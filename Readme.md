# ecue-media-manager

The e:cue media manager application allows you to turn [e:cue Programmer](http://ecue.com) into a responsive, customizable live video playback environment.

![Screenshot](http://ruby-lighting.com/github/ecue-media-manager/Interface.jpg)

The application consists of two parts: The Programmer show file and the [Node.js](http://nodejs.org) backend. The e:cue show file consistes of a number of scripts and an Action Pad. The Action Pad has a control area for each of the two available media players. The control areas consist of a "currently playing" panel, a group of playback buttons, and a set of scroll buttons. The media playback buttons show thumbnails of available media content that can be played by pressing the button. If there are more media files than buttons available, the scroll buttons can be used to scroll through the content. 

The Node.js backend watches a specified folder for supported image and video files files. When a media file is added or updated the application generates the appropriate thumbnails and triggers Programmer to load them into the interface.

The application is designed to be customizable to suit a wide variety of situations. 

## Features
- Automatically updates with configuration or media files change.

- Currently playing panel in the Action Pad.

- Customizable crop & resize options for thumbnails.

- Optional watermark to show whether media is image or video.

- Error logging for easy diagnostics

## Installing & configuring

### Creating a media directory
The application works by watching for changes in a specific directory. Before configuring the system, you should create this directory. But by default it is set to `c:\ecue\media`. As this is the standard media folder pre-configured with e:cue servers I'd sugges that you use this location for consistency, but it can be wherevery you like as long as the Programmer and the application have read & write permissions.

### Setting up Programmer
Setting up Programmer to run with the provided sample show file is pretty straightforward. I'll cover this first and then explain how to incorporate the application into an existing show file.

1. Open the sample show file.

2. Enable the HTTP server. Read [this article](http://ecuetips.com/setting-up-the-http-server/) if you need help. 

3. Open the Macro Editor (*Shift+F2*).

4. Open the `intitializeMediaWatcher` script by double-clicking in its comment area.

5. Edit the `_mediaPath` to match the directory you'll be using for your media. Please note that you **must use double-backslashes** and **the path must end with a double backslash**. For example if your media folder was in `c:\users\alice\media`, the code would look like this: `_mediaPath = "c:\users\\alice\\media\\"`

6. Exit the editor by pressing *Ctrl+H* or closing the window and selecting *yes* when prompted to save.

7. To apply the change we'll need to reset the scripting environment and run this script again. Do this by first clicking ![Reset Globals Icon](http://ruby-lighting.com/github/ecue-media-manager/resetGlobals.jpg) at the top of the Macro Manager windows then run the script by either double-clicking on it or, while it is selected, click the ![Reun Script Icon](http://ruby-lighting.com/github/ecue-media-manager/runScript.jpg) button.

---
Once you've completed these steps, Programmer should be ready to go. If you'd like to add the Media Manager functionallity into an existing show you'll need to do the following:

1. Open the macro manager and export all of the scripts to files.

2. Open the Action Pad and expor it to a file.

3. Open the show file that you wan to work with.

4. Import the scripts from the Macro manager.

5. Import the Action Pad.

6. Perfrom the configuration steps listed above for the sample show file. 

7. Add an Initialization trigger that runs the `intitializeMediaWatcher` script when the show is loaded.

### Installing the Backend
As mentioned above, the Backend is written in Node.js. If you are not familiar with [Node.js](http://nodejs.org), it is a sever-side implementation of Javascript based on the V8 Javascript engine originally created for Google's Chrome web browser. In recent years it has become a widely used server-side technology amongst web developers and excels and handling back-end networking situations, making it an ideal solution for integrating Programmer with other systems.

There is a little bit of command-line configuration that needs to take place, but it it is pretty easy to do. The only major requirement is that **you'll need to have the server that you're installing on to be connected to the internet during installation**.

1. Install node.js. It can be downloaded [here](http://nodejs.org).

2. [Download and unzip this project](https://github.com/RubyRubenstahl/ecue-media-manager/archive/master.zip) into the desired folder. I recommend `c:\ecue\ecue-media-manager`.

3. Navigate to the folder in explorer.

4. Open a *PowerShell* window in **Administrator mode** by clicking *File > Open Windows PowerShell > Open Windows Powershell as Administrator*. (If you're not in Administrator mode, installing the service will not work).

5. In powershell enter the following commands:
```
c:\ecue\ecue-media-manager>npm install
c:\ecue\ecue-media-manager>npm install winser -g
c:\ecue\ecue-media-manager>winser -i -a
```
6. After you type in these two lines you should see a bunch of information spit out by NPM, and the script should be installed and ready to go. If you see a bunch of lines starting with `npm ERR!` then your computer probably isn't connected to the internet or you've opened PowerShell without Admin privileges. 

### Configuring the Backend
Configuration of the backend is handled by a [JSON formatted](https://en.wikipedia.org/wiki/JSON) file called `config.json`, which resides the root folder of the application files.

- Media directory: The media directory should be set to the path of the media files. It should be the same folder and formatting as in the Programmer setup. You **must use double-backslashes** and **the path must end with a double backslash**.

- Extensions: Out of the box Programmer supports `*.wmv`, `*.jpg` and `*.bmp` files. If codecs are installed for other filetypes, you can add them to the extensions list. 

- Programmer: In the e:cue section, you'll need to change the IP address and port to match the configuration of Programmer's HTTP server. In most cases you won't have to change these. 

### Testing
Once you've gone through the Installation & Configuration instructions, the system should now be working. Try adding media files into the media folder. If everything is working properly you should see a folder called `.thumbnails` added to the media folder, which will contain the generated thumnail files as well as a few support files. You should also see the thumbnails being imported into the Action Pad as you add media files. 

If you're not seeing anything happen, open the log file called `logfile.log`, located in the project root folder, with a text editor. Here are a few possible errors & things to check:

| Error Message                                                    | Solution                                                                                                                                                                                                 |
|------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Could not load config file: Unexpected token                     | Check the formatting of the config file. Are you missing a quotation mark or comma? Reference the original file if needed                                                                                |
| Could not load config file: ENOENT, no such file or directory... | The config file could not be found. Make sure that it is in the directory and named `config.json`.                                                                                                       |
| Could not connect to programmer at....                           | The backend could not connect to Programmer's HTTP interface. Make sure that the HTTP server is up and running and that the IP address & port match in the `config.json` file and Programmer's settings. |
| Error messages containing "ENOENT"                               | These messages means a file could not be found or does not have read/write permissions. Check that the media directory is set correctly and that read/write permissions are set correctly.               |




### Customizing
Once you have everything working, there are several options for customizing how thumbnails are rendered and presented.

#### Customizing thumbnail rendering
In the `config.json` file there are a number of settings that can be changed.

- mediaTypeWatermark - When set to `true`, this option will ad a watermark icon at the top left of the thumbnail indicating whether the media file is an image or a video. 

- Crop: When the *enabledz* option is set to `true`, the thumbnail will be cropped to the dimensions specified in the `x`, `y`, `width`, and `height` settings. 

- Resize: This will set the size that the thumbnail will be rendered to. Programmer will scale the thumbnail to fit the buttons, but you'll want to keep this fairly small as having large thumbnails will eat up a lot of memory. In addition to entering the number of pictures, you can also use basic forumulas. `iw` and `ih` can be used to represent the height/width of the input media dimensions. To make the thumbnail 1/5th the size of the original use ```"width": "iw/5", "height": "ih/5"```.

#### Customizing the Action Pad
The supplied action pad comes with 24 buttons arranged in columns rows of 4. These buttons can be moved around and you can alter the number of available buttons.

##### Adding/editing buttons

The most important thing to understand when editing the buttons is the Script ID naming convention and the `Action #2 setting`. Each media button is named `MPx_y` where `x` is the number of the media player and `y` is the number of the btton. The thumbnails are applied to the buttons using the script ID, so it must be correct for the system to function properly. The `Action #2` trigger also needs to be configured to send the correct play signal when clicked. 

To add a new button do the following:
- Copy and paste an existing button.
- Open the button's settings
- Set the script ID to the next `MPx_y` where `x` is the Media Player number and `y` is the next available button number.
- Click on the `Action #2` tab
- Change the macro call to be `videoButtonClick,x,y` where `x` is the Media Player number and `y` is the button number.

##### Configuring button scripting
If you've arranged the buttons to have a different number of columns, open the `intitializeMediaWatcher` script and change the `_columnWidth` parameter to the number of columns you are using. This will make sure that the scroll buttons scroll one row at a time.

If you've changed the number of buttons, open the `intitializeMediaWatcher` script and change `_buttonCount` to match the number  of buttons you're using. 


# Support
If you have any questions or issues getting this up and running send me an email at [ruby@ruby-lighting.com](mailto://ruby@ruby-lighting.com) and I'll try to assist you.

