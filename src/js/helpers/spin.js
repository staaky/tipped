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
