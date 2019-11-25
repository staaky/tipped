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
