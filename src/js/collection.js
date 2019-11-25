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
