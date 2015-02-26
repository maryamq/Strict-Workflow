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
  prefs = background.PREFS,
  enablePause = false,
  jqueryMap = {},

  initModule, setJqueryMap, togglePause, onStartSingle, onStartContinuous ;

  setJqueryMap = function ($mainContainer) {
    jqueryMap = {
      $container : $mainContainer,
      $pause      : $mainContainer.find( '.popup-pause'),
      $startSingle      : $mainContainer.find( '.popup-start-single'),
      $toggleContinuous      : $mainContainer.find( '.popup-toggle-continuous'),
    };
  };

  initModule = function($container) {
    setJqueryMap($container);
    jqueryMap.$pause.click(togglePause);
    jqueryMap.$startSingle.click(onStartSingle);
    jqueryMap.$toggleContinuous.click(toggleContinuous);
  };

  togglePause = function(event) {
    // mainPomodor.togglePause();

  };

  onStartSingle = function(event) {
    mainPomodoro.startPomodoro(1);

  };

  toggleContinuous  = function(event) {
   mainPomodoro.startPomodoro(2);
 };

 return { initModule : initModule };

}());

popup.initModule($('#popup'));


