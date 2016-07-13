/**
 * Created by Mike on 4/4/2016.
 */
var queue = require('queue');
var path = require('path');
var fs = require('fs.extra');
var util = require('util');
var exec = require('child_process').exec;
var events = require('events');
var log = require('./logger');
var config = require('./configLoader');
var _ = require('underscore');
var isVideo = require('is-video');
var options;

var q = queue();
var debounceTimer;

module.exports = new events.EventEmitter();


/**
 * Configure the queue options
 */
module.exports.init = function(opts){
  options = opts;
  q.concurrency = 10;
}

/**
 * Add a file to be thumbnailed
 */
module.exports.add = function(filePath){

  // Exit if the file extensions is not in the configured extensions list
   if(!isAccepteFileType(filePath)){
    return;
  }

    var thumbnailPath = getThumbnailPath(filePath);

  // Generate the ffmpeg commend arguments.
  var args;

  var seekArg = '';
  // Seek to second #2 if the media file is a video
  if(isVideo(filePath)){
   seekArg = '-ss 2 ';
  }

  var filters='';
  var filterCount = 0;
  var crop = config.settings.media.crop;
  if(crop.enabled){
    if(filterCount>0){filters +=',';}
    filters += util.format('crop=%s:%s:%s:%s', crop.width, crop.height, crop.x, crop.y);
    filterCount++;
  }

  var resize = config.settings.media.resize;
  if(resize.enabled){
    if(filterCount>0){filters +=',';}
    filters +=  util.format('scale=%s:%s', resize.width, resize.height);
    filterCount++;
  }

  var watermarkInputArg = '';
  if(config.settings.media.mediaTypeWatermark){
    if(filterCount>0){filters +=',';}

    var watermarkImage = path.join(__dirname, '../bin/imageIcon.png');
    if(isVideo(filePath)){
      watermarkImage = path.join(__dirname, '../bin/videoIcon.png');
    }

    watermarkInputArg =  util.format('-i "%s"', watermarkImage);

    filters +=  util.format('overlay=0:0');
    filterCount++;
  }

  args = util.format('%s -i "%s" %s -f image2 -filter_complex "%s" -vframes 1 -nostats -loglevel 0 -y "%s"',
      seekArg, filePath,watermarkInputArg, filters, thumbnailPath);



  // Construct and queue the command
  var ffmpegPath = path.join(__dirname, '../bin/ffmpeg.exe');
  var ffmpegCommand = ffmpegPath + ' ' + args;
  queueffmpegCommand(ffmpegCommand, thumbnailPath);

  // Reset the debounce timer
  debounce();
}

/**
 * Queue a command to delete a thumbnail file if the originial
 * media file has been removed
 */
module.exports.remove = function(filepath){
  var thumbnailPath = getThumbnailPath(filepath);
  var command = 'DELETE ' + thumbnailPath;

  if(isDuplicate(command)){
    return;
  }

  q.push(function(callback){
    try {
      fs.unlinkSync(thumbnailPath);

    } catch(err){
      log.error(err.message);
    }
    callback();
  });

  debounce();
}



/**
 * Push a command onto the queue if it isn't a duplicate
 */
function queueffmpegCommand(command, outputFile){
  log.info("Adding thumbnail to queueu:", command);

    if(isDuplicate(command)){
    return;
  }

  // Push the command onto the queue stack
  q.push(function(callback) {
    log.info("Running: ", command);

    exec(command, function (err, stdout, stderr) {
      if (err) {
        var errorThumbnailPath =path.join(__dirname, '../bin/error_thumbnail.jpg');

        fs.copy(errorThumbnailPath, outputFile, {replace: true}, function(err){
          if(err){
            log.error(err.message);
          }
        });
        log.error(err.message);
      }

    return callback();
    });
  });

  debounce();
}


/**
 * Add a delay after a change is detected to allow any other files to be
 * added to the command queue before we actually kick it off.
 */
function debounce(){
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(function(){
    clearDuplicateList();
    module.exports.emit('ready');
  }, 1000);
}

/**
 * Generate the path to a thumbnail file from the original media file path
 */
function getThumbnailPath(filepath){

  var fileName = path.basename(filepath);
  return path.join(options.thumbnailDir, fileName+ ".jpg");
}


/**
 * Run all commands in the task queue
 */
module.exports.run = function(){
  verifyThumbnailFolderExists();
  q.start();
}

/**
 * Emit a signal when the task queue has been completed.
 */
q.on('end',function(){
  module.exports.emit('complete');
})


/**
 * Track commands so that duplicates aren't added to the queue
 * returns true if a duplicate is detected. If no duplicate is
 * found, returns false and adds the command to the list.   *
 */
var duplicates = [];
function isDuplicate(command){
  if(_.contains(duplicates, command)){
    return true;
  }
  else{
    duplicates.push(command);
    return false;
  }

}

/**
 * Clear the list of commands used for detecting duplicates
 */
function clearDuplicateList(){
  duplicates = [];
}

/**
 * Returns true if the file extension is in the extensions list
 */
function isAccepteFileType(filename){
  var isValid = _.contains(config.settings.media.extensions, path.extname(filename).toLowerCase());
  if(!isValid){
    log.warn("Invalid filetype:", filename);
  }
  return isValid;
}

// Verify that the thumbnail folder exists. If it doesn't, create it
// and copy the 'updating' thumbail into it.
function verifyThumbnailFolderExists(){
  var tnPath = config.settings.media.thumbnailDirectory;
  if(!fs.existsSync(tnPath)){
    log.warn('Thumbnail directory does not exist, creating:', tnPath);
    fs.mkdirpSync(tnPath);
    fs.copy(
        path.join(__dirname, '../bin/updating.png'),
        path.join(tnPath, 'updating.png')
  );
  }
}