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
