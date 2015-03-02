/*
  Localization
*/


var options = (function() {
  var 
  jqueryMap = {},
  settings = {},
  prefs = chrome.extension.getBackgroundPage().pomodoro.prefs,
  initialize, saveClickHandler, setJqueryMap;

  setJqueryMap = function($container) {
    jqueryMap = {
      $container : $container,
      $tabs : $container.find("#tabs"),
      $workMins: $container.find("#work-duration"),
      $breakMins: $container.find("#break-duration"),
      $showNotifications: $container.find("#show-notifications"),
      $shouldRing: $container.find("#should-ring"),
      $blacklist: $container.find("#blacklist"),
      $save: $container.find("#save-button")
    };

    jqueryMap.$save.click(saveClickHandler);

    jqueryMap.$workMins.val(settings.durations.work/60);
    jqueryMap.$breakMins.val(settings.durations.play/60);
    jqueryMap.$showNotifications.prop('checked', settings.showNotifications);
    jqueryMap.$shouldRing.prop('checked', settings.shouldRing);
    jqueryMap.$blacklist.val(settings.blacklist.join('\n'));

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

