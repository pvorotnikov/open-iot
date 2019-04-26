const moment = require('moment')
const cron = require('cron')
const { constants, logger } = require('../lib')
const { Cron } = require('../models')

class Scheduler {

    /**
     * Create scheduler
     * @param {String} cronTime schedule cron. By default run at second 0 every minute
     */
    constructor(cronTime='0 * * * * *') {
        this.mainJob = new cron.CronJob({
            cronTime,
            onTick: this.tick.bind(this),
            runOnInit: true,
            start: true,
            unrefTimeout: true,
        })
    }

    /**
     * Handle every tick.
     * @returns {Promise<>}
     */
    async tick() {

        const crons = await Cron.find()
        const now = moment()

        crons.forEach(async (c) => {
            const job = new cron.CronJob(c.cron, null)

            const nextExecution = job.nextDates()
            const scheduledExecution = moment(c.next)

            // determine whether this needs to be executed
            const diff = scheduledExecution.diff(now)
            if (diff < 0) {
                await this.handleSchedule(c.id, c.type, c.arguments)
                c.next = nextExecution.toDate()
                c.updated = now.toDate()
                await c.save()
            }

        })

    }

    /**
     * Execute cron job
     * @param {String} id cron id
     * @param {String} type cron type
     * @param {Object} args cron arguments
     */
    async handleSchedule(id, type, args) {
        logger.info(`Executing cron ${id}`)
        switch (type) {
            case 'publish':
                const { topic, payload } = args
                process.emit(constants.EVENTS.MQTT_PUBLISH_MESSAGE, { topic, payload })
                break
            default:
                logger.error(`Unsupported cron type: ${type}`)
        }
    }

}

module.exports = Scheduler
