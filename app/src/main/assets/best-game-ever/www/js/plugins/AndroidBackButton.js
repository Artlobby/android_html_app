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
* End of file
*/
