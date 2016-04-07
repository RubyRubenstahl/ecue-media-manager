/**
 * Created by Mike on 4/5/2016.
 */
var winston = require('winston');
require('winston-logrotate');
var path = require('path');
var moment = require('moment');

//var rotate = new winston.transports.Rotate;
var logFilePath = path.join(__dirname, "../logfile.log");
var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console(),
    new (winston.transports.File)({
      filename: logFilePath,
      json: false,
      maxsize: 5000000,
      maxFiles: 1,
      showLevel: true,
      timestamp: function(){ return moment().format()}
    })
  ]
});

// Set the logger to command line mode to allow colorized formatting
logger.cli();


module.exports = logger;


