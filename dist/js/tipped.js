/*!
 * Tipped - A Complete Javascript Tooltip Solution - v4.7.0
 * (c) 2012-2019 Nick Stakenburg
 *
 * http://www.tippedjs.com
 *
 * @license: https://creativecommons.org/licenses/by/4.0
 */

// UMD wrapper
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    root.Tipped = factory(jQuery);
  }
}(this, function($) {

var Tipped = {};

$.extend(Tipped, {
  version: '4.7.0'
});

Tipped.Skins = {
  // base skin, don't modify! (create custom skins in a separate file)
  base: {
    afterUpdate: false,
    ajax: {},
    cache: true,
    container: false,
    containment: {
      selector: "viewport",
      padding: 5
    },
    close: false,
    detach: true,
    fadeIn: 200,
    fadeOut: 200,
    showDelay: 75,
    hideDelay: 25,
    hideAfter: false,
    hideOn: { element: "mouseleave" },
    hideOthers: false,
    position: "top",
    inline: false,
    offset: { x: 0, y: 0 },
    onHide: false,
    onShow: false,
    padding: true,
    radius: true,
    shadow: true,
    showOn: { element: "mousemove" },
    size: "medium",
    spinner: true,
    stem: true,
    target: "element",
    voila: true
  },

  // Every other skin inherits from this one
  reset: {
    ajax: false,
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseleave"
    },
    showOn: {
      element: "mouseenter",
      tooltip: "mouseenter"
    }
  }
};

$.each(
  "dark light gray red green blue lightyellow lightblue lightpink".split(" "),
  function(i, s) {
    Tipped.Skins[s] = {};
  }
);

var Browser = (function(uA) {
  function getVersion(identifier) {
    var version = new RegExp(identifier + "([\\d.]+)").exec(uA);
    return version ? parseFloat(version[1]) : true;
  }

  return {
    IE:
      !!(window.attachEvent && uA.indexOf("Opera") === -1) &&
      getVersion("MSIE "),
    Opera:
      uA.indexOf("Opera") > -1 &&
      ((!!window.opera && opera.version && parseFloat(opera.version())) ||
        7.55),
    WebKit: uA.indexOf("AppleWebKit/") > -1 && getVersion("AppleWebKit/"),
    Gecko:
      uA.indexOf("Gecko") > -1 &&
      uA.indexOf("KHTML") === -1 &&
      getVersion("rv:"),
    MobileSafari: !!uA.match(/Apple.*Mobile.*Safari/),
    Chrome: uA.indexOf("Chrome") > -1 && getVersion("Chrome/"),
    ChromeMobile: uA.indexOf("CrMo") > -1 && getVersion("CrMo/"),
    Android: uA.indexOf("Android") > -1 && getVersion("Android "),
    IEMobile: uA.indexOf("IEMobile") > -1 && getVersion("IEMobile/")
  };
})(navigator.userAgent);

var Support = (function() {
  var testElement = document.createElement("div"),
    domPrefixes = "Webkit Moz O ms Khtml".split(" ");

  function prefixed(property) {
    return testAllProperties(property, "prefix");
  }

  function testProperties(properties, prefixed) {
    for (var i in properties) {
      if (testElement.style[properties[i]] !== undefined) {
        return prefixed === "prefix" ? properties[i] : true;
      }
    }
    return false;
  }

  function testAllProperties(property, prefixed) {
    var ucProperty = property.charAt(0).toUpperCase() + property.substr(1),
      properties = (
        property +
        " " +
        domPrefixes.join(ucProperty + " ") +
        ucProperty
      ).split(" ");

    return testProperties(properties, prefixed);
  }

  // feature detect
  return {
    css: {
      animation: testAllProperties("animation"),
      transform: testAllProperties("transform"),
      prefixed: prefixed
    },

    shadow:
      testAllProperties("boxShadow") && testAllProperties("pointerEvents"),

    touch: (function() {
      try {
        return !!(
          "ontouchstart" in window ||
          (window.DocumentTouch && document instanceof DocumentTouch)
        ); // firefox for Android;
      } catch (e) {
        return false;
      }
    })()
  };
})();

var _slice = Array.prototype.slice;

var _ = {
  wrap: function(fn, wrapper) {
    var __fn = fn;
    return function() {
      var args = [$.proxy(__fn, this)].concat(_slice.call(arguments));
      return wrapper.apply(this, args);
    };
  },

  // is
  isElement: function(object) {
    return object && object.nodeType === 1;
  },

  isText: function(object) {
    return object && object.nodeType === 3;
  },

  isDocumentFragment: function(object) {
    return object && object.nodeType === 11;
  },

  delay: function(fn, ms) {
    var args = _slice.call(arguments, 2);
    return setTimeout(function() {
      return fn.apply(fn, args);
    }, ms);
  },

  defer: function(fn) {
    return _.delay.apply(this, [fn, 1].concat(_slice.call(arguments, 1)));
  },

  // Event
  pointer: function(event) {
    return { x: event.pageX, y: event.pageY };
  },

  element: {
    isAttached: (function() {
      function findTopAncestor(element) {
        // Walk up the DOM tree until we are at the top
        var ancestor = element;
        while (ancestor && ancestor.parentNode) {
          ancestor = ancestor.parentNode;
        }
        return ancestor;
      }

      return function(element) {
        var topAncestor = findTopAncestor(element);
        return !!(topAncestor && topAncestor.body);
      };
    })()
  }
};

function degrees(radian) {
  return (radian * 180) / Math.PI;
}

function radian(degrees) {
  return (degrees * Math.PI) / 180;
}

function sec(x) {
  return 1 / Math.cos(x);
}

function sfcc(c) {
  return String.fromCharCode.apply(String, c.replace(" ", "").split(","));
}

//deep extend
function deepExtend(destination, source) {
  for (var property in source) {
    if (
      source[property] &&
      source[property].constructor &&
      source[property].constructor === Object
    ) {
      destination[property] = $.extend({}, destination[property]) || {};
      deepExtend(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
}

var getUID = (function() {
  var count = 0,
    _prefix = "_tipped-uid-";

  return function(prefix) {
    prefix = prefix || _prefix;

    count++;
    // raise the count as long as we find a conflicting element on the page
    while (document.getElementById(prefix + count)) {
      count++;
    }
    return prefix + count;
  };
})();

var Position = {
  positions: [
    "topleft",
    "topmiddle",
    "topright",
    "righttop",
    "rightmiddle",
    "rightbottom",
    "bottomright",
    "bottommiddle",
    "bottomleft",
    "leftbottom",
    "leftmiddle",
    "lefttop"
  ],

  regex: {
    toOrientation: /^(top|left|bottom|right)(top|left|bottom|right|middle|center)$/,
    horizontal: /^(top|bottom)/,
    isCenter: /(middle|center)/,
    side: /^(top|bottom|left|right)/
  },

  toDimension: (function() {
    var translate = {
      top: "height",
      left: "width",
      bottom: "height",
      right: "width"
    };

    return function(position) {
      return translate[position];
    };
  })(),

  isCenter: function(position) {
    return !!position.toLowerCase().match(this.regex.isCenter);
  },

  isCorner: function(position) {
    return !this.isCenter(position);
  },

  //returns 'horizontal' or 'vertical' based on the options object
  getOrientation: function(position) {
    return position.toLowerCase().match(this.regex.horizontal)
      ? "horizontal"
      : "vertical";
  },

  getSide: function(position) {
    var side = null,
      matches = position.toLowerCase().match(this.regex.side);
    if (matches && matches[1]) side = matches[1];
    return side;
  },

  split: function(position) {
    return position.toLowerCase().match(this.regex.toOrientation);
  },

  _flip: {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left"
  },
  flip: function(position, corner) {
    var split = this.split(position);

    if (corner) {
      return this.inverseCornerPlane(
        this.flip(this.inverseCornerPlane(position))
      );
    } else {
      return this._flip[split[1]] + split[2];
    }
  },

  inverseCornerPlane: function(position) {
    if (Position.isCorner(position)) {
      var split = this.split(position);
      return split[2] + split[1];
    } else {
      return position;
    }
  },

  adjustOffsetBasedOnPosition: function(
    offset,
    defaultTargetPosition,
    targetPosition
  ) {
    var adjustedOffset = $.extend({}, offset);
    var orientationXY = { horizontal: "x", vertical: "y" };
    var inverseXY = { x: "y", y: "x" };

    var inverseSides = {
      top: { right: "x" },
      bottom: { left: "x" },
      left: { bottom: "y" },
      right: { top: "y" }
    };

    var defaultOrientation = Position.getOrientation(defaultTargetPosition);
    if (defaultOrientation === Position.getOrientation(targetPosition)) {
      // we're on the same orientation
      // inverse when needed
      if (
        Position.getSide(defaultTargetPosition) !==
        Position.getSide(targetPosition)
      ) {
        var inverse = inverseXY[orientationXY[defaultOrientation]];
        adjustedOffset[inverse] *= -1;
      }
    } else {
      // moving to a side
      // flipXY
      var fx = adjustedOffset.x;
      adjustedOffset.x = adjustedOffset.y;
      adjustedOffset.y = fx;

      //  inversing x or y might be required based on movement
      var inverseSide =
        inverseSides[Position.getSide(defaultTargetPosition)][
          Position.getSide(targetPosition)
        ];
      if (inverseSide) {
        adjustedOffset[inverseSide] *= -1;
      }

      // nullify x or y
      // move to left/right (vertical) = nullify y
      adjustedOffset[
        orientationXY[Position.getOrientation(targetPosition)]
      ] = 0;
    }

    return adjustedOffset;
  },

  getBoxFromPoints: function(x1, y1, x2, y2) {
    var minX = Math.min(x1, x2),
      maxX = Math.max(x1, x2),
      minY = Math.min(y1, y2),
      maxY = Math.max(y1, y2);

    return {
      left: minX,
      top: minY,
      width: Math.max(maxX - minX, 0),
      height: Math.max(maxY - minY, 0)
    };
  },

  isPointWithinBox: function(x1, y1, bx1, by1, bx2, by2) {
    var box = this.getBoxFromPoints(bx1, by1, bx2, by2);

    return (
      x1 >= box.left &&
      x1 <= box.left + box.width &&
      y1 >= box.top &&
      y1 <= box.top + box.height
    );
  },
  isPointWithinBoxLayout: function(x, y, layout) {
    return this.isPointWithinBox(
      x,
      y,
      layout.position.left,
      layout.position.top,
      layout.position.left + layout.dimensions.width,
      layout.position.top + layout.dimensions.height
    );
  },

  getDistance: function(x1, y1, x2, y2) {
    return Math.sqrt(
      Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2)
    );
  },

  intersectsLine: (function() {
    var ccw = function(x1, y1, x2, y2, x3, y3) {
      var cw = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
      return cw > 0 ? true : cw < 0 ? false : true;
    };

    return function(x1, y1, x2, y2, x3, y3, x4, y4, isReturnPosition) {
      if (!isReturnPosition) {
        /* http://www.bryceboe.com/2006/10/23/line-segment-intersection-algorithm/comment-page-1/ */
        return (
          ccw(x1, y1, x3, y3, x4, y4) != ccw(x2, y2, x3, y3, x4, y4) &&
          ccw(x1, y1, x2, y2, x3, y3) != ccw(x1, y1, x2, y2, x4, y4)
        );
      }

      /* http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345 */
      var s1_x, s1_y, s2_x, s2_y;
      s1_x = x2 - x1;
      s1_y = y2 - y1;
      s2_x = x4 - x3;
      s2_y = y4 - y3;

      var s, t;
      s = (-s1_y * (x1 - x3) + s1_x * (y1 - y3)) / (-s2_x * s1_y + s1_x * s2_y);
      t = (s2_x * (y1 - y3) - s2_y * (x1 - x3)) / (-s2_x * s1_y + s1_x * s2_y);

      if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
        var atX = x1 + t * s1_x;
        var atY = y1 + t * s1_y;
        return { x: atX, y: atY };
      }

      return false; // No collision
    };
  })()
};

var Bounds = {
  viewport: function() {
    var vp;
    if (Browser.MobileSafari || (Browser.Android && Browser.Gecko)) {
      vp = { width: window.innerWidth, height: window.innerHeight };
    } else {
      vp = {
        height: $(window).height(),
        width: $(window).width()
      };
    }

    return vp;
  }
};

var Mouse = {
  _buffer: { pageX: 0, pageY: 0 },
  _dimensions: {
    width: 30, // should both be even
    height: 30
  },
  _shift: {
    x: 2,
    y: 10 // correction so the tooltip doesn't appear on top of the mouse
  },

  // a modified version of the actual position, to match the box
  getPosition: function(event) {
    var position = this.getActualPosition(event);

    return {
      left:
        position.left -
        Math.round(this._dimensions.width * 0.5) +
        this._shift.x,
      top:
        position.top - Math.round(this._dimensions.height * 0.5) + this._shift.y
    };
  },

  getActualPosition: function(event) {
    var position =
      event && $.type(event.pageX) === "number" ? event : this._buffer;

    return {
      left: position.pageX,
      top: position.pageY
    };
  },

  getDimensions: function() {
    return this._dimensions;
  }
};

var Color = (function() {
  var names = {
    _default: "#000000",
    aqua: "#00ffff",
    black: "#000000",
    blue: "#0000ff",
    fuchsia: "#ff00ff",
    gray: "#808080",
    green: "#008000",
    lime: "#00ff00",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    purple: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    teal: "#008080",
    white: "#ffffff",
    yellow: "#ffff00"
  };

  function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
  }

  function rgb2hex(rgb) {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }

  return {
    toRGB: function(str) {
      if (/^rgba?\(/.test(str)) {
        return rgb2hex(str);
      } else {
        // first try color name to hex
        if (names[str]) str = names[str];

        // assume already hex, just normalize #rgb #rrggbb
        var hex = str.replace("#", "");
        if (!/^(?:[0-9a-fA-F]{3}){1,2}$/.test(hex)) return names._default;

        if (hex.length == 3) {
          hex =
            hex.charAt(0) +
            hex.charAt(0) +
            hex.charAt(1) +
            hex.charAt(1) +
            hex.charAt(2) +
            hex.charAt(2);
        }

        return "#" + hex;
      }
    }
  };
})();

// Spin
// Create pure CSS based spinners
function Spin() {
  return this.initialize.apply(this, _slice.call(arguments));
}

// mark as supported
Spin.supported = Support.css.transform && Support.css.animation;

$.extend(Spin.prototype, {
  initialize: function() {
    this.options = $.extend({}, arguments[0] || {});

    this.build();
    this.start();
  },

  build: function() {
    var d = (this.options.length + this.options.radius) * 2;
    var dimensions = { height: d, width: d };

    this.element = $("<div>")
      .addClass("tpd-spin")
      .css(dimensions);

    this.element.append(
      (this._rotate = $("<div>").addClass("tpd-spin-rotate"))
    );

    this.element.css({
      "margin-left": -0.5 * dimensions.width,
      "margin-top": -0.5 * dimensions.height
    });

    var lines = this.options.lines;

    // insert 12 frames
    for (var i = 0; i < lines; i++) {
      var frame, line;
      this._rotate.append(
        (frame = $("<div>")
          .addClass("tpd-spin-frame")
          .append((line = $("<div>").addClass("tpd-spin-line"))))
      );

      line.css({
        "background-color": this.options.color,
        width: this.options.width,
        height: this.options.length,
        "margin-left": -0.5 * this.options.width,
        "border-radius": Math.round(0.5 * this.options.width)
      });

      frame.css({ opacity: ((1 / lines) * (i + 1)).toFixed(2) });

      var transformCSS = {};
      transformCSS[Support.css.prefixed("transform")] =
        "rotate(" + (360 / lines) * (i + 1) + "deg)";
      frame.css(transformCSS);
    }
  },

  start: function() {
    var rotateCSS = {};
    rotateCSS[Support.css.prefixed("animation")] =
      "tpd-spin 1s infinite steps(" + this.options.lines + ")";
    this._rotate.css(rotateCSS);
  },

  stop: function() {
    var rotateCSS = {};
    rotateCSS[Support.css.prefixed("animation")] = "none";
    this._rotate.css(rotateCSS);
    this.element.detach();
  }
});

function Visible() {
  return this.initialize.apply(this, _slice.call(arguments));
}

$.extend(Visible.prototype, {
  initialize: function(elements) {
    elements = $.type(elements) == 'array' ? elements : [elements]; // ensure array
    this.elements = elements;

    this._restore = [];
    $.each(elements, $.proxy(function(i, element) {
      var visible = $(element).is(':visible');

      if (!visible) {
        $(element).show();
      }

      this._restore.push({
        element: element,
        visible: visible
      });

    }, this));
    return this;
  },

  restore: function() {
    $.each(this._restore, function(i, entry) {
      if (!entry.visible) {
        $(entry.element).show();
      }
    });

    this._restore = null;
  }
});

var AjaxCache = (function() {
  var cache = [];

  return {
    // return an update object to pass onto tooltip.update()
    get: function(ajax) {
      var entry = null;
      for (var i = 0; i < cache.length; i++) {
        if (
          cache[i] &&
          cache[i].url === ajax.url &&
          (cache[i].type || "GET").toUpperCase() ===
            (ajax.type || "GET").toUpperCase() &&
          $.param(cache[i].data || {}) === $.param(ajax.data || {})
        ) {
          entry = cache[i];
        }
      }
      return entry;
    },

    set: function(ajax, callbackName, args) {
      var entry = this.get(ajax);
      if (!entry) {
        entry = $.extend({ callbacks: {} }, ajax);
        cache.push(entry);
      }

      entry.callbacks[callbackName] = args;
    },

    remove: function(url) {
      for (var i = 0; i < cache.length; i++) {
        if (cache[i] && cache[i].url === url) {
          delete cache[i];
        }
      }
    },

    clear: function() {
      cache = [];
    }
  };
})();

/*!
 * Voilà - v1.3.0
 * (c) 2015 Nick Stakenburg
 *
 * http://voila.nickstakenburg.com
 *
 * MIT License
 */

var Voila = (function($) {
  function Voila(elements, opts, cb) {
    if (!(this instanceof Voila)) {
      return new Voila(elements, opts, cb);
    }

    var argTypeOne = $.type(arguments[1]),
      options = argTypeOne === "object" ? arguments[1] : {},
      callback =
        argTypeOne === "function"
          ? arguments[1]
          : $.type(arguments[2]) === "function"
          ? arguments[2]
          : false;

    this.options = $.extend(
      {
        method: "onload"
      },
      options
    );

    this.deferred = new jQuery.Deferred();

    // if there's a callback, push it onto the stack
    if (callback) {
      this.always(callback);
    }

    this._processed = 0;
    this.images = [];
    this._add(elements);

    return this;
  }

  $.extend(Voila.prototype, {
    _add: function(elements) {
      // normalize to an array
      var array =
        $.type(elements) == "string"
          ? $(elements) // selector
          : elements instanceof jQuery || elements.length > 0
          ? elements // jQuery obj, Array
          : [elements]; // element node

      // subtract the images
      $.each(
        array,
        $.proxy(function(i, element) {
          var images = $(),
            $element = $(element);

          // single image
          if ($element.is("img")) {
            images = images.add($element);
          } else {
            // nested
            images = images.add($element.find("img"));
          }

          images.each(
            $.proxy(function(i, element) {
              this.images.push(
                new ImageReady(
                  element,
                  // success
                  $.proxy(function(image) {
                    this._progress(image);
                  }, this),
                  // error
                  $.proxy(function(image) {
                    this._progress(image);
                  }, this),
                  // options
                  this.options
                )
              );
            }, this)
          );
        }, this)
      );

      // no images found
      if (this.images.length < 1) {
        setTimeout(
          $.proxy(function() {
            this._resolve();
          }, this)
        );
      }
    },

    abort: function() {
      // clear callbacks
      this._progress = this._notify = this._reject = this._resolve = function() {};

      // clear images
      $.each(this.images, function(i, image) {
        image.abort();
      });
      this.images = [];
    },

    _progress: function(image) {
      this._processed++;

      // when a broken image passes by keep track of it
      if (!image.isLoaded) this._broken = true;

      this._notify(image);

      // completed
      if (this._processed === this.images.length) {
        this[this._broken ? "_reject" : "_resolve"]();
      }
    },

    _notify: function(image) {
      this.deferred.notify(this, image);
    },
    _reject: function() {
      this.deferred.reject(this);
    },
    _resolve: function() {
      this.deferred.resolve(this);
    },

    always: function(callback) {
      this.deferred.always(callback);
      return this;
    },

    done: function(callback) {
      this.deferred.done(callback);
      return this;
    },

    fail: function(callback) {
      this.deferred.fail(callback);
      return this;
    },

    progress: function(callback) {
      this.deferred.progress(callback);
      return this;
    }
  });

  /* ImageReady (standalone) - part of Voilà
   * http://voila.nickstakenburg.com
   * MIT License
   */
  var ImageReady = (function($) {
    var Poll = function() {
      return this.initialize.apply(this, Array.prototype.slice.call(arguments));
    };
    $.extend(Poll.prototype, {
      initialize: function() {
        this.options = $.extend(
          {
            test: function() {},
            success: function() {},
            timeout: function() {},
            callAt: false,
            intervals: [
              [0, 0],
              [1 * 1000, 10],
              [2 * 1000, 50],
              [4 * 1000, 100],
              [20 * 1000, 500]
            ]
          },
          arguments[0] || {}
        );

        this._test = this.options.test;
        this._success = this.options.success;
        this._timeout = this.options.timeout;

        this._ipos = 0;
        this._time = 0;
        this._delay = this.options.intervals[this._ipos][1];
        this._callTimeouts = [];

        this.poll();
        this._createCallsAt();
      },

      poll: function() {
        this._polling = setTimeout(
          $.proxy(function() {
            if (this._test()) {
              this.success();
              return;
            }

            // update time
            this._time += this._delay;

            // next i within the interval
            if (this._time >= this.options.intervals[this._ipos][0]) {
              // timeout when no next interval
              if (!this.options.intervals[this._ipos + 1]) {
                if ($.type(this._timeout) == "function") {
                  this._timeout();
                }
                return;
              }

              this._ipos++;

              // update to the new bracket
              this._delay = this.options.intervals[this._ipos][1];
            }

            this.poll();
          }, this),
          this._delay
        );
      },

      success: function() {
        this.abort();
        this._success();
      },

      _createCallsAt: function() {
        if (!this.options.callAt) return;

        // start a timer for each call
        $.each(
          this.options.callAt,
          $.proxy(function(i, at) {
            var time = at[0],
              fn = at[1];

            var timeout = setTimeout(
              $.proxy(function() {
                fn();
              }, this),
              time
            );

            this._callTimeouts.push(timeout);
          }, this)
        );
      },

      _stopCallTimeouts: function() {
        $.each(this._callTimeouts, function(i, timeout) {
          clearTimeout(timeout);
        });
        this._callTimeouts = [];
      },

      abort: function() {
        this._stopCallTimeouts();

        if (this._polling) {
          clearTimeout(this._polling);
          this._polling = null;
        }
      }
    });

    var ImageReady = function() {
      return this.initialize.apply(this, Array.prototype.slice.call(arguments));
    };
    $.extend(ImageReady.prototype, {
      supports: {
        naturalWidth: (function() {
          return "naturalWidth" in new Image();
        })()
      },

      // NOTE: setTimeouts allow callbacks to be attached
      initialize: function(img, successCallback, errorCallback) {
        this.img = $(img)[0];
        this.successCallback = successCallback;
        this.errorCallback = errorCallback;
        this.isLoaded = false;

        this.options = $.extend(
          {
            method: "onload",
            pollFallbackAfter: 1000
          },
          arguments[3] || {}
        );

        // onload and a fallback for no naturalWidth support (IE6-7)
        if (this.options.method == "onload" || !this.supports.naturalWidth) {
          this.load();
          return;
        }

        // start polling
        this.poll();
      },

      // NOTE: Polling for naturalWidth is only reliable if the
      // <img>.src never changes. naturalWidth isn't always reset
      // to 0 after the src changes (depending on how the spec
      // was implemented). The spec even seems to be against
      // this, making polling unreliable in those cases.
      poll: function() {
        this._poll = new Poll({
          test: $.proxy(function() {
            return this.img.naturalWidth > 0;
          }, this),

          success: $.proxy(function() {
            this.success();
          }, this),

          timeout: $.proxy(function() {
            // error on timeout
            this.error();
          }, this),

          callAt: [
            [
              this.options.pollFallbackAfter,
              $.proxy(function() {
                this.load();
              }, this)
            ]
          ]
        });
      },

      load: function() {
        this._loading = setTimeout(
          $.proxy(function() {
            var image = new Image();
            this._onloadImage = image;

            image.onload = $.proxy(function() {
              image.onload = function() {};

              if (!this.supports.naturalWidth) {
                this.img.naturalWidth = image.width;
                this.img.naturalHeight = image.height;
                image.naturalWidth = image.width;
                image.naturalHeight = image.height;
              }

              this.success();
            }, this);

            image.onerror = $.proxy(this.error, this);

            image.src = this.img.src;
          }, this)
        );
      },

      success: function() {
        if (this._calledSuccess) return;

        this._calledSuccess = true;

        // stop loading/polling
        this.abort();

        // some time to allow layout updates, IE requires this!
        this.waitForRender(
          $.proxy(function() {
            this.isLoaded = true;
            this.successCallback(this);
          }, this)
        );
      },

      error: function() {
        if (this._calledError) return;

        this._calledError = true;

        // stop loading/polling
        this.abort();

        // don't wait for an actual render on error, just timeout
        // to give the browser some time to render a broken image icon
        this._errorRenderTimeout = setTimeout(
          $.proxy(function() {
            if (this.errorCallback) this.errorCallback(this);
          }, this)
        );
      },

      abort: function() {
        this.stopLoading();
        this.stopPolling();
        this.stopWaitingForRender();
      },

      stopPolling: function() {
        if (this._poll) {
          this._poll.abort();
          this._poll = null;
        }
      },

      stopLoading: function() {
        if (this._loading) {
          clearTimeout(this._loading);
          this._loading = null;
        }

        if (this._onloadImage) {
          this._onloadImage.onload = function() {};
          this._onloadImage.onerror = function() {};
        }
      },

      // used by success() only
      waitForRender: function(callback) {
        this._renderTimeout = setTimeout(callback);
      },

      stopWaitingForRender: function() {
        if (this._renderTimeout) {
          clearTimeout(this._renderTimeout);
          this._renderTimeout = null;
        }

        if (this._errorRenderTimeout) {
          clearTimeout(this._errorRenderTimeout);
          this._errorRenderTimeout = null;
        }
      }
    });

    return ImageReady;
  })(jQuery);

  return Voila;
})(jQuery);

Tipped.Behaviors = {
  hide: {
    showOn: {
      element: "mouseenter",
      tooltip: false
    },
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseenter"
    }
  },

  mouse: {
    showOn: {
      element: "mouseenter",
      tooltip: false
    },
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseenter"
    },
    target: "mouse",
    showDelay: 100,
    fadeIn: 0,
    hideDelay: 0,
    fadeOut: 0
  },

  sticky: {
    showOn: {
      element: "mouseenter",
      tooltip: "mouseenter"
    },
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseleave"
    },
    // more show delay solves issues positioning at the initial mouse
    // position when elements span multiple lines/line-breaks, since
    // the mouse won't be positioning close to the edge
    showDelay: 150,
    target: "mouse",
    fixed: true
  }
};

