$.extend(Tooltip.prototype, {
  // bind with cached event to make unbinding cached handlers easy
  bind: function (element, eventName, handler, context) {
    var cachedHandler = handler.bind(context || this);

    this._cache.events.push({
      element: element,
      eventName: eventName,
      handler: cachedHandler,
    });

    $(element).on(eventName, cachedHandler);
  },

  unbind: function () {
    $.each(this._cache.events, function (i, event) {
      $(event.element).off(event.eventName, event.handler);
    });

    this._cache.events = [];
  },
});
