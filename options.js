
var options = (function() {
  var 
  jqueryMap = {},
  settings = {},
  mainPomodoro = chrome.extension.getBackgroundPage().pomodoro,
  prefs = mainPomodoro.prefs,

  initialize, showStatusMessage, saveClickHandler, setJqueryMap, blockNumChangeHandler;

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
      $save: $container.find("#save-button"),
      $statusMessage: $container.find("#status-message"),
    };

    //  Translate every spans that needs it.
    var $textToTranslateArr = $container.find("[data-i18n]");
    for (var i = 0; i < $textToTranslateArr.length; i++) {
      mainPomodoro.utils.setLocalizedString($($textToTranslateArr[i]));
    }

    jqueryMap.$save.click(saveClickHandler);
    jqueryMap.$workMins.val(settings.durations.work/60);
    jqueryMap.$breakMins.val(settings.durations.play/60);
    jqueryMap.$showNotifications.prop('checked', settings.showNotifications);
    jqueryMap.$shouldRing.prop('checked', settings.shouldRing);
    jqueryMap.$redBlock.val(settings.timeblock.red);
    jqueryMap.$blueBlock.val(settings.timeblock.blue);
    jqueryMap.$blackBlock.val(settings.timeblock.black);
    jqueryMap.$blacklist.val(settings.blacklist.join('\n'));
    jqueryMap.$statusMessage.hide();

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

  showStatusMessage = function(messageKey, isError) {
    jqueryMap.$statusMessage.attr("data-i18n", messageKey);
    mainPomodoro.utils.setLocalizedString(jqueryMap.$statusMessage);
    jqueryMap.$statusMessage.attr("class", !isError ? "option-save-success": "option-save-error");
    jqueryMap.$statusMessage.show();
  },

  saveClickHandler = function (event) {
    var workMins = jqueryMap.$workMins.val();
    var playMins = jqueryMap.$breakMins.val();
    var redBlock = jqueryMap.$redBlock.val();
    var blueBlock = jqueryMap.$blueBlock.val();
    var blackBlock = jqueryMap.$blackBlock.val();
    jqueryMap.$statusMessage.show();
    // Basic validation for time and timeblocks.
    if (!$.isNumeric(workMins) || !$.isNumeric(playMins)) {
      showStatusMessage("options_time_format_error", true);
      return;
    }
    if (!$.isNumeric(redBlock) || !$.isNumeric(blueBlock) || !$.isNumeric(blackBlock)) {
      showStatusMessage("options_time_block_error", true);
      return;
    }

    settings.durations.work = workMins * 60;
    settings.durations.play = playMins * 60;
    settings.showNotifications = jqueryMap.$showNotifications.prop('checked');
    settings.shouldRing = jqueryMap.$shouldRing.prop('checked');
    settings.blacklist = jqueryMap.$blacklist.val().split(/\r?\n/);
    settings.timeblock.blue = blueBlock
    settings.timeblock.red = redBlock
    settings.timeblock.black = blackBlock
    prefs.savePrefs(settings);
    showStatusMessage("options_save_successful", false);
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