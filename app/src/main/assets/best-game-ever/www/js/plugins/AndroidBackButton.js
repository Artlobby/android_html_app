/*:
 * @plugindesc Plugin to utilize the android back button.
 * @author DekitaRPG (dekitarpg.com)
 *
 * @help PLEASE NOTE:
 * 
 * This plugin will not work unless your app has been created with the 
 * same structure that I demonstrate in my example application

 * My example application can be found via youtube at the link below
 * https://youtu.be/0HMoksBxJ1Q
 * 
 * This plugin was written for part 2 of that tutorial (the link above
 * is for part 1). In part 2 I detail how I link the android environment
 * with the javascript environment within my game. 
 * 
 * This plugin does not provide any customizable parameters!!
 */
(function AndroidBackButtonWrapper() { "use strict";
    // 
    // isAndroidObjectAvailable()
    // returns true if android object is available
    // 
    function isAndroidObjectAvailable() {
        return window.android && typeof android.vibrate === "function";
    }

    // 
    // checkAndroidBackButtonWasPressed()
    // returns true if android back button was pressed
    // since the last time this function was called. 
    // 
    function checkAndroidBackButtonWasPressed() {
        if (!isAndroidObjectAvailable()) return false;
        return android.wasBackButtonPressed();
    }

    // 
    // Alias of the main scene update to check 
    // android back button pressing..
    // 
    const alias_Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        alias_Scene_Base_update.apply(this, arguments);
        this.updateAndroidBackPressed();
    };

    // 
    // [scene].updateAndroidBackPressed()
    // No need to pop scene as windows trigger 'cance' when back press.
    // 
    Scene_Base.prototype.updateAndroidBackPressed = function() {
        //if (checkAndroidBackButtonWasPressed()) this.popScene();
    };

    // 
    // Alias of process handling for windows.
    // this triggers the 'cancel' handler when back button is pressed
    // 
    const alias_WindowProcessHandling = Window_Selectable.prototype.processHandling;
    Window_Selectable.prototype.processHandling = function() {
        alias_WindowProcessHandling.apply(this, arguments);
        if (this.isOpenAndActive() && checkAndroidBackButtonWasPressed()) {
            this.processCancel();
        }
    };

    // 
    // Alias of the title scenes initialize
    // This is to re-enable the android back button 
    // (so that back will exit the game)
    // 
    const alias_Scene_Title_init = Scene_Title.prototype.initialize;
    Scene_Title.prototype.initialize = function() {
        alias_Scene_Title_init.apply(this, arguments);
        if (isAndroidObjectAvailable()) {
            android.setCanGoBack(true);
        }
    };

    // 
    // Alias of map scene initialize
    // This is to disable the android back button after map has loaded
    // (so that the button can be utilized within game windows etc)
    // 
    const alias_Scene_Map_init = Scene_Map.prototype.initialize;
    Scene_Map.prototype.initialize = function() {
        alias_Scene_Map_init.apply(this, arguments);
        if (isAndroidObjectAvailable()) {
            android.setCanGoBack(false);
        }
    };

    // 
    // Alias of the map scenes main update function
    // So control the update flow when the exit game windows are visible
    // 
    const alias_Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        if (isAndroidObjectAvailable() && this._exitGameConfirmationWindow.active) {
            // call scene base update here
            // this is so that the actual map items dont update
            // whilst the confirmation window is opened. 
            alias_Scene_Base_update.apply(this, arguments);
        } else {
            // do a regular update since exit confirmation window is inactive
            alias_Scene_Map_update.apply(this, arguments);
        }
    };

    // 
    // [OVERWRITE] (from function defined in scene base above)
    // Check if android back was pressed. Show exit window if it was.
    // 
    Scene_Map.prototype.updateAndroidBackPressed = function() {
        if (checkAndroidBackButtonWasPressed()) {
            this._exitGameWindow.show();
            this._exitGameConfirmationWindow.show();
            this._exitGameConfirmationWindow.activate();
            this._exitGameConfirmationWindow.select(1);
        }
    };

    // 
    // Alias of maps create display objects to add custom windows
    // 
    const alias_Scene_Map_cdo = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        alias_Scene_Map_cdo.apply(this, arguments);
        if (isAndroidObjectAvailable()) {
            this.createExitGameWindows();
        }
    };

    // 
    // Creates aforementioned custom windows
    // 
    Scene_Map.prototype.createExitGameWindows = function() {
        this._exitGameWindow = new Window_AndroidExitGame();
        this.addChild(this._exitGameWindow);
        this._exitGameConfirmationWindow = new Window_AndroidExitGameConfirmation();
        this._exitGameConfirmationWindow.setHandler('confirm',this.commandAndroidExitGameConfirm.bind(this));
        this._exitGameConfirmationWindow.setHandler('cancel',this.commandAndroidExitGameCancel.bind(this));
        this.addChild(this._exitGameConfirmationWindow);
    };

    // 
    // Triggered when user confirms exiting the game.
    // Calls forxeExitApp defined within the js_interface class in android app.
    // 
    Scene_Map.prototype.commandAndroidExitGameConfirm = function(){
        if (isAndroidObjectAvailable()) android.forceExitApp();
    };

    // 
    // Triggered whern user cancel's exiting the game.
    // 
    Scene_Map.prototype.commandAndroidExitGameCancel = function(){
        this._exitGameWindow.hide();
        this._exitGameConfirmationWindow.hide();
        this._exitGameConfirmationWindow.deactivate();
    };

    // 
    // Custom window classes for showing exit game options..
    // 
    function Window_AndroidExitGame() {
        this.initialize.apply(this, arguments);
    }
    Window_AndroidExitGame.prototype = Object.create(Window_Selectable.prototype);
    Window_AndroidExitGame.prototype.constructor = Window_AndroidExitGame;

    Window_AndroidExitGame.prototype.initialize = function() {
        let x = 0;
        let w = Graphics.boxWidth;
        var h = this.fittingHeight(3);
        let y = (Graphics.height - h) / 2;
        Window_Selectable.prototype.initialize.call(this, x, y, w, h);
        this.opacity = 12;
        this.refresh();
        this.hide();
    };

    Window_AndroidExitGame.prototype.refresh = function() {
        this.contents.clear();
        let cw = this.contentsWidth();
        let ch = this.contentsHeight();
        let text = "Do You Want To Exit The Game ??";
        this.contents.fillRect(0, 0, cw, ch, 'rgba(0,0,0,0.5)');
        this.drawText(text, 0, 12, cw, 'center');
    };

    Window_AndroidExitGame.prototype.standardPadding = function() { return 0; };
    Window_AndroidExitGame.prototype.textPadding = function() { return 0; };

    // 
    // 
    // 
    function Window_AndroidExitGameConfirmation() {
        this.initialize.apply(this, arguments);
    }
    Window_AndroidExitGameConfirmation.prototype = Object.create(Window_Command.prototype);
    Window_AndroidExitGameConfirmation.prototype.constructor = Window_AndroidExitGameConfirmation;

    Window_AndroidExitGameConfirmation.prototype.initialize = function() {
        let x = (Graphics.width - this.windowWidth()) / 2;
        let y = Graphics.height / 2 - 12;// - this.windowHeight();
        Window_Command.prototype.initialize.call(this, x, y);
        this.hide();
        this.deactivate();
        this.opacity = 0;
    };

    Window_AndroidExitGameConfirmation.prototype.windowWidth = function() {
        return Graphics.width / 4;
    };

    Window_AndroidExitGameConfirmation.prototype.maxCols = function() {
        return 2;
    };

    Window_AndroidExitGameConfirmation.prototype.windowHeight = function() {
        return this.fittingHeight(1);
    };

    Window_AndroidExitGameConfirmation.prototype.makeCommandList = function() {
        this.addCommand("YES", 'confirm');
        this.addCommand("NO",  'cancel');
    };

    Window_AndroidExitGameConfirmation.prototype.itemTextAlign = function(index) {
        return 'center';
    };

    // 
    // End Definitions:..
    // 
})();



