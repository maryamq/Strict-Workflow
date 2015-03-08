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
  var 
  background  = chrome.extension.getBackgroundPage(),
  mainPomodoro = background.pomodoro.main,
  jqueryMap = {},

  initModule, setJqueryMap, togglePause, onStartSingle, onStartContinuous, getCompletionLabel;

  setJqueryMap = function ($mainContainer) {
    jqueryMap = {
      $container : $mainContainer,
      $startSingle  : $mainContainer.find( '.popup-start-single'),
      $startBlueMode : $mainContainer.find( '#popup-blue'),
      $startRedMode  : $mainContainer.find( '#popup-red'),
      $startBlackMode : $mainContainer.find( '#popup-black'),
    };
  };

  getCompletionLabel = function($elem, workMode) {
    var backgroundState = mainPomodoro.getStateMap();
    if (backgroundState.isRunning && 
      backgroundState.selectedElemId && $elem.attr("id") == backgroundState.selectedElemId) {
      $elem.addClass('selected');

      // using state values instead of workMode values is important because workMode values can be updated in options
      // but shouldnt take affect here.
      return "(" + backgroundState.numPomodoros + "/" + backgroundState.numBlocksRequested + ")";
    }
    $elem.removeClass('selected');
    return "(" + workMode+ ")";
  };

  initModule = function($container) {
    setJqueryMap($container);
    var workmodes = background.pomodoro.prefs.getPrefs().timeblock;
    jqueryMap.$startSingle.click({pomoCount: 1}, startPomodoro);
    jqueryMap.$startBlueMode.click({pomoCount: workmodes.blue}, startPomodoro);
    jqueryMap.$startRedMode.click({pomoCount: workmodes.red}, startPomodoro);
    jqueryMap.$startBlackMode.click({pomoCount: workmodes.black}, startPomodoro);

    // setup titles
    jqueryMap.$startBlueMode.html("Blue mode " + getCompletionLabel(jqueryMap.$startBlueMode, workmodes.blue));
    jqueryMap.$startRedMode.html("Red mode " + getCompletionLabel(jqueryMap.$startRedMode, workmodes.red));
    jqueryMap.$startBlackMode.html("Blue mode " + getCompletionLabel(jqueryMap.$startBlackMode, workmodes.black));
  };

  startPomodoro = function(event) {
    var $elem = $(this);
    mainPomodoro.startPomodoro($elem.attr("id"), event.data.pomoCount);
  };

 return { initModule : initModule };

}());

popup.initModule($('#popup'));


