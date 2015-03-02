var  pomodoro =  {};
pomodoro.prefs = (function() {

 var 
   default_settings = {
      blacklist: [
        'facebook.com',
        'twitter.com',
        'tumblr.com',
        'pinterest.com',
        'myspace.com',
        'livejournal.com',
        'digg.com',
        'stumbleupon.com',
        'reddit.com',
        'kongregate.com',
        'newgrounds.com',
        'addictinggames.com',
        'hulu.com'
      ],
      whitelist: [],
      durations: { // in seconds
        work: 2,
        play: 2
      },
      badgeBgColor : {
        work: [192, 0, 0, 255],
        play: [0, 192, 0, 255]
      },
      showNotifications: true,
      shouldRing: true,
      clickRestarts: false,
      timeblock: {
        red: 5,
        blue: 10,
        black: 20,
      }
    },
    settings = {},

   reloadPrefs, getPrefs, savePrefs;

   initPrefs = function() {
      if(typeof localStorage['prefs'] !== 'undefined') {
        diskSettings = JSON.parse(localStorage['prefs']);
        // This is useful when new properties are added.
        // Similary to $.extend
        for (var key in default_settings) {
          if (diskSettings.hasOwnProperty(key)) {
            settings[key] = diskSettings[key];
          } else {
            settings[key] = default_settings[key];
          }
        }
      } else {
        // No prev settings found. defaults to default_setting
        settings = default_settings;
      }

      return settings;
    };

   getPrefs = function() {
    // load prefs from the disk
    return settings;
   };

   savePrefs = function(new_settings) {
      settings = new_settings;
      localStorage['prefs'] = JSON.stringify(settings);
    };

  formatDuration = function(totalTimeMins) {
    var hours = parseInt(totalTimeMins/60);
    var mins = parseInt(totalTimeMins % 60);
    var message = hours > 0 ? hours + "hr:" : "00hr:";
    message += mins > 0 ? mins : "00";
    message += "m";
    return message;
  };

  return {
    initPrefs : initPrefs,
    getPrefs : getPrefs,
    savePrefs : savePrefs,
    formatDuration: formatDuration
  };
}());