/**

Hi, Today I'm going to show you how I enable the use of the back button on Android devices within my Webview HTML App.

This will build on my previous tutorial, where I demonstrated how to quickly build and begin debugging your html games and apps on android. If you havent seen that tutorial yet, I'll link it in the description below for reference.


Hey guys, David here, also known as DekitaRPG. I'll be making lots of diy tech && programming tutorial videos in the future so if you like that kinda stuff, make sure to click subscribe.

Today I'm going to be building on my previous tutorial by "hooking" the android back button so I can control how it functions during the lifespan of my app. This allows me to use the back button to change pages or scenes within my apps javascript environement, as well as restrict its functionality entirely. 


So, to get started, I first load my previous app project. 

As I want to use the back button from within my javascript environement, I add some private variables into my Javascript interface class. This class is passed through to the apps webview object later which allows the functions to be accessed using javascript code.

the first variable is a boolean that will be used to determine if the app will allow the back buttons normal functionality - which is to exit the app when pressed. 
the second variable is another boolean that will be used to flag if the back button was pressed. 

After the variables are defined I create some functions to control and use them.

The first function I call 'setCanGoBack'. this function is prefixed with the @JavascriptInterface decleration. this will allow the function to be available from within the javascript environement later. it should be fairly obvious what this function will do.  It will be called from within javascript to allow or restrict the default behaviour of the back button. 


The second function I call 'wasBackButtonPressed'. When called this function will return a boolean value for if the back button was pressed since the last time this function was called.  You can see from the function code that the flag is reset to false before returning the current value of the flag. 

I then create a third new function for the javascript interface class, this third function will be used to force exit the app. This can be used for closing the app even if the back buttons functionality has been changed. 



After these three functions have been defined I leave my custom javascript interface class and scroll down to below the main activities onCreate function.. Below onCreate I overwrite another one of the default android apps functions - this time, onBackPressed.  As you can likely tell from its name, this function controls the logic of the back button within the app. 

Within the newly overwritten 'onBackPressed' function I first set the 'was_back_pressed' flag in my javascript interface class to true. Remember, this flag will reset back to false after the 'wasBackButtonPressed' function from the javascript interface class is called. 

Then, I check to make sure that the webview object exists, and is currently focused. if it is, then I restrict the back buttons regular functionality based on the can_go_back variable from the js_interface class. If the app's webview isnt focused I have no idea how the back button could be pressed, but just incase, I allow the app to go back like normal, which should exit the app. 


Now, all the code has been defined within the app. All thats left to do is decide how to use the back button within the app. I decided to use the popular RPG Maker MV engine to demonstrate...

I wrote a plugin for the RPG Maker MV engine; however, this is just raw javascript, so the approach can easily be applied to regular html webpage apps.

In my plugin code I have defined two main functions. isAndroidObjectAvailable, which returns a boolean based on if the android object is available.
The android object is just a chosen name for the javascript interface class that gets passed to the webview running the javascript.

The second main function is checkAndroidBackButtonWasPressed, which does exactly as its name suggests. If the android object isnt available, this function aways returns false. 



after these two main functions are defined, I aliased some of the default rpg maker engine's javascript functions for game windows and scenes. This was done to allow for the app to exit like normal when back is pressed during the title scene. and if pressed during the game map, or game menus  it will go back menu pages, or bring up a handy prompt for the user asking if they want to exit the app..

Overall, these small changes make the app experience feel like its much more tailored towards the android device. Coupled with other features from my previous tutorial, you should now be able to easily vibrate the users device, pop toast messages on the device, as well as control the logic of the back button - all from within the webview javascript environement!!

*/