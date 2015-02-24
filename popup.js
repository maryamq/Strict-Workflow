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
  mainPomodoro = background.mainPomodoro,
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

  };

  onStartSingle = function(event) {
    mainPomodoro.start();

  };

  toggleContinuous  = function(event) {

  };

  return { initModule : initModule };

}());

popup.initModule($('#popup'));


