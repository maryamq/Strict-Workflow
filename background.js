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

      settings = default_settings; // BUG!!!! FOr test only
      return settings;
    };

   getPrefs = function() {
    // load prefs from the disk
    return settings;
   };

   savePrefs = function() {
      localStorage['prefs'] = JSON.stringify(settings);
      return prefs;
    };

  return {
    initPrefs : initPrefs,
    getPrefs : getPrefs,
    savePrefs : savePrefs
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
  executeInTabIfBlocked, executeInAllBlockedTabs, locationsMatch, parseLocation, isLocationBlocked, chromeBlockedTabListener,
  domainsMatch, startPomodoro, startTimer, timerTickCallback, startTimerCallback, endTimerCallback, breakStartCallback;

  initialize = function() {
    pomodoro.prefs.initPrefs();
    callbackMap = {onStart: startTimerCallback, onBreakStart: breakStartCallback, onEnd: endTimerCallback, onTick: timerTickCallback};
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

// TODO(maryamq): This does not work.
  locationsMatch = function(location, listedPattern) {
    return domainsMatch(location.domain, listedPattern.domain) &&
           !location.path || location.path.substr(0, listedPattern.path.length) == listedPattern.path;
      //pathsMatch(location.path, listedPattern.path);
  };

  parseLocation = function(location) {
    var components = location.split('/');
    return {domain: components.shift(), path: components.join('/')};
  };

  isLocationBlocked = function(location) {
    for(var k in settings.blacklist) {
      listedPattern = parseLocation(settings.blacklist[k]);
      if(locationsMatch(location, listedPattern)) {
        // Return true if the location is blocked.
        return true;
      }
    }

    // Now check whitelist.
    for(var k in settings.whitelist) {
      listedPattern = parseLocation(settings.whitelist[k]);
      if(locationsMatch(location, listedPattern)) {
        // Return false if the location is in whitelist.
        return false;
      }
    }
    
    return false;
  };

  executeInTabIfBlocked = function(blocked, tab) {
    var file = blocked ? configMap.blockTabFile : configMap.unblockTabFile;
    var location = tab.url.split('://');
    location = parseLocation(location[1]);
    
    if(isLocationBlocked(location)) {
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

 domainsMatch = function(test, against) {
  /*
    google.com ~> google.com: case 1, pass
    www.google.com ~> google.com: case 3, pass
    google.com ~> www.google.com: case 2, fail
    google.com ~> yahoo.com: case 3, fail
    yahoo.com ~> google.com: case 2, fail
    bit.ly ~> goo.gl: case 2, fail
    mail.com ~> gmail.com: case 2, fail
    gmail.com ~> mail.com: case 3, fail
  */

    // Case 1: if the two strings match, pass
    if(test === against) {
      return true;
    } else {
      var testFrom = test.length - against.length - 1;

      // Case 2: if the second string is longer than first, or they are the same
      // length and do not match (as indicated by case 1 failing), fail
      if(testFrom < 0) {
        return false;
      } else {
        // Case 3: if and only if the first string is longer than the second and
        // the first string ends with a period followed by the second string,
        // pass
        return test.substr(testFrom) === '.' + against;
      }
    }
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