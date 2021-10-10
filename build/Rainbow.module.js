
/**
 * @license
 * Copyright 2021-08-02 MrKBear mrkbear@qq.com
 * All rights reserved.
 * This file is part of the App project.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 */
var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}

// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active ) ;
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };
    
// Alias for removeListener added in NodeJS 10.0
// https://nodejs.org/api/events.html#events_emitter_off_eventname_listener
EventEmitter.prototype.off = function(type, listener){
    return this.removeListener(type, listener);
};

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

var resizeObservers = [];

var hasActiveObservations = function () {
    return resizeObservers.some(function (ro) { return ro.activeTargets.length > 0; });
};

var hasSkippedObservations = function () {
    return resizeObservers.some(function (ro) { return ro.skippedTargets.length > 0; });
};

var msg = 'ResizeObserver loop completed with undelivered notifications.';
var deliverResizeLoopError = function () {
    var event;
    if (typeof ErrorEvent === 'function') {
        event = new ErrorEvent('error', {
            message: msg
        });
    }
    else {
        event = document.createEvent('Event');
        event.initEvent('error', false, false);
        event.message = msg;
    }
    window.dispatchEvent(event);
};

var ResizeObserverBoxOptions;
(function (ResizeObserverBoxOptions) {
    ResizeObserverBoxOptions["BORDER_BOX"] = "border-box";
    ResizeObserverBoxOptions["CONTENT_BOX"] = "content-box";
    ResizeObserverBoxOptions["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
})(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));

var freeze = function (obj) { return Object.freeze(obj); };

var ResizeObserverSize = (function () {
    function ResizeObserverSize(inlineSize, blockSize) {
        this.inlineSize = inlineSize;
        this.blockSize = blockSize;
        freeze(this);
    }
    return ResizeObserverSize;
}());

var DOMRectReadOnly = (function () {
    function DOMRectReadOnly(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.top = this.y;
        this.left = this.x;
        this.bottom = this.top + this.height;
        this.right = this.left + this.width;
        return freeze(this);
    }
    DOMRectReadOnly.prototype.toJSON = function () {
        var _a = this, x = _a.x, y = _a.y, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left, width = _a.width, height = _a.height;
        return { x: x, y: y, top: top, right: right, bottom: bottom, left: left, width: width, height: height };
    };
    DOMRectReadOnly.fromRect = function (rectangle) {
        return new DOMRectReadOnly(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    };
    return DOMRectReadOnly;
}());

var isSVG = function (target) { return target instanceof SVGElement && 'getBBox' in target; };
var isHidden = function (target) {
    if (isSVG(target)) {
        var _a = target.getBBox(), width = _a.width, height = _a.height;
        return !width && !height;
    }
    var _b = target, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
    return !(offsetWidth || offsetHeight || target.getClientRects().length);
};
var isElement = function (obj) {
    var _a, _b;
    if (obj instanceof Element) {
        return true;
    }
    var scope = (_b = (_a = obj) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
    return !!(scope && obj instanceof scope.Element);
};
var isReplacedElement = function (target) {
    switch (target.tagName) {
        case 'INPUT':
            if (target.type !== 'image') {
                break;
            }
        case 'VIDEO':
        case 'AUDIO':
        case 'EMBED':
        case 'OBJECT':
        case 'CANVAS':
        case 'IFRAME':
        case 'IMG':
            return true;
    }
    return false;
};

var global = typeof window !== 'undefined' ? window : {};

var cache = new WeakMap();
var scrollRegexp = /auto|scroll/;
var verticalRegexp = /^tb|vertical/;
var IE = (/msie|trident/i).test(global.navigator && global.navigator.userAgent);
var parseDimension = function (pixel) { return parseFloat(pixel || '0'); };
var size = function (inlineSize, blockSize, switchSizes) {
    if (inlineSize === void 0) { inlineSize = 0; }
    if (blockSize === void 0) { blockSize = 0; }
    if (switchSizes === void 0) { switchSizes = false; }
    return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
};
var zeroBoxes = freeze({
    devicePixelContentBoxSize: size(),
    borderBoxSize: size(),
    contentBoxSize: size(),
    contentRect: new DOMRectReadOnly(0, 0, 0, 0)
});
var calculateBoxSizes = function (target, forceRecalculation) {
    if (forceRecalculation === void 0) { forceRecalculation = false; }
    if (cache.has(target) && !forceRecalculation) {
        return cache.get(target);
    }
    if (isHidden(target)) {
        cache.set(target, zeroBoxes);
        return zeroBoxes;
    }
    var cs = getComputedStyle(target);
    var svg = isSVG(target) && target.ownerSVGElement && target.getBBox();
    var removePadding = !IE && cs.boxSizing === 'border-box';
    var switchSizes = verticalRegexp.test(cs.writingMode || '');
    var canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || '');
    var canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || '');
    var paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
    var paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
    var paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
    var paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
    var borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
    var borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
    var borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
    var borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
    var horizontalPadding = paddingLeft + paddingRight;
    var verticalPadding = paddingTop + paddingBottom;
    var horizontalBorderArea = borderLeft + borderRight;
    var verticalBorderArea = borderTop + borderBottom;
    var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
    var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
    var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
    var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
    var contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
    var contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
    var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
    var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
    var boxes = freeze({
        devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
        borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
        contentBoxSize: size(contentWidth, contentHeight, switchSizes),
        contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
    });
    cache.set(target, boxes);
    return boxes;
};
var calculateBoxSize = function (target, observedBox, forceRecalculation) {
    var _a = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a.borderBoxSize, contentBoxSize = _a.contentBoxSize, devicePixelContentBoxSize = _a.devicePixelContentBoxSize;
    switch (observedBox) {
        case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
            return devicePixelContentBoxSize;
        case ResizeObserverBoxOptions.BORDER_BOX:
            return borderBoxSize;
        default:
            return contentBoxSize;
    }
};

var ResizeObserverEntry = (function () {
    function ResizeObserverEntry(target) {
        var boxes = calculateBoxSizes(target);
        this.target = target;
        this.contentRect = boxes.contentRect;
        this.borderBoxSize = freeze([boxes.borderBoxSize]);
        this.contentBoxSize = freeze([boxes.contentBoxSize]);
        this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
    }
    return ResizeObserverEntry;
}());

