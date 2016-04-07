/**
 * Created by Mike on 3/22/2016.
 */
var fs = require('fs');
var _ = require('underscore');
var util = require('util');
var events = require('events');
var chokidar = require('chokidar');
var path = require('path');
var log = require('./logger');


module.exports = new events.EventEmitter();
module.exports.settings = {};
var settings = {};
var filewatcher = chokidar.watch(null,
		{persistent: true,
		atomic: true});

/**
 * Add the config file watcher and
 * do the initial file read
 */
module.exports.load = function(filename){
	addWatcher(filename);
	readConfig(filename);
}

/**
 * Reload the config file and restart the stream if  the config file changes
 */
function addWatcher(configFilePath){
	log.info("Adding config watcher:", configFilePath);
	filewatcher.add(configFilePath);
	filewatcher.on('change', function(path){
		log.info('Config changed');
		readConfig(configFilePath);

	});

	filewatcher.on('add', function(path){
		readConfig(configFilePath);
	});
}

/**
 * Read the config file and emit an event (along with the data) once its read
 */
function readConfig(filepath){
	try {
		var configText =  fs.readFileSync(filepath, 'utf8');
		settings = JSON.parse(configText);
		module.exports.settings = settings;

		addInternalConfig()
		module.exports.emit('loaded', settings);
	}
	catch(e){
		module.exports.emit('error', e);
	}
}


function addInternalConfig(){
	settings.media.thumbnailDirectory = path.join(settings.media.mediaDirectory, '.thumbnails');
}