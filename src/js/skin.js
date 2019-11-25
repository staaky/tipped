function Skin() {
  this.initialize.apply(this, _slice.call(arguments));
}

$.extend(Skin.prototype, {
  initialize: function(tooltip) {
    this.tooltip = tooltip;
    this.element = tooltip._skin;

    // classes to further style the tooltip
    var options = this.tooltip.options;
    this.tooltip._tooltip[(options.shadow ? "remove" : "add") + "Class"](
      "tpd-no-shadow"
    )
      [(options.radius ? "remove" : "add") + "Class"]("tpd-no-radius")
      [(options.stem ? "remove" : "add") + "Class"]("tpd-no-stem");

    // we should get radius and border when initializing
    var frames, bg, bgc, spinner;
    var prefixedRadius = Support.css.prefixed("borderTopLeftRadius");

    this.element
      .append(
        (frames = $("<div>")
          .addClass("tpd-frames")
          .append(
            $("<div>")
              .addClass("tpd-frame")
              .append(
                $("<div>")
                  .addClass("tpd-backgrounds")
                  .append(
                    (bg = $("<div>")
                      .addClass("tpd-background")
                      .append(
                        (bgc = $("<div>").addClass("tpd-background-content"))
                      ))
                  )
              )
          ))
      )
      .append((spinner = $("<div>").addClass("tpd-spinner")));

    // REQUIRED FOR IE < 8
    bg.css({ width: 999, height: 999, zoom: 1 });

    this._css = {
      border: parseFloat(bg.css("border-top-width")),
      radius: parseFloat(prefixedRadius ? bg.css(prefixedRadius) : 0),
      padding: parseFloat(tooltip._content.css("padding-top")),
      borderColor: bg.css("border-top-color"),
      //spacing: parseFloat(this.element.css('margin-top')),
      // borderOpacity: .5 // IE pre rgba fallback can be inserted here
      backgroundColor: bgc.css("background-color"),
      backgroundOpacity: bgc.css("opacity"),
      spinner: {
        dimensions: {
          width: spinner.innerWidth(),
          height: spinner.innerHeight()
        }
      }
    };

    spinner.remove();
    frames.remove();

    this._side = Position.getSide(tooltip.options.position.tooltip) || "top";

    this._vars = {};
  },

  destroy: function() {
    if (!this.frames) return;

    // remove all the stems
    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, side) {
        if (this["stem_" + side]) this["stem_" + side].destroy();
      }, this)
    );

    this.frames.remove();
    this.frames = null;
  },

  build: function() {
    // if already build exit
    if (this.frames) return;

    this.element.append((this.frames = $("<div>").addClass("tpd-frames")));

    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, side) {
        this.insertFrame(side);
      }, this)
    );

    // insert a spinner, if we haven't already
    if (!this._spinner) {
      this.tooltip._tooltip.append(
        (this._spinner = $("<div>")
          .addClass("tpd-spinner")
          .hide()
          .append($("<div>").addClass("tpd-spinner-spin")))
      );
    }
  },

  _frame: (function() {
    var backgrounds;

    var frame = $("<div>")
      .addClass("tpd-frame")
      // background
      .append(
        (backgrounds = $("<div>")
          .addClass("tpd-backgrounds")
          .append($("<div>").addClass("tpd-background-shadow")))
      )
      .append(
        $("<div>")
          .addClass("tpd-shift-stem")
          .append(
            $("<div>").addClass(
              "tpd-shift-stem-side tpd-shift-stem-side-before"
            )
          )
          .append($("<div>").addClass("tpd-stem"))
          .append(
            $("<div>").addClass("tpd-shift-stem-side tpd-shift-stem-side-after")
          )
      );

    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, s) {
        backgrounds.append(
          $("<div>")
            .addClass("tpd-background-box tpd-background-box-" + s)
            .append(
              $("<div>")
                .addClass("tpd-background-box-shift")
                .append(
                  $("<div>")
                    .addClass("tpd-background-box-shift-further")
                    .append(
                      $("<div>")
                        .addClass("tpd-background")
                        .append($("<div>").addClass("tpd-background-title"))
                        .append($("<div>").addClass("tpd-background-content"))
                    )
                    .append(
                      $("<div>").addClass(
                        "tpd-background tpd-background-loading"
                      )
                    )
                    .append(
                      $("<div>")
                        .addClass("tpd-background-border-hack")
                        .hide()
                    )
                )
            )
        );
      }, this)
    );

    return frame;
  })(),

  _getFrame: function(side) {
    var frame = this._frame.clone();

    // class
    frame.addClass("tpd-frame-" + side);

    // put border radius on shadow
    frame
      .find(".tpd-background-shadow")
      .css({ "border-radius": this._css.radius });

    // mark side on stem
    if (this.tooltip.options.stem) {
      frame.find(".tpd-stem").attr("data-stem-position", side);
    }

    // radius on background layers
    var innerBackgroundRadius = Math.max(
      this._css.radius - this._css.border,
      0
    );
    frame.find(".tpd-background-title").css({
      "border-top-left-radius": innerBackgroundRadius,
      "border-top-right-radius": innerBackgroundRadius
    });
    frame.find(".tpd-background-content").css({
      "border-bottom-left-radius": innerBackgroundRadius,
      "border-bottom-right-radius": innerBackgroundRadius
    });
    frame.find(".tpd-background-loading").css({
      "border-radius": innerBackgroundRadius
    });

    // adjust the dimensions of the shift sides
    var ss = { backgroundColor: this._css.borderColor };
    var orientation = Position.getOrientation(side),
      isHorizontal = orientation === "horizontal";
    ss[isHorizontal ? "height" : "width"] = this._css.border + "px";
    var inverse = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left"
    };
    ss[inverse[side]] = 0;
    frame.find(".tpd-shift-stem-side").css(ss);

    return frame;
  },

  insertFrame: function(side) {
    var frame = (this["frame_" + side] = this._getFrame(side));
    this.frames.append(frame);

    if (this.tooltip.options.stem) {
      var stem = frame.find(".tpd-stem");
      this["stem_" + side] = new Stem(stem, this, {});
    }
  },

  // Loading
  startLoading: function() {
    if (!this.tooltip.supportsLoading) return;
    this.build(); // make sure the tooltip is build

    // resize to the dimensions of the spinner the first time a tooltip is shown
    if (!this._spinner && !this.tooltip.is("resize-to-content")) {
      this.setDimensions(this._css.spinner.dimensions); // this creates ._spinner
    }

    if (this._spinner) {
      this._spinner.show();
    }
  },

  // the idea behind stopLoading is that dimensions are set right after calling this function
  // that's why we don't set the manually here
  stopLoading: function() {
    if (!this.tooltip.supportsLoading || !this._spinner) return;
    this.build(); // make sure the tooltip is build

    this._spinner.hide();
  },

  // updates the background of the currently active side
  updateBackground: function() {
    var frame = this._vars.frames[this._side];

    var backgroundDimensions = $.extend({}, frame.background.dimensions);

    if (this.tooltip.title && !this.tooltip.is("loading")) {
      // show both background children
      this.element
        .find(".tpd-background-title, .tpd-background-content")
        .show();

      // remove background color and replace it with transparent
      this.element
        .find(".tpd-background")
        .css({ "background-color": "transparent" });

      var contentDimensions = $.extend({}, backgroundDimensions);
      var innerBackgroundRadius = Math.max(
        this._css.radius - this._css.border,
        0
      );
      var contentRadius = {
        "border-top-left-radius": innerBackgroundRadius,
        "border-top-right-radius": innerBackgroundRadius,
        "border-bottom-left-radius": innerBackgroundRadius,
        "border-bottom-right-radius": innerBackgroundRadius
      };

      // measure the title
      var visible = new Visible(this.tooltip._tooltip);

      var titleHeight = this.tooltip._titleWrapper.innerHeight(); // without margins

      contentDimensions.height -= titleHeight;

      // set all title dimensions
      this.element.find(".tpd-background-title").css({
        height: titleHeight,
        width: backgroundDimensions.width
      });

      // remove radius at the top
      contentRadius["border-top-left-radius"] = 0;
      contentRadius["border-top-right-radius"] = 0;

      visible.restore();

      // set all content dimensions
      // set correct radius
      this.element
        .find(".tpd-background-content")
        .css(contentDimensions)
        .css(contentRadius);

      // loading indicator
      this.element.find(".tpd-background-loading").css({
        "background-color": this._css.backgroundColor
      });
    } else {
      // no title or close button creates a bar at the top
      // set background color only for better px handling in the corners
      // show both background children
      this.element
        .find(".tpd-background-title, .tpd-background-content")
        .hide();

      this.element
        .find(".tpd-background")
        .css({ "background-color": this._css.backgroundColor });
    }

    // border fix, required as a workaround for the following bugs:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=929979
    // https://code.google.com/p/chromium/issues/detail?id=320330
    if (this._css.border) {
      this.element
        .find(".tpd-background")
        .css({ "border-color": "transparent" });

      this.element
        .find(".tpd-background-border-hack")
        // scaled
        .css({
          width: backgroundDimensions.width,
          height: backgroundDimensions.height,
          "border-radius": this._css.radius,
          "border-width": this._css.border,
          "border-color": this._css.borderColor
        })
        .show();
    }
  },

  // update dimensions of the currently active side
  // background + stem
  paint: function() {
    // don't update if we've already rendered the dimensions at current stem position
    if (
      this._paintedDimensions &&
      this._paintedDimensions.width === this._dimensions.width &&
      this._paintedDimensions.height === this._dimensions.height &&
      this._paintedStemPosition === this._stemPosition
    ) {
      return;
    }

    // store these to prevent future updates at the same dimensions
    this._paintedDimensions = this._dimensions;
    this._paintedStemPosition = this._stemPosition;

    // visible side, hide others
    this.element
      .removeClass(
        "tpd-visible-frame-top tpd-visible-frame-bottom tpd-visible-frame-left tpd-visible-frame-right"
      )
      .addClass("tpd-visible-frame-" + this._side);

    var frame = this._vars.frames[this._side];

    // set dimensions
    var backgroundDimensions = $.extend({}, frame.background.dimensions);
    this.element.find(".tpd-background").css(backgroundDimensions);
    this.element.find(".tpd-background-shadow").css({
      width: backgroundDimensions.width + 2 * this._css.border,
      height: backgroundDimensions.height + 2 * this._css.border
    });

    // update background to the correct display method
    this.updateBackground();

    this.element
      .find(".tpd-background-box-shift, .tpd-background-box-shift-further")
      .removeAttr("style");

    // dimensions of the skin
    this.element
      .add(this.frames)
      // and the tooltip
      .add(this.tooltip._tooltip)
      .css(frame.dimensions);

    // resize every frame
    var name = this._side,
      value = this._vars.frames[name];
    var f = this.element.find(".tpd-frame-" + this._side),
      fdimensions = this._vars.frames[name].dimensions;

    f.css(fdimensions);

    // background
    f.find(".tpd-backgrounds").css(
      $.extend({}, value.background.position, {
        width: fdimensions.width - value.background.position.left,
        height: fdimensions.height - value.background.position.top
      })
    );

    // find the position of this frame
    // adjust the backgrounds
    var orientation = Position.getOrientation(name);

    // no stem only shows the top frame (using CSS)
    // with a stem we have to make adjustments
    if (this.tooltip.options.stem) {
      // position the shiftstem
      f.find(".tpd-shift-stem").css(
        $.extend({}, value.shift.dimensions, value.shift.position)
      );

      if (orientation === "vertical") {
        // left or right
        // top or bottom
        // make top/bottom side small
        var smallBoxes = f.find(
          ".tpd-background-box-top, .tpd-background-box-bottom"
        );
        smallBoxes.css({
          height: this._vars.cut,
          width: this._css.border
        });

        // align the bottom side with the bottom
        f.find(".tpd-background-box-bottom")
          .css({
            top: value.dimensions.height - this._vars.cut
          })
          // shift right side back
          .find(".tpd-background-box-shift")
          .css({
            "margin-top": -1 * value.dimensions.height + this._vars.cut
          });

        // both sides should now be moved left or right depending on the current side
        var moveSmallBy =
          name === "right"
            ? value.dimensions.width - value.stemPx - this._css.border
            : 0;
        smallBoxes
          .css({
            left: moveSmallBy
          })
          .find(".tpd-background-box-shift")
          .css({
            // inverse of the above
            "margin-left": -1 * moveSmallBy
          });

        // hide the background that will be replaced by the stemshift when we have a stem
        f.find(
          ".tpd-background-box-" + (name == "left" ? "left" : "right")
        ).hide();

        // resize the other one
        if (name === "right") {
          // top can be resized to height - border
          f.find(".tpd-background-box-left").css({
            width: value.dimensions.width - value.stemPx - this._css.border
          });
        } else {
          f.find(".tpd-background-box-right")
            .css({
              "margin-left": this._css.border //,
              //height: (value.dimensions.height - value.stemPx - this._vars.border) + 'px'
            })
            .find(".tpd-background-box-shift")
            .css({
              "margin-left": -1 * this._css.border
            });
        }

        // left or right should be shifted to the center
        // depending on which side is used
        var smallBox = f.find(".tpd-background-box-" + this._side);
        smallBox.css({
          height: value.dimensions.height - 2 * this._vars.cut, // resize
          "margin-top": this._vars.cut
        });
        smallBox.find(".tpd-background-box-shift").css({
          "margin-top": -1 * this._vars.cut
        });
      } else {
        // top or bottom
        // make left and right side small
        var smallBoxes = f.find(
          ".tpd-background-box-left, .tpd-background-box-right"
        );
        smallBoxes.css({
          width: this._vars.cut,
          height: this._css.border
        });

        // align the right side with the right
        f.find(".tpd-background-box-right")
          .css({
            left: value.dimensions.width - this._vars.cut
          })
          // shift right side back
          .find(".tpd-background-box-shift")
          .css({
            "margin-left": -1 * value.dimensions.width + this._vars.cut
          });

        // both sides should now be moved up or down depending on the current side
        var moveSmallBy =
          name === "bottom"
            ? value.dimensions.height - value.stemPx - this._css.border
            : 0;
        smallBoxes
          .css({
            top: moveSmallBy
          })
          .find(".tpd-background-box-shift")
          .css({
            // inverse of the above
            "margin-top": -1 * moveSmallBy
          });

        // hide the background that will be replaced by the stemshift
        f.find(
          ".tpd-background-box-" + (name === "top" ? "top" : "bottom")
        ).hide();

        // resize the other one
        if (name === "bottom") {
          // top can be resized to height - border
          f.find(".tpd-background-box-top").css({
            height: value.dimensions.height - value.stemPx - this._css.border
          });
        } else {
          f.find(".tpd-background-box-bottom")
            .css({
              "margin-top": this._css.border
            })
            .find(".tpd-background-box-shift")
            .css({
              "margin-top": -1 * this._css.border
            });
        }

        // top or bottom should be shifted to the center
        // depending on which side is used
        var smallBox = f.find(".tpd-background-box-" + this._side);
        smallBox.css({
          width: value.dimensions.width - 2 * this._vars.cut,
          "margin-left": this._vars.cut
        });
        smallBox.find(".tpd-background-box-shift").css({
          "margin-left": -1 * this._vars.cut
        });
      }
    }

    // position the loader
    var fb = frame.background,
      fbp = fb.position,
      fbd = fb.dimensions;
    this._spinner.css({
      top:
        fbp.top +
        this._css.border +
        (fbd.height * 0.5 - this._css.spinner.dimensions.height * 0.5),
      left:
        fbp.left +
        this._css.border +
        (fbd.width * 0.5 - this._css.spinner.dimensions.width * 0.5)
    });
  },

  getVars: function() {
    var padding = this._css.padding,
      radius = this._css.radius,
      border = this._css.border;

    var maxStemHeight = this._vars.maxStemHeight || 0;
    var dimensions = $.extend({}, this._dimensions || {});
    var vars = {
      frames: {},
      dimensions: dimensions,
      maxStemHeight: maxStemHeight
    };

    // set the cut
    vars.cut = Math.max(this._css.border, this._css.radius) || 0;

    var stemDimensions = { width: 0, height: 0 };
    var stemOffset = 0;
    var stemPx = 0;

    if (this.tooltip.options.stem) {
      stemDimensions = this.stem_top.getMath().dimensions.outside;
      stemOffset = this.stem_top._css.offset;
      stemPx = Math.max(stemDimensions.height - this._css.border, 0); // the height we assume the stem is should never be negative
    }

    // store for later use
    vars.stemDimensions = stemDimensions;
    vars.stemOffset = stemOffset;

    // positition the background and resize the outer frame
    $.each(
      "top right bottom left".split(" "),
      $.proxy(function(i, side) {
        var orientation = Position.getOrientation(side),
          isLR = orientation === "vertical";

        var frameDimensions = {
          width: dimensions.width + 2 * border,
          height: dimensions.height + 2 * border
        };

        var shiftWidth =
          frameDimensions[isLR ? "height" : "width"] - 2 * vars.cut;

        var frame = {
          dimensions: frameDimensions,
          stemPx: stemPx,
          position: { top: 0, left: 0 },
          background: {
            dimensions: $.extend({}, dimensions),
            position: { top: 0, left: 0 }
          }
        };
        vars.frames[side] = frame;

        // adjust width or height of frame based on orientation
        frame.dimensions[isLR ? "width" : "height"] += stemPx;

        if (side === "top" || side === "left") {
          frame.background.position[side] += stemPx;
        }

        $.extend(frame, {
          shift: {
            position: { top: 0, left: 0 },
            dimensions: {
              width: isLR ? stemDimensions.height : shiftWidth,
              height: isLR ? shiftWidth : stemDimensions.height
            }
          }
        });

        switch (side) {
          case "top":
          case "bottom":
            frame.shift.position.left += vars.cut;

            if (side === "bottom") {
              frame.shift.position.top +=
                frameDimensions.height - border - stemPx;
            }
            break;
          case "left":
          case "right":
            frame.shift.position.top += vars.cut;

            if (side === "right") {
              frame.shift.position.left +=
                frameDimensions.width - border - stemPx;
            }
            break;
        }
      }, this)
    );

    // add connections
    vars.connections = {};
    $.each(
      Position.positions,
      $.proxy(function(i, position) {
        vars.connections[position] = this.getConnectionLayout(position, vars);
      }, this)
    );

    return vars;
  },

  setDimensions: function(dimensions) {
    this.build();

    // don't update if nothing changed
    var d = this._dimensions;
    if (d && d.width === dimensions.width && d.height === dimensions.height) {
      return;
    }

    this._dimensions = dimensions;
    this._vars = this.getVars();
  },

  setSide: function(side) {
    this._side = side;
    this._vars = this.getVars();
  },

  // gets position and offset of the given stem
  getConnectionLayout: function(position, vars) {
    var side = Position.getSide(position),
      orientation = Position.getOrientation(position),
      dimensions = vars.dimensions,
      cut = vars.cut; // where the stem starts

    var stem = this["stem_" + side],
      stemOffset = vars.stemOffset,
      stemWidth = this.tooltip.options.stem
        ? stem.getMath().dimensions.outside.width
        : 0,
      stemMiddleFromSide = cut + stemOffset + stemWidth * 0.5;

    // at the end of this function we should know how much the stem is able to shift
    var layout = {
      stem: {}
    };
    var move = {
      left: 0,
      right: 0,
      up: 0,
      down: 0
    };

    var stemConnection = { top: 0, left: 0 },
      connection = { top: 0, left: 0 };

    var frame = vars.frames[side],
      stemMiddleFromSide = 0;

    // top/bottom
    if (orientation == "horizontal") {
      var width = frame.dimensions.width;

      if (this.tooltip.options.stem) {
        width = frame.shift.dimensions.width;

        // if there's not enough width for twice the stemOffset, calculate what is available, divide the width
        if (width - stemWidth < 2 * stemOffset) {
          stemOffset = Math.floor((width - stemWidth) * 0.5) || 0;
        }

        stemMiddleFromSide = cut + stemOffset + stemWidth * 0.5;
      }

      var availableWidth = width - 2 * stemOffset;

      var split = Position.split(position);
      var left = stemOffset;
      switch (split[2]) {
        case "left":
          move.right = availableWidth - stemWidth;

          stemConnection.left = stemMiddleFromSide;
          break;
        case "middle":
          left += Math.round(availableWidth * 0.5 - stemWidth * 0.5);

          move.left = left - stemOffset;
          move.right = left - stemOffset;

          stemConnection.left = connection.left = Math.round(
            frame.dimensions.width * 0.5
          );
          //connection.left = stemConnection.left;
          break;
        case "right":
          left += availableWidth - stemWidth;

          move.left = availableWidth - stemWidth;

          stemConnection.left = frame.dimensions.width - stemMiddleFromSide;
          connection.left = frame.dimensions.width;
          break;
      }

      // if we're working with the bottom stems we have to add the height to the connection
      if (split[1] === "bottom") {
        stemConnection.top += frame.dimensions.height;
        connection.top += frame.dimensions.height;
      }

      $.extend(layout.stem, {
        position: { left: left },
        before: { width: left },
        after: {
          left: left + stemWidth,
          //right: 0, // seems to work better in Chrome (subpixel bug)
          // but it fails in oldIE, se we add overlap to compensate
          width: width - left - stemWidth + 1
        }
      });
    } else {
      // we are dealing with height
      var height = frame.dimensions.height;

      if (this.tooltip.options.stem) {
        height = frame.shift.dimensions.height;

        if (height - stemWidth < 2 * stemOffset) {
          stemOffset = Math.floor((height - stemWidth) * 0.5) || 0;
        }

        stemMiddleFromSide = cut + stemOffset + stemWidth * 0.5;
      }

      var availableHeight = height - 2 * stemOffset;

      var split = Position.split(position);
      var top = stemOffset;
      switch (split[2]) {
        case "top":
          move.down = availableHeight - stemWidth;

          stemConnection.top = stemMiddleFromSide;
          break;
        case "middle":
          top += Math.round(availableHeight * 0.5 - stemWidth * 0.5);

          move.up = top - stemOffset;
          move.down = top - stemOffset;

          stemConnection.top = connection.top = Math.round(
            frame.dimensions.height * 0.5
          );
          break;
        case "bottom":
          top += availableHeight - stemWidth;

          move.up = availableHeight - stemWidth;

          stemConnection.top = frame.dimensions.height - stemMiddleFromSide;
          connection.top = frame.dimensions.height;
          break;
      }

      // if we're working with the right stems we have to add the height to the connection
      if (split[1] === "right") {
        stemConnection.left += frame.dimensions.width;
        connection.left += frame.dimensions.width;
      }

      $.extend(layout.stem, {
        position: { top: top },
        before: { height: top },
        after: {
          top: top + stemWidth,
          height: height - top - stemWidth + 1
        }
      });
    }

    // store movement and connection
    layout.move = move;
    layout.stem.connection = stemConnection;
    layout.connection = connection;

    return layout;
  },

  // sets the stem as one of the available 12 positions
  // we also need to call this function without a stem because it sets
  // connections
  setStemPosition: function(stemPosition, shift) {
    if (this._stemPosition !== stemPosition) {
      this._stemPosition = stemPosition;
      var side = Position.getSide(stemPosition);
      this.setSide(side);
    }

    // actual positioning
    if (this.tooltip.options.stem) {
      this.setStemShift(stemPosition, shift);
    }
  },

  setStemShift: function(stemPosition, shift) {
    var _shift = this._shift,
      _dimensions = this._dimensions;
    // return if we have the same shift on the same dimensions
    if (
      _shift &&
      _shift.stemPosition === stemPosition &&
      _shift.shift.x === shift.x &&
      _shift.shift.y === shift.y &&
      _dimensions &&
      _shift.dimensions.width === _dimensions.width &&
      _shift.dimensions.height === _dimensions.height
    ) {
      return;
    }
    this._shift = {
      stemPosition: stemPosition,
      shift: shift,
      dimensions: _dimensions
    };

    var side = Position.getSide(stemPosition),
      xy = { horizontal: "x", vertical: "y" }[
        Position.getOrientation(stemPosition)
      ],
      leftWidth = {
        x: { left: "left", width: "width" },
        y: { left: "top", width: "height" }
      }[xy],
      stem = this["stem_" + side],
      layout = deepExtend({}, this._vars.connections[stemPosition].stem);

    // only use offset in the orientation of this position
    if (shift && shift[xy] !== 0) {
      layout.before[leftWidth["width"]] += shift[xy];
      layout.position[leftWidth["left"]] += shift[xy];
      layout.after[leftWidth["left"]] += shift[xy];
      layout.after[leftWidth["width"]] -= shift[xy];
    }

    // actual positioning
    stem.element.css(layout.position);
    stem.element.siblings(".tpd-shift-stem-side-before").css(layout.before);
    stem.element.siblings(".tpd-shift-stem-side-after").css(layout.after);
  }
});