var calculateDepthForNode = function (node) {
    if (isHidden(node)) {
        return Infinity;
    }
    var depth = 0;
    var parent = node.parentNode;
    while (parent) {
        depth += 1;
        parent = parent.parentNode;
    }
    return depth;
};

var broadcastActiveObservations = function () {
    var shallowestDepth = Infinity;
    var callbacks = [];
    resizeObservers.forEach(function processObserver(ro) {
        if (ro.activeTargets.length === 0) {
            return;
        }
        var entries = [];
        ro.activeTargets.forEach(function processTarget(ot) {
            var entry = new ResizeObserverEntry(ot.target);
            var targetDepth = calculateDepthForNode(ot.target);
            entries.push(entry);
            ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
            if (targetDepth < shallowestDepth) {
                shallowestDepth = targetDepth;
            }
        });
        callbacks.push(function resizeObserverCallback() {
            ro.callback.call(ro.observer, entries, ro.observer);
        });
        ro.activeTargets.splice(0, ro.activeTargets.length);
    });
    for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
        var callback = callbacks_1[_i];
        callback();
    }
    return shallowestDepth;
};

var gatherActiveObservationsAtDepth = function (depth) {
    resizeObservers.forEach(function processObserver(ro) {
        ro.activeTargets.splice(0, ro.activeTargets.length);
        ro.skippedTargets.splice(0, ro.skippedTargets.length);
        ro.observationTargets.forEach(function processTarget(ot) {
            if (ot.isActive()) {
                if (calculateDepthForNode(ot.target) > depth) {
                    ro.activeTargets.push(ot);
                }
                else {
                    ro.skippedTargets.push(ot);
                }
            }
        });
    });
};

var process = function () {
    var depth = 0;
    gatherActiveObservationsAtDepth(depth);
    while (hasActiveObservations()) {
        depth = broadcastActiveObservations();
        gatherActiveObservationsAtDepth(depth);
    }
    if (hasSkippedObservations()) {
        deliverResizeLoopError();
    }
    return depth > 0;
};

var trigger;
var callbacks = [];
var notify = function () { return callbacks.splice(0).forEach(function (cb) { return cb(); }); };
var queueMicroTask = function (callback) {
    if (!trigger) {
        var toggle_1 = 0;
        var el_1 = document.createTextNode('');
        var config = { characterData: true };
        new MutationObserver(function () { return notify(); }).observe(el_1, config);
        trigger = function () { el_1.textContent = "" + (toggle_1 ? toggle_1-- : toggle_1++); };
    }
    callbacks.push(callback);
    trigger();
};

var queueResizeObserver = function (cb) {
    queueMicroTask(function ResizeObserver() {
        requestAnimationFrame(cb);
    });
};

var watching = 0;
var isWatching = function () { return !!watching; };
var CATCH_PERIOD = 250;
var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
var events = [
    'resize',
    'load',
    'transitionend',
    'animationend',
    'animationstart',
    'animationiteration',
    'keyup',
    'keydown',
    'mouseup',
    'mousedown',
    'mouseover',
    'mouseout',
    'blur',
    'focus'
];
var time = function (timeout) {
    if (timeout === void 0) { timeout = 0; }
    return Date.now() + timeout;
};
var scheduled = false;
var Scheduler = (function () {
    function Scheduler() {
        var _this = this;
        this.stopped = true;
        this.listener = function () { return _this.schedule(); };
    }
    Scheduler.prototype.run = function (timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = CATCH_PERIOD; }
        if (scheduled) {
            return;
        }
        scheduled = true;
        var until = time(timeout);
        queueResizeObserver(function () {
            var elementsHaveResized = false;
            try {
                elementsHaveResized = process();
            }
            finally {
                scheduled = false;
                timeout = until - time();
                if (!isWatching()) {
                    return;
                }
                if (elementsHaveResized) {
                    _this.run(1000);
                }
                else if (timeout > 0) {
                    _this.run(timeout);
                }
                else {
                    _this.start();
                }
            }
        });
    };
    Scheduler.prototype.schedule = function () {
        this.stop();
        this.run();
    };
    Scheduler.prototype.observe = function () {
        var _this = this;
        var cb = function () { return _this.observer && _this.observer.observe(document.body, observerConfig); };
        document.body ? cb() : global.addEventListener('DOMContentLoaded', cb);
    };
    Scheduler.prototype.start = function () {
        var _this = this;
        if (this.stopped) {
            this.stopped = false;
            this.observer = new MutationObserver(this.listener);
            this.observe();
            events.forEach(function (name) { return global.addEventListener(name, _this.listener, true); });
        }
    };
    Scheduler.prototype.stop = function () {
        var _this = this;
        if (!this.stopped) {
            this.observer && this.observer.disconnect();
            events.forEach(function (name) { return global.removeEventListener(name, _this.listener, true); });
            this.stopped = true;
        }
    };
    return Scheduler;
}());
var scheduler = new Scheduler();
var updateCount = function (n) {
    !watching && n > 0 && scheduler.start();
    watching += n;
    !watching && scheduler.stop();
};

var skipNotifyOnElement = function (target) {
    return !isSVG(target)
        && !isReplacedElement(target)
        && getComputedStyle(target).display === 'inline';
};
var ResizeObservation = (function () {
    function ResizeObservation(target, observedBox) {
        this.target = target;
        this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
        this.lastReportedSize = {
            inlineSize: 0,
            blockSize: 0
        };
    }
    ResizeObservation.prototype.isActive = function () {
        var size = calculateBoxSize(this.target, this.observedBox, true);
        if (skipNotifyOnElement(this.target)) {
            this.lastReportedSize = size;
        }
        if (this.lastReportedSize.inlineSize !== size.inlineSize
            || this.lastReportedSize.blockSize !== size.blockSize) {
            return true;
        }
        return false;
    };
    return ResizeObservation;
}());

