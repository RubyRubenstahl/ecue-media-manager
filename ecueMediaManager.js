/**
 * Created by Mike on 3/22/2016.
 */
var util = require('util');
var request = require('request');
var configLoader = require('./modules/configLoader');
var mediaWatcher = require('./modules/mediaWatcher');
var thumbnailGenerator = require('./modules/thumbnailGenerator');
var log = require('./modules/logger');
var fileListWriter = require('./modules/filelistWriter');
var path = require('path');

var settings = {};
var host = "http://127.0.0.1";
log.info("-----===== Starting =====------");

// TODO: write documentation

/**
 * Configuration
 */

	 // When the config file has loaded (or reloaded) store the settings and
	 // initialize the thumnail generator module, and start the file watcher.

		configLoader.on('loaded', function(config){
			log.info('Configuration file loaded');
			settings = config;

			host = util.format('http://%s:%s', settings.ecue.ipAddress, settings.ecue.port)

			thumbnailGenerator.init({
				thumbnailDir: settings.media.thumbnailDirectory,
				extensions: settings.media.extensions
			});

			mediaWatcher.watch(settings.media.mediaDirectory);
		});


		configLoader.on('error', function(err){
			log.error("Could not load config file:", err.message);
		});


/**
 * Media Watcher
 */

	// Add a new video to the thumbnail generation queue when it changes
	mediaWatcher.on('changed', function(file, stat){
		thumbnailGenerator.add(file);
	});

	// Delete thumbnail for a removed file
	mediaWatcher.on('deleted', function(file, stat){
		log.info("Deleting stale thumbnail:", file);
		thumbnailGenerator.remove(file);
	});


/**
 * Thumbnail generation
 */
	// When a group of thumbnails is ready to generate, send a signal to
	// Programmer to unload the thumbnails to allow them to be written,
	// then run the thumbnail generator queue. A 100ms delay is added
	// to give Programmer time to unload them.
	thumbnailGenerator.on('ready', function(){
		clearThumbnails(function(){
			setTimeout(function(){
				log.info('Starting thumbnail generation queue');
				thumbnailGenerator.run();
			}, 100);
		})
	});

	// Inform Programmer that generation is complete so that the thumbnails
	// can be reloaded.
	thumbnailGenerator.on('complete', function(){
		log.info("Thumbnail generation queue complete");
		fileListWriter.write(function(){
			notifyProgrammer();
		});

	});


// Run the configuration loader AFTER all of the event handlers have been
// defined so that we don't miss any events.
configLoader.load(path.join(__dirname,"config.json"));


/**
 * Send a signal to Programmer to let it know that the thumnails can be loaded
 */
function notifyProgrammer(){
	log.info("Notifying Programmer of updated thumbnails")
	var url = host + '/get?CallMacro=updateMediaContent';
	request(url, function(err){
		if(err){
			log.error('Could not connect to programmer at', url);
		}
	});
}

/**
 * Send a signal to programmer to unload the thumbnails, allowing the
 * files to be written over.
 */
function clearThumbnails(callback){
	var url = host + '/get?CallMacro=clearVideoThumbnails';
	request(url, function(err){
		if(err){
			log.error('Could not connect to programmer at', url);
		}
		return callback();
	});
}