var Options = {
  create: (function() {
    var BASE, RESET;

    // hideOn helper
    function toDisplayObject(input, display) {
      var on;
      if ($.type(input) === "string") {
        on = {
          element:
            (RESET[display] && RESET[display].element) || BASE[display].element,
          event: input
        };
      } else {
        on = deepExtend($.extend({}, BASE[display]), input);
      }

      return on;
    }

    // hideOn helper
    function initialize(options) {
      BASE = Tipped.Skins.base;
      RESET = deepExtend($.extend({}, BASE), Tipped.Skins["reset"]);
      initialize = create;
      return create(options);
    }

    function middleize(position) {
      if (position.match(/^(top|left|bottom|right)$/)) {
        position += "middle";
      }

      position.replace("center", "middle").replace(" ", "");

      return position;
    }

    function presetiffy(options) {
      var preset, behavior;
      if (options.behavior && (behavior = Tipped.Behaviors[options.behavior])) {
        preset = deepExtend($.extend({}, behavior), options);
      } else {
        preset = options;
      }

      return preset;
    }

    function create(options) {
      var selected_skin = options.skin
        ? options.skin
        : Tooltips.options.defaultSkin;
      var SELECTED = $.extend({}, Tipped.Skins[selected_skin] || {});
      // make sure the skin option is set
      if (!SELECTED.skin) {
        SELECTED.skin = Tooltips.options.defaultSkin || "dark";
      }

      var MERGED_SELECTED = deepExtend(
        $.extend({}, RESET),
        presetiffy(SELECTED)
      ); // work presets into selected skin

      var MERGED = deepExtend(
        $.extend({}, MERGED_SELECTED),
        presetiffy(options)
      ); // also work presets into the given options

      // Ajax
      if (MERGED.ajax) {
        var RESET_ajax = RESET.ajax || {},
          BASE_ajax = BASE.ajax;

        if ($.type(MERGED.ajax) === "boolean") {
          // true
          MERGED.ajax = {
            //method: RESET_ajax.type || BASE_ajax.type
          };
        }
        // otherwise it must be an object
        MERGED.ajax = deepExtend($.extend({}, BASE_ajax), MERGED.ajax);
      }

      var position;
      var targetPosition = (targetPosition =
        (MERGED.position && MERGED.position.target) ||
        ($.type(MERGED.position) === "string" && MERGED.position) ||
        (RESET.position && RESET.position.target) ||
        ($.type(RESET.position) === "string" && RESET.position) ||
        (BASE.position && BASE.position.target) ||
        BASE.position);
      targetPosition = middleize(targetPosition);

      var tooltipPosition =
        (MERGED.position && MERGED.position.tooltip) ||
        (RESET.position && RESET.position.tooltip) ||
        (BASE.position && BASE.position.tooltip) ||
        Tooltips.Position.getInversedPosition(targetPosition);
      tooltipPosition = middleize(tooltipPosition);

      if (MERGED.position) {
        if ($.type(MERGED.position) === "string") {
          MERGED.position = middleize(MERGED.position);
          position = {
            target: MERGED.position,
            tooltip: Tooltips.Position.getTooltipPositionFromTarget(
              MERGED.position
            )
          };
        } else {
          // object
          position = { tooltip: tooltipPosition, target: targetPosition };
          if (MERGED.position.tooltip) {
            position.tooltip = middleize(MERGED.position.tooltip);
          }
          if (MERGED.position.target) {
            position.target = middleize(MERGED.position.target);
          }
        }
      } else {
        position = {
          tooltip: tooltipPosition,
          target: targetPosition
        };
      }

      // make sure the 2 positions are on the same plane when centered
      // this aligns the sweet spot when repositioning based on the stem
      if (
        Position.isCorner(position.target) &&
        Position.getOrientation(position.target) !==
          Position.getOrientation(position.tooltip)
      ) {
        // switch over the target only, cause we shouldn't be resetting the stem on the tooltip
        position.target = Position.inverseCornerPlane(position.target);
      }

      // if we're hooking to the mouse we want the center
      if (MERGED.target === "mouse") {
        var orientation = Position.getOrientation(position.target);

        // force center alignment on the mouse
        if (orientation === "horizontal") {
          position.target = position.target.replace(/(left|right)/, "middle");
        } else {
          position.target = position.target.replace(/(top|bottom)/, "middle");
        }
      }

      // if the target is the mouse we set the position to 'bottomright' so the position system can work with it
      MERGED.position = position;

      // Offset
      var offset;
      if (MERGED.target === "mouse") {
        // get the offset of the base class
        offset = $.extend({}, BASE.offset);
        $.extend(offset, Tipped.Skins["reset"].offset || {});

        if (options.skin) {
          $.extend(
            offset,
            (
              Tipped.Skins[options.skin] ||
              Tipped.Skins[Tooltips.options.defaultSkin] ||
              {}
            ).offset || {}
          );
        }

        // find out what the offset should be
        offset = Position.adjustOffsetBasedOnPosition(
          BASE.offset,
          BASE.position,
          position.target,
          true
        );

        // now put any given options on top of that
        if (options.offset) {
          offset = $.extend(offset, options.offset || {});
        }
      } else {
        offset = {
          x: MERGED.offset.x,
          y: MERGED.offset.y
        };
      }

      MERGED.offset = offset;

      // hideOnClickOutside
      if (MERGED.hideOn && MERGED.hideOn === "click-outside") {
        MERGED.hideOnClickOutside = true;
        MERGED.hideOn = false;
        MERGED.fadeOut = 0; // instantly fadeout for better UI
      }

      if (MERGED.showOn) {
        // showOn and hideOn should not abide by inheritance,
        // otherwise we'd always have the BASE/RESET object for it as starting point
        var showOn = MERGED.showOn;

        if ($.type(showOn) === "string") {
          showOn = { element: showOn };
        }

        MERGED.showOn = showOn;
      }

      if (MERGED.hideOn) {
        var hideOn = MERGED.hideOn;

        if ($.type(hideOn) === "string") {
          hideOn = { element: hideOn };
        }

        MERGED.hideOn = hideOn;
      }

      // normalize inline
      if (MERGED.inline) {
        if ($.type(MERGED.inline) !== "string") {
          MERGED.inline = false;
        }
      }

      // fadeIn 0 on IE < 9 to prevent text transform during fade
      if (Browser.IE && Browser.IE < 9) {
        $.extend(MERGED, { fadeIn: 0, fadeOut: 0, hideDelay: 0 });
      }

      if (MERGED.spinner) {
        if (!Spin.supported) {
          MERGED.spinner = false;
        } else {
          if ($.type(MERGED.spinner) === "boolean") {
            MERGED.spinner = RESET.spinner || BASE.spinner || {};
          }
        }
      }

      if (!MERGED.container) {
        MERGED.container = document.body;
      }

      if (MERGED.containment) {
        if ($.type(MERGED.containment) === "string") {
          MERGED.containment = {
            selector: MERGED.containment,
            padding:
              (RESET.containment && RESET.containment.padding) ||
              (BASE.padding && BASE.containment.padding)
          };
        }
      }

      // normalize shadow, setting it to true should only mean it's enabled when supported
      if (MERGED.shadow) {
        MERGED.shadow = Support.shadow;
      }

      return MERGED;
    }

    return initialize;
  })()
};

function Skin() {
  this.initialize.apply(this, _slice.call(arguments));
}

