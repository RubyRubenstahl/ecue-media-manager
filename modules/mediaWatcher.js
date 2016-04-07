/**
 * Created by Mike on 4/4/2016.
 */
var chokidar = require('chokidar');
var _ = require('underscore');
var util = require('util');
var events = require('events');


// Configure the file watcher to be persistent
var filewatcher = chokidar.watch(null,
    {persistent: true,
    ignored: [
      '**\\.thumbnails\\**'
    ]});

module.exports = new events.EventEmitter();


/**
 * Add a watcher to the media directory
 */
module.exports.watch = function(mediaDir){

  // Stop any other watchers
  filewatcher.close();
  filewatcher.add(mediaDir);

  // Report a new file
  filewatcher.on('add' , function(path){
    module.exports.emit('changed', path);
  });

  // Report a changed file
  filewatcher.on('change' , function(path){
    module.exports.emit('changed', path);
  });

  // Report a deleted file
  filewatcher.on('unlink' , function(path){
    module.exports.emit('deleted', path);
  });
}




