/*
  Localization
*/


var options = (function() {
  var 
  jqueryMap = {},
  settings = {},
  prefs = chrome.extension.getBackgroundPage().pomodoro.prefs,
  initialize, saveClickHandler, setJqueryMap,blockNumChangeHandler;

  setJqueryMap = function($container) {
    jqueryMap = {
      $container : $container,
      $tabs : $container.find("#tabs"),
      $workMins: $container.find("#work-duration"),
      $breakMins: $container.find("#break-duration"),
      $showNotifications: $container.find("#show-notifications"),
      $shouldRing: $container.find("#should-ring"),
      $blacklist: $container.find("#blacklist"),
      $redBlock: $container.find("#timeblock_red input"),
      $blueBlock: $container.find("#timeblock_blue input"),
      $blackBlock: $container.find("#timeblock_black input"),
      $save: $container.find("#save-button")
    };

    jqueryMap.$save.click(saveClickHandler);
    jqueryMap.$workMins.val(settings.durations.work/60);
    jqueryMap.$breakMins.val(settings.durations.play/60);
    jqueryMap.$showNotifications.prop('checked', settings.showNotifications);
    jqueryMap.$shouldRing.prop('checked', settings.shouldRing);
    jqueryMap.$redBlock.val(settings.timeblock.red);
    jqueryMap.$blueBlock.val(settings.timeblock.blue);
    jqueryMap.$blackBlock.val(settings.timeblock.black);
    jqueryMap.$blacklist.val(settings.blacklist.join('\n'));

    //event handlers
    jqueryMap.$redBlock.change(blockNumChangeHandler);
    jqueryMap.$blackBlock.change(blockNumChangeHandler);
    jqueryMap.$blueBlock.change(blockNumChangeHandler);
    // forcefully trigger change event on each of the work modes
    jqueryMap.$redBlock.change();
    jqueryMap.$blackBlock.change();
    jqueryMap.$blueBlock.change();


  };

  blockNumChangeHandler = function(event) {
    var $source = $(this);
    var $note = $source.parent().find('.note');
    var totalTimeMins = ($source.val() * (settings.durations.work + settings.durations.play)) / 60;
    var message = prefs.formatDuration(totalTimeMins);
    $note.html("(Total Time: " + message + ")");
  };

  saveClickHandler = function (event) {
    settings.durations.work = jqueryMap.$workMins.val() * 60;
    settings.durations.play = jqueryMap.$breakMins.val() * 60;
    settings.showNotifications = jqueryMap.$showNotifications.prop('checked');
    settings.shouldRing = jqueryMap.$shouldRing.prop('checked');
    settings.blacklist = jqueryMap.$blacklist.val().split(/\r?\n/);
    prefs.savePrefs(settings);
    return false;
  };


  initialize = function($main) {
    settings = prefs.getPrefs();
    setJqueryMap($main);
    jqueryMap.$tabs.tabs();
  };

  return {
    initialize : initialize
  };
}());

options.initialize($('#optionsContainer'));