$.extend(Skin.prototype, {
  initialize: function(tooltip) {
    this.tooltip = tooltip;
    this.element = tooltip._skin;

    // classes to further style the tooltip
    var options = this.tooltip.options;
    this.tooltip._tooltip[(options.shadow ? "remove" : "add") + "Class"](
      "tpd-no-shadow"
    )
      [(options.radius ? "remove" : "add") + "Class"]("tpd-no-radius")
      [(options.stem ? "remove" : "add") + "Class"]("tpd-no-stem");

    // we should get radius and border when initializing
    var frames, bg, bgc, spinner;
    var prefixedRadius = Support.css.prefixed("borderTopLeftRadius");

    this.element
      .append(
        (frames = $("<div>")
          .addClass("tpd-frames")
          .append(
            $("<div>")
              .addClass("tpd-frame")
              .append(
                $("<div>")
                  .addClass("tpd-backgrounds")
                  .append(
                    (bg = $("<div>")
                      .addClass("tpd-background")
                      .append(
                        (bgc = $("<div>").addClass("tpd-background-content"))
                      ))
                  )
              )
          ))
      )
      .append((spinner = $("<div>").addClass("tpd-spinner")));

    // REQUIRED FOR IE < 8
    bg.css({ width: 999, height: 999, zoom: 1 });

    this._css = {
      border: parseFloat(bg.css("border-top-width")),
      radius: parseFloat(prefixedRadius ? bg.css(prefixedRadius) : 0),
      padding: parseFloat(tooltip._content.css("padding-top")),
      borderColor: bg.css("border-top-color"),
      //spacing: parseFloat(this.element.css('margin-top')),
      // borderOpacity: .5 // IE pre rgba fallback can be inserted here
      backgroundColor: bgc.css("background-color"),
      backgroundOpacity: bgc.css("opacity"),
      spinner: {
        dimensions: {
          width: spinner.innerWidth(),
          height: spinner.innerHeight()
        }
      }
    };

    spinner.remove();
    frames.remove();

    this._side = Position.getSide(tooltip.options.position.tooltip) || "top";

    this._vars = {};
  },

  destroy: function() {
    if (!this.frames) return;

    // remove all the stems
    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, side) {
        if (this["stem_" + side]) this["stem_" + side].destroy();
      }, this)
    );

    this.frames.remove();
    this.frames = null;
  },

  build: function() {
    // if already build exit
    if (this.frames) return;

    this.element.append((this.frames = $("<div>").addClass("tpd-frames")));

    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, side) {
        this.insertFrame(side);
      }, this)
    );

    // insert a spinner, if we haven't already
    if (!this._spinner) {
      this.tooltip._tooltip.append(
        (this._spinner = $("<div>")
          .addClass("tpd-spinner")
          .hide()
          .append($("<div>").addClass("tpd-spinner-spin")))
      );
    }
  },

  _frame: (function() {
    var backgrounds;

    var frame = $("<div>")
      .addClass("tpd-frame")
      // background
      .append(
        (backgrounds = $("<div>")
          .addClass("tpd-backgrounds")
          .append($("<div>").addClass("tpd-background-shadow")))
      )
      .append(
        $("<div>")
          .addClass("tpd-shift-stem")
          .append(
            $("<div>").addClass(
              "tpd-shift-stem-side tpd-shift-stem-side-before"
            )
          )
          .append($("<div>").addClass("tpd-stem"))
          .append(
            $("<div>").addClass("tpd-shift-stem-side tpd-shift-stem-side-after")
          )
      );

    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, s) {
        backgrounds.append(
          $("<div>")
            .addClass("tpd-background-box tpd-background-box-" + s)
            .append(
              $("<div>")
                .addClass("tpd-background-box-shift")
                .append(
                  $("<div>")
                    .addClass("tpd-background-box-shift-further")
                    .append(
                      $("<div>")
                        .addClass("tpd-background")
                        .append($("<div>").addClass("tpd-background-title"))
                        .append($("<div>").addClass("tpd-background-content"))
                    )
                    .append(
                      $("<div>").addClass(
                        "tpd-background tpd-background-loading"
                      )
                    )
                    .append(
                      $("<div>")
                        .addClass("tpd-background-border-hack")
                        .hide()
                    )
                )
            )
        );
      }, this)
    );

    return frame;
  })(),

  _getFrame: function(side) {
    var frame = this._frame.clone();

    // class
    frame.addClass("tpd-frame-" + side);

    // put border radius on shadow
    frame
      .find(".tpd-background-shadow")
      .css({ "border-radius": this._css.radius });

    // mark side on stem
    if (this.tooltip.options.stem) {
      frame.find(".tpd-stem").attr("data-stem-position", side);
    }

    // radius on background layers
    var innerBackgroundRadius = Math.max(
      this._css.radius - this._css.border,
      0
    );
    frame.find(".tpd-background-title").css({
      "border-top-left-radius": innerBackgroundRadius,
      "border-top-right-radius": innerBackgroundRadius
    });
    frame.find(".tpd-background-content").css({
      "border-bottom-left-radius": innerBackgroundRadius,
      "border-bottom-right-radius": innerBackgroundRadius
    });
    frame.find(".tpd-background-loading").css({
      "border-radius": innerBackgroundRadius
    });

    // adjust the dimensions of the shift sides
    var ss = { backgroundColor: this._css.borderColor };
    var orientation = Position.getOrientation(side),
      isHorizontal = orientation === "horizontal";
    ss[isHorizontal ? "height" : "width"] = this._css.border + "px";
    var inverse = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left"
    };
    ss[inverse[side]] = 0;
    frame.find(".tpd-shift-stem-side").css(ss);

    return frame;
  },

  insertFrame: function(side) {
    var frame = (this["frame_" + side] = this._getFrame(side));
    this.frames.append(frame);

    if (this.tooltip.options.stem) {
      var stem = frame.find(".tpd-stem");
      this["stem_" + side] = new Stem(stem, this, {});
    }
  },

  // Loading
  startLoading: function() {
    if (!this.tooltip.supportsLoading) return;
    this.build(); // make sure the tooltip is build

    // resize to the dimensions of the spinner the first time a tooltip is shown
    if (!this._spinner && !this.tooltip.is("resize-to-content")) {
      this.setDimensions(this._css.spinner.dimensions); // this creates ._spinner
    }

    if (this._spinner) {
      this._spinner.show();
    }
  },

  // the idea behind stopLoading is that dimensions are set right after calling this function
  // that's why we don't set the manually here
  stopLoading: function() {
    if (!this.tooltip.supportsLoading || !this._spinner) return;
    this.build(); // make sure the tooltip is build

    this._spinner.hide();
  },

  // updates the background of the currently active side
  updateBackground: function() {
    var frame = this._vars.frames[this._side];

    var backgroundDimensions = $.extend({}, frame.background.dimensions);

    if (this.tooltip.title && !this.tooltip.is("loading")) {
      // show both background children
      this.element
        .find(".tpd-background-title, .tpd-background-content")
        .show();

      // remove background color and replace it with transparent
      this.element
        .find(".tpd-background")
        .css({ "background-color": "transparent" });

      var contentDimensions = $.extend({}, backgroundDimensions);
      var innerBackgroundRadius = Math.max(
        this._css.radius - this._css.border,
        0
      );
      var contentRadius = {
        "border-top-left-radius": innerBackgroundRadius,
        "border-top-right-radius": innerBackgroundRadius,
        "border-bottom-left-radius": innerBackgroundRadius,
        "border-bottom-right-radius": innerBackgroundRadius
      };

      // measure the title
      var visible = new Visible(this.tooltip._tooltip);

      var titleHeight = this.tooltip._titleWrapper.innerHeight(); // without margins

      contentDimensions.height -= titleHeight;

      // set all title dimensions
      this.element.find(".tpd-background-title").css({
        height: titleHeight,
        width: backgroundDimensions.width
      });

      // remove radius at the top
      contentRadius["border-top-left-radius"] = 0;
      contentRadius["border-top-right-radius"] = 0;

      visible.restore();

      // set all content dimensions
      // set correct radius
      this.element
        .find(".tpd-background-content")
        .css(contentDimensions)
        .css(contentRadius);

      // loading indicator
      this.element.find(".tpd-background-loading").css({
        "background-color": this._css.backgroundColor
      });
    } else {
      // no title or close button creates a bar at the top
      // set background color only for better px handling in the corners
      // show both background children
      this.element
        .find(".tpd-background-title, .tpd-background-content")
        .hide();

      this.element
        .find(".tpd-background")
        .css({ "background-color": this._css.backgroundColor });
    }

    // border fix, required as a workaround for the following bugs:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=929979
    // https://code.google.com/p/chromium/issues/detail?id=320330
    if (this._css.border) {
      this.element
        .find(".tpd-background")
        .css({ "border-color": "transparent" });

      this.element
        .find(".tpd-background-border-hack")
        // scaled
        .css({
          width: backgroundDimensions.width,
          height: backgroundDimensions.height,
          "border-radius": this._css.radius,
          "border-width": this._css.border,
          "border-color": this._css.borderColor
        })
        .show();
    }
  },

  // update dimensions of the currently active side
  // background + stem
  paint: function() {
    // don't update if we've already rendered the dimensions at current stem position
    if (
      this._paintedDimensions &&
      this._paintedDimensions.width === this._dimensions.width &&
      this._paintedDimensions.height === this._dimensions.height &&
      this._paintedStemPosition === this._stemPosition
    ) {
      return;
    }

    // store these to prevent future updates at the same dimensions
    this._paintedDimensions = this._dimensions;
    this._paintedStemPosition = this._stemPosition;

    // visible side, hide others
    this.element
      .removeClass(
        "tpd-visible-frame-top tpd-visible-frame-bottom tpd-visible-frame-left tpd-visible-frame-right"
      )
      .addClass("tpd-visible-frame-" + this._side);

    var frame = this._vars.frames[this._side];

    // set dimensions
    var backgroundDimensions = $.extend({}, frame.background.dimensions);
    this.element.find(".tpd-background").css(backgroundDimensions);
    this.element.find(".tpd-background-shadow").css({
      width: backgroundDimensions.width + 2 * this._css.border,
      height: backgroundDimensions.height + 2 * this._css.border
    });

    // update background to the correct display method
    this.updateBackground();

    this.element
      .find(".tpd-background-box-shift, .tpd-background-box-shift-further")
      .removeAttr("style");

    // dimensions of the skin
    this.element
      .add(this.frames)
      // and the tooltip
      .add(this.tooltip._tooltip)
      .css(frame.dimensions);

    // resize every frame
    var name = this._side,
      value = this._vars.frames[name];
    var f = this.element.find(".tpd-frame-" + this._side),
      fdimensions = this._vars.frames[name].dimensions;

    f.css(fdimensions);

    // background
    f.find(".tpd-backgrounds").css(
      $.extend({}, value.background.position, {
        width: fdimensions.width - value.background.position.left,
        height: fdimensions.height - value.background.position.top
      })
    );

    // find the position of this frame
    // adjust the backgrounds
    var orientation = Position.getOrientation(name);

    // no stem only shows the top frame (using CSS)
    // with a stem we have to make adjustments
    if (this.tooltip.options.stem) {
      // position the shiftstem
      f.find(".tpd-shift-stem").css(
        $.extend({}, value.shift.dimensions, value.shift.position)
      );

      if (orientation === "vertical") {
        // left or right
        // top or bottom
        // make top/bottom side small
        var smallBoxes = f.find(
          ".tpd-background-box-top, .tpd-background-box-bottom"
        );
        smallBoxes.css({
          height: this._vars.cut,
          width: this._css.border
        });

        // align the bottom side with the bottom
        f.find(".tpd-background-box-bottom")
          .css({
            top: value.dimensions.height - this._vars.cut
          })
          // shift right side back
          .find(".tpd-background-box-shift")
          .css({
            "margin-top": -1 * value.dimensions.height + this._vars.cut
          });

        // both sides should now be moved left or right depending on the current side
        var moveSmallBy =
          name === "right"
            ? value.dimensions.width - value.stemPx - this._css.border
            : 0;
        smallBoxes
          .css({
            left: moveSmallBy
          })
          .find(".tpd-background-box-shift")
          .css({
            // inverse of the above
            "margin-left": -1 * moveSmallBy
          });

        // hide the background that will be replaced by the stemshift when we have a stem
        f.find(
          ".tpd-background-box-" + (name == "left" ? "left" : "right")
        ).hide();

        // resize the other one
        if (name === "right") {
          // top can be resized to height - border
          f.find(".tpd-background-box-left").css({
            width: value.dimensions.width - value.stemPx - this._css.border
          });
        } else {
          f.find(".tpd-background-box-right")
            .css({
              "margin-left": this._css.border //,
              //height: (value.dimensions.height - value.stemPx - this._vars.border) + 'px'
            })
            .find(".tpd-background-box-shift")
            .css({
              "margin-left": -1 * this._css.border
            });
        }

        // left or right should be shifted to the center
        // depending on which side is used
        var smallBox = f.find(".tpd-background-box-" + this._side);
        smallBox.css({
          height: value.dimensions.height - 2 * this._vars.cut, // resize
          "margin-top": this._vars.cut
        });
        smallBox.find(".tpd-background-box-shift").css({
          "margin-top": -1 * this._vars.cut
        });
      } else {
        // top or bottom
        // make left and right side small
        var smallBoxes = f.find(
          ".tpd-background-box-left, .tpd-background-box-right"
        );
        smallBoxes.css({
          width: this._vars.cut,
          height: this._css.border
        });

        // align the right side with the right
        f.find(".tpd-background-box-right")
          .css({
            left: value.dimensions.width - this._vars.cut
          })
          // shift right side back
          .find(".tpd-background-box-shift")
          .css({
            "margin-left": -1 * value.dimensions.width + this._vars.cut
          });

        // both sides should now be moved up or down depending on the current side
        var moveSmallBy =
          name === "bottom"
            ? value.dimensions.height - value.stemPx - this._css.border
            : 0;
        smallBoxes
          .css({
            top: moveSmallBy
          })
          .find(".tpd-background-box-shift")
          .css({
            // inverse of the above
            "margin-top": -1 * moveSmallBy
          });

        // hide the background that will be replaced by the stemshift
        f.find(
          ".tpd-background-box-" + (name === "top" ? "top" : "bottom")
        ).hide();

        // resize the other one
        if (name === "bottom") {
          // top can be resized to height - border
          f.find(".tpd-background-box-top").css({
            height: value.dimensions.height - value.stemPx - this._css.border
          });
        } else {
          f.find(".tpd-background-box-bottom")
            .css({
              "margin-top": this._css.border
            })
            .find(".tpd-background-box-shift")
            .css({
              "margin-top": -1 * this._css.border
            });
        }

        // top or bottom should be shifted to the center
        // depending on which side is used
        var smallBox = f.find(".tpd-background-box-" + this._side);
        smallBox.css({
          width: value.dimensions.width - 2 * this._vars.cut,
          "margin-left": this._vars.cut
        });
        smallBox.find(".tpd-background-box-shift").css({
          "margin-left": -1 * this._vars.cut
        });
      }
    }

    // position the loader
    var fb = frame.background,
      fbp = fb.position,
      fbd = fb.dimensions;
    this._spinner.css({
      top:
        fbp.top +
        this._css.border +
        (fbd.height * 0.5 - this._css.spinner.dimensions.height * 0.5),
      left:
        fbp.left +
        this._css.border +
        (fbd.width * 0.5 - this._css.spinner.dimensions.width * 0.5)
    });
  },

  getVars: function() {
    var padding = this._css.padding,
      radius = this._css.radius,
      border = this._css.border;

    var maxStemHeight = this._vars.maxStemHeight || 0;
    var dimensions = $.extend({}, this._dimensions || {});
    var vars = {
      frames: {},
      dimensions: dimensions,
      maxStemHeight: maxStemHeight
    };

    // set the cut
    vars.cut = Math.max(this._css.border, this._css.radius) || 0;

    var stemDimensions = { width: 0, height: 0 };
    var stemOffset = 0;
    var stemPx = 0;

    if (this.tooltip.options.stem) {
      stemDimensions = this.stem_top.getMath().dimensions.outside;
      stemOffset = this.stem_top._css.offset;
      stemPx = Math.max(stemDimensions.height - this._css.border, 0); // the height we assume the stem is should never be negative
    }

    // store for later use
    vars.stemDimensions = stemDimensions;
    vars.stemOffset = stemOffset;

    // positition the background and resize the outer frame
    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, side) {
        var orientation = Position.getOrientation(side),
          isLR = orientation === "vertical";

        var frameDimensions = {
          width: dimensions.width + 2 * border,
          height: dimensions.height + 2 * border
        };

        var shiftWidth =
          frameDimensions[isLR ? "height" : "width"] - 2 * vars.cut;

        var frame = {
          dimensions: frameDimensions,
          stemPx: stemPx,
          position: { top: 0, left: 0 },
          background: {
            dimensions: $.extend({}, dimensions),
            position: { top: 0, left: 0 }
          }
        };
        vars.frames[side] = frame;

        // adjust width or height of frame based on orientation
        frame.dimensions[isLR ? "width" : "height"] += stemPx;

        if (side === "top" || side === "left") {
          frame.background.position[side] += stemPx;
        }

        $.extend(frame, {
          shift: {
            position: { top: 0, left: 0 },
            dimensions: {
              width: isLR ? stemDimensions.height : shiftWidth,
              height: isLR ? shiftWidth : stemDimensions.height
            }
          }
        });

        switch (side) {
          case "top":
          case "bottom":
            frame.shift.position.left += vars.cut;

            if (side === "bottom") {
              frame.shift.position.top +=
                frameDimensions.height - border - stemPx;
            }
            break;
          case "left":
          case "right":
            frame.shift.position.top += vars.cut;

            if (side === "right") {
              frame.shift.position.left +=
                frameDimensions.width - border - stemPx;
            }
            break;
        }
      }, this)
    );

    // add connections
    vars.connections = {};
    $.each(
      Position.positions,
      $.proxy(function(i, position) {
        vars.connections[position] = this.getConnectionLayout(position, vars);
      }, this)
    );

    return vars;
  },

  setDimensions: function(dimensions) {
    this.build();

    // don't update if nothing changed
    var d = this._dimensions;
    if (d && d.width === dimensions.width && d.height === dimensions.height) {
      return;
    }

    this._dimensions = dimensions;
    this._vars = this.getVars();
  },

  setSide: function(side) {
    this._side = side;
    this._vars = this.getVars();
  },

  // gets position and offset of the given stem
  getConnectionLayout: function(position, vars) {
    var side = Position.getSide(position),
      orientation = Position.getOrientation(position),
      dimensions = vars.dimensions,
      cut = vars.cut; // where the stem starts

    var stem = this["stem_" + side],
      stemOffset = vars.stemOffset,
      stemWidth = this.tooltip.options.stem
        ? stem.getMath().dimensions.outside.width
        : 0,
      stemMiddleFromSide = cut + stemOffset + stemWidth * 0.5;

    // at the end of this function we should know how much the stem is able to shift
    var layout = {
      stem: {}
    };
    var move = {
      left: 0,
      right: 0,
      up: 0,
      down: 0
    };

    var stemConnection = { top: 0, left: 0 },
      connection = { top: 0, left: 0 };

    var frame = vars.frames[side],
      stemMiddleFromSide = 0;

    // top/bottom
    if (orientation == "horizontal") {
      var width = frame.dimensions.width;

      if (this.tooltip.options.stem) {
        width = frame.shift.dimensions.width;

        // if there's not enough width for twice the stemOffset, calculate what is available, divide the width
        if (width - stemWidth < 2 * stemOffset) {
          stemOffset = Math.floor((width - stemWidth) * 0.5) || 0;
        }

        stemMiddleFromSide = cut + stemOffset + stemWidth * 0.5;
      }

      var availableWidth = width - 2 * stemOffset;

      var split = Position.split(position);
      var left = stemOffset;
      switch (split[2]) {
        case "left":
          move.right = availableWidth - stemWidth;

          stemConnection.left = stemMiddleFromSide;
          break;
        case "middle":
          left += Math.round(availableWidth * 0.5 - stemWidth * 0.5);

          move.left = left - stemOffset;
          move.right = left - stemOffset;

          stemConnection.left = connection.left = Math.round(
            frame.dimensions.width * 0.5
          );
          //connection.left = stemConnection.left;
          break;
        case "right":
          left += availableWidth - stemWidth;

          move.left = availableWidth - stemWidth;

          stemConnection.left = frame.dimensions.width - stemMiddleFromSide;
          connection.left = frame.dimensions.width;
          break;
      }

      // if we're working with the bottom stems we have to add the height to the connection
      if (split[1] === "bottom") {
        stemConnection.top += frame.dimensions.height;
        connection.top += frame.dimensions.height;
      }

      $.extend(layout.stem, {
        position: { left: left },
        before: { width: left },
        after: {
          left: left + stemWidth,
          //right: 0, // seems to work better in Chrome (subpixel bug)
          // but it fails in oldIE, se we add overlap to compensate
          width: width - left - stemWidth + 1
        }
      });
    } else {
      // we are dealing with height
      var height = frame.dimensions.height;

      if (this.tooltip.options.stem) {
        height = frame.shift.dimensions.height;

        if (height - stemWidth < 2 * stemOffset) {
          stemOffset = Math.floor((height - stemWidth) * 0.5) || 0;
        }

        stemMiddleFromSide = cut + stemOffset + stemWidth * 0.5;
      }

      var availableHeight = height - 2 * stemOffset;

      var split = Position.split(position);
      var top = stemOffset;
      switch (split[2]) {
        case "top":
          move.down = availableHeight - stemWidth;

          stemConnection.top = stemMiddleFromSide;
          break;
        case "middle":
          top += Math.round(availableHeight * 0.5 - stemWidth * 0.5);

          move.up = top - stemOffset;
          move.down = top - stemOffset;

          stemConnection.top = connection.top = Math.round(
            frame.dimensions.height * 0.5
          );
          break;
        case "bottom":
          top += availableHeight - stemWidth;

          move.up = availableHeight - stemWidth;

          stemConnection.top = frame.dimensions.height - stemMiddleFromSide;
          connection.top = frame.dimensions.height;
          break;
      }

      // if we're working with the right stems we have to add the height to the connection
      if (split[1] === "right") {
        stemConnection.left += frame.dimensions.width;
        connection.left += frame.dimensions.width;
      }

      $.extend(layout.stem, {
        position: { top: top },
        before: { height: top },
        after: {
          top: top + stemWidth,
          height: height - top - stemWidth + 1
        }
      });
    }

    // store movement and connection
    layout.move = move;
    layout.stem.connection = stemConnection;
    layout.connection = connection;

    return layout;
  },

  // sets the stem as one of the available 12 positions
  // we also need to call this function without a stem because it sets
  // connections
  setStemPosition: function(stemPosition, shift) {
    if (this._stemPosition !== stemPosition) {
      this._stemPosition = stemPosition;
      var side = Position.getSide(stemPosition);
      this.setSide(side);
    }

    // actual positioning
    if (this.tooltip.options.stem) {
      this.setStemShift(stemPosition, shift);
    }
  },

  setStemShift: function(stemPosition, shift) {
    var _shift = this._shift,
      _dimensions = this._dimensions;
    // return if we have the same shift on the same dimensions
    if (
      _shift &&
      _shift.stemPosition === stemPosition &&
      _shift.shift.x === shift.x &&
      _shift.shift.y === shift.y &&
      _dimensions &&
      _shift.dimensions.width === _dimensions.width &&
      _shift.dimensions.height === _dimensions.height
    ) {
      return;
    }
    this._shift = {
      stemPosition: stemPosition,
      shift: shift,
      dimensions: _dimensions
    };

    var side = Position.getSide(stemPosition),
      xy = { horizontal: "x", vertical: "y" }[
        Position.getOrientation(stemPosition)
      ],
      leftWidth = {
        x: { left: "left", width: "width" },
        y: { left: "top", width: "height" }
      }[xy],
      stem = this["stem_" + side],
      layout = deepExtend({}, this._vars.connections[stemPosition].stem);

    // only use offset in the orientation of this position
    if (shift && shift[xy] !== 0) {
      layout.before[leftWidth["width"]] += shift[xy];
      layout.position[leftWidth["left"]] += shift[xy];
      layout.after[leftWidth["left"]] += shift[xy];
      layout.after[leftWidth["width"]] -= shift[xy];
    }

    // actual positioning
    stem.element.css(layout.position);
    stem.element.siblings(".tpd-shift-stem-side-before").css(layout.before);
    stem.element.siblings(".tpd-shift-stem-side-after").css(layout.after);
  }
});

function Stem() {
  this.initialize.apply(this, _slice.call(arguments));
}

