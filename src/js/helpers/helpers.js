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
