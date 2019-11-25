var Dimensions = {
  _count: 0,

  // dimensions are returned as the 1st parameter of the callback
  get: function(url, options, callback) {
    if ($.type(options) == "function") {
      callback = options;
      options = {};
    }
    options = $.extend(
      {
        type: "image",
        lifetime: 1000 * 60 * 5
      },
      options || {}
    );

    var cache = Dimensions.cache.get(url),
      type = options.type,
      data = { type: type, callback: callback };

    var img;
    if (!cache) {
      // nothing in cache, go check
      switch (type) {
        case "image":
          img = new Image();
          img.onload = function() {
            img.onload = function() {};
            cache = {
              dimensions: {
                width: img.width,
                height: img.height
              }
            };

            data.image = img;

            Dimensions.cache.set(url, cache.dimensions, data);
            if (callback) {
              callback(cache.dimensions, data);
            }
          };

          img.src = url;
          break;
      }
    } else {
      img = cache.data.image;
      // we return cloned dimensions so the value can't be modified
      if (callback) {
        callback($.extend({}, cache.dimensions), cache.data);
      }
    }

    return img;
  }
};

Dimensions.Cache = function() {
  return this.initialize.apply(this, _slice.call(arguments));
};
$.extend(Dimensions.Cache.prototype, {
  initialize: function() {
    this.cache = [];
  },

  get: function(url) {
    var entry = null;
    for (var i = 0; i < this.cache.length; i++) {
      if (this.cache[i] && this.cache[i].url === url) entry = this.cache[i];
    }
    return entry;
  },

  set: function(url, dimensions, data) {
    this.remove(url);
    this.cache.push({ url: url, dimensions: dimensions, data: data });
  },

  remove: function(url) {
    for (var i = 0; i < this.cache.length; i++) {
      if (this.cache[i] && this.cache[i].url === url) {
        delete this.cache[i];
      }
    }
  },

  // forcefully inject a cache entry or extend the data of existing cache
  inject: function(data) {
    var entry = get(data.url);

    if (entry) {
      $.extend(entry, data);
    } else {
      this.cache.push(data);
    }
  }
});

Dimensions.cache = new Dimensions.Cache();

//Loading
Dimensions.Loading = function() {
  return this.initialize.apply(this, _slice.call(arguments));
};
$.extend(Dimensions.Loading.prototype, {
  initialize: function() {
    this.cache = [];
  },

  set: function(url, data) {
    this.clear(url);
    this.cache.push({ url: url, data: data });
  },

  get: function(url) {
    var entry = null;
    for (var i = 0; i < this.cache.length; i++) {
      if (this.cache[i] && this.cache[i].url === url) entry = this.cache[i];
    }
    return entry;
  },

  clear: function(url) {
    var cache = this.cache;

    for (var i = 0; i < cache.length; i++) {
      if (cache[i] && cache[i].url === url && cache[i].data) {
        var data = cache[i].data;
        switch (data.type) {
          case "image":
            if (data.image && data.image.onload) {
              data.image.onload = function() {};
            }
            break;
        }
        delete cache[i];
      }
    }
  }
});

Dimensions.loading = new Dimensions.Loading();