var ResizeObserverDetail = (function () {
    function ResizeObserverDetail(resizeObserver, callback) {
        this.activeTargets = [];
        this.skippedTargets = [];
        this.observationTargets = [];
        this.observer = resizeObserver;
        this.callback = callback;
    }
    return ResizeObserverDetail;
}());

var observerMap = new WeakMap();
var getObservationIndex = function (observationTargets, target) {
    for (var i = 0; i < observationTargets.length; i += 1) {
        if (observationTargets[i].target === target) {
            return i;
        }
    }
    return -1;
};
var ResizeObserverController = (function () {
    function ResizeObserverController() {
    }
    ResizeObserverController.connect = function (resizeObserver, callback) {
        var detail = new ResizeObserverDetail(resizeObserver, callback);
        observerMap.set(resizeObserver, detail);
    };
    ResizeObserverController.observe = function (resizeObserver, target, options) {
        var detail = observerMap.get(resizeObserver);
        var firstObservation = detail.observationTargets.length === 0;
        if (getObservationIndex(detail.observationTargets, target) < 0) {
            firstObservation && resizeObservers.push(detail);
            detail.observationTargets.push(new ResizeObservation(target, options && options.box));
            updateCount(1);
            scheduler.schedule();
        }
    };
    ResizeObserverController.unobserve = function (resizeObserver, target) {
        var detail = observerMap.get(resizeObserver);
        var index = getObservationIndex(detail.observationTargets, target);
        var lastObservation = detail.observationTargets.length === 1;
        if (index >= 0) {
            lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
            detail.observationTargets.splice(index, 1);
            updateCount(-1);
        }
    };
    ResizeObserverController.disconnect = function (resizeObserver) {
        var _this = this;
        var detail = observerMap.get(resizeObserver);
        detail.observationTargets.slice().forEach(function (ot) { return _this.unobserve(resizeObserver, ot.target); });
        detail.activeTargets.splice(0, detail.activeTargets.length);
    };
    return ResizeObserverController;
}());

var ResizeObserver = (function () {
    function ResizeObserver(callback) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
        }
        if (typeof callback !== 'function') {
            throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
        }
        ResizeObserverController.connect(this, callback);
    }
    ResizeObserver.prototype.observe = function (target, options) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
        }
        if (!isElement(target)) {
            throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
        }
        ResizeObserverController.observe(this, target, options);
    };
    ResizeObserver.prototype.unobserve = function (target) {
        if (arguments.length === 0) {
            throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
        }
        if (!isElement(target)) {
            throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
        }
        ResizeObserverController.unobserve(this, target);
    };
    ResizeObserver.prototype.disconnect = function () {
        ResizeObserverController.disconnect(this);
    };
    ResizeObserver.toString = function () {
        return 'function ResizeObserver () { [polyfill code] }';
    };
    return ResizeObserver;
}());

/**
 * 封装 GLCanvas
 * 管理封装画布的功能属性
 * 监听画布事件
 *
 * @event resize 画布缓冲区大小改变
 * @event mousemove 鼠标移动
 * @event mouseup 鼠标抬起
 * @event mousedown 鼠标按下
 */
