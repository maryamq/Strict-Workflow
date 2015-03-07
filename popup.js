/*
  popup.js
  */

  var popup = (function() {
    var initModule = function($container) {
      popup.shell.initModule($container);
    };

    return {initModule: initModule};
  }());

  popup.shell = (function($container) {
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var 
  background  = chrome.extension.getBackgroundPage(),
  mainPomodoro = background.pomodoro.main,
  enablePause = false,
  jqueryMap = {},

  initModule, setJqueryMap, togglePause, onStartSingle, onStartContinuous ;

  setJqueryMap = function ($mainContainer) {
    jqueryMap = {
      $container : $mainContainer,
      $pause      : $mainContainer.find( '.popup-pause'),
      $startSingle      : $mainContainer.find( '.popup-start-single'),
      $startBlueMode      : $mainContainer.find( '.popup-blue'),
      $startRedMode      : $mainContainer.find( '.popup-red'),
      $startBlackMode      : $mainContainer.find( '.popup-black'),
    };
  };

  initModule = function($container) {
    setJqueryMap($container);
    var workmodes = background.pomodoro.prefs.getPrefs().timeblock;
    jqueryMap.$startSingle.click({pomoCount: 1}, startPomodoro);
    jqueryMap.$startBlueMode.click({pomoCount: workmodes.blue}, startPomodoro);
    jqueryMap.$startRedMode.click({pomoCount: workmodes.red}, startPomodoro);
    jqueryMap.$startBlackMode.click({pomoCount: workmodes.black}, startPomodoro);
    // setup titles
    jqueryMap.$startBlueMode.html("Blue mode (" + workmodes.blue + ")");
    jqueryMap.$startRedMode.html("Red mode (" + workmodes.red + ")");
    jqueryMap.$startBlackMode.html("Black mode (" + workmodes.black + ")");
  };

  startPomodoro = function(event) {
    mainPomodoro.startPomodoro(event.data.pomoCount);
  };

 return { initModule : initModule };

}());

popup.initModule($('#popup'));