$.extend(Stem.prototype, {
  initialize: function(element, skin) {
    this.element = $(element);
    if (!this.element[0]) return;

    this.skin = skin;

    this.element.removeClass("tpd-stem-reset"); // for correct offset
    this._css = $.extend({}, skin._css, {
      width: this.element.innerWidth(),
      height: this.element.innerHeight(),
      offset: parseFloat(this.element.css("margin-left")), // side
      spacing: parseFloat(this.element.css("margin-top"))
    });
    this.element.addClass("tpd-stem-reset");

    this.options = $.extend({}, arguments[2] || {});

    this._position = this.element.attr("data-stem-position") || "top";
    this._m = 100; // multiplier, improves rendering when scaling everything down

    this.build();
  },

  destroy: function() {
    this.element.html("");
  },

  build: function() {
    this.destroy();

    // figure out low opacity based on the background color
    var backgroundColor = this._css.backgroundColor,
      alpha =
        backgroundColor.indexOf("rgba") > -1 &&
        parseFloat(backgroundColor.replace(/^.*,(.+)\)/, "$1")),
      hasLowOpacityTriangle = alpha && alpha < 1;

    // if the triangle doesn't have opacity or when we don't have to deal with a border
    // we can get away with a better way to draw the stem.
    // otherwise we need to draw the border as a seperate element, but that
    // can only happen on browsers with support for transforms
    this._useTransform = hasLowOpacityTriangle && Support.css.transform;
    if (!this._css.border) this._useTransform = false;
    this[(this._useTransform ? "build" : "buildNo") + "Transform"]();
  },

  buildTransform: function() {
    this.element.append(
      (this.spacer = $("<div>")
        .addClass("tpd-stem-spacer")
        .append(
          (this.downscale = $("<div>")
            .addClass("tpd-stem-downscale")
            .append(
              (this.transform = $("<div>")
                .addClass("tpd-stem-transform")
                .append(
                  (this.first = $("<div>")
                    .addClass("tpd-stem-side")
                    .append(
                      (this.border = $("<div>").addClass("tpd-stem-border"))
                    )
                    .append($("<div>").addClass("tpd-stem-border-corner"))
                    .append($("<div>").addClass("tpd-stem-triangle")))
                ))
            ))
        ))
    );
    this.transform.append(
      (this.last = this.first.clone().addClass("tpd-stem-side-inversed"))
    );
    this.sides = this.first.add(this.last);

    var math = this.getMath(),
      md = math.dimensions,
      _m = this._m,
      _side = Position.getSide(this._position);

    //if (!math.enabled) return;

    this.element.find(".tpd-stem-spacer").css({
      width: _flip ? md.inside.height : md.inside.width,
      height: _flip ? md.inside.width : md.inside.height
    });
    if (_side === "top" || _side === "left") {
      var _scss = {};
      if (_side === "top") {
        _scss.bottom = 0;
        _scss.top = "auto";
      } else if (_side === "left") {
        _scss.right = 0;
        _scss.left = "auto";
      }

      this.element.find(".tpd-stem-spacer").css(_scss);
    }

    this.transform.css({
      width: md.inside.width * _m,
      height: md.inside.height * _m
    });

    // adjust the dimensions of the element to that of the
    var _transform = Support.css.prefixed("transform");

    // triangle
    var triangleStyle = {
      "background-color": "transparent",
      "border-bottom-color": this._css.backgroundColor,
      "border-left-width": md.inside.width * 0.5 * _m,
      "border-bottom-width": md.inside.height * _m
    };
    triangleStyle[_transform] = "translate(" + math.border * _m + "px, 0)";
    this.element.find(".tpd-stem-triangle").css(triangleStyle);

    // border
    // first convert color to rgb + opacity
    // otherwise we'd be working with a border that overlays the background
    var borderColor = this._css.borderColor;
    alpha =
      borderColor.indexOf("rgba") > -1 &&
      parseFloat(borderColor.replace(/^.*,(.+)\)/, "$1"));
    if (alpha && alpha < 1) {
      // turn the borderColor into a color without alpha
      borderColor = (
        borderColor.substring(0, borderColor.lastIndexOf(",")) + ")"
      ).replace("rgba", "rgb");
    } else {
      alpha = 1;
    }

    var borderStyle = {
      "background-color": "transparent",
      "border-right-width": math.border * _m,
      width: math.border * _m,
      "margin-left": -2 * math.border * _m,
      "border-color": borderColor,
      opacity: alpha
    };
    borderStyle[_transform] =
      "skew(" +
      math.skew +
      "deg) translate(" +
      math.border * _m +
      "px, " +
      -1 * this._css.border * _m +
      "px)";
    this.element.find(".tpd-stem-border").css(borderStyle);

    var borderColor = this._css.borderColor;
    alpha =
      borderColor.indexOf("rgba") > -1 &&
      parseFloat(borderColor.replace(/^.*,(.+)\)/, "$1"));
    if (alpha && alpha < 1) {
      // turn the borderColor into a color without alpha
      borderColor = (
        borderColor.substring(0, borderColor.lastIndexOf(",")) + ")"
      ).replace("rgba", "rgb");
    } else {
      alpha = 1;
    }

    var borderCornerStyle = {
      width: math.border * _m,
      "border-right-width": math.border * _m,
      "border-right-color": borderColor,
      background: borderColor,
      opacity: alpha,
      // setting opacity here causes a flicker in firefox, it's set in css now
      // 'opacity': this._css.borderOpacity,
      "margin-left": -2 * math.border * _m
    };
    borderCornerStyle[_transform] =
      "skew(" +
      math.skew +
      "deg) translate(" +
      math.border * _m +
      "px, " +
      (md.inside.height - this._css.border) * _m +
      "px)";

    this.element.find(".tpd-stem-border-corner").css(borderCornerStyle);

    // measurements are done, now flip things if needed
    this.setPosition(this._position);

    // now downscale to improve subpixel rendering
    if (_m > 1) {
      var t = {};
      t[_transform] = "scale(" + 1 / _m + "," + 1 / _m + ")";
      this.downscale.css(t);
    }
    // switch around the visible dimensions if needed
    var _flip = /^(left|right)$/.test(this._position);

    if (!this._css.border) {
      this.element.find(".tpd-stem-border, .tpd-stem-border-corner").hide();
    }

    this.element.css({
      width: _flip ? md.outside.height : md.outside.width,
      height: _flip ? md.outside.width : md.outside.height
    });
  },

  buildNoTransform: function() {
    this.element.append(
      (this.spacer = $("<div>")
        .addClass("tpd-stem-spacer")
        .append(
          $("<div>")
            .addClass("tpd-stem-notransform")
            .append(
              $("<div>")
                .addClass("tpd-stem-border")
                .append($("<div>").addClass("tpd-stem-border-corner"))
                .append(
                  $("<div>")
                    .addClass("tpd-stem-border-center-offset")
                    .append(
                      $("<div>")
                        .addClass("tpd-stem-border-center-offset-inverse")
                        .append($("<div>").addClass("tpd-stem-border-center"))
                    )
                )
            )
            .append($("<div>").addClass("tpd-stem-triangle"))
        ))
    );

    var math = this.getMath(),
      md = math.dimensions;

    var _flip = /^(left|right)$/.test(this._position),
      _bottom = /^(bottom)$/.test(this._position),
      _right = /^(right)$/.test(this._position),
      _side = Position.getSide(this._position);

    this.element.css({
      width: _flip ? md.outside.height : md.outside.width,
      height: _flip ? md.outside.width : md.outside.height
    });

    // handle spacer
    this.element
      .find(".tpd-stem-notransform")
      .add(this.element.find(".tpd-stem-spacer"))
      .css({
        width: _flip ? md.inside.height : md.inside.width,
        height: _flip ? md.inside.width : md.inside.height
      });
    if (_side === "top" || _side === "left") {
      var _scss = {};
      if (_side === "top") {
        _scss.bottom = 0;
        _scss.top = "auto";
      } else if (_side === "left") {
        _scss.right = 0;
        _scss.left = "auto";
      }

      this.element.find(".tpd-stem-spacer").css(_scss);
    }

    // resets
    this.element.find(".tpd-stem-border").css({
      width: "100%",
      background: "transparent"
    });

    // == on bottom
    var borderCornerStyle = {
      opacity: 1
    };

    borderCornerStyle[_flip ? "height" : "width"] = "100%";
    borderCornerStyle[_flip ? "width" : "height"] = this._css.border;
    borderCornerStyle[_bottom ? "top" : "bottom"] = 0;

    $.extend(borderCornerStyle, !_right ? { right: 0 } : { left: 0 });

    this.element.find(".tpd-stem-border-corner").css(borderCornerStyle);

    // border /\
    // top or bottom
    var borderStyle = {
      width: 0,
      "background-color": "transparent",
      opacity: 1
    };

    var borderSideCSS = md.inside.width * 0.5 + "px solid transparent";

    var triangleStyle = { "background-color": "transparent" };
    var triangleSideCSS =
      md.inside.width * 0.5 - math.border + "px solid transparent";

    if (!_flip) {
      var shared = {
        "margin-left": -0.5 * md.inside.width,
        "border-left": borderSideCSS,
        "border-right": borderSideCSS
      };

      // ==
      $.extend(borderStyle, shared);
      borderStyle[_bottom ? "border-top" : "border-bottom"] =
        md.inside.height + "px solid " + this._css.borderColor;

      // /\
      $.extend(triangleStyle, shared);
      triangleStyle[_bottom ? "border-top" : "border-bottom"] =
        md.inside.height + "px solid " + this._css.backgroundColor;
      triangleStyle[!_bottom ? "top" : "bottom"] = math.top;
      triangleStyle[_bottom ? "top" : "bottom"] = "auto";

      // add offset
      this.element
        .find(".tpd-stem-border-center-offset")
        .css({
          "margin-top": -1 * this._css.border * (_bottom ? -1 : 1)
        })
        .find(".tpd-stem-border-center-offset-inverse")
        .css({
          "margin-top": this._css.border * (_bottom ? -1 : 1)
        });
    } else {
      var shared = {
        left: "auto",
        top: "50%",
        "margin-top": -0.5 * md.inside.width,
        "border-top": borderSideCSS,
        "border-bottom": borderSideCSS
      };

      // ==
      $.extend(borderStyle, shared);
      borderStyle[_right ? "right" : "left"] = 0;
      borderStyle[_right ? "border-left" : "border-right"] =
        md.inside.height + "px solid " + this._css.borderColor;

      // /\
      $.extend(triangleStyle, shared);
      triangleStyle[_right ? "border-left" : "border-right"] =
        md.inside.height + "px solid " + this._css.backgroundColor;
      triangleStyle[!_right ? "left" : "right"] = math.top;
      triangleStyle[_right ? "left" : "right"] = "auto";

      // add offset
      this.element
        .find(".tpd-stem-border-center-offset")
        .css({
          "margin-left": -1 * this._css.border * (_right ? -1 : 1)
        })
        .find(".tpd-stem-border-center-offset-inverse")
        .css({
          "margin-left": this._css.border * (_right ? -1 : 1)
        });
    }

    this.element.find(".tpd-stem-border-center").css(borderStyle);
    this.element
      .find(".tpd-stem-border-corner")
      .css({ "background-color": this._css.borderColor });
    this.element.find(".tpd-stem-triangle").css(triangleStyle);

    if (!this._css.border) {
      this.element.find(".tpd-stem-border").hide();
    }
  },

  setPosition: function(position) {
    this._position = position;
    this.transform.attr(
      "class",
      "tpd-stem-transform tpd-stem-transform-" + position
    );
  },

  getMath: function() {
    var height = this._css.height,
      width = this._css.width,
      border = this._css.border;

    // width should be divisible by 2
    // this fixes pixel bugs in the transform methods, so only do it there
    if (this._useTransform && !!(Math.floor(width) % 2)) {
      width = Math.max(Math.floor(width) - 1, 0);
    }

    // first increase the original dimensions so the triangle is that of the given css dimensions
    var corner_top = degrees(Math.atan((width * 0.5) / height)),
      corner_side = 90 - corner_top,
      side = border / Math.cos(((90 - corner_side) * Math.PI) / 180),
      top = border / Math.cos(((90 - corner_top) * Math.PI) / 180);
    var dimensions = {
      width: width + side * 2,
      height: height + top
    };

    var cut = Math.max(border, this._css.radius);

    // adjust height and width
    height = dimensions.height;
    width = dimensions.width * 0.5;

    // calculate the rest
    var cA = degrees(Math.atan(height / width)),
      cB = 90 - cA,
      overstaand = border / Math.cos((cB * Math.PI) / 180);

    var angle = (Math.atan(height / width) * 180) / Math.PI,
      skew = -1 * (90 - angle),
      angleTop = 90 - angle,
      cornerWidth = border * Math.tan((angleTop * Math.PI) / 180);

    var top = border / Math.cos(((90 - angleTop) * Math.PI) / 180);

    // add spacing
    //dimensions.height += this._css.spacing;
    var inside = $.extend({}, dimensions),
      outside = $.extend({}, dimensions);
    outside.height += this._css.spacing;

    // IE11 and below have issues with rendering stems that
    // end up with floating point dimensions
    // ceil the outside height to fix this
    outside.height = Math.ceil(outside.height);

    // if the border * 2 is bigger than the width, we should disable the stem
    var enabled = true;
    if (border * 2 >= dimensions.width) {
      enabled = false;
    }

    return {
      enabled: enabled,
      outside: outside,
      dimensions: {
        inside: inside,
        outside: outside
      },
      top: top,
      border: overstaand,
      skew: skew,
      corner: cornerWidth
    };
  }
});

var Tooltips = {
  tooltips: {},

  options: {
    defaultSkin: "dark",
    startingZIndex: 999999
  },

  _emptyClickHandler: function() {},

  init: function() {
    this.reset();

    this._resizeHandler = $.proxy(this.onWindowResize, this);
    $(window).bind("resize orientationchange", this._resizeHandler);

    if (Browser.MobileSafari) {
      $("body").bind("click", this._emptyClickHandler);
    }
  },

  reset: function() {
    Tooltips.removeAll();

    Delegations.removeAll();

    if (this._resizeHandler) {
      $(window).unbind("resize orientationchange", this._resizeHandler);
    }

    if (Browser.MobileSafari) {
      $("body").unbind("click", this._emptyClickHandler);
    }
  },

  onWindowResize: function() {
    if (this._resizeTimer) {
      window.clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    }

    this._resizeTimer = _.delay(
      $.proxy(function() {
        var visible = this.getVisible();
        $.each(visible, function(i, tooltip) {
          tooltip.clearUpdatedTo();

          tooltip.position();
        });
      }, this),
      15
    );
  },

  _getTooltips: function(element, noClosest) {
    var uids = [],
      tooltips = [],
      u;

    if (_.isElement(element)) {
      if ((u = $(element).data("tipped-uids"))) uids = uids.concat(u);
    } else {
      // selector
      $(element).each(function(i, el) {
        if ((u = $(el).data("tipped-uids"))) uids = uids.concat(u);
      });
    }

    if (!uids[0] && !noClosest) {
      // find a uids string
      var closestTooltip = this.getTooltipByTooltipElement(
        $(element).closest(".tpd-tooltip")[0]
      );
      if (closestTooltip && closestTooltip.element) {
        u = $(closestTooltip.element).data("tipped-uids") || [];
        if (u) uids = uids.concat(u);
      }
    }

    if (uids.length > 0) {
      $.each(
        uids,
        $.proxy(function(i, uid) {
          var tooltip;
          if ((tooltip = this.tooltips[uid])) {
            tooltips.push(tooltip);
          }
        }, this)
      );
    }

    return tooltips;
  },

  // Returns the element for which the tooltip was created when given a tooltip element or any element within that tooltip.
  findElement: function(element) {
    var tooltips = [];

    if (_.isElement(element)) {
      tooltips = this._getTooltips(element);
    }

    return tooltips[0] && tooltips[0].element;
  },

  get: function(element) {
    var options = $.extend(
      {
        api: false
      },
      arguments[1] || {}
    );

    var matched = [];
    if (_.isElement(element)) {
      matched = this._getTooltips(element);
    } else if (element instanceof $) {
      // when a jQuery object, search every element
      element.each(
        $.proxy(function(i, el) {
          var tooltips = this._getTooltips(el, true);
          if (tooltips.length > 0) {
            matched = matched.concat(tooltips);
          }
        }, this)
      );
    } else if ($.type(element) === "string") {
      // selector
      $.each(this.tooltips, function(i, tooltip) {
        if (tooltip.element && $(tooltip.element).is(element)) {
          matched.push(tooltip);
        }
      });
    }

    // if api is set we'll mark the given tooltips as using the API
    if (options.api) {
      $.each(matched, function(i, tooltip) {
        tooltip.is("api", true);
      });
    }

    return matched;
  },

  getTooltipByTooltipElement: function(element) {
    if (!element) return null;
    var matched = null;
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.is("build") && tooltip._tooltip[0] === element) {
        matched = tooltip;
      }
    });
    return matched;
  },

  getBySelector: function(selector) {
    var matched = [];
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.element && $(tooltip.element).is(selector)) {
        matched.push(tooltip);
      }
    });
    return matched;
  },

  getNests: function() {
    var matched = [];
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.is("nest")) {
        // safe cause when a tooltip is a nest it's already build
        matched.push(tooltip);
      }
    });
    return matched;
  },

  show: function(selector) {
    $(this.get(selector)).each(function(i, tooltip) {
      tooltip.show(false, true); // not instant, but without delay
    });
  },

  hide: function(selector) {
    $(this.get(selector)).each(function(i, tooltip) {
      tooltip.hide();
    });
  },

  toggle: function(selector) {
    $(this.get(selector)).each(function(i, tooltip) {
      tooltip.toggle();
    });
  },

  hideAll: function(but) {
    $.each(this.getVisible(), function(i, tooltip) {
      if (but && but === tooltip) return;
      tooltip.hide();
    });
  },

  refresh: function(selector) {
    // find only those tooltips that are visible
    var tooltips;
    if (selector) {
      // filter out only those visible
      tooltips = $.grep(this.get(selector), function(tooltip, i) {
        return tooltip.is("visible");
      });
    } else {
      // all visible tooltips
      tooltips = this.getVisible();
    }

    $.each(tooltips, function(i, tooltip) {
      tooltip.refresh();
    });
  },

  getVisible: function() {
    var visible = [];
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.visible()) {
        visible.push(tooltip);
      }
    });
    return visible;
  },

  isVisibleByElement: function(element) {
    var visible = false;
    if (_.isElement(element)) {
      $.each(this.getVisible() || [], function(i, tooltip) {
        if (tooltip.element === element) {
          visible = true;
          return false;
        }
      });
    }
    return visible;
  },

  getHighestTooltip: function() {
    var Z = 0,
      h;
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.zIndex > Z) {
        Z = tooltip.zIndex;
        h = tooltip;
      }
    });
    return h;
  },

  resetZ: function() {
    // the zIndex only has to be restore when there are no visible tooltip
    // use find to $break when a a visible tooltip is found
    if (this.getVisible().length <= 1) {
      $.each(this.tooltips, function(i, tooltip) {
        // only reset on tooltip that don't have the zIndex option set
        if (tooltip.is("build") && !tooltip.options.zIndex) {
          tooltip._tooltip.css({
            zIndex: (tooltip.zIndex = +Tooltips.options.startingZIndex)
          });
        }
      });
    }
  },

  // AjaxCache
  clearAjaxCache: function() {
    // if there's an _cache.xhr running, abort it for all tooltips
    // set updated state to false for all
    $.each(
      this.tooltips,
      $.proxy(function(i, tooltip) {
        if (tooltip.options.ajax) {
          // abort possible running request
          if (tooltip._cache && tooltip._cache.xhr) {
            tooltip._cache.xhr.abort();
            tooltip._cache.xhr = null;
          }

          // reset state
          tooltip.is("updated", false);
          tooltip.is("updating", false);
          tooltip.is("sanitized", false); // sanitize again
        }
      }, this)
    );

    AjaxCache.clear();
  },

  add: function(tooltip) {
    this.tooltips[tooltip.uid] = tooltip;
  },

  remove: function(element) {
    var tooltips = this._getTooltips(element);
    this.removeTooltips(tooltips);
  },

  removeTooltips: function(tooltips) {
    if (!tooltips) return;

    $.each(
      tooltips,
      $.proxy(function(i, tooltip) {
        var uid = tooltip.uid;

        delete this.tooltips[uid];

        tooltip.remove(); // also removes uid from element
      }, this)
    );
  },

  // remove all tooltips that are not attached to the DOM
  removeDetached: function() {
    // first find all nests
    var nests = this.getNests(),
      detached = [];
    if (nests.length > 0) {
      $.each(nests, function(i, nest) {
        if (nest.is("detached")) {
          detached.push(nest);
          nest.attach();
        }
      });
    }

    $.each(
      this.tooltips,
      $.proxy(function(i, tooltip) {
        if (tooltip.element && !_.element.isAttached(tooltip.element)) {
          this.remove(tooltip.element);
        }
      }, this)
    );

    // restore previously detached nests
    // if they haven't been removed
    $.each(detached, function(i, nest) {
      nest.detach();
    });
  },

  removeAll: function() {
    $.each(
      this.tooltips,
      $.proxy(function(i, tooltip) {
        if (tooltip.element) {
          this.remove(tooltip.element);
        }
      }, this)
    );
    this.tooltips = {};
  },

  setDefaultSkin: function(name) {
    this.options.defaultSkin = name || "dark";
  },

  setStartingZIndex: function(index) {
    this.options.startingZIndex = index || 0;
  }
};

