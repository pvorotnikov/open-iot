const winston = require('winston')
const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            colorize: true,
            timestamp: true,
            level: 'debug',
            prettyPrint: true,
        }),
        new winston.transports.File({ filename: 'open-iot.log' })
    ]
})

// morgan stream
logger.stream = {
    write: function(message, encoding) {
        logger.info(message)
    }
}

module.exports = logger;
