/**
 * Created by Mike on 4/5/2016.
 */
var csvWriter = require('csv-write-stream');
var config = require('./configLoader')
var path = require('path');
var fs = require('fs.extra');
var _ = require('underscore');
var log = require('./logger');

/**
 * Write a comma list of files in a comma delimited format
 *  Column 1: File name without extension
 *  Column 2: Media file path
 *  Column 3: Thumbnail path
 */
module.exports.write = function(callback){

  var filepath = path.join(config.settings.media.thumbnailDirectory,'filelist.dat');

  // Configure the CSV writer
  var writer = csvWriter();
  writer.sendHeaders = false;
  writer.pipe(fs.createWriteStream(filepath));

  // Read a list of files from the media directory
  var fileList = fs.readdirSync(config.settings.media.mediaDirectory);

  // Filter down to only the accepted file types
  var filteredFileList = _.filter(fileList, function(filename){
    return isAccepteFileType(filename);
  });

  // Write the file list
  _.each(filteredFileList, function(filename){
      var entry = {
        name: path.basename(filename, path.extname(filename)),
        filepath: path.join(config.settings.media.mediaDirectory, filename),
        thumbnailPath: path.join(config.settings.media.thumbnailDirectory, filename + '.jpg'),
      }

      writer.write(entry);
  });

  // Run the callback if one was provided once the file write is complete
  writer.end(function(){
    if(callback){
      return callback();
    }
  });

}


/**
 * Generate the thumbnail path from the media file path
 */
function getThumbnailPath(filepath){
  var fileName = path.basename(filepath);
  return path.join(options.thumbnailDir, fileName+ '.jpg');
}

/**
 * Returns true if the file extension is in the extensions list
 */
function isAccepteFileType(filename){

  var isValid = _.contains(config.settings.media.extensions, path.extname(filename).toLowerCase());
  if(!isValid){
    log.warn('Invalid filetype:', filename);
  }
  return isValid;
}