// Extra position functions, used in Options
Tooltips.Position = {
  inversedPosition: {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
    middle: "middle",
    center: "center"
  },

  getInversedPosition: function(position) {
    var positions = Position.split(position),
      left = positions[1],
      right = positions[2],
      orientation = Position.getOrientation(position),
      options = $.extend(
        {
          horizontal: true,
          vertical: true
        },
        arguments[1] || {}
      );

    if (orientation === "horizontal") {
      if (options.vertical) {
        left = this.inversedPosition[left];
      }
      if (options.horizontal) {
        right = this.inversedPosition[right];
      }
    } else {
      // vertical
      if (options.vertical) {
        right = this.inversedPosition[right];
      }
      if (options.horizontal) {
        left = this.inversedPosition[left];
      }
    }

    return left + right;
  },

  // what we do here is inverse topleft -> bottomleft instead of bottomright
  // and lefttop -> righttop instead of rightbottom
  getTooltipPositionFromTarget: function(position) {
    var positions = Position.split(position);
    return this.getInversedPosition(
      positions[1] + this.inversedPosition[positions[2]]
    );
  }
};

function Tooltip() {
  this.initialize.apply(this, _slice.call(arguments));
}

$.extend(Tooltip.prototype, {
  supportsLoading: Support.css.transform && Support.css.animation,

  initialize: function(element, content) {
    this.element = element;
    if (!this.element) return;

    var options;
    if (
      $.type(content) === "object" &&
      !(
        _.isElement(content) ||
        _.isText(content) ||
        _.isDocumentFragment(content) ||
        content instanceof $
      )
    ) {
      options = content;
      content = null;
    } else {
      options = arguments[2] || {};
    }

    // append element options if data-tpd-options
    var dataOptions = $(element).data("tipped-options");
    if (dataOptions) {
      options = deepExtend(
        $.extend({}, options),
        eval("({" + dataOptions + "})")
      );
    }

    this.options = Options.create(options);

    // all the garbage goes in here
    this._cache = {
      dimensions: {
        width: 0,
        height: 0
      },
      events: [],
      timers: {},
      layouts: {},
      is: {},
      fnCallFn: "",
      updatedTo: {}
    };

    // queues for effects
    this.queues = {
      showhide: $({})
    };

    // title
    var title =
      $(element).attr("title") || $(element).data("tipped-restore-title");

    if (!content) {
      // grab the content off the attribute
      var dt = $(element).attr("data-tipped");

      if (dt) {
        content = dt;
      } else if (title) {
        content = title;
      }

      if (content) {
        // avoid scripts in title/data-tipped
        var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        content = content.replace(SCRIPT_REGEX, "");
      }
    }

    if (
      (!content || (content instanceof $ && !content[0])) &&
      !((this.options.ajax && this.options.ajax.url) || this.options.inline)
    ) {
      this._aborted = true;
      return;
    }

    // backup title
    if (title) {
      // backup the title so we can restore it once the tooltip is removed
      $(element).data("tipped-restore-title", title);
      $(element)[0].setAttribute("title", ""); // IE needs setAttribute
    }

    this.content = content;
    this.title = $(this.element).data("tipped-title");
    if ($.type(this.options.title) != "undefined")
      this.title = this.options.title;

    this.zIndex = this.options.zIndex || +Tooltips.options.startingZIndex;

    // make sure the element has a uids array
    var uids = $(element).data("tipped-uids"); //, initial_uid = uid;
    if (!uids) {
      uids = [];
    }

    // generate a new uid
    var uid = getUID();
    this.uid = uid;
    uids.push(uid);

    // store grown uids array back into data
    $(element).data("tipped-uids", uids);

    // mark parent tooltips as being a nest if this tooltip is created on an element within another tooltip
    var parentTooltipElement = $(this.element).closest(".tpd-tooltip")[0],
      parentTooltip;
    if (
      parentTooltipElement &&
      (parentTooltip = Tooltips.getTooltipByTooltipElement(
        parentTooltipElement
      ))
    ) {
      parentTooltip.is("nest", true);
    }

    // set the target
    var target = this.options.target;
    this.target =
      target === "mouse"
        ? this.element
        : target === "element" || !target
        ? this.element
        : _.isElement(target)
        ? target
        : target instanceof $ && target[0]
        ? target[0]
        : this.element;

    // for inline content
    if (this.options.inline) {
      this.content = $("#" + this.options.inline)[0];
    }

    // ajax might not be using ajax: { url: ... } but instead have the 2nd parameter as its url
    // we store _content
    if (this.options.ajax) {
      this.__content = this.content;
    }

    // function as content
    if ($.type(this.content) === "function") {
      this._fn = this.content;
    }

    this.preBuild();

    Tooltips.add(this);
  },

  remove: function() {
    this.unbind();

    this.clearTimers();

    // restore content if it was an element attached to the DOM before insertion
    this.restoreElementToMarker();

    this.stopLoading();
    this.abort();

    // delete the tooltip
    if (this.is("build") && this._tooltip) {
      this._tooltip.remove();
      this._tooltip = null;
    }

    var uids = $(this.element).data("tipped-uids") || [];
    var uid_index = $.inArray(this.uid, uids);
    if (uid_index > -1) {
      uids.splice(uid_index, 1);
      $(this.element).data("tipped-uids", uids);
    }

    if (uids.length < 1) {
      // restore title
      var da = "tipped-restore-title",
        r_title;
      if ((r_title = $(this.element).data(da))) {
        // only restore it when the title hasn't been altered
        if (!$(this.element)[0].getAttribute("title") != "") {
          $(this.element).attr("title", r_title);
        }
        // remove the data
        $(this.element).removeData(da);
      }

      // remove the data attribute uid
      $(this.element).removeData("tipped-uids");
    }

    // remove any delegation classes
    var classList = $(this.element).attr("class") || "",
      newClassList = classList
        .replace(/(tpd-delegation-uid-)\d+/g, "")
        .replace(/^\s\s*/, "")
        .replace(/\s\s*$/, ""); // trim whitespace
    $(this.element).attr("class", newClassList);
  },

  detach: function() {
    if (this.options.detach && !this.is("detached")) {
      if (this._tooltip) this._tooltip.detach();
      this.is("detached", true);
    }
  },

  attach: function() {
    if (this.is("detached")) {
      var container;
      if ($.type(this.options.container) === "string") {
        var target = this.target;
        if (target === "mouse") {
          target = this.element;
        }

        container = $(
          $(target)
            .closest(this.options.container)
            .first()
        );
      } else {
        container = $(this.options.container);
      }

      // we default to document body, if nothing was found
      if (!container[0]) container = $(document.body);

      container.append(this._tooltip);
      this.is("detached", false);
    }
  },

  preBuild: function() {
    this.is("detached", true);

    var initialCSS = {
      left: "-10000px", // TODO: remove
      top: "-10000px",
      opacity: 0,
      zIndex: this.zIndex
    };

    this._tooltip = $("<div>")
      .addClass("tpd-tooltip")
      .addClass("tpd-skin-" + this.options.skin)
      .addClass("tpd-size-" + this.options.size)
      .css(initialCSS)
      .hide();

    this.createPreBuildObservers();
  },

  build: function() {
    if (this.is("build")) return;

    this.attach();

    this._tooltip.append((this._skin = $("<div>").addClass("tpd-skin"))).append(
      (this._contentWrapper = $("<div>")
        .addClass("tpd-content-wrapper")
        .append(
          (this._contentSpacer = $("<div>")
            .addClass("tpd-content-spacer")
            .append(
              (this._titleWrapper = $("<div>")
                .addClass("tpd-title-wrapper")
                .append(
                  (this._titleSpacer = $("<div>")
                    .addClass("tpd-title-spacer")
                    .append(
                      (this._titleRelative = $("<div>")
                        .addClass("tpd-title-relative")
                        .append(
                          (this._titleRelativePadder = $("<div>")
                            .addClass("tpd-title-relative-padder")
                            .append(
                              (this._title = $("<div>").addClass("tpd-title"))
                            ))
                        ))
                    ))
                )
                .append(
                  (this._close = $("<div>")
                    .addClass("tpd-close")
                    .append(
                      $("<div>")
                        .addClass("tpd-close-icon")
                        .html("&times;")
                    ))
                ))
            )
            .append(
              (this._contentRelative = $("<div>")
                .addClass("tpd-content-relative")
                .append(
                  (this._contentRelativePadder = $("<div>")
                    .addClass("tpd-content-relative-padder")
                    .append(
                      (this._content = $("<div>").addClass("tpd-content"))
                    ))
                )
                .append(
                  (this._inner_close = $("<div>")
                    .addClass("tpd-close")
                    .append(
                      $("<div>")
                        .addClass("tpd-close-icon")
                        .html("&times;")
                    ))
                ))
            ))
        ))
    );

    this.skin = new Skin(this); // TODO: remove instances of is('skinned'), and look into why they are there

    // set radius of contenspacer to be that found on the skin
    this._contentSpacer.css({
      "border-radius": Math.max(
        this.skin._css.radius - this.skin._css.border,
        0
      )
    });

    this.createPostBuildObservers();

    this.is("build", true);
  },

  createPostBuildObservers: function() {
    // x
    this._tooltip.delegate(
      ".tpd-close, .close-tooltip",
      "click",
      $.proxy(function(event) {
        // this helps prevent the click on x to trigger a click on the body
        // which could conflict with some scripts
        event.stopPropagation();
        event.preventDefault();

        this.is("api", false);

        this.hide(true);
      }, this)
    );
  },

  createPreBuildObservers: function() {
    // what can be observed before build
    // - the element
    this.bind(this.element, "mouseenter", this.setActive); // mousemove
    this.bind(
      this._tooltip,
      // avoid double click issues
      Support.touch && Browser.MobileSafari ? "touchstart" : "mouseenter",
      this.setActive
    );

    // idle stats
    this.bind(this.element, "mouseleave", function(event) {
      this.setIdle(event);
    });
    this.bind(this._tooltip, "mouseleave", function(event) {
      this.setIdle(event);
    });

    if (this.options.showOn) {
      $.each(
        this.options.showOn,
        $.proxy(function(name, events) {
          var element,
            toggleable = false;

          switch (name) {
            case "element":
              element = this.element;

              if (
                this.options.hideOn &&
                this.options.showOn &&
                this.options.hideOn.element === "click" &&
                this.options.showOn.element === "click"
              ) {
                toggleable = true;
                this.is("toggleable", toggleable);
              }
              break;

            case "tooltip":
              element = this._tooltip;
              break;
            case "target":
              element = this.target;
              break;
          }

          if (!element) return;

          if (events) {
            // Translate mouseenter to touchstart
            // just for the tooltip to fix double click issues
            // https://davidwalsh.name/ios-hover-menu-fix
            var useEvents = events;

            this.bind(
              element,
              useEvents,
              events === "click" && toggleable
                ? function(event) {
                    this.is("api", false);
                    this.toggle();
                  }
                : function(event) {
                    this.is("api", false);
                    this.showDelayed();
                  }
            );
          }
        }, this)
      );

      // iOS requires that we track touchend time to avoid
      // links requiring a double-click
      if (Support.touch && Browser.MobileSafari) {
        this.bind(this._tooltip, "touchend", function() {
          this._tooltipTouchEndTime = new Date().getTime();
        });
      }
    }

    if (this.options.hideOn) {
      $.each(
        this.options.hideOn,
        $.proxy(function(name, events) {
          var element;

          switch (name) {
            case "element":
              // no events needed if the element toggles
              if (this.is("toggleable") && events === "click") return;
              element = this.element;
              break;
            case "tooltip":
              element = this._tooltip;
              break;
            case "target":
              element = this.target;
              break;
          }

          // if we don't have an element now we don't have to attach anything
          if (!element) return;

          if (events) {
            var useEvents = events;

            // prevent having to double-click links on iOS
            // by comparing the touchend time on the tooltip to a mouseleave/out
            // triggered on the element or target, if it is within a short duration
            // we cancel the hide event.
            // we basically track if we've moved from element/target to tooltip
            if (
              Support.touch &&
              Browser.MobileSafari &&
              /^(target|element)/.test(name) &&
              /mouse(leave|out)/.test(useEvents)
            ) {
              this.bind(element, useEvents, function(event) {
                if (
                  this._tooltipTouchEndTime &&
                  /^mouse(leave|out)$/.test(event.type)
                ) {
                  var now = new Date().getTime();
                  if (now - this._tooltipTouchEndTime < 450) {
                    // quicktap (355-369ms)
                    return;
                  }
                }
                this.is("api", false);
                this.hideDelayed();
              });
            } else {
              this.bind(element, useEvents, function(event) {
                this.is("api", false);
                this.hideDelayed();
              });
            }
          }
        }, this)
      );
    }

    if (this.options.hideOnClickOutside) {
      // add a class to check for the hideOnClickOutSide element
      $(this.element).addClass("tpd-hideOnClickOutside");

      // touchend is an iOS fix to prevent the need to double tap
      // without this it doesn't even work at all on iOS
      this.bind(
        document.documentElement,
        "click touchend",
        $.proxy(function(event) {
          if (!this.visible()) return;

          var element = $(event.target).closest(
            ".tpd-tooltip, .tpd-hideOnClickOutside"
          )[0];

          if (
            !element ||
            (element &&
              (element !== this._tooltip[0] && element !== this.element))
          ) {
            this.hide();
          }
        }, this)
      );
    }

    if (this.options.target === "mouse") {
      this.bind(
        this.element,
        "mouseenter mousemove",
        $.proxy(function(event) {
          this._cache.event = event;
        }, this)
      );
    }

    var isMouseMove = false;
    if (
      this.options.showOn &&
      this.options.target === "mouse" &&
      !this.options.fixed
    ) {
      isMouseMove = true;
    }

    if (isMouseMove) {
      this.bind(this.element, "mousemove", function(event) {
        if (!this.is("build")) return;
        this.is("api", false);
        this.position();
      });
    }
  }
});

$.extend(Tooltip.prototype, {
  // make sure there are no animations queued up, and stop any animations currently going on
  stop: function() {
    // cancel when we call this function before the tooltip is created
    if (!this._tooltip) return;

    var shq = this.queues.showhide;
    // clear queue
    shq.queue([]);
    // stop possible show/hide event
    this._tooltip.stop(1, 0);
  },

  showDelayed: function(event) {
    if (this.is("disabled")) return;

    // cancel hide timer
    this.clearTimer("hide");

    // if there is a show timer we don't have to start another one
    if (this.is("visible") || this.getTimer("show")) return;

    // otherwise we start one
    this.setTimer(
      "show",
      $.proxy(function() {
        this.clearTimer("show");
        this.show();
      }, this),
      this.options.showDelay || 1
    );
  },

  show: function() {
    this.clearTimer("hide");

    // don't show tooltip already visible or on hidden targets, those would end up at (0, 0)
    if (
      this.visible() ||
      this.is("disabled") ||
      !$(this.target).is(":visible")
    ) {
      return;
    }

    this.is("visible", true);

    this.attach();

    this.stop();
    var shq = this.queues.showhide;

    // update
    if (!(this.is("updated") || this.is("updating"))) {
      shq.queue(
        $.proxy(function(next_updated) {
          this._onResizeDimensions = { width: 0, height: 0 };

          this.update(
            $.proxy(function(aborted) {
              if (aborted) {
                this.is("visible", false);
                this.detach();
                return;
              }

              next_updated();
            }, this)
          );
        }, this)
      );
    }

    // sanitize every time
    // we've moved this outside of the update in 4.3
    // allowing the update to finish without conflicting with the sanitize
    // that might even be performed later or cancelled
    shq.queue(
      $.proxy(function(next_ready_to_show) {
        if (!this.is("sanitized")) {
          this._contentWrapper.css({ visibility: "hidden" });

          this.startLoading();

          this.sanitize(
            $.proxy(function() {
              this.stopLoading();
              this._contentWrapper.css({ visibility: "visible" });
              this.is("resize-to-content", true);
              next_ready_to_show();
            }, this)
          );
        } else {
          // already sanitized
          this.stopLoading(); // always stop loading
          this._contentWrapper.css({ visibility: "visible" }); // and make visible
          this.is("resize-to-content", true);
          next_ready_to_show();
        }
      }, this)
    );

    // position and raise
    // we always do this because when the tooltip hides and ajax updates, we'd otherwise have incorrect dimensions
    shq.queue(
      $.proxy(function(next_position_raise) {
        this.position();
        this.raise();
        next_position_raise();
      }, this)
    );

    // onShow callback
    shq.queue(
      $.proxy(function(next_onshow) {
        // only fire it here if we've already updated
        if (this.is("updated") && $.type(this.options.onShow) === "function") {
          //
          var visible = new Visible(this._tooltip);
          this.options.onShow(this._content[0], this.element); // todo: update
          visible.restore();
          next_onshow();
        } else {
          next_onshow();
        }
      }, this)
    );

    // Fade-in
    shq.queue(
      $.proxy(function(next_show) {
        this._show(/*instant ? 0 :*/ this.options.fadeIn, function() {
          next_show();
        });
      }, this)
    );
  },

  _show: function(duration, callback) {
    duration =
      ($.type(duration) === "number" ? duration : this.options.fadeIn) || 0;
    callback =
      callback || ($.type(arguments[0]) == "function" ? arguments[0] : false);

    // hide others
    if (this.options.hideOthers) {
      Tooltips.hideAll(this);
    }

    this._tooltip.fadeTo(
      duration,
      1,
      $.proxy(function() {
        if (callback) callback();
      }, this)
    );
  },

  hideDelayed: function() {
    // cancel show timer
    this.clearTimer("show");

    // if there is a hide timer we don't have to start another one
    if (this.getTimer("hide") || !this.visible() || this.is("disabled")) return;

    // otherwise we start one
    this.setTimer(
      "hide",
      $.proxy(function() {
        this.clearTimer("hide");
        this.hide();
      }, this),
      this.options.hideDelay || 1 // always at least some delay
    );
  },

  hide: function(instant, callback) {
    this.clearTimer("show");
    if (!this.visible() || this.is("disabled")) return;

    this.is("visible", false);

    this.stop();
    var shq = this.queues.showhide;

    // instantly cancel ajax/sanitize/refresh
    shq.queue(
      $.proxy(function(next_aborted) {
        this.abort();
        next_aborted();
      }, this)
    );

    // Fade-out
    shq.queue(
      $.proxy(function(next_fade_out) {
        this._hide(instant, next_fade_out);
      }, this)
    );

    // if all tooltips are hidden now we can reset Tooltips.zIndex.current
    shq.queue(function(next_resetZ) {
      Tooltips.resetZ();
      next_resetZ();
    });

    // update on next open
    shq.queue(
      $.proxy(function(next_update_on_show) {
        this.clearUpdatedTo();
        next_update_on_show();
      }, this)
    );

    if ($.type(this.options.afterHide) === "function" && this.is("updated")) {
      shq.queue(
        $.proxy(function(next_afterhide) {
          this.options.afterHide(this._content[0], this.element); // TODO: update
          next_afterhide();
        }, this)
      );
    }

    // if we have a non-caching ajax or function based tooltip, reset updated
    // after afterHide callback since it checks for this
    if (!this.options.cache && (this.options.ajax || this._fn)) {
      shq.queue(
        $.proxy(function(next_non_cached_reset) {
          this.is("updated", false);
          this.is("updating", false);
          this.is("sanitized", false); // sanitize again
          next_non_cached_reset();
        }, this)
      );
    }

    // callback
    if ($.type(callback) === "function") {
      shq.queue(function(next_callback) {
        callback();
        next_callback();
      });
    }

    // detach last
    shq.queue(
      $.proxy(function(next_detach) {
        this.detach();
        next_detach();
      }, this)
    );
  },

  _hide: function(instant, callback) {
    callback =
      callback || ($.type(arguments[0]) === "function" ? arguments[0] : false);

    this.attach();

    // we use fadeTo instead of fadeOut because it has some bugs with detached/reattached elements (jQuery)
    this._tooltip.fadeTo(
      instant ? 0 : this.options.fadeOut,
      0,
      $.proxy(function() {
        // stop loading after a complete hide to make sure a loading icon
        // fades out without switching to content during a hide()
        this.stopLoading();

        // the next show should resize to spinner
        // if it has to sanitize again
        // the logic behind that is handled in show()
        this.is("resize-to-content", false);

        // jQuerys fadein/out is bugged when working with elements that get detached elements
        // fading to 0 doesn't mean we hide at the end, so force that
        this._tooltip.hide();

        if (callback) callback();
      }, this)
    );
  },

  toggle: function() {
    if (this.is("disabled")) return;
    this[this.visible() ? "hide" : "show"]();
  },

  raise: function() {
    // if zIndex is set on the tooltip we don't raise it.
    if (!this.is("build") || this.options.zIndex) return;
    var highestTooltip = Tooltips.getHighestTooltip();

    if (
      highestTooltip &&
      highestTooltip !== this &&
      this.zIndex <= highestTooltip.zIndex
    ) {
      this.zIndex = highestTooltip.zIndex + 1;
      this._tooltip.css({ "z-index": this.zIndex });

      if (this._tooltipShadow) {
        this._tooltipShadow.css({ "z-index": this.zIndex });

        this.zIndex = highestTooltip.zIndex + 2;
        this._tooltip.css({ "z-index": this.zIndex });
      }
    }
  }
});