class GLCanvas extends EventEmitter {
    /**
     * HTML节点
     */
    canvas;
    div;
    /**
     * 获取节点
     */
    get dom() {
        return this.div;
    }
    get can() {
        return this.canvas;
    }
    /**
     * 像素分辨率
     */
    pixelRatio = devicePixelRatio ?? 1;
    /**
     * 帧缓冲区宽度
     */
    get width() {
        return this.canvas.width;
    }
    /**
     * 帧缓冲区高度
     */
    get height() {
        return this.canvas.height;
    }
    /**
     * 画布宽度
     */
    get offsetWidth() {
        return this.canvas.offsetWidth;
    }
    /**
     * 画布高度
     */
    get offsetHeight() {
        return this.canvas.offsetHeight;
    }
    /**
     * 缩放 X
     */
    get scaleX() {
        return this.canvas.width / this.canvas.offsetWidth;
    }
    /**
     * 缩放 Y
     */
    get scaleY() {
        return this.canvas.height / this.canvas.offsetHeight;
    }
    /**
     * 分辨率 (画布宽高比)
     */
    get ratio() {
        return this.canvas.offsetWidth / this.canvas.offsetHeight;
    }
    /**
     * 缓存判断是否要设置 canvas 大小
     */
    offsetFlg = [NaN, NaN];
    /**
     * 画布大小适应到 css 大小
     */
    resize() {
        if (this.offsetWidth !== this.offsetFlg[0] ||
            this.offsetHeight !== this.offsetFlg[1]) {
            // 缓存记录
            this.offsetFlg[0] = this.offsetWidth;
            this.offsetFlg[1] = this.offsetHeight;
            // 重置缓冲区
            this.canvas.width = this.offsetWidth * this.pixelRatio;
            this.canvas.height = this.offsetHeight * this.pixelRatio;
            this.emit("resize", this);
        }
    }
    /**
     * 鼠标 X 坐标
     */
    mouseX = 0;
    /**
     * 鼠标 Y 坐标
     */
    mouseY = 0;
    /**
     * 鼠标相对 X 坐标
     */
    mouseUvX = 0;
    /**
     * 鼠标相对 Y 坐标
     */
    mouseUvY = 0;
    /**
     * 鼠标 GLX 坐标
     */
    mouseGlX = 0;
    /**
     * 鼠标 GLY 坐标
     */
    mouseGlY = 0;
    /**
     * 鼠标 X 变化量
     */
    mouseMotionX = 0;
    /**
     * 鼠标 Y 变化量
     */
    mouseMotionY = 0;
    /**
     * 缓存鼠标位置
     */
    mouseFlg = [NaN, NaN];
    /**
     * 保存鼠标数据
     */
    calcMouseData(offsetX, offsetY) {
        if (offsetX !== this.mouseFlg[0] ||
            offsetY !== this.mouseFlg[1]) {
            this.mouseX = offsetX;
            this.mouseY = offsetY;
            this.mouseUvX = offsetX / this.offsetWidth;
            this.mouseUvY = offsetY / this.offsetHeight;
            this.mouseGlX = this.mouseUvX * 2 - 1;
            this.mouseGlY = -this.mouseUvY * 2 + 1;
            this.mouseMotionX = offsetX - this.mouseFlg[0];
            this.mouseMotionY = offsetY - this.mouseFlg[1];
            this.mouseFlg[0] = offsetX;
            this.mouseFlg[1] = offsetY;
            return true;
        }
        return false;
    }
    calcMouseDataFromTouchEvent(e) {
        if (e.touches.length <= 0)
            return;
        let offsetX = e.touches[0].clientX - this.canvas.offsetLeft;
        let offsetY = e.touches[0].clientY - this.canvas.offsetTop;
        return this.calcMouseData(offsetX, offsetY);
    }
    /**
     * 鼠标触摸触发计数
     */
    touchCount = 0;
    /**
     * 鼠标是否按下
     */
    mouseDown = false;
    /**
     * 检测 canvas 变化
     */
    obs = null;
    /**
     * 使用 canvas 节点创建
     * 不适用节点则自动创建
     * @param ele 使用的 canvas节点
     * @param o 设置
     */
    constructor(ele, o) {
        super();
        let opt = o ?? {};
        let autoResize = opt.autoResize ?? true;
        let mouseEvent = opt.mouseEvent ?? true;
        let eventLog = opt.eventLog ?? false;
        // 获取/创建节点
        this.canvas = ele ?? document.createElement("canvas");
        this.div = document.createElement("div");
        this.div.appendChild(this.canvas);
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        if (autoResize) {
            // 创建观察者
            this.obs = new (window.ResizeObserver || ResizeObserver)((entries) => {
                for (let entry of entries) {
                    if (entry.target === this.canvas)
                        this.resize();
                }
            });
            // 大小监听
            this.obs.observe(this.canvas);
        }
        if (mouseEvent) {
            this.canvas.addEventListener("mouseup", (e) => {
                if (this.touchCount >= 2) {
                    this.touchCount = 0;
                    return;
                }
                if (eventLog)
                    console.log("GLCanvas: mouseup");
                this.mouseDown = false;
                this.calcMouseData(e.offsetX, e.offsetY);
                this.emit("mouseup", this);
            });
            this.canvas.addEventListener("touchstart", (e) => {
                this.touchCount = 1;
                if (eventLog)
                    console.log("GLCanvas: touchstart");
                this.mouseDown = true;
                this.calcMouseDataFromTouchEvent(e);
                this.emit("mousedown", this);
            });
            this.canvas.addEventListener("mousedown", (e) => {
                if (this.touchCount >= 2)
                    return;
                if (eventLog)
                    console.log("GLCanvas: mousedown");
                this.mouseDown = true;
                this.calcMouseData(e.offsetX, e.offsetY);
                this.emit("mousedown", this);
            });
            this.canvas.addEventListener("touchend", (e) => {
                this.touchCount++;
                if (eventLog)
                    console.log("GLCanvas: touchend");
                this.mouseDown = false;
                this.calcMouseDataFromTouchEvent(e);
                this.emit("mouseup", this);
            });
            this.canvas.addEventListener("mousemove", (e) => {
                if (this.touchCount >= 2)
                    return;
                if (eventLog)
                    console.log("GLCanvas: mousemove");
                if (this.calcMouseData(e.offsetX, e.offsetY))
                    this.emit("mousemove", this);
            });
            this.canvas.addEventListener("touchmove", (e) => {
                if (eventLog)
                    console.log("GLCanvas: touchmove");
                if (this.calcMouseDataFromTouchEvent(e))
                    this.emit("mousemove", this);
            });
        }
    }
}

/**
 * Shader类
 */
class GLProgram {
    /**
     * shader 使用的上下文
     */
    gl;
    /**
     * 顶点着色器源码
     */
    vertexShaderSource = "";
    /**
     * 片段着色器源代码
     */
    fragmentShaderSource = "";
    /**
     * 顶点着色器
     */
    vertexShader;
    /**
     * 片段着色器
     */
    fragmentShader;
    /**
     * 程序
     */
    program;
    /**
     * 设置源代码
     */
    setSource(vert, frag) {
        this.vertexShaderSource =
            vert.replace(/^\s+/, "");
        this.fragmentShaderSource =
            frag.replace(/^\s+/, "");
        return this;
    }
    /**
     * 编译
     */
    compile() {
        // 创建程序
        this.program = this.gl.createProgram();
        // 创建顶点着色器
        this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        // 创建片段着色器
        this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        // 绑定源代码
        this.gl.shaderSource(this.vertexShader, this.vertexShaderSource);
        this.gl.shaderSource(this.fragmentShader, this.fragmentShaderSource);
        // 编译
        this.gl.compileShader(this.vertexShader);
        this.gl.compileShader(this.fragmentShader);
        // 检测编译错误
        if (!this.gl.getShaderParameter(this.vertexShader, this.gl.COMPILE_STATUS)) {
            console.error("vertex:\r\n" + this.gl.getShaderInfoLog(this.vertexShader));
        }
        if (!this.gl.getShaderParameter(this.fragmentShader, this.gl.COMPILE_STATUS)) {
            console.error("fragment:\r\n" + this.gl.getShaderInfoLog(this.fragmentShader));
        }
        // 附加到程序
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);
        // 连接程序
        this.gl.linkProgram(this.program);
        // 检测链接错误
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error("link:\r\n" + this.gl.getProgramInfoLog(this.program));
        }
        return this;
    }
    /**
     * 创建编译 shader
     */
    constructor(gl) {
        this.gl = gl;
        this.onload();
    }
    onload() { }
    ;
    /**
     * attrib 位置缓存
     */
    attribLocationCache = {};
    /**
     * attrib 位置缓存
     */
    uniformLocationCache = {};
    /**
     * 获取 attribLocation
     */
    attribLocate(attr) {
        // 获取缓存
        let cache = this.attribLocationCache[attr];
        // 缓存搜索
        if (cache === undefined || cache <= -1) {
            cache = this.gl.getAttribLocation(this.program, attr);
            if (cache === undefined || cache <= -1) {
                console.error("Attrib: can not get locate of " + attr);
            }
            else {
                this.gl.enableVertexAttribArray(cache);
            }
            this.attribLocationCache[attr] = cache;
            return cache;
        }
        // 搜索到返回
        else {
            this.gl.enableVertexAttribArray(cache);
            return cache;
        }
    }
    /**
     * 获取 attribLocation
     */
    uniformLocate(uni) {
        // 获取缓存
        let cache = this.uniformLocationCache[uni];
        // 缓存搜索
        if (!cache) {
            cache = this.gl.getUniformLocation(this.program, uni);
            if (!cache)
                console.error("Uniform: can not get locate of " + uni);
            this.uniformLocationCache[uni] = cache;
            return cache;
        }
        // 搜索到返回
        else
            return cache;
    }
    /**
     * 使用程序
     */
    use() {
        this.gl.useProgram(this.program);
        return this;
    }
}

/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create$2() {
  var out = new ARRAY_TYPE(16);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function invert(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspective(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$1() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */

function set$1(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$1();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
})();

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create() {
  var out = new ARRAY_TYPE(2);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */

function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
})();

/**
 * 摄像机
 */
class Camera {
    canvas;
    /**
     * 视点
     */
    eye;
    /**
     * 目标
     */
    target;
    /**
     * 镜头旋转方向
     */
    up;
    /**
     * 视野大小
     */
    range = Math.PI / 9;
    /**
     * 画布宽高比例
     */
    ratio = 1.;
    /**
     * 进远平面距离
     */
    nearFar;
    /**
     * 观察者矩阵
     */
    viewMat;
    /**
     * 观察者矩阵
     */
    projectionMat;
    /**
     * 变换矩阵
     */
    transformMat;
    /**
     * 逆变换矩阵
     */
    transformNMat;
    /**
     * 构造函数设置初始值
     */
    constructor(canvas) {
        this.canvas = canvas;
        // 设置全部参数的初始值
        this.eye = create$1();
        this.target = create$1();
        this.up = create$1();
        this.nearFar = create();
        this.viewMat = create$2();
        this.projectionMat = create$2();
        this.transformMat = create$2();
        this.transformNMat = create$2();
        // 设置视点初始值
        set$1(this.eye, 0., 0., 10.);
        // 设置向上方向
        set$1(this.up, 0., 1., 0.);
        // 设置进远平面
        set(this.nearFar, 0.001, 1000.);
        // 射线追踪临时变量
        this.tempRayP = create$1();
        this.tempRayO = create$1();
        this.tempRayPoint = create$1();
    }
    tempRayPoint;
    tempRayP;
    tempRayO;
    /**
     * 生成变换需要的全部矩阵
     */
    generateMat() {
        // 更新 ratio
        this.ratio = this.canvas.ratio;
        // 更新观察者矩阵
        lookAt(this.viewMat, this.eye, this.target, this.up);
        // 更新投影矩阵
        perspective(this.projectionMat, this.range, this.ratio, this.nearFar[0], this.nearFar[1]);
        // 更新变换矩阵
        multiply(this.transformMat, this.projectionMat, this.viewMat);
        // 计算逆矩阵
        invert(this.transformNMat, this.transformMat);
    }
    /**
     * X 轴旋转角度
     * [0 - 360)
     */
    angleX = 90;
    /**
     * Y 轴旋转角度
     * [90 - -90]
     */
    angleY = 0;
    /**
     * 通过角度设置视点
     */
    setEyeFromAngle() {
        // 平移至原点
        sub(this.eye, this.eye, this.target);
        // 计算视点距离
        let dis = length(this.eye);
        // 计算方向角
        let anDir = create$1();
        // 设置水平旋转坐标
        let dx = Math.cos(this.angleX * Math.PI / 180);
        let dz = Math.sin(this.angleX * Math.PI / 180);
        // 计算垂直旋转坐标
        let dv = Math.cos(this.angleY * Math.PI / 180);
        let dy = Math.sin(this.angleY * Math.PI / 180);
        // 合成
        set$1(anDir, dx * dv * dis, dy * dis, dz * dv * dis);
        // 赋值
        copy(this.eye, anDir);
        // 平移回视点
        add(this.eye, this.eye, this.target);
    }
    /**
     * 控制灵敏度
     */
    sensitivity = .5;
    /**
     * 摄像机控制函数
     */
    ctrl(x, y) {
        this.angleX += x * this.sensitivity;
        this.angleY += y * this.sensitivity;
        if (this.angleX > 360)
            this.angleX = this.angleX - 360;
        if (this.angleX < 0)
            this.angleX = 360 + this.angleX;
        if (this.angleY > 90)
            this.angleY = 90;
        if (this.angleY < -90)
            this.angleY = -90;
        this.setEyeFromAngle();
    }
    /**
     * 射线追踪
     */
    rayTrack(x, y) {
        // 逆变换
        set$1(this.tempRayP, x, y, 1);
        transformMat4(this.tempRayP, this.tempRayP, this.transformNMat);
        set$1(this.tempRayO, x, y, 0);
        transformMat4(this.tempRayO, this.tempRayO, this.transformNMat);
        sub(this.tempRayP, this.tempRayP, this.tempRayO);
        normalize(this.tempRayP, this.tempRayP);
        return [this.tempRayO, this.tempRayP];
    }
    /**
     * 极限追踪距离
     */
    EL = 1e-5;
    scaleRay(D, d, o, p) {
        // 限制 d
        if (d < this.EL)
            d = this.EL;
        let len = D / d;
        this.tempRayPoint[0] = o[0] + p[0] * len;
        this.tempRayPoint[1] = o[1] + p[1] * len;
        this.tempRayPoint[2] = o[2] + p[2] * len;
        return this.tempRayPoint;
    }
    /**
     * 计算射线与 XY 平面焦点
     * @param o 射线原点
     * @param p 射线方向
     * @param k 交点距离
     */
    intersectionLineXYPlant(o, p, k = 0) {
        let d = Math.abs(p[2] - k);
        let D = Math.abs(o[2] - k);
        return this.scaleRay(D, d, o, p);
    }
    /**
     * 计算射线与 XZ 平面焦点
     * @param o 射线原点
     * @param p 射线方向
     * @param k 交点距离
     */
    intersectionLineXZPlant(o, p, k = 0) {
        let d = Math.abs(p[1] - k);
        let D = Math.abs(o[1] - k);
        return this.scaleRay(D, d, o, p);
    }
    /**
     * 计算射线与 YZ 平面焦点
     * @param o 射线原点
     * @param p 射线方向
     * @param k 交点距离
     */
    intersectionLineYZPlant(o, p, k = 0) {
        let d = Math.abs(p[0] - k);
        let D = Math.abs(o[0] - k);
        return this.scaleRay(D, d, o, p);
    }
}

/**
 * @author mrdoob / http://mrdoob.com/
 */

var Stats = function () {

	var mode = 0;

	var container = document.createElement( 'div' );
	container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
	container.addEventListener( 'click', function ( event ) {

		event.preventDefault();
		showPanel( ++ mode % container.children.length );

	}, false );

	//

	function addPanel( panel ) {

		container.appendChild( panel.dom );
		return panel;

	}

	function showPanel( id ) {

		for ( var i = 0; i < container.children.length; i ++ ) {

			container.children[ i ].style.display = i === id ? 'block' : 'none';

		}

		mode = id;

	}

	//

	var beginTime = ( performance || Date ).now(), prevTime = beginTime, frames = 0;

	var fpsPanel = addPanel( new Stats.Panel( 'FPS', '#0ff', '#002' ) );
	var msPanel = addPanel( new Stats.Panel( 'MS', '#0f0', '#020' ) );

	if ( self.performance && self.performance.memory ) {

		var memPanel = addPanel( new Stats.Panel( 'MB', '#f08', '#201' ) );

	}

	showPanel( 0 );

	return {

		REVISION: 16,

		dom: container,

		addPanel: addPanel,
		showPanel: showPanel,

		begin: function () {

			beginTime = ( performance || Date ).now();

		},

		end: function () {

			frames ++;

			var time = ( performance || Date ).now();

			msPanel.update( time - beginTime, 200 );

			if ( time > prevTime + 1000 ) {

				fpsPanel.update( ( frames * 1000 ) / ( time - prevTime ), 100 );

				prevTime = time;
				frames = 0;

				if ( memPanel ) {

					var memory = performance.memory;
					memPanel.update( memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576 );

				}

			}

			return time;

		},

		update: function () {

			beginTime = this.end();

		},

		// Backwards Compatibility

		domElement: container,
		setMode: showPanel

	};

};

Stats.Panel = function ( name, fg, bg ) {

	var min = Infinity, max = 0, round = Math.round;
	var PR = round( window.devicePixelRatio || 1 );

	var WIDTH = 80 * PR, HEIGHT = 48 * PR,
			TEXT_X = 3 * PR, TEXT_Y = 2 * PR,
			GRAPH_X = 3 * PR, GRAPH_Y = 15 * PR,
			GRAPH_WIDTH = 74 * PR, GRAPH_HEIGHT = 30 * PR;

	var canvas = document.createElement( 'canvas' );
	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	canvas.style.cssText = 'width:80px;height:48px';

	var context = canvas.getContext( '2d' );
	context.font = 'bold ' + ( 9 * PR ) + 'px Helvetica,Arial,sans-serif';
	context.textBaseline = 'top';

	context.fillStyle = bg;
	context.fillRect( 0, 0, WIDTH, HEIGHT );

	context.fillStyle = fg;
	context.fillText( name, TEXT_X, TEXT_Y );
	context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

	context.fillStyle = bg;
	context.globalAlpha = 0.9;
	context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

	return {

		dom: canvas,

		update: function ( value, maxValue ) {

			min = Math.min( min, value );
			max = Math.max( max, value );

			context.fillStyle = bg;
			context.globalAlpha = 1;
			context.fillRect( 0, 0, WIDTH, GRAPH_Y );
			context.fillStyle = fg;
			context.fillText( round( value ) + ' ' + name + ' (' + round( min ) + '-' + round( max ) + ')', TEXT_X, TEXT_Y );

			context.drawImage( canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT );

			context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT );

			context.fillStyle = bg;
			context.globalAlpha = 0.9;
			context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round( ( 1 - ( value / maxValue ) ) * GRAPH_HEIGHT ) );

		}

	};

};

/**
 * 时钟
 */
class Clock {
    /**
     * 总用时
     */
    allTime = 0;
    /**
     * 速率
     */
    speed = 1;
    /**
     * fps监视器
     */
    stats;
    /**
     * 是否使用 Stats
     */
    isStatsOn = false;
    /**
     * 开启 fps 监视
     */
    useStats() {
        this.stats = new Stats();
        this.isStatsOn = true;
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
        return this;
    }
    /**
     * 主函数
     */
    fn;
    /**
     * 动画循环
     * @param fn 循环函数
     */
    constructor(fn) {
        this.fn = fn ?? ((t) => { });
    }
    /**
     * 设置函数
     * @param fn 循环函数
     */
    setFn(fn) {
        this.fn = fn;
    }
    /**
     * 开始
     */
    run() {
        // 主循环
        let loop = (t) => {
            if (this.isStatsOn)
                this.stats.begin();
            // 时差
            let dur = (t - this.allTime) * this.speed / 1000;
            // 检测由于失焦导致的丢帧
            if (t - this.allTime < 100) {
                this.fn(dur);
            }
            // 更新时间
            this.allTime = t;
            if (this.isStatsOn)
                this.stats.end();
            // 继续循环
            requestAnimationFrame(loop);
        };
        // 获取时间
        requestAnimationFrame((t) => {
            // 记录初始时间
            this.allTime = t;
            // 开启循环
            requestAnimationFrame(loop);
        });
    }
}

/**
 * WEBGl 渲染器
 * 控制 GL 对象的渲染
 */
class GLRenderer {
    /**
     * 使用的画布
     */
    canvas;
    /**
     * GL 上下文
     */
    gl;
    /**
     * WebGL 版本
     */
    glVersion = 0;
    /**
     * 获取上下文
     */
    getContext() {
        // 尝试 webgl2
        this.gl = this.canvas.can.getContext("webgl2");
        if (this.gl) {
            this.glVersion = 2;
            console.log("Render: Using WebGL2 :)");
        }
        else {
            // 尝试 WebGL1
            this.gl = this.canvas.can.getContext("webgl");
            if (this.gl) {
                this.glVersion = 1;
                console.log("Render: Using WebGL1 :(");
            }
            // 获取失败发出警告
            else {
                console.error("Render: Not supported WebGL!");
            }
        }
    }
    /**
     * 清屏颜色
     */
    cleanColor = [.92, .92, .92, 1.];
    /**
     * 清屏
     */
    clean() {
        this.gl.clearColor(this.cleanColor[0], this.cleanColor[1], this.cleanColor[2], this.cleanColor[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    /**
     * 构造
     */
    constructor(canvas, canvasOp) {
        this.canvas = new GLCanvas(canvas, canvasOp);
        // 获取上下文
        this.getContext();
    }
}

/**
 * 基础绘制 Shader
 * @class BasicsShader
 */
class BasicsShader extends GLProgram {
    onload() {
        // 顶点着色
        const vertex = `
        attribute vec3 vPos;
        
        uniform vec3 r;
        uniform mat4 mvp;
        uniform vec3 pos;

        void main(){
            gl_Position = mvp * vec4(vPos * r + pos, 1.);
        }
        `;
        // 片段着色
        const fragment = `
        precision lowp float;
        
        uniform vec3 color;
    
        void main(){
            gl_FragColor = vec4(color, 1.);
        }
        `;
        // 保存代码
        this.setSource(vertex, fragment);
        // 编译
        this.compile();
    }
    /**
     * 传递半径数据
     */
    r(r) {
        this.gl.uniform3fv(this.uniformLocate("r"), r);
        return this;
    }
    /**
     * 坐标
     */
    pos(r) {
        this.gl.uniform3fv(this.uniformLocate("pos"), r);
        return this;
    }
    /**
     * 传递半径数据
     */
    mvp(mat, transpose = false) {
        this.gl.uniformMatrix4fv(this.uniformLocate("mvp"), transpose, mat);
        return this;
    }
    /**
     * 传递半径数据
     * @param {vec3|Number[]} rgb
     */
    color(rgb) {
        this.gl.uniform3fv(this.uniformLocate("color"), rgb);
    }
}

class TestAxis {
    /**
     * 坐标轴数据
     */
    static AXIS_VER_DATA = new Float32Array([
        0, 0, 0, 1, 0, 0,
        0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 1
    ]);
    axisVertexBuffer;
    onload() {
        // 创建缓冲区
        this.axisVertexBuffer = this.gl.createBuffer();
        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axisVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, TestAxis.AXIS_VER_DATA, this.gl.STATIC_DRAW);
    }
    /**
     * GL 上下文
     */
    gl;
    /**
     * 创建编译 shader
     */
    constructor(gl) {
        this.gl = gl;
        this.onload();
    }
    /**
     * 绘制半径
     */
    r = 1;
    pos = [0, 0, 0];
    /**
     * 绘制坐标轴
     */
    draw(camera, shader) {
        // 使用程序
        shader.use();
        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.axisVertexBuffer);
        // 指定指针数据
        this.gl.vertexAttribPointer(shader.attribLocate("vPos"), 3, this.gl.FLOAT, false, 0, 0);
        // mvp参数传递
        shader.mvp(camera.transformMat);
        // 半径传递
        shader.r([this.r, this.r, this.r]);
        shader.pos(this.pos);
        // 绘制 X 轴
        shader.color([1, 0, 0]);
        this.gl.drawArrays(this.gl.LINES, 0, 2);
        // 绘制 Y 轴
        shader.color([0, 1, 0]);
        this.gl.drawArrays(this.gl.LINES, 2, 2);
        // 绘制 Z 轴
        shader.color([0, 0, 1]);
        this.gl.drawArrays(this.gl.LINES, 4, 2);
    }
}

class TestBox {
    /**
     * 立方体数据
     */
    static CUBE_VER_DATA = new Float32Array([
        1, 1, 1, -1, 1, 1, -1, 1, -1, 1, 1, -1,
        1, -1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1
    ]);
    /**
     * 立方体线段绘制索引
     */
    static CUBE_ELE_DATA = new Uint16Array([
        0, 1, 1, 2, 2, 3, 3, 0,
        4, 5, 5, 6, 6, 7, 7, 4,
        0, 4, 1, 5, 2, 6, 3, 7
    ]);
    onload() {
        // 创建缓冲区
        this.cubeVertexBuffer = this.gl.createBuffer();
        this.cubeElementBuffer = this.gl.createBuffer();
        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, TestBox.CUBE_VER_DATA, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeElementBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, TestBox.CUBE_ELE_DATA, this.gl.STATIC_DRAW);
    }
    /**
     * GL 上下文
     */
    gl;
    /**
     * 创建编译 shader
     */
    constructor(gl) {
        this.gl = gl;
        this.onload();
    }
    cubeVertexBuffer;
    cubeElementBuffer;
    /**
     * 绘制半径
     */
    r = [1, 1, 1];
    /**
     * 绘制立方体
     */
    draw(camera, shader) {
        // 使用程序
        shader.use();
        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeElementBuffer);
        // 指定指针数据
        this.gl.vertexAttribPointer(shader.attribLocate("vPos"), 3, this.gl.FLOAT, false, 0, 0);
        // mvp参数传递
        shader.mvp(camera.transformMat);
        // 半径传递
        shader.r(this.r);
        shader.pos([0, 0, 0]);
        // 指定颜色
        shader.color([.2, .2, .2]);
        // 开始绘制
        this.gl.drawElements(this.gl.LINES, 24, this.gl.UNSIGNED_SHORT, 0);
    }
}

/**
 * 三阶贝塞尔曲线
 */
class Bezier3 {
    pointA;
    pointB;
    handA;
    handB;
    len = 0;
    tempVal;
    /**
     * 设置单一值
     */
    setSimpVal(a, b, c, d) {
        this.pointA.length = 0;
        this.pointB.length = 0;
        this.handA.length = 0;
        this.handB.length = 0;
        this.pointA.push(a);
        this.pointB.push(b);
        this.handA.push(c);
        this.handB.push(d);
    }
    /**
     * 获取贝塞尔插值
     * @param t
     * @returns
     */
    bezierM(t) {
        // 长度搜索
        if (this.len)
            this.len = Math.min(this.pointA.length, this.pointB.length, this.handA.length, this.handB.length);
        // 插值计算
        this.tempVal = SmoothTool.bezier3(t);
        // 生成插值
        let res = [];
        for (let i = 0; i < this.len; i++) {
            res[i] =
                this.pointA[i] * this.tempVal[0] +
                    this.handA[i] * this.tempVal[1] +
                    this.handB[i] * this.tempVal[2] +
                    this.pointB[i] * this.tempVal[3];
        }
        return res;
    }
}
/**
 * 平滑插值工具
 */
class SmoothTool {
    /**
     * 三阶贝塞尔插值
     * @param t 进度
     */
    static bezier3(t) {
        return [
            (1 - t) ** 3,
            3 * t * (1 - t) ** 2,
            3 * t ** 2 * (1 - t),
            t ** 3
        ];
    }
    /**
     * 生成贝塞尔点集
     * @param val 一维稀疏数组
     * @param w 插值尾值
     * @param smooth 平滑程度
     * @param f 插值频率
     */
    static genSmoothLine(val, w = false, smooth = 1, f = 1) {
        let res = [];
        let bz = new Bezier3();
        for (let i = 0; i < val.length - 1; i++) {
            bz.pointA = val[i];
            bz.pointB = val[i + 1];
            bz.handA = [bz.pointA[0] + smooth, bz.pointA[1]];
            bz.handB = [bz.pointB[0] - smooth, bz.pointB[1]];
            bz.len = 2;
            // console.log(bz);
            // 计算插值次数
            const num = (bz.pointB[0] - bz.pointA[0]) / f;
            for (let j = 0; j < num; j++) {
                // console.log(num, j, j / num);
                res.push(bz.bezierM(j / num)[1]);
            }
        }
        if (w)
            res.push(val[val.length - 1][1]);
        return res;
    }
    /**
     * 指定长度的区间内生成固定点
     * 随机距离随机摆动
     * @param len 覆盖程度
     * @param num 点数量
     * @param pow 摆动幅度
     */
    static genRandomPointR(len, num, pow) {
        let res = [];
        for (let i = 0; i < num; i++) {
            res.push([
                Math.random(),
                (Math.random() - .5) * 2 * pow
            ]);
        }
        // 排序
        res = res.sort((a, b) => a[0] - b[0]);
        let min = res[0][0];
        let max = res[res.length - 1][0];
        let range = max - min;
        // 最小归一化
        for (let i = 0; i < res.length; i++) {
            res[i][0] = Math.floor((res[i][0] - min) * len / range);
        }
        return res;
    }
    /**
     * 指定长度的区间内生成固定点
     * 固定距离随机摆动
     * @param len
     * @param num
     * @param pow
     */
    static genRandomPointM(len, num, pow) {
        let res = [];
        for (let i = 0; i < num; i++) {
            res.push([
                Math.floor(i * len / (num - 1)),
                (Math.random() - .5) * 2 * pow
            ]);
        }
        return res;
    }
    /**
     * 随机生成数字
     * @param min 最小值
     * @param max 最大值
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
}

class Planet {
    /**
     * GL 上下文
     */
    gl;
    vertexBuffer;
    pointNum;
    static NORMAL_COLOR = [111 / 255, 149 / 255, 191 / 255];
    /**
     * 加载
     */
    constructor(gl) {
        this.gl = gl;
        // 随机颜色
        let colorDep = SmoothTool.random(0.98, 1.02);
        this.color = [
            colorDep * Planet.NORMAL_COLOR[0],
            colorDep * Planet.NORMAL_COLOR[1],
            colorDep * Planet.NORMAL_COLOR[2]
        ];
        // 生成多边形数据
        let randSeed = Math.random();
        let d = this.genBuffer(.35 + randSeed * .3, .03 + randSeed * .03 + Math.random() * .01, Math.floor(SmoothTool.random(5, 9)), .8 + randSeed * .3 + Math.random() * .1);
        this.vertexBuffer = this.gl.createBuffer();
        this.pointNum = d.length / 3;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(d), this.gl.STATIC_DRAW);
    }
    /**
     * 坐标
     */
    pos = [0, 0, 0];
    /**
     * 生成网格
     * @param r 半径
     * @param p 半径浮动
     * @param f 浮动频率
     * @param o 平滑程度
     * @param e 精度
     */
    genBuffer(r, p, f, o = 1, e = Math.PI / 180) {
        const dir = [0, 0];
        const res = [0, 0, 0];
        // 点个数
        let num = Math.PI * 2 / e;
        // 生成抖动数据
        let d = SmoothTool.genRandomPointM(num, f, p);
        // 闭合数据
        d[d.length - 1][1] = d[0][1];
        // 插值
        let m = SmoothTool.genSmoothLine(d, false, o);
        for (let i = 0; i < m.length; i++) {
            // 当前角度
            let th = i * 2 * Math.PI / m.length;
            // 参数方程求解
            dir[0] = Math.cos(th);
            dir[1] = Math.sin(th);
            res.push(dir[0] * (r + m[i]));
            res.push(dir[1] * (r + m[i]));
            res.push(0);
        }
        // 连接起始点
        res.push(res[3]);
        res.push(res[4]);
        res.push(res[5]);
        return res;
    }
    color;
    draw(camera, shader) {
        // 使用程序
        shader.use();
        // 绑定缓冲区
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        // 指定指针数据
        this.gl.vertexAttribPointer(shader.attribLocate("vPos"), 3, this.gl.FLOAT, false, 0, 0);
        // mvp参数传递
        shader.mvp(camera.transformMat);
        // 半径传递
        shader.color(this.color);
        shader.r([1, 1, 1]);
        shader.pos([0, 0, 0]);
        // 开始绘制
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.pointNum);
    }
}

export { BasicsShader, Bezier3, Camera, Clock, GLCanvas, GLProgram, GLRenderer, Planet, SmoothTool, TestAxis, TestBox };
//# sourceMappingURL=Rainbow.module.js.map
