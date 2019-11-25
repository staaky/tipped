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