$.extend(Tooltip.prototype, {
  createElementMarker: function(callback) {
    // marker for inline content
    if (
      !this.elementMarker &&
      this.content &&
      _.element.isAttached(this.content)
    ) {
      // save the original display on the element
      $(this.content).data(
        "tpd-restore-inline-display",
        $(this.content).css("display")
      );

      // put an inline marker before the element
      this.elementMarker = $("<div>").hide();

      $(this.content).before($(this.elementMarker).hide());
    }
  },

  restoreElementToMarker: function() {
    var rid;

    if (this.elementMarker && this.content) {
      // restore old visibility
      if ((rid = $(this.content).data("tpd-restore-inline-display"))) {
        $(this.content).css({ display: rid });
      }

      $(this.elementMarker)
        .before(this.content)
        .remove();
    }
  },

  startLoading: function() {
    if (this.is("loading")) return;

    // make sure the tooltip is build, otherwise there won't be a skin
    this.build();

    // always set this flag
    this.is("loading", true);

    // can exit now if no spinner through options
    if (!this.options.spinner) return;

    this._tooltip.addClass("tpd-is-loading");

    this.skin.startLoading();

    // if we're showing for the first time, force show
    if (!this.is("resize-to-content")) {
      this.position();
      this.raise();
      this._show();
    }
  },

  stopLoading: function() {
    // make sure the tooltip is build, otherwise there won't be a skin
    this.build();

    this.is("loading", false);

    if (!this.options.spinner) return;

    this._tooltip.removeClass("tpd-is-loading");

    this.skin.stopLoading();
  },

  // abort
  abort: function() {
    this.abortAjax();
    this.abortSanitize();
    this.is("refreshed-before-sanitized", false);
  },

  abortSanitize: function() {
    if (this._cache.voila) {
      this._cache.voila.abort();
      this._cache.voila = null;
    }
  },

  abortAjax: function() {
    if (this._cache.xhr) {
      this._cache.xhr.abort();
      this._cache.xhr = null;
      this.is("updated", false);
      this.is("updating", false);
    }
  },

  update: function(callback) {
    if (this.is("updating")) return;

    // mark as updating
    this.is("updating", true);

    this.build();

    var type = this.options.inline
      ? "inline"
      : this.options.ajax
      ? "ajax"
      : _.isElement(this.content) ||
        _.isText(this.content) ||
        _.isDocumentFragment(this.content)
      ? "element"
      : this._fn
      ? "function"
      : "html";

    // it could be that when we update the element that it gets so much content that it overlaps the current mouse position
    // for just a few ms, enough to trigger a mouseleave event. To work around this we hide the tooltip if it was visible.
    // hide the content container while updating, using visibility instead of display to work around
    // issues with scripts that depend on display
    this._contentWrapper.css({ visibility: "hidden" });

    // from here we go into routes that should always return a prepared element to be inserted
    switch (type) {
      case "html":
      case "element":
      case "inline":
        // if we've already updated, just forward to the callback
        if (this.is("updated")) {
          if (callback) callback();
          return;
        }

        this._update(this.content, callback);
        break;

      case "function":
        if (this.is("updated")) {
          if (callback) callback();
          return;
        }

        var updateWith = this._fn(this.element);

        // if there's nothing to update with, abort
        if (!updateWith) {
          this.is("updating", false);
          if (callback) callback(true); // true means aborted in this case
          return;
        }

        this._update(updateWith, callback);
        break;

      case "ajax":
        var ajaxOptions = this.options.ajax || {};

        var url = ajaxOptions.url || this.__content,
          data = ajaxOptions.data || {},
          type = ajaxOptions.type || "GET", // jQuery default
          dataType = ajaxOptions.dataType;

        var initialOptions = { url: url, data: data };
        if (type) $.extend(initialOptions, { type: type }); // keep jQuery initial type intact
        if (dataType) $.extend(initialOptions, { dataType: dataType }); // keep intelligent guess intact

        // merge initial options with given
        var options = $.extend({}, initialOptions, ajaxOptions);

        // remove method from the request, we want to use type only to support jQuery 1.9-
        if (options.method) {
          options = $.extend({}, options);
          delete options.method;
        }

        // make sure there are callbacks
        $.each(
          "complete error success".split(" "),
          $.proxy(function(i, cb) {
            if (!options[cb]) {
              if (cb === "success") {
                // when no success callback is given create a callback that sets
                // the responseText as content, otherwise we use the given one
                options[cb] = function(data, textStatus, jqXHR) {
                  return jqXHR.responseText;
                };
              } else {
                // for every other callback use an empty one
                options[cb] = function() {};
              }
            }

            options[cb] = _.wrap(
              options[cb],
              $.proxy(function(proceed) {
                var args = _slice.call(arguments, 1),
                  jqXHR = $.type(args[0] === "object") ? args[0] : args[2]; // success callback has jqXHR as 3th arg, complete and error as 1st

                // don't store aborts
                if (jqXHR.statusText && jqXHR.statusText === "abort") return;

                // we should cache each individual callback here and make that fetchable
                if (this.options.cache) {
                  AjaxCache.set(
                    {
                      url: options.url,
                      type: options.type,
                      data: options.data
                    },
                    cb,
                    args
                  );
                }

                this._cache.xhr = null;

                // proceed is the callback at this point (complete/success/error)
                // we expect it's return value to hold the value to update the tooltip with
                var updateWith = proceed.apply(this, args);
                if (updateWith) {
                  this._update(updateWith, callback);
                }
              }, this)
            );
          }, this)
        );

        // try cache first, for entries that have previously been successful
        var entry;
        if (
          this.options.cache &&
          (entry = AjaxCache.get(options)) &&
          entry.callbacks.success
        ) {
          // if there is a cache, still call success and complete, but clear out the api
          $.each(
            entry.callbacks,
            $.proxy(function(cb, args) {
              if ($.type(options[cb]) === "function") {
                options[cb].apply(this, args);
              }
            }, this)
          );

          // stop here and avoid the request
          return;
        }

        // first check cache for possible update object and avoid load if we have one
        this.startLoading();

        this._cache.xhr = $.ajax(options);

        break;
    }
  },

  _update: function(content, callback) {
    // defaults
    var data = {
      title: this.options.title,
      close: this.options.close
    };

    if (
      $.type(content) === "string" ||
      _.isElement(content) ||
      _.isText(content) ||
      _.isDocumentFragment(content) ||
      content instanceof $
    ) {
      data.content = content;
    } else {
      $.extend(data, content);
    }

    var content = data.content,
      title = data.title,
      close = data.close;

    // store the new content, title and close so dimension/positioning functions can work with it
    this.content = content;
    this.title = title;
    this.close = close;

    // create a marker for when the content is an element attached to the DOM
    this.createElementMarker();

    // make sure the content is visible
    if (_.isElement(content) || content instanceof $) {
      $(content).show();
    }

    // append instantly
    this._content.html(this.content);

    this._title.html(title && $.type(title) === "string" ? title : "");
    this._titleWrapper[title ? "show" : "hide"]();
    this._close[
      (this.title || this.options.title) && close ? "show" : "hide"
    ]();

    var hasInnerClose = close && !(this.options.title || this.title),
      hasInnerCloseNonOverlap =
        close && !(this.options.title || this.title) && close !== "overlap",
      hasTitleCloseNonOverlap =
        close && (this.options.title || this.title) && close !== "overlap";
    this._inner_close[hasInnerClose ? "show" : "hide"]();
    this._tooltip[(hasInnerCloseNonOverlap ? "add" : "remove") + "Class"](
      "tpd-has-inner-close"
    );
    this._tooltip[(hasTitleCloseNonOverlap ? "add" : "remove") + "Class"](
      "tpd-has-title-close"
    );

    // possible remove padding
    this._content[(this.options.padding ? "remove" : "add") + "Class"](
      "tpd-content-no-padding"
    );

    this.finishUpdate(callback);
  },

  sanitize: function(callback) {
    // if the images loaded plugin isn't loaded, just callback
    if (
      !this.options.voila || // also callback on manual disable
      this._content.find("img").length < 1 // or when no images need preloading
    ) {
      this.is("sanitized", true);
      if (callback) callback();
      return;
    }

    // Voila uses img.complete and polling to detect if an image loaded
    // but if the src of an image is changed, complete will still be true
    // even as it's loading a new source. so we have to fallback to onload
    // to allow for src updates.
    this._cache.voila = Voila(
      this._content,
      { method: "onload" },
      $.proxy(function(instance) {
        // mark images as sanitized so we can avoid sanitizing them again
        // for an instant refresh() later
        this._markImagesAsSanitized(instance.images);

        if (this.is("refreshed-before-sanitized")) {
          this.is("refreshed-before-sanitized", false);
          this.sanitize(callback);
        } else {
          // finish up
          this.is("sanitized", true);
          if (callback) callback();
        }
      }, this)
    );
  },

  // expects a voila.image instance
  _markImagesAsSanitized: function(images) {
    $.each(images, function(i, image) {
      var img = image.img;
      $(img).data("completed-src", image.img.src);
    });
  },

  _hasAllImagesSanitized: function() {
    var sanitizedAll = true;

    // as soon as we find one image that isn't sanitized
    // or sanitized based on the wrong source we
    // have to sanitize again
    this._content.find("img").each(function(i, img) {
      var completedSrc = $(img).data("completed-src");
      if (!(completedSrc && img.src === completedSrc)) {
        sanitizedAll = false;
        return false;
      }
    });

    return sanitizedAll;
  },

  refresh: function() {
    if (!this.visible()) return;

    // avoid refreshing while sanitize() still needs to finish up
    if (!this.is("sanitized")) {
      // mark the need to re-sanitize
      this.is("refreshed-before-sanitized", true);

      return;
    }

    // mark as refreshing
    this.is("refreshing", true);

    // clear potential timers
    this.clearTimer("refresh-spinner");

    if (
      !this.options.voila ||
      this._content.find("img").length < 1 ||
      this._hasAllImagesSanitized()
    ) {
      // still use should-update-dimensions because text could also have updated
      this.is("should-update-dimensions", true);

      this.position();
      this.is("refreshing", false);
    } else {
      // mark as unsanitized so we sanitize again even after a hide
      this.is("sanitized", false);

      this._contentWrapper.css({ visibility: "hidden" });

      this.startLoading();

      this.sanitize(
        $.proxy(function() {
          this._contentWrapper.css({ visibility: "visible" });

          this.stopLoading();

          // set the update dimensions marker again since a position() call
          // on mousemove during refresh could have caused it to be unset
          this.is("should-update-dimensions", true);

          this.position();
          this.is("refreshing", false);
        }, this)
      );
    }
  },

  finishUpdate: function(callback) {
    this.is("updated", true);
    this.is("updating", false);

    if ($.type(this.options.afterUpdate) === "function") {
      // make sure visibility is visible during this
      var isHidden = this._contentWrapper.css("visibility");
      if (isHidden) this._contentWrapper.css({ visibility: "visible" });

      this.options.afterUpdate(this._content[0], this.element);

      if (isHidden) this._contentWrapper.css({ visibility: "hidden" });
    }

    if (callback) callback();
  }
});

