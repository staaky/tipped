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