pomodoro.main = (function() {
// Todo start a single pomodoro
  var 
  settings = null,
  configMap = {
    blockTabFile: "content_scripts/block.js",
    unblockTabFile: "content_scripts/unblock.js"
  },
  callbackMap = {},
  stateMap = {
    numPomodoros : 0,
    numBlocksRequested : 1,
  },
  initialize,
  executeInTabIfBlocked, executeInAllBlockedTabs, isLocationMatched, parseLocation, isLocationBlocked, chromeBlockedTabListener,
  startPomodoro, startTimer, timerTickCallback, startTimerCallback, endTimerCallback, breakStartCallback;

  initialize = function() {
    pomodoro.prefs.initPrefs();
    callbackMap = 
       {onStart: startTimerCallback, onBreakStart: breakStartCallback, onEnd: endTimerCallback, onTick: timerTickCallback};
  };

  startPomodoro = function(numBlocks) {
    settings = pomodoro.prefs.getPrefs();
    stateMap.numBlocksRequested = numBlocks
    stateMap.numPomodoros = 0;
    pomodoro.timer.initialize(callbackMap, settings.durations);
    chrome.tabs.onUpdated.addListener(chromeBlockedTabListener);
    // Call this to block currently opened windows.
    executeInAllBlockedTabs(true);
    startTimer();
  };

  startTimer = function() {
    chrome.browserAction.setBadgeBackgroundColor({color: settings.badgeBgColor.work});
    chrome.browserAction.setBadgeText ( { text: "work" } );
    pomodoro.timer.start();
  };

  chromeBlockedTabListener = function(tabId, changeInfo, tab) {
    if (pomodoro.timer.isWorkMode()) {
      executeInTabIfBlocked(true, tab);
    }
  };

  startTimerCallback = function(timer) {};
    
  breakStartCallback = function(timer) {
    chrome.browserAction.setBadgeBackgroundColor({color: settings.badgeBgColor.play});
    chrome.browserAction.setBadgeText ( { text: "play" } );
    executeInAllBlockedTabs(false);
  };

  timerTickCallback = function(timer) {
    // TODO: UI updates
  };

  endTimerCallback = function(timer) {
    stateMap.numPomodoros++;
    if (stateMap.numPomodoros < stateMap.numBlocksRequested) {
      // Only increment timer if the break mode has ended.
      startTimer();
    } else {
      chrome.browserAction.setBadgeBackgroundColor({color: settings.badgeBgColor.play});
      chrome.browserAction.setBadgeText ( { text: "done" } );
      chrome.tabs.onUpdated.removeListener(chromeBlockedTabListener);
    }
  };

  parseLocation = function (location) {
    var components = location.split('/');
    return {domain: components.shift(), path: components.join('/')};
  };

  isLocationMatched = function(url, pattern) {
    var domainMatch = false;
    var visitedParsedUrl = parseLocation(url);
    var patternParsed = parseLocation(pattern);
    // check if the domain matched.
    if(visitedParsedUrl.domain === patternParsed.domain) {
      domainMatch =  true;
    } else if (patternParsed.domain.length > visitedParsedUrl.domain.length) {
      domainMatch = false;
    } else {
      // url.domain.endsWith('.' + pattern.domain)
      var suffix = "." + patternParsed.domain;
      domainMatch = visitedParsedUrl.domain.indexOf(suffix, patternParsed.domain.length  - suffix.length) !== -1;
    }
    // If domain didn't match or there is no path in pattern, don't bother processing any more.
    if (!domainMatch || !patternParsed.path) {
      return domainMatch;
    }
    // check the path
    return patternParsed.path.substr(0, visitedParsedUrl.pathlength) == visitedParsedUrl.path;
  };

  isLocationBlocked = function(location) {
    for(var k in settings.blacklist) {
      if(isLocationMatched(location, settings.blacklist[k])) {
        // Return true if the location is blocked. Blacklist supercedes whitelist.
        return true;
      }
    }

    // Now check whitelist.
    for(var k in settings.whitelist) {
      if(isLocationMatched(location, settings.whitelist[k])) {
        // Return false if the location is in whitelist.
        return false;
      }
    }
    
    return false;
  };

  executeInTabIfBlocked = function(blocked, tab) {
    var file = blocked ? configMap.blockTabFile : configMap.unblockTabFile;
   
    if(isLocationBlocked(tab.url.split('://')[1])) {
      chrome.tabs.executeScript(tab.id, {file: file});
    }
  };

  executeInAllBlockedTabs = function(blocked) {
    var windows = chrome.windows.getAll({populate: true}, function (windows) {
      var tabs, tab, domain, listedDomain;
      for(var i in windows) {
        tabs = windows[i].tabs;
        for(var j in tabs) {
          executeInTabIfBlocked(blocked, tabs[j]);
        }
      }
    });
  };

  return {
    initialize: initialize,
    startPomodoro: startPomodoro
  }

}());
// Simple timer to start/stop a work flow
pomodoro.timer = (function () {
  var 
   callbackMap = {
    onTick: null,
    onStart: null,
    onEnd: null,
   },
   configMap = {
    work : 1, // in seconds
    play: 1
   },
   stateMap = {
    workMode: false,
    isPaused: false,
    isRunning:false,
    timeRemaining: 0
   },
   tickInterval = 0,
   timer = null,
   
   getTimeRemaining, isWorkMode,
   initialize, start, pause, end, tick;

  initialize = function(callbacks, durationConfig) {
    timer = this;
    callbackMap.onTick = callbacks.onTick;
    callbackMap.onEnd = callbacks.onEnd;
    callbackMap.onStart = callbacks.onStart;
    callbackMap.onBreakStart = callbacks.onBreakStart;
    if (durationConfig) {
      configMap.work = durationConfig.work;
      configMap.play = durationConfig.play;
    }
  };

  getTimeRemaining = function() {
    return timeRemaining;
  };

  isWorkMode = function () {
    return stateMap.workMode;
  };

  start = function() {
    stateMap.workMode = !stateMap.workMode;
    stateMap.isRunning = true;
    stateMap.isPaused = false;

    stateMap.timeRemaining = stateMap.workMode ? configMap.work : configMap.play;

    tickInterval = setInterval(tick, 1000);
    callbackMap.onStart(timer);
    callbackMap.onTick(timer);
  };

  tick = function() {
    stateMap.timeRemaining--;
    callbackMap.onTick(timer);
    if(stateMap.timeRemaining <= 0) {
      clearInterval(tickInterval);
      end(timer);
    }
  };

  end = function() {
    stateMap.isRunning = false;
    stateMap.isPaused  = false;
    stateMap.timeRemaining = null;

    if (stateMap.workMode == true) {
      // restart timer for break mode
      callbackMap.onBreakStart(timer);
      start();
    } else {
      callbackMap.onEnd(timer);
    }
  };

  return {
    initialize : initialize,
    start : start,
    isWorkMode: isWorkMode,
    getTimeRemaining: getTimeRemaining
  };
}());


pomodoro.main.initialize();