$.extend(Tooltip.prototype, {
  clearUpdatedTo: function() {
    this._cache.updatedTo = {};
  },

  updateDimensionsToContent: function(targetPosition, stemPosition) {
    this.skin.build(); // skin has to be build at this point

    var isLoading = this.is("loading");
    var updatedTo = this._cache.updatedTo;

    if (
      !this._maxWidthPass &&
      !this.is("api") && // API calls always update
      //&& !this.is('refreshing')
      !this.is("should-update-dimensions") && // when this marker is set always update
      updatedTo.stemPosition === stemPosition &&
      updatedTo.loading === isLoading
    ) {
      return;
    }

    // always exit if we're loading and need to resize to content
    // the spinner will only change class at that point, while we stay
    // at old dimensions, so no need to do any further checks
    if (isLoading && this.is("resize-to-content")) {
      return;
    }

    // store so we can avoid duplicate updates
    this._cache.updatedTo = {
      type: this.is("resize-to-content") ? "content" : "spinner",
      loading: this.is("loading"),
      stemPosition: stemPosition
    };

    // if the should-update-dimensions flag was set
    // unset it since we're updating now
    if (this.is("should-update-dimensions")) {
      this.is("should-update-dimensions", false);
    }

    // actual updating from here
    targetPosition = targetPosition || this.options.position.target;
    stemPosition = stemPosition || this.options.position.tooltip;
    var side = Position.getSide(stemPosition);
    var orientation = Position.getOrientation(stemPosition);
    var border = this.skin._css.border;
    var borderPx = border + "px ";

    // set measure class before measuring
    this._tooltip.addClass("tpd-tooltip-measuring");
    var style = this._tooltip.attr("style");
    this._tooltip.removeAttr("style");

    var paddings = { top: border, right: border, bottom: border, left: border };

    // Add extra padding
    // if there's a stem and we're positioning to the side we might have to add some extra padding to the left
    var padding = 0;

    // if the stem orientation is vertical we might have to add extra padding
    if (Position.getOrientation(stemPosition) === "vertical") {
      // change the padding of the active side that of stemHeight
      if (this.options.stem) {
        paddings[side] = this.skin[
          "stem_" + side
        ].getMath().dimensions.outside.height;
      }

      // seems like a cheesy way to fix the mouse correction problem, but it works!
      var room = this.getMouseRoom();
      if (room[Position._flip[side]]) {
        paddings[side] += room[Position._flip[side]];
      }

      var containmentLayout = this.getContainmentLayout(stemPosition);
      var paddingLine = this.getPaddingLine(targetPosition);
      var addPadding = false;

      // if one of the points is within the box no need to check for intersection
      if (
        Position.isPointWithinBoxLayout(
          paddingLine.x1,
          paddingLine.y1,
          containmentLayout
        ) ||
        Position.isPointWithinBoxLayout(
          paddingLine.x2,
          paddingLine.y2,
          containmentLayout
        )
      ) {
        addPadding = true;
      } else {
        var intersects = false;
        $.each(
          "top right bottom left".split(" "),
          $.proxy(function(i, s) {
            var line = this.getSideLine(containmentLayout, s);

            if (
              Position.intersectsLine(
                paddingLine.x1,
                paddingLine.y1,
                paddingLine.x2,
                paddingLine.y2,
                line.x1,
                line.y1,
                line.x2,
                line.y2
              )
            ) {
              addPadding = true;
              return false;
            }
          }, this)
        );
      }

      if (addPadding) {
        // now if the stem is on the right we should add padding to that same side
        // so do that for left as well
        if (side === "left") {
          padding = paddingLine.x1 - containmentLayout.position.left;
        } else {
          padding =
            containmentLayout.position.left +
            containmentLayout.dimensions.width -
            paddingLine.x1;
        }

        paddings[side] += padding;
      }
    }

    // there can be added offset that requires extra padding
    if (this.options.offset) {
      if (orientation === "vertical") {
        var offset = Position.adjustOffsetBasedOnPosition(
          this.options.offset,
          this.options.position.target,
          targetPosition
        );

        if (offset.x !== 0) {
          paddings.right += Math.abs(offset.x);
        }
      }
    }

    // same thing for containment padding
    var padding;
    if (
      this.options.containment &&
      (padding = this.options.containment.padding)
    ) {
      $.each(paddings, function(name, value) {
        paddings[name] += padding;
      });

      // corrections: whenever the stem is on the side remove containment padding there
      if (orientation === "vertical") {
        // left/right
        paddings[side === "left" ? "left" : "right"] -= padding;
      } else {
        // top/bottom
        paddings[side === "top" ? "top" : "bottom"] -= padding;
      }
    }

    var viewport = Bounds.viewport();

    var hasInnerClose = this.close && this.close !== "overlap" && !this.title;

    var innerCloseDimensions = { width: 0, height: 0 };
    if (hasInnerClose) {
      innerCloseDimensions = this._innerCloseDimensions || {
        width: this._inner_close.outerWidth(true),
        height: this._inner_close.outerHeight(true)
      };
      this._innerCloseDimensions = innerCloseDimensions;
    }

    this._contentRelativePadder.css({
      "padding-right": innerCloseDimensions.width
    });

    this._contentSpacer.css({
      width: viewport.width - paddings.left - paddings.right
    });

    // first measure the dimensions
    var contentDimensions = {
      width: this._content.innerWidth() + innerCloseDimensions.width,
      height: Math.max(
        this._content.innerHeight(),
        innerCloseDimensions.height || 0
      )
    };

    var titleDimensions = { width: 0, height: 0 };

    // add title height if title or closebutton
    if (this.title) {
      var closeDimensions = { width: 0, height: 0 };

      this._titleWrapper.add(this._titleSpacer).css({
        width: "auto",
        height: "auto"
      });

      // measure close dimensions
      if (this.close && this.close !== "overlap") {
        //  || this.title
        closeDimensions = {
          width: this._close.outerWidth(true),
          height: this._close.outerHeight(true)
        };
        this._close.hide();
      }

      // There is a problem when maxWidth is set but when the element inserted as content has a larger fixed width
      // the title will be measured using the smaller maxWidth but it'll appear inside a larger area, making it only partially filled
      // to avoid this we use the max of maxWidth and content width in the second pass
      if (
        this._maxWidthPass &&
        contentDimensions.width > this.options.maxWidth
      ) {
        this._titleRelative.css({ width: contentDimensions.width });
      }

      // set padding on the spacer
      this._titleRelativePadder.css({ "padding-right": closeDimensions.width });

      // measure title border bottom
      var titleBorderBottom = parseFloat(
        this._titleWrapper.css("border-bottom-width")
      );

      // title dimensions
      titleDimensions = {
        width: this.title ? this._titleWrapper.innerWidth() : 0,
        height: Math.max(
          this.title ? this._titleWrapper.innerHeight() + titleBorderBottom : 0,
          closeDimensions.height + titleBorderBottom
        )
      };

      // make responsive
      if (
        titleDimensions.width >
        viewport.width - paddings.left - paddings.right
      ) {
        titleDimensions.width = viewport.width - paddings.left - paddings.right;

        this._titleSpacer.css({
          width: titleDimensions.width // - closeDimensions.width
        });

        titleDimensions.height = Math.max(
          this.title ? this._titleWrapper.innerHeight() + titleBorderBottom : 0,
          closeDimensions.height + titleBorderBottom
        );
      }

      contentDimensions.width = Math.max(
        titleDimensions.width,
        contentDimensions.width
      );
      contentDimensions.height += titleDimensions.height;

      // fixate the height since we're measuring it below
      // using innerHeight here cause we don't want to increase by the border
      this._titleWrapper.css({
        height: Math.max(
          this.title ? this._titleWrapper.innerHeight() : 0,
          closeDimensions.height
        )
      });

      if (this.close) {
        this._close.show();
      }
    }

    if (this.options.stem) {
      // min width/height
      var wh = orientation === "vertical" ? "height" : "width";
      var stemMath = this.skin["stem_" + side].getMath();
      var stemZ = stemMath.outside.width + 2 * this.skin._css.radius;

      if (contentDimensions[wh] < stemZ) {
        contentDimensions[wh] = stemZ;
      }
    }

    this._contentSpacer.css({ width: contentDimensions.width });

    if (
      contentDimensions.height !==
      Math.max(this._content.innerHeight(), innerCloseDimensions.height) +
        (this.title ? this._titleRelative.outerHeight() : 0)
    ) {
      contentDimensions.width++;
    }

    if (!this.is("resize-to-content")) {
      contentDimensions = this.skin._css.spinner.dimensions;
    }

    this.setDimensions(contentDimensions);

    // reset the spacing to the correct one, that of the border
    paddings = { top: border, right: border, bottom: border, left: border };
    if (this.options.stem) {
      var stemSide = Position.getSide(stemPosition);
      paddings[
        stemSide
      ] = this.skin.stem_top.getMath().dimensions.outside.height;
    }

    this._contentSpacer.css({
      "margin-top": paddings.top,
      "margin-left": +paddings.left,
      width: contentDimensions.width
    });

    if (this.title || this.close) {
      // if there's no close button, still show it while measuring
      this._titleWrapper.css({
        height: this._titleWrapper.innerHeight(),
        width: contentDimensions.width
      });
    }

    this._tooltip.removeClass("tpd-tooltip-measuring");
    this._tooltip.attr("style", style);

    // maxWidth
    var relatives = this._contentRelative.add(this._titleRelative);
    if (
      this.options.maxWidth &&
      contentDimensions.width > this.options.maxWidth &&
      !this._maxWidthPass &&
      this.is("resize-to-content")
    ) {
      relatives.css({ width: this.options.maxWidth });
      this._maxWidthPass = true;
      this.updateDimensionsToContent(targetPosition, stemPosition);
      this._maxWidthPass = false;
      relatives.css({ width: "auto" });
    }
  },

  setDimensions: function(dimensions) {
    this.skin.setDimensions(dimensions);
  },

  // return how much space we have around the target within the containment
  getContainmentSpace: function(stemPosition, ignorePadding) {
    var containmentLayout = this.getContainmentLayout(
      stemPosition,
      ignorePadding
    );
    var targetLayout = this.getTargetLayout();

    var tpos = targetLayout.position,
      tdim = targetLayout.dimensions,
      cpos = containmentLayout.position,
      cdim = containmentLayout.dimensions;

    var space = {
      top: Math.max(tpos.top - cpos.top, 0),
      bottom: Math.max(cpos.top + cdim.height - (tpos.top + tdim.height), 0),
      left: Math.max(tpos.left - cpos.left, 0),
      right: Math.max(cpos.left + cdim.width - (tpos.left + tdim.width), 0)
    };

    // we might have to subtract some more
    if (tpos.top > cpos.top + cdim.height) {
      space.top -= tpos.top - (cpos.top + cdim.height);
    }
    if (tpos.top + tdim.height < cpos.top) {
      space.bottom -= cpos.top - (tpos.top + tdim.height);
    }
    if (
      tpos.left > cpos.left + cdim.width &&
      cpos.left + cdim.width >= tpos.left
    ) {
      space.left -= tpos.left - (cpos.left + cdim.width);
    }
    if (tpos.left + tdim.width < cpos.left) {
      space.right -= cpos.left - (tpos.left + tdim.width);
    }

    this._cache.layouts.containmentSpace = space;

    return space;
  },

  position: function(event) {
    // this function could be called on mousemove with target: 'mouse',
    // prevent repositioning while the tooltip isn't visible yet / unattached
    // it will be positioned initially by show()
    if (!this.visible()) {
      return;
    }

    this.is("positioning", true);

    // first clear the layouts cache, otherwise we might be working with cached positions/dimensions/layouts
    this._cache.layouts = {};

    var _d = this._cache.dimensions; // for onResize callback

    var initialTargetPosition = this.options.position.target,
      initialStemPosition = this.options.position.tooltip,
      stemPosition = initialStemPosition,
      targetPosition = initialTargetPosition;

    this.updateDimensionsToContent(targetPosition, stemPosition);

    var initialPosition = this.getPositionBasedOnTarget(
      targetPosition,
      stemPosition
    );
    var position = deepExtend(initialPosition);

    var results = [];

    if (this.options.containment) {
      var newPositions = {};
      // check if at least one side is contained
      var oneSideContained = false;
      var containmentSides = {};
      $.each(
        "top right bottom left".split(" "),
        $.proxy(function(i, side) {
          if (
            (containmentSides[side] = this.isSideWithinContainment(
              side,
              stemPosition,
              true
            ))
          ) {
            // true ignored padding
            oneSideContained = true;
          }
        }, this)
      );

      // if no side is contained, fake a containment so we instantly position based on initial position
      if (!oneSideContained) {
        position.contained = true;
      }

      if (position.contained) {
        // if no side is contained we can just use this initial position as a fallback
        this.setPosition(position);
      } else {
        // store previous result
        results.unshift({
          position: position,
          targetPosition: targetPosition,
          stemPosition: stemPosition
        });

        // flip the target
        var inversedTarget = Position.flip(initialTargetPosition);
        targetPosition = inversedTarget;
        stemPosition = Position.flip(initialStemPosition);

        // if this side is contained we can try positioning it, otherwise fake uncontained
        if (containmentSides[Position.getSide(targetPosition)]) {
          this.updateDimensionsToContent(targetPosition, stemPosition);
          position = this.getPositionBasedOnTarget(
            targetPosition,
            stemPosition
          );
        } else {
          position.contained = false;
        }

        if (position.contained) {
          this.setPosition(position, stemPosition);
        } else {
          // store previous result
          results.unshift({
            position: position,
            targetPosition: targetPosition,
            stemPosition: stemPosition
          });

          // the origin point we'll be working with for the target is either the last set position or its initial position
          // this allows a tooltip that was previously flipped to become connected to the correct nearest point on the side
          var originTargetPosition = initialTargetPosition;

          // find out how much space we have on either side of the target
          // we ignore padding here since the passed in stemPosition here isn't the correct one, the one below is
          // what we want is just to figure out what has the most visible space within the containment area
          var space = this.getContainmentSpace(stemPosition, true); // ignore padding

          var newMinPos =
            Position.getOrientation(originTargetPosition) === "horizontal"
              ? ["left", "right"]
              : ["top", "bottom"];
          var newSide;
          if (space[newMinPos[0]] === space[newMinPos[1]]) {
            newSide =
              Position.getOrientation(originTargetPosition) === "horizontal"
                ? "left"
                : "top";
          } else {
            newSide =
              newMinPos[space[newMinPos[0]] > space[newMinPos[1]] ? 0 : 1];
          }

          var newCorner = Position.split(originTargetPosition)[1];
          var newTargetPosition = newSide + newCorner;

          var newStemPosition = Position.flip(newTargetPosition);

          targetPosition = newTargetPosition;
          stemPosition = newStemPosition;

          // if this side is contained we can try positioning it, otherwise fake uncontained
          if (containmentSides[Position.getSide(targetPosition)]) {
            this.updateDimensionsToContent(targetPosition, stemPosition);
            position = this.getPositionBasedOnTarget(
              targetPosition,
              stemPosition
            );
          } else {
            position.contained = false;
          }

          if (position.contained) {
            this.setPosition(position, stemPosition);
          } else {
            // store previous result
            results.unshift({
              position: position,
              targetPosition: targetPosition,
              stemPosition: stemPosition
            });

            // the fallback should be the result with the least negative positions
            var fallback;

            // since the array is reversed using unshift we start at the last position working back
            var negatives = [];
            $.each(results, function(i, result) {
              if (result.position.top >= 0 && result.position.left >= 0) {
                fallback = result;
              } else {
                // measure negativity based on how large the negative area is
                var ntop =
                    result.position.top >= 0
                      ? 1
                      : Math.abs(result.position.top),
                  nleft =
                    result.position.left >= 0
                      ? 1
                      : Math.abs(result.position.left);

                negatives.push({ result: result, negativity: ntop * nleft });
              }
            });

            // if we haven't found a fallback yet, go through the negatives to find the least negative one
            if (!fallback) {
              // start with the initial position
              var leastNegative = negatives[negatives.length - 1];

              // check all others to see if we can find a better one
              $.each(negatives, function(i, negative) {
                if (negative.negativity < leastNegative.negativity) {
                  leastNegative = negative;
                }
              });

              fallback = leastNegative.result;
            }

            // fallback
            this.updateDimensionsToContent(
              fallback.targetPosition,
              fallback.stemPosition,
              true
            );
            this.setPosition(fallback.position, fallback.stemPosition);
          }
        }
      }
    } else {
      // now set the position
      this.setPosition(position);
    }

    // onResize, we keep track of the dimensions in cache here
    this._cache.dimensions = this.skin._vars.dimensions;

    this.skin.paint();

    this.is("positioning", false);
  },

  getPositionBasedOnTarget: function(targetPosition, stemPosition) {
    stemPosition = stemPosition || this.options.position.tooltip;

    var dimensions = this.getTargetDimensions();

    var connection = { left: 0, top: 0 },
      max = { left: 0, top: 0 };

    var side = Position.getSide(targetPosition);
    var skinVars = this.skin._vars;
    var frame = skinVars.frames[Position.getSide(stemPosition)];

    var orientation = Position.getOrientation(targetPosition);
    var split = Position.split(targetPosition);
    var half;

    if (orientation === "horizontal") {
      // top/bottom
      half = Math.floor(dimensions.width * 0.5);

      switch (split[2]) {
        case "left":
          max.left = half;
          break;
        case "middle":
          //connection.x = dimensions.width - half;
          connection.left = dimensions.width - half; // we could instead ceil here
          max.left = connection.left;
          break;
        case "right":
          connection.left = dimensions.width;
          max.left = dimensions.width - half;
          break;
      }

      if (split[1] === "bottom") {
        connection.top = dimensions.height;
        max.top = dimensions.height;
      }
    } else {
      // left/right
      half = Math.floor(dimensions.height * 0.5);

      switch (split[2]) {
        case "top":
          max.top = half;
          break;
        case "middle":
          connection.top = dimensions.height - half;
          max.top = connection.top;
          break;
        case "bottom":
          max.top = dimensions.height - half;
          connection.top = dimensions.height;
          break;
      }

      if (split[1] === "right") {
        connection.left = dimensions.width;
        max.left = dimensions.width;
      }
    }

    // Align actual tooltip
    var targetOffset = this.getTargetPosition();

    var target = $.extend({}, dimensions, {
      top: targetOffset.top,
      left: targetOffset.left,
      connection: connection,
      max: max
    });

    var tooltip = {
      width: frame.dimensions.width,
      height: frame.dimensions.height,
      top: 0,
      left: 0,
      connection: skinVars.connections[stemPosition].connection,
      stem: skinVars.connections[stemPosition].stem
    };

    // Align the tooltip
    // first move the top/left to the connection of the target
    tooltip.top = target.top + target.connection.top;
    tooltip.left = target.left + target.connection.left;

    // now move it back by the connection on the tooltip to align it
    tooltip.top -= tooltip.connection.top;
    tooltip.left -= tooltip.connection.left;

    // now find out if the stem is within connection
    if (this.options.stem) {
      var stemWidth = skinVars.stemDimensions.width;
      var positions = {
        stem: {
          top: tooltip.top + tooltip.stem.connection.top,
          left: tooltip.left + tooltip.stem.connection.left
        },
        connection: {
          top: target.top + target.connection.top,
          left: target.left + target.connection.left
        },
        max: {
          top: target.top + target.max.top,
          left: target.left + target.max.left
        }
      };

      if (
        !Position.isPointWithinBox(
          positions.stem.left,
          positions.stem.top,
          positions.connection.left,
          positions.connection.top,
          positions.max.left,
          positions.max.top
        )
      ) {
        // align the stem with the nearest connection point on the target
        var positions = {
          stem: {
            top: tooltip.top + tooltip.stem.connection.top,
            left: tooltip.left + tooltip.stem.connection.left
          },
          connection: {
            top: target.top + target.connection.top,
            left: target.left + target.connection.left
          },
          max: {
            top: target.top + target.max.top,
            left: target.left + target.max.left
          }
        };

        var distances = {
          connection: Position.getDistance(
            positions.stem.left,
            positions.stem.top,
            positions.connection.left,
            positions.connection.top
          ),
          max: Position.getDistance(
            positions.stem.left,
            positions.stem.top,
            positions.max.left,
            positions.max.top
          )
        };

        // closest distance
        var distance = Math.min(distances.connection, distances.max);
        var closest =
          positions[
            distances.connection <= distances.max ? "connection" : "max"
          ];

        // find out on which axis the distance is
        var axis =
          Position.getOrientation(stemPosition) === "horizontal"
            ? "left"
            : "top";
        var closestToMax = Position.getDistance(
          positions.connection.left,
          positions.connection.top,
          positions.max.left,
          positions.max.top
        );

        if (stemWidth <= closestToMax) {
          // shift normally
          var moveToClosest = { top: 0, left: 0 };

          // the movement is on the corresponding axis, by a negative or positive margin, so inverse when needed
          var inversed = closest[axis] < positions.stem[axis] ? -1 : 1;
          moveToClosest[axis] = distance * inversed;

          // can we access stem width here
          moveToClosest[axis] += Math.floor(stemWidth * 0.5) * inversed;

          tooltip.left += moveToClosest.left;
          tooltip.top += moveToClosest.top;
        } else {
          // shift to center which is either closest or max
          // to find out which we calculate the distance to the center of the target
          $.extend(positions, {
            center: {
              top: Math.round(target.top + dimensions.height * 0.5),
              left: Math.round(target.left + dimensions.left * 0.5)
            }
          });

          var distancesToCenter = {
            connection: Position.getDistance(
              positions.center.left,
              positions.center.top,
              positions.connection.left,
              positions.connection.top
            ),
            max: Position.getDistance(
              positions.center.left,
              positions.center.top,
              positions.max.left,
              positions.max.top
            )
          };

          var distance =
            distances[
              distancesToCenter.connection <= distancesToCenter.max
                ? "connection"
                : "max"
            ];

          var moveToCenter = { top: 0, left: 0 };

          // the movement is on the corresponding axis, by a negative or positive margin, so inverse when needed
          var inversed = closest[axis] < positions.stem[axis] ? -1 : 1;
          moveToCenter[axis] = distance * inversed;

          tooltip.left += moveToCenter.left;
          tooltip.top += moveToCenter.top;
        }
      }
    }

    // now add offset
    if (this.options.offset) {
      var offset = $.extend({}, this.options.offset);
      offset = Position.adjustOffsetBasedOnPosition(
        offset,
        this.options.position.target,
        targetPosition
      );
      tooltip.top += offset.y;
      tooltip.left += offset.x;
    }

    // store a containment
    var containment = this.getContainment(
      {
        top: tooltip.top,
        left: tooltip.left
      },
      stemPosition
    );

    var contained = containment.horizontal && containment.vertical;
    var shift = { x: 0, y: 0 }; // movement of the stem

    // we can only correct the stem on the tooltip, so check for containment in its orientation
    var stemOrientation = Position.getOrientation(stemPosition);

    if (!containment[stemOrientation]) {
      var isHorizontalStem = stemOrientation === "horizontal",
        movements = isHorizontalStem ? ["left", "right"] : ["up", "down"],
        correctionDirection = isHorizontalStem ? "x" : "y",
        correctionDirectionTL = isHorizontalStem ? "left" : "top",
        correctPx = containment.correction[correctionDirection];

      // we need to find the negative space threshold
      var containmentLayout = this.getContainmentLayout(stemPosition),
        negativeSpaceThreshold =
          containmentLayout.position[isHorizontalStem ? "left" : "top"]; // used to be 0 but containment padding makes this variable

      if (correctPx !== 0) {
        // we can't correct by 0
        var allowedShift = skinVars.connections[stemPosition].move;
        var allowedShiftPx =
          allowedShift[movements[correctPx * -1 < 0 ? 0 : 1]];
        var multiplier = correctPx < 0 ? -1 : 1;

        if (
          allowedShiftPx >= correctPx * multiplier && // when enough allowed movement
          tooltip[correctionDirectionTL] + correctPx >= negativeSpaceThreshold
        ) {
          tooltip[correctionDirectionTL] += correctPx;
          shift[correctionDirection] = correctPx * -1;

          // now mark as contained
          contained = true;
        } else if (
          Position.getOrientation(targetPosition) ===
          Position.getOrientation(stemPosition)
        ) {
          // STEM + TOOLTIP SHIFT:
          // max shift
          tooltip[correctionDirectionTL] += allowedShiftPx * multiplier;
          shift[correctionDirection] = allowedShiftPx * multiplier * -1;

          // if we've moved into negative space we should apply a correction
          if (tooltip[correctionDirectionTL] < negativeSpaceThreshold) {
            var backPx =
              negativeSpaceThreshold - tooltip[correctionDirectionTL];

            // movement back should still be in allowed range
            // we can't move further back than the tooltip allows in total shift
            var maxBackPx =
              allowedShift[movements[0]] + allowedShift[movements[1]];
            backPx = Math.min(backPx, maxBackPx);

            // only shift the tooltip since it's already maxed out on stem shift
            tooltip[correctionDirectionTL] += backPx;

            // we can shift the stem but not beyond the maximum
            var shiftStemResult = shift[correctionDirection] - backPx;
            if (
              shiftStemResult >=
                skinVars.connections[stemPosition].move[movements[0]] &&
              shiftStemResult <=
                skinVars.connections[stemPosition].move[movements[1]]
            ) {
              shift[correctionDirection] -= backPx; // needed because otherwise the correction on the tooltip could make the stem seem disconnected
            }
          }

          // adjust containment so we can get the correct remaining correction
          containment = this.getContainment(
            {
              top: tooltip.top,
              left: tooltip.left
            },
            stemPosition
          );

          var stillRequiredPx = containment.correction[correctionDirection];

          // for these calculations we require the tooltip position without offset, adding it back later on
          var tooltipWithoutOffset = deepExtend({}, tooltip);

          if (this.options.offset) {
            tooltipWithoutOffset.left -= this.options.offset.x;
            tooltipWithoutOffset.top -= this.options.offset.y;
          }

          var positions = {
            stem: {
              top: tooltipWithoutOffset.top + tooltip.stem.connection.top,
              left: tooltipWithoutOffset.left + tooltip.stem.connection.left
            }
          };
          positions.stem[correctionDirectionTL] += shift[correctionDirection];

          var targetLayout = this.getTargetLayout();
          var stemWidth = skinVars.stemDimensions.width;
          var halfStemWidth = Math.floor(stemWidth * 0.5);
          // the containment threshold on the other side of the negative threshold, we call it positive but it's also sort of a negative
          // used to measure overflow on the right/bottom
          var positiveSpaceThreshold =
            negativeSpaceThreshold +
            containmentLayout.dimensions[isHorizontalStem ? "width" : "height"];

          if (correctionDirection === "x") {
            // find possible x
            var x = targetLayout.position.left + halfStemWidth;
            if (stillRequiredPx > 0) {
              // find leftmost
              x += targetLayout.dimensions.width - halfStemWidth * 2;
            }

            // move the tooltip and stem as far as needed and possible.
            // as far as what's possible on the stem, we allow movement from half a stem width to half a stem width on the other end of the tooltip.
            // the last check on each line is a guard against containment padding.
            if (
              (stillRequiredPx < 0 &&
                positions.stem.left + stillRequiredPx >= x &&
                tooltipWithoutOffset.left + stillRequiredPx >=
                  negativeSpaceThreshold) || // left
              (stillRequiredPx > 0 &&
                positions.stem.left + stillRequiredPx <= x &&
                tooltipWithoutOffset.left + stillRequiredPx <=
                  positiveSpaceThreshold) // right
            ) {
              tooltipWithoutOffset.left += stillRequiredPx;
            }
          } else {
            // possible y
            var y = targetLayout.position.top + halfStemWidth;
            if (stillRequiredPx > 0) {
              // find leftmost
              y += targetLayout.dimensions.height - halfStemWidth * 2;
            }

            // now see if the adjustment is possible
            if (
              (stillRequiredPx < 0 &&
                positions.stem.top + stillRequiredPx >= y &&
                tooltipWithoutOffset.top + stillRequiredPx >=
                  negativeSpaceThreshold) || // top
              (stillRequiredPx > 0 &&
                positions.stem.top + stillRequiredPx <= y &&
                tooltipWithoutOffset.top + stillRequiredPx <=
                  positiveSpaceThreshold) // bottom
            ) {
              tooltipWithoutOffset.top += stillRequiredPx;
            }
          }

          // add back the offset
          tooltip = tooltipWithoutOffset;
          if (this.options.offset) {
            tooltip.left += this.options.offset.x;
            tooltip.top += this.options.offset.y;
          }
        }
      }

      // now it could be that we've moved the tooltip into containment on one side but out of it in the other, to check against this, adjust again
      containment = this.getContainment(
        { top: tooltip.top, left: tooltip.left },
        stemPosition
      );
      contained = containment.horizontal && containment.vertical;
    }

    return {
      top: tooltip.top,
      left: tooltip.left,
      contained: contained,
      shift: shift
    };
  },

  setPosition: function(position, stemPosition) {
    var _p = this._position;

    if (!(_p && _p.top === position.top && _p.left === position.left)) {
      // handle a different container
      var container;
      if (this.options.container !== document.body) {
        if ($.type(this.options.container) === "string") {
          var target = this.target;
          if (target === "mouse") {
            target = this.element;
          }

          container = $(
            $(target)
              .closest(this.options.container)
              .first()
          );
        } else {
          container = $(container);
        }

        // we default to document body, if nothing was found
        // so only use this is we actually have an element
        if (container[0]) {
          var _offset = $(container).offset(),
            offset = {
              top: Math.round(_offset.top),
              left: Math.round(_offset.left)
            },
            scroll = {
              top: Math.round($(container).scrollTop()),
              left: Math.round($(container).scrollLeft())
            };

          position.top -= offset.top;
          position.top += scroll.top;
          position.left -= offset.left;
          position.left += scroll.left;
        }
      }

      this._position = position;

      this._tooltip.css({
        top: position.top,
        left: position.left
      });
    }

    this.skin.setStemPosition(
      stemPosition || this.options.position.tooltip,
      position.shift || { x: 0, y: 0 }
    );
  },

  getSideLine: function(layout, side) {
    var x1 = layout.position.left,
      y1 = layout.position.top,
      x2 = layout.position.left,
      y2 = layout.position.top;

    switch (side) {
      case "top":
        x2 += layout.dimensions.width;
        break;
      case "bottom":
        y1 += layout.dimensions.height;
        x2 += layout.dimensions.width;
        y2 += layout.dimensions.height;
        break;
      case "left":
        y2 += layout.dimensions.height;
        break;
      case "right":
        x1 += layout.dimensions.width;
        x2 += layout.dimensions.width;
        y2 += layout.dimensions.height;
        break;
    }

    return { x1: x1, y1: y1, x2: x2, y2: y2 };
  },

  isSideWithinContainment: function(targetSide, stemPosition, ignorePadding) {
    var containmentLayout = this.getContainmentLayout(
      stemPosition,
      ignorePadding
    );
    var targetLayout = this.getTargetLayout();
    var isWithin = false;

    var targetLine = this.getSideLine(targetLayout, targetSide);

    // if one of the points is within the box we can return true right away
    if (
      Position.isPointWithinBoxLayout(
        targetLine.x1,
        targetLine.y1,
        containmentLayout
      ) ||
      Position.isPointWithinBoxLayout(
        targetLine.x2,
        targetLine.y2,
        containmentLayout
      )
    ) {
      return true;
    } else {
      // the box forming the target might better bigger than the containment area
      // so we should check if the line forming the sides intersects with one of the lines forming the containment area
      var intersects = false;
      $.each(
        "top right bottom left".split(" "),
        $.proxy(function(i, s) {
          var line = this.getSideLine(containmentLayout, s);

          if (
            Position.intersectsLine(
              targetLine.x1,
              targetLine.y1,
              targetLine.x2,
              targetLine.y2,
              line.x1,
              line.y1,
              line.x2,
              line.y2
            )
          ) {
            intersects = true;
            return false;
          }
        }, this)
      );

      return intersects;
    }
  },

  getContainment: function(position, stemPosition) {
    var contained = {
      horizontal: true,
      vertical: true,
      correction: { y: 0, x: 0 }
    };

    if (this.options.containment) {
      var containmentLayout = this.getContainmentLayout(stemPosition);

      var dimensions = this.skin._vars.frames[Position.getSide(stemPosition)]
        .dimensions;

      if (this.options.containment) {
        if (
          position.left < containmentLayout.position.left ||
          position.left + dimensions.width >
            containmentLayout.position.left + containmentLayout.dimensions.width
        ) {
          contained.horizontal = false;

          // store the correction that would be required
          if (position.left < containmentLayout.position.left) {
            contained.correction.x =
              containmentLayout.position.left - position.left;
          } else {
            contained.correction.x =
              containmentLayout.position.left +
              containmentLayout.dimensions.width -
              (position.left + dimensions.width);
          }
        }
        if (
          position.top < containmentLayout.position.top ||
          position.top + dimensions.height >
            containmentLayout.position.top + containmentLayout.dimensions.height
        ) {
          contained.vertical = false;

          // store the correction that would be required
          if (position.top < containmentLayout.position.top) {
            contained.correction.y =
              containmentLayout.position.top - position.top;
          } else {
            contained.correction.y =
              containmentLayout.position.top +
              containmentLayout.dimensions.height -
              (position.top + dimensions.height);
          }
        }
      }
    }

    return contained;
  },

  // stemPosition is used here since it might change containment padding
  getContainmentLayout: function(stemPosition, ignorePadding) {
    var viewportScroll = {
      top: $(window).scrollTop(),
      left: $(window).scrollLeft()
    };

    var target = this.target;
    if (target === "mouse") {
      target = this.element;
    }

    var area = $(target)
      .closest(this.options.containment.selector)
      .first()[0];

    var layout;

    if (!area || this.options.containment.selector === "viewport") {
      layout = {
        dimensions: Bounds.viewport(),
        position: viewportScroll
      };
    } else {
      layout = {
        dimensions: {
          width: $(area).innerWidth(),
          height: $(area).innerHeight()
        },
        position: $(area).offset()
      };
    }

    var padding = this.options.containment.padding;
    if (padding && !ignorePadding) {
      var maxDim = Math.max(layout.dimensions.height, layout.dimensions.width);
      if (padding * 2 > maxDim) {
        padding = Math.max(Math.floor(maxDim * 0.5), 0);
      }

      if (padding) {
        layout.dimensions.width -= 2 * padding;
        layout.dimensions.height -= 2 * padding;
        layout.position.top += padding;
        layout.position.left += padding;

        // when the stem is on the left/right we don't want the padding there so
        // the padding doesn't interfere with the stem once the viewport becomes smaller
        // we only want padding on one side in those situations
        var orientation = Position.getOrientation(stemPosition);

        // left/right
        if (orientation === "vertical") {
          layout.dimensions.width += padding;

          if (Position.getSide(stemPosition) === "left") {
            layout.position.left -= padding;
          }
        } else {
          // top/bottom
          layout.dimensions.height += padding;

          if (Position.getSide(stemPosition) === "top") {
            layout.position.top -= padding;
          }
        }
      }
    }

    this._cache.layouts.containmentLayout = layout;

    return layout;
  },

  // room top/bottom/left/right on the element compared to the mouse position
  getMouseRoom: function() {
    var room = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    };

    if (this.options.target === "mouse" && !this.is("api")) {
      var actualMousePosition = Mouse.getActualPosition(this._cache.event);
      var elementPosition = $(this.element).offset();
      var elementDimensions = {
        width: $(this.element).innerWidth(),
        height: $(this.element).innerHeight()
      };
      room = {
        top: Math.max(0, actualMousePosition.top - elementPosition.top),
        bottom: Math.max(
          0,
          elementPosition.top +
            elementDimensions.height -
            actualMousePosition.top
        ),
        left: Math.max(0, actualMousePosition.left - elementPosition.left),
        right: Math.max(
          0,
          elementPosition.left +
            elementDimensions.width -
            actualMousePosition.left
        )
      };
    }

    return room;
  },

  // Target layout
  getTargetPosition: function() {
    var position, offset;

    if (this.options.target === "mouse") {
      if (this.is("api")) {
        // when we've called this method from the API, use the element position instead
        offset = $(this.element).offset();
        position = {
          top: Math.round(offset.top),
          left: Math.round(offset.left)
        };
      } else {
        // mouse position is safe to use
        position = Mouse.getPosition(this._cache.event);
      }
    } else {
      offset = $(this.target).offset();
      position = {
        top: Math.round(offset.top),
        left: Math.round(offset.left)
      };
    }

    this._cache.layouts.targetPosition = position;

    return position;
  },
  getTargetDimensions: function() {
    if (this._cache.layouts.targetDimensions)
      return this._cache.layouts.targetDimensions;

    var dimensions;

    if (this.options.target === "mouse") {
      dimensions = Mouse.getDimensions();
    } else {
      dimensions = {
        width: $(this.target).innerWidth(),
        height: $(this.target).innerHeight()
      };
    }

    this._cache.layouts.targetDimensions = dimensions;

    return dimensions;
  },
  getTargetLayout: function() {
    if (this._cache.layouts.targetLayout)
      return this._cache.layouts.targetLayout;

    var layout = {
      position: this.getTargetPosition(),
      dimensions: this.getTargetDimensions()
    };

    this._cache.layouts.targetLayout = layout;

    return layout;
  },

  getPaddingLine: function(targetPosition) {
    var targetLayout = this.getTargetLayout();

    var side = "left";
    if (Position.getOrientation(targetPosition) === "vertical") {
      return this.getSideLine(targetLayout, Position.getSide(targetPosition));
    } else {
      if (Position.isCorner(targetPosition)) {
        var corner = Position.inverseCornerPlane(targetPosition);
        side = Position.getSide(corner);
        return this.getSideLine(targetLayout, side);
      } else {
        // middle top or bottom
        var line = this.getSideLine(targetLayout, side);

        // we have to add half the width to the lane for it to span the entire middle as a line
        var halfWidth = Math.round(targetLayout.dimensions.width * 0.5);
        line.x1 += halfWidth;
        line.x2 += halfWidth;

        return line;
      }
    }
  }
});

