'use strict';

const winston = require('winston');
const winstonDailyRotateFile = require('winston-daily-rotate-file');

let transports = [
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }),
  new winstonDailyRotateFile({
    filename: 'logs/.log',
    datePattern: 'yyyy-MM-dd',
    prepend: true,
    level: 'info'
  })
];

if (process.env.NODE_ENV === 'development') {
  transports.push(new winston.transports.Console({level: 'info'}));
}

const logger = new winston.Logger({
  level: 'info',
  transports: transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log'
    })
  ]
});

module.exports = logger;