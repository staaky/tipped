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