$.extend(Tooltip.prototype, {
  setActive: function() {
    this.is("active", true);

    //  raise the tooltip if it's visible
    if (this.visible()) {
      this.raise();
    }

    if (this.options.hideAfter) {
      this.clearTimer("idle");
    }
  },
  setIdle: function() {
    this.is("active", false);

    if (this.options.hideAfter) {
      this.setTimer(
        "idle",
        $.proxy(function() {
          this.clearTimer("idle");

          if (!this.is("active")) {
            this.hide();
          }
        }, this),
        this.options.hideAfter
      );
    }
  }
});

$.extend(Tooltip.prototype, {
  // bind with cached event to make unbinding cached handlers easy
  bind: function(element, eventName, handler, context) {
    var cachedHandler = $.proxy(handler, context || this);

    this._cache.events.push({
      element: element,
      eventName: eventName,
      handler: cachedHandler
    });

    $(element).bind(eventName, cachedHandler);
  },

  unbind: function() {
    $.each(this._cache.events, function(i, event) {
      $(event.element).unbind(event.eventName, event.handler);
    });

    this._cache.events = [];
  }
});

$.extend(Tooltip.prototype, {
  disable: function() {
    if (this.is("disabled")) return;
    this.is("disabled", true);
  },

  enable: function() {
    if (!this.is("disabled")) return;
    this.is("disabled", false);
  }
});

$.extend(Tooltip.prototype, {
  // states
  is: function(question, answer) {
    if ($.type(answer) === "boolean") {
      this._cache.is[question] = answer;
    }

    return this._cache.is[question];
  },

  visible: function() {
    return this.is("visible");
  }
});

$.extend(Tooltip.prototype, {
  setTimer: function(name, handler, ms) {
    this._cache.timers[name] = _.delay(handler, ms);
  },

  getTimer: function(name) {
    return this._cache.timers[name];
  },

  clearTimer: function(name) {
    if (this._cache.timers[name]) {
      clearTimeout(this._cache.timers[name]);
      delete this._cache.timers[name];
    }
  },

  clearTimers: function() {
    $.each(this._cache.timers, function(i, timer) {
      clearTimeout(timer);
    });
    this._cache.timers = {};
  }
});

$.extend(Tipped, {
  init: function() {
    Tooltips.init();
  },

  create: function(element, content) {
    var options = $.extend({}, arguments[2] || {}),
      tooltips = [];

    // initialize tooltips
    if (_.isElement(element)) {
      tooltips.push(new Tooltip(element, content, options));
    } else {
      // assume selector
      $(element).each(function(i, el) {
        tooltips.push(new Tooltip(el, content, options));
      });
    }

    return new Collection(tooltips);
  },

  get: function(selector) {
    var tooltips = Tooltips.get(selector);
    return new Collection(tooltips);
  },

  findElement: function(element) {
    return Tooltips.findElement(element);
  },

  hideAll: function() {
    Tooltips.hideAll();
    return this;
  },

  setDefaultSkin: function(name) {
    Tooltips.setDefaultSkin(name);
    return this;
  },

  visible: function(selector) {
    if (_.isElement(selector)) {
      return Tooltips.isVisibleByElement(selector);
    } else if ($.type(selector) !== "undefined") {
      var elements = $(selector),
        visible = 0;
      $.each(elements, function(i, element) {
        if (Tooltips.isVisibleByElement(element)) visible++;
      });
      return visible;
    } else {
      return Tooltips.getVisible().length;
    }
  },

  clearAjaxCache: function() {
    Tooltips.clearAjaxCache();
    return this;
  },

  refresh: function(selector, doneCallback, progressCallback) {
    Tooltips.refresh(selector, doneCallback, progressCallback);
    return this;
  },

  setStartingZIndex: function(index) {
    Tooltips.setStartingZIndex(index);
    return this;
  },

  remove: function(selector) {
    Tooltips.remove(selector);
    return this;
  }
});

$.each("show hide toggle disable enable".split(" "), function(i, name) {
  Tipped[name] = function(selector) {
    this.get(selector)[name]();
    return this;
  };
});

$.extend(Tipped, {
  delegate: function() {
    Delegations.add.apply(Delegations, _slice.call(arguments));
  },

  undelegate: function() {
    Delegations.remove.apply(Delegations, _slice.call(arguments));
  }
});

var Delegations = {
  _uid: 0,
  _delegations: {},

  add: function(selector, content, options) {
    var options;
    if ($.type(content) === "object" && !_.isElement(content)) {
      options = content;
      content = null;
    } else {
      options = arguments[2] || {};
    }

    var uid = ++this._uid;

    var ttOptions = Options.create($.extend({}, options));

    this._delegations[uid] = {
      uid: uid,
      selector: selector,
      content: content,
      options: ttOptions
    };

    var handler = function(event) {
      // store the uid so we don't create a second tooltip
      $(this).addClass("tpd-delegation-uid-" + uid);

      // now create the tooltip
      var tooltip = new Tooltip(this, content, options);

      // store any cached pageX/Y on it
      tooltip._cache.event = event;

      tooltip.setActive();

      tooltip.showDelayed();
    };

    this._delegations[uid].removeTitleHandler = $.proxy(this.removeTitle, this);
    $(document).delegate(
      selector + ":not(.tpd-delegation-uid-" + uid + ")",
      "mouseenter",
      this._delegations[uid].removeTitleHandler
    );

    this._delegations[uid].handler = handler;
    $(document).delegate(
      selector + ":not(.tpd-delegation-uid-" + uid + ")",
      ttOptions.showOn.element,
      handler
    );
  },

  // puts the title into data-tipped-restore-title,
  // this way tooltip creation picks up on it
  // without showing the native title tooltip
  removeTitle: function(event) {
    var element = event.currentTarget;

    var title = $(element).attr("title");

    // backup title
    if (title) {
      $(element).data("tipped-restore-title", title);
      $(element)[0].setAttribute("title", ""); // IE needs setAttribute
    }
  },

  remove: function(selector) {
    $.each(
      this._delegations,
      $.proxy(function(uid, delegation) {
        if (delegation.selector === selector) {
          $(document)
            .undelegate(
              selector + ":not(.tpd-delegation-uid-" + uid + ")",
              "mouseenter",
              delegation.removeTitleHandler
            )
            .undelegate(
              selector + ":not(.tpd-delegation-uid-" + uid + ")",
              delegation.options.showOn.element,
              delegation.handler
            );
          delete this._delegations[uid];
        }
      }, this)
    );
  },

  removeAll: function() {
    $.each(
      this._delegations,
      $.proxy(function(uid, delegation) {
        $(document)
          .undelegate(
            delegation.selector + ":not(.tpd-delegation-uid-" + uid + ")",
            "mouseenter",
            delegation.removeTitleHandler
          )
          .undelegate(
            delegation.selector + ":not(.tpd-delegation-uid-" + uid + ")",
            delegation.options.showOn.element,
            delegation.handler
          );
        delete this._delegations[uid];
      }, this)
    );
  }
};

function Collection() {
  this.initialize.apply(this, _slice.call(arguments));
}

$.extend(Collection.prototype, {
  initialize: function(tooltips) {
    this.tooltips = tooltips;
    return this;
  },

  items: function() {
    // everytime we grab a tooltip collection we'll clear the mouse buffer
    // this way it's never passed onto the elements
    $.each(this.tooltips, function(i, tooltip) {
      tooltip.is("api", true);
    });

    return this.tooltips;
  },

  refresh: function(callback) {
    $.each(this._tooltips, function(i, tooltip) {
      if (tooltip.is("visible")) {
        tooltip.refresh();
      }
    });
    return this;
  },

  remove: function() {
    Tooltips.removeTooltips(this.tooltips);

    // clear tooltips on this collection
    this.tooltips = [];

    return this;
  }
});

$.each("show hide toggle disable enable".split(" "), function(i, name) {
  Collection.prototype[name] = function() {
    $.each(this.tooltips, function(j, tooltip) {
      tooltip.is("api", true);
      tooltip[name]();
    });
    return this;
  };
});

Tipped.init();

return Tipped;

}));