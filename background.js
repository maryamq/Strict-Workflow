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
        work: 0.5 * 60,
        break: 0.5 * 60
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
        settings = JSON.parse(localStorage['prefs']);
      } else {
        // No prev settings found. defaults to default_setting
        settings = default_settings;
        savePrefs();
      }
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

    callbackMap.onEnd(timer);
    if (stateMap.workMode == true) {
      // restart timer for break mode
      start();
    }
  };

  return {
    initialize : initialize,
    start : start,
    isWorkMode: isWorkMode,
    getTimeRemaining: getTimeRemaining
  };
}());

function testCallback(timer) {
  console.debug("printing timer isWorkMode " + timer.isWorkMode());
}

function tickCallback(timer) {
  console.debug("Tick isWorkMode " + timer.isWorkMode());
}

var timer = pomodoro.timer.initialize( {onStart: testCallback, onEnd: testCallback, onTick: tickCallback}, {work: 2, play: 2});
pomodoro.timer.start();