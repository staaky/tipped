$.extend(Tooltip.prototype, {
  clearUpdatedTo: function() {
    this._cache.updatedTo = {};
  },

  updateDimensionsToContent: function(targetPosition, stemPosition) {
    this.skin.build(); // skin has to be build at this point

    var isLoading = this.is("loading");
    var updatedTo = this._cache.updatedTo;

    if (
      !this._maxWidthPass &&
      !this.is("api") && // API calls always update
      //&& !this.is('refreshing')
      !this.is("should-update-dimensions") && // when this marker is set always update
      updatedTo.stemPosition === stemPosition &&
      updatedTo.loading === isLoading
    ) {
      return;
    }

    // always exit if we're loading and need to resize to content
    // the spinner will only change class at that point, while we stay
    // at old dimensions, so no need to do any further checks
    if (isLoading && this.is("resize-to-content")) {
      return;
    }

    // store so we can avoid duplicate updates
    this._cache.updatedTo = {
      type: this.is("resize-to-content") ? "content" : "spinner",
      loading: this.is("loading"),
      stemPosition: stemPosition
    };

    // if the should-update-dimensions flag was set
    // unset it since we're updating now
    if (this.is("should-update-dimensions")) {
      this.is("should-update-dimensions", false);
    }

    // actual updating from here
    targetPosition = targetPosition || this.options.position.target;
    stemPosition = stemPosition || this.options.position.tooltip;
    var side = Position.getSide(stemPosition);
    var orientation = Position.getOrientation(stemPosition);
    var border = this.skin._css.border;
    var borderPx = border + "px ";

    // set measure class before measuring
    this._tooltip.addClass("tpd-tooltip-measuring");
    var style = this._tooltip.attr("style");
    this._tooltip.removeAttr("style");

    var paddings = { top: border, right: border, bottom: border, left: border };

    // Add extra padding
    // if there's a stem and we're positioning to the side we might have to add some extra padding to the left
    var padding = 0;

    // if the stem orientation is vertical we might have to add extra padding
    if (Position.getOrientation(stemPosition) === "vertical") {
      // change the padding of the active side that of stemHeight
      if (this.options.stem) {
        paddings[side] = this.skin[
          "stem_" + side
        ].getMath().dimensions.outside.height;
      }

      // seems like a cheesy way to fix the mouse correction problem, but it works!
      var room = this.getMouseRoom();
      if (room[Position._flip[side]]) {
        paddings[side] += room[Position._flip[side]];
      }

      var containmentLayout = this.getContainmentLayout(stemPosition);
      var paddingLine = this.getPaddingLine(targetPosition);
      var addPadding = false;

      // if one of the points is within the box no need to check for intersection
      if (
        Position.isPointWithinBoxLayout(
          paddingLine.x1,
          paddingLine.y1,
          containmentLayout
        ) ||
        Position.isPointWithinBoxLayout(
          paddingLine.x2,
          paddingLine.y2,
          containmentLayout
        )
      ) {
        addPadding = true;
      } else {
        var intersects = false;
        $.each(
          "top right bottom left".split(" "),
          $.proxy(function(i, s) {
            var line = this.getSideLine(containmentLayout, s);

            if (
              Position.intersectsLine(
                paddingLine.x1,
                paddingLine.y1,
                paddingLine.x2,
                paddingLine.y2,
                line.x1,
                line.y1,
                line.x2,
                line.y2
              )
            ) {
              addPadding = true;
              return false;
            }
          }, this)
        );
      }

      if (addPadding) {
        // now if the stem is on the right we should add padding to that same side
        // so do that for left as well
        if (side === "left") {
          padding = paddingLine.x1 - containmentLayout.position.left;
        } else {
          padding =
            containmentLayout.position.left +
            containmentLayout.dimensions.width -
            paddingLine.x1;
        }

        paddings[side] += padding;
      }
    }

    // there can be added offset that requires extra padding
    if (this.options.offset) {
      if (orientation === "vertical") {
        var offset = Position.adjustOffsetBasedOnPosition(
          this.options.offset,
          this.options.position.target,
          targetPosition
        );

        if (offset.x !== 0) {
          paddings.right += Math.abs(offset.x);
        }
      }
    }

    // same thing for containment padding
    var padding;
    if (
      this.options.containment &&
      (padding = this.options.containment.padding)
    ) {
      $.each(paddings, function(name, value) {
        paddings[name] += padding;
      });

      // corrections: whenever the stem is on the side remove containment padding there
      if (orientation === "vertical") {
        // left/right
        paddings[side === "left" ? "left" : "right"] -= padding;
      } else {
        // top/bottom
        paddings[side === "top" ? "top" : "bottom"] -= padding;
      }
    }

    var viewport = Bounds.viewport();

    var hasInnerClose = this.close && this.close !== "overlap" && !this.title;

    var innerCloseDimensions = { width: 0, height: 0 };
    if (hasInnerClose) {
      innerCloseDimensions = this._innerCloseDimensions || {
        width: this._inner_close.outerWidth(true),
        height: this._inner_close.outerHeight(true)
      };
      this._innerCloseDimensions = innerCloseDimensions;
    }

    this._contentRelativePadder.css({
      "padding-right": innerCloseDimensions.width
    });

    this._contentSpacer.css({
      width: viewport.width - paddings.left - paddings.right
    });

    // first measure the dimensions
    var contentDimensions = {
      width: this._content.innerWidth() + innerCloseDimensions.width,
      height: Math.max(
        this._content.innerHeight(),
        innerCloseDimensions.height || 0
      )
    };

    var titleDimensions = { width: 0, height: 0 };

    // add title height if title or closebutton
    if (this.title) {
      var closeDimensions = { width: 0, height: 0 };

      this._titleWrapper.add(this._titleSpacer).css({
        width: "auto",
        height: "auto"
      });

      // measure close dimensions
      if (this.close && this.close !== "overlap") {
        //  || this.title
        closeDimensions = {
          width: this._close.outerWidth(true),
          height: this._close.outerHeight(true)
        };
        this._close.hide();
      }

      // There is a problem when maxWidth is set but when the element inserted as content has a larger fixed width
      // the title will be measured using the smaller maxWidth but it'll appear inside a larger area, making it only partially filled
      // to avoid this we use the max of maxWidth and content width in the second pass
      if (
        this._maxWidthPass &&
        contentDimensions.width > this.options.maxWidth
      ) {
        this._titleRelative.css({ width: contentDimensions.width });
      }

      // set padding on the spacer
      this._titleRelativePadder.css({ "padding-right": closeDimensions.width });

      // measure title border bottom
      var titleBorderBottom = parseFloat(
        this._titleWrapper.css("border-bottom-width")
      );

      // title dimensions
      titleDimensions = {
        width: this.title ? this._titleWrapper.innerWidth() : 0,
        height: Math.max(
          this.title ? this._titleWrapper.innerHeight() + titleBorderBottom : 0,
          closeDimensions.height + titleBorderBottom
        )
      };

      // make responsive
      if (
        titleDimensions.width >
        viewport.width - paddings.left - paddings.right
      ) {
        titleDimensions.width = viewport.width - paddings.left - paddings.right;

        this._titleSpacer.css({
          width: titleDimensions.width // - closeDimensions.width
        });

        titleDimensions.height = Math.max(
          this.title ? this._titleWrapper.innerHeight() + titleBorderBottom : 0,
          closeDimensions.height + titleBorderBottom
        );
      }

      contentDimensions.width = Math.max(
        titleDimensions.width,
        contentDimensions.width
      );
      contentDimensions.height += titleDimensions.height;

      // fixate the height since we're measuring it below
      // using innerHeight here cause we don't want to increase by the border
      this._titleWrapper.css({
        height: Math.max(
          this.title ? this._titleWrapper.innerHeight() : 0,
          closeDimensions.height
        )
      });

      if (this.close) {
        this._close.show();
      }
    }

    if (this.options.stem) {
      // min width/height
      var wh = orientation === "vertical" ? "height" : "width";
      var stemMath = this.skin["stem_" + side].getMath();
      var stemZ = stemMath.outside.width + 2 * this.skin._css.radius;

      if (contentDimensions[wh] < stemZ) {
        contentDimensions[wh] = stemZ;
      }
    }

    this._contentSpacer.css({ width: contentDimensions.width });

    if (
      contentDimensions.height !==
      Math.max(this._content.innerHeight(), innerCloseDimensions.height) +
        (this.title ? this._titleRelative.outerHeight() : 0)
    ) {
      contentDimensions.width++;
    }

    if (!this.is("resize-to-content")) {
      contentDimensions = this.skin._css.spinner.dimensions;
    }

    this.setDimensions(contentDimensions);

    // reset the spacing to the correct one, that of the border
    paddings = { top: border, right: border, bottom: border, left: border };
    if (this.options.stem) {
      var stemSide = Position.getSide(stemPosition);
      paddings[
        stemSide
      ] = this.skin.stem_top.getMath().dimensions.outside.height;
    }

    this._contentSpacer.css({
      "margin-top": paddings.top,
      "margin-left": +paddings.left,
      width: contentDimensions.width
    });

    if (this.title || this.close) {
      // if there's no close button, still show it while measuring
      this._titleWrapper.css({
        height: this._titleWrapper.innerHeight(),
        width: contentDimensions.width
      });
    }

    this._tooltip.removeClass("tpd-tooltip-measuring");
    this._tooltip.attr("style", style);

    // maxWidth
    var relatives = this._contentRelative.add(this._titleRelative);
    if (
      this.options.maxWidth &&
      contentDimensions.width > this.options.maxWidth &&
      !this._maxWidthPass &&
      this.is("resize-to-content")
    ) {
      relatives.css({ width: this.options.maxWidth });
      this._maxWidthPass = true;
      this.updateDimensionsToContent(targetPosition, stemPosition);
      this._maxWidthPass = false;
      relatives.css({ width: "auto" });
    }
  },

  setDimensions: function(dimensions) {
    this.skin.setDimensions(dimensions);
  },

  // return how much space we have around the target within the containment
  getContainmentSpace: function(stemPosition, ignorePadding) {
    var containmentLayout = this.getContainmentLayout(
      stemPosition,
      ignorePadding
    );
    var targetLayout = this.getTargetLayout();

    var tpos = targetLayout.position,
      tdim = targetLayout.dimensions,
      cpos = containmentLayout.position,
      cdim = containmentLayout.dimensions;

    var space = {
      top: Math.max(tpos.top - cpos.top, 0),
      bottom: Math.max(cpos.top + cdim.height - (tpos.top + tdim.height), 0),
      left: Math.max(tpos.left - cpos.left, 0),
      right: Math.max(cpos.left + cdim.width - (tpos.left + tdim.width), 0)
    };

    // we might have to subtract some more
    if (tpos.top > cpos.top + cdim.height) {
      space.top -= tpos.top - (cpos.top + cdim.height);
    }
    if (tpos.top + tdim.height < cpos.top) {
      space.bottom -= cpos.top - (tpos.top + tdim.height);
    }
    if (
      tpos.left > cpos.left + cdim.width &&
      cpos.left + cdim.width >= tpos.left
    ) {
      space.left -= tpos.left - (cpos.left + cdim.width);
    }
    if (tpos.left + tdim.width < cpos.left) {
      space.right -= cpos.left - (tpos.left + tdim.width);
    }

    this._cache.layouts.containmentSpace = space;

    return space;
  },

  position: function(event) {
    // this function could be called on mousemove with target: 'mouse',
    // prevent repositioning while the tooltip isn't visible yet / unattached
    // it will be positioned initially by show()
    if (!this.visible()) {
      return;
    }

    this.is("positioning", true);

    // first clear the layouts cache, otherwise we might be working with cached positions/dimensions/layouts
    this._cache.layouts = {};

    var _d = this._cache.dimensions; // for onResize callback

    var initialTargetPosition = this.options.position.target,
      initialStemPosition = this.options.position.tooltip,
      stemPosition = initialStemPosition,
      targetPosition = initialTargetPosition;

    this.updateDimensionsToContent(targetPosition, stemPosition);

    var initialPosition = this.getPositionBasedOnTarget(
      targetPosition,
      stemPosition
    );
    var position = deepExtend(initialPosition);

    var results = [];

    if (this.options.containment) {
      var newPositions = {};
      // check if at least one side is contained
      var oneSideContained = false;
      var containmentSides = {};
      $.each(
        "top right bottom left".split(" "),
        $.proxy(function(i, side) {
          if (
            (containmentSides[side] = this.isSideWithinContainment(
              side,
              stemPosition,
              true
            ))
          ) {
            // true ignored padding
            oneSideContained = true;
          }
        }, this)
      );

      // if no side is contained, fake a containment so we instantly position based on initial position
      if (!oneSideContained) {
        position.contained = true;
      }

      if (position.contained) {
        // if no side is contained we can just use this initial position as a fallback
        this.setPosition(position);
      } else {
        // store previous result
        results.unshift({
          position: position,
          targetPosition: targetPosition,
          stemPosition: stemPosition
        });

        // flip the target
        var inversedTarget = Position.flip(initialTargetPosition);
        targetPosition = inversedTarget;
        stemPosition = Position.flip(initialStemPosition);

        // if this side is contained we can try positioning it, otherwise fake uncontained
        if (containmentSides[Position.getSide(targetPosition)]) {
          this.updateDimensionsToContent(targetPosition, stemPosition);
          position = this.getPositionBasedOnTarget(
            targetPosition,
            stemPosition
          );
        } else {
          position.contained = false;
        }

        if (position.contained) {
          this.setPosition(position, stemPosition);
        } else {
          // store previous result
          results.unshift({
            position: position,
            targetPosition: targetPosition,
            stemPosition: stemPosition
          });

          // the origin point we'll be working with for the target is either the last set position or its initial position
          // this allows a tooltip that was previously flipped to become connected to the correct nearest point on the side
          var originTargetPosition = initialTargetPosition;

          // find out how much space we have on either side of the target
          // we ignore padding here since the passed in stemPosition here isn't the correct one, the one below is
          // what we want is just to figure out what has the most visible space within the containment area
          var space = this.getContainmentSpace(stemPosition, true); // ignore padding

          var newMinPos =
            Position.getOrientation(originTargetPosition) === "horizontal"
              ? ["left", "right"]
              : ["top", "bottom"];
          var newSide;
          if (space[newMinPos[0]] === space[newMinPos[1]]) {
            newSide =
              Position.getOrientation(originTargetPosition) === "horizontal"
                ? "left"
                : "top";
          } else {
            newSide =
              newMinPos[space[newMinPos[0]] > space[newMinPos[1]] ? 0 : 1];
          }

          var newCorner = Position.split(originTargetPosition)[1];
          var newTargetPosition = newSide + newCorner;

          var newStemPosition = Position.flip(newTargetPosition);

          targetPosition = newTargetPosition;
          stemPosition = newStemPosition;

          // if this side is contained we can try positioning it, otherwise fake uncontained
          if (containmentSides[Position.getSide(targetPosition)]) {
            this.updateDimensionsToContent(targetPosition, stemPosition);
            position = this.getPositionBasedOnTarget(
              targetPosition,
              stemPosition
            );
          } else {
            position.contained = false;
          }

          if (position.contained) {
            this.setPosition(position, stemPosition);
          } else {
            // store previous result
            results.unshift({
              position: position,
              targetPosition: targetPosition,
              stemPosition: stemPosition
            });

            // the fallback should be the result with the least negative positions
            var fallback;

            // since the array is reversed using unshift we start at the last position working back
            var negatives = [];
            $.each(results, function(i, result) {
              if (result.position.top >= 0 && result.position.left >= 0) {
                fallback = result;
              } else {
                // measure negativity based on how large the negative area is
                var ntop =
                    result.position.top >= 0
                      ? 1
                      : Math.abs(result.position.top),
                  nleft =
                    result.position.left >= 0
                      ? 1
                      : Math.abs(result.position.left);

                negatives.push({ result: result, negativity: ntop * nleft });
              }
            });

            // if we haven't found a fallback yet, go through the negatives to find the least negative one
            if (!fallback) {
              // start with the initial position
              var leastNegative = negatives[negatives.length - 1];

              // check all others to see if we can find a better one
              $.each(negatives, function(i, negative) {
                if (negative.negativity < leastNegative.negativity) {
                  leastNegative = negative;
                }
              });

              fallback = leastNegative.result;
            }

            // fallback
            this.updateDimensionsToContent(
              fallback.targetPosition,
              fallback.stemPosition,
              true
            );
            this.setPosition(fallback.position, fallback.stemPosition);
          }
        }
      }
    } else {
      // now set the position
      this.setPosition(position);
    }

    // onResize, we keep track of the dimensions in cache here
    this._cache.dimensions = this.skin._vars.dimensions;

    this.skin.paint();

    this.is("positioning", false);
  },

  getPositionBasedOnTarget: function(targetPosition, stemPosition) {
    stemPosition = stemPosition || this.options.position.tooltip;

    var dimensions = this.getTargetDimensions();

    var connection = { left: 0, top: 0 },
      max = { left: 0, top: 0 };

    var side = Position.getSide(targetPosition);
    var skinVars = this.skin._vars;
    var frame = skinVars.frames[Position.getSide(stemPosition)];

    var orientation = Position.getOrientation(targetPosition);
    var split = Position.split(targetPosition);
    var half;

    if (orientation === "horizontal") {
      // top/bottom
      half = Math.floor(dimensions.width * 0.5);

      switch (split[2]) {
        case "left":
          max.left = half;
          break;
        case "middle":
          //connection.x = dimensions.width - half;
          connection.left = dimensions.width - half; // we could instead ceil here
          max.left = connection.left;
          break;
        case "right":
          connection.left = dimensions.width;
          max.left = dimensions.width - half;
          break;
      }

      if (split[1] === "bottom") {
        connection.top = dimensions.height;
        max.top = dimensions.height;
      }
    } else {
      // left/right
      half = Math.floor(dimensions.height * 0.5);

      switch (split[2]) {
        case "top":
          max.top = half;
          break;
        case "middle":
          connection.top = dimensions.height - half;
          max.top = connection.top;
          break;
        case "bottom":
          max.top = dimensions.height - half;
          connection.top = dimensions.height;
          break;
      }

      if (split[1] === "right") {
        connection.left = dimensions.width;
        max.left = dimensions.width;
      }
    }

    // Align actual tooltip
    var targetOffset = this.getTargetPosition();

    var target = $.extend({}, dimensions, {
      top: targetOffset.top,
      left: targetOffset.left,
      connection: connection,
      max: max
    });

    var tooltip = {
      width: frame.dimensions.width,
      height: frame.dimensions.height,
      top: 0,
      left: 0,
      connection: skinVars.connections[stemPosition].connection,
      stem: skinVars.connections[stemPosition].stem
    };

    // Align the tooltip
    // first move the top/left to the connection of the target
    tooltip.top = target.top + target.connection.top;
    tooltip.left = target.left + target.connection.left;

    // now move it back by the connection on the tooltip to align it
    tooltip.top -= tooltip.connection.top;
    tooltip.left -= tooltip.connection.left;

    // now find out if the stem is within connection
    if (this.options.stem) {
      var stemWidth = skinVars.stemDimensions.width;
      var positions = {
        stem: {
          top: tooltip.top + tooltip.stem.connection.top,
          left: tooltip.left + tooltip.stem.connection.left
        },
        connection: {
          top: target.top + target.connection.top,
          left: target.left + target.connection.left
        },
        max: {
          top: target.top + target.max.top,
          left: target.left + target.max.left
        }
      };

      if (
        !Position.isPointWithinBox(
          positions.stem.left,
          positions.stem.top,
          positions.connection.left,
          positions.connection.top,
          positions.max.left,
          positions.max.top
        )
      ) {
        // align the stem with the nearest connection point on the target
        var positions = {
          stem: {
            top: tooltip.top + tooltip.stem.connection.top,
            left: tooltip.left + tooltip.stem.connection.left
          },
          connection: {
            top: target.top + target.connection.top,
            left: target.left + target.connection.left
          },
          max: {
            top: target.top + target.max.top,
            left: target.left + target.max.left
          }
        };

        var distances = {
          connection: Position.getDistance(
            positions.stem.left,
            positions.stem.top,
            positions.connection.left,
            positions.connection.top
          ),
          max: Position.getDistance(
            positions.stem.left,
            positions.stem.top,
            positions.max.left,
            positions.max.top
          )
        };

        // closest distance
        var distance = Math.min(distances.connection, distances.max);
        var closest =
          positions[
            distances.connection <= distances.max ? "connection" : "max"
          ];

        // find out on which axis the distance is
        var axis =
          Position.getOrientation(stemPosition) === "horizontal"
            ? "left"
            : "top";
        var closestToMax = Position.getDistance(
          positions.connection.left,
          positions.connection.top,
          positions.max.left,
          positions.max.top
        );

        if (stemWidth <= closestToMax) {
          // shift normally
          var moveToClosest = { top: 0, left: 0 };

          // the movement is on the corresponding axis, by a negative or positive margin, so inverse when needed
          var inversed = closest[axis] < positions.stem[axis] ? -1 : 1;
          moveToClosest[axis] = distance * inversed;

          // can we access stem width here
          moveToClosest[axis] += Math.floor(stemWidth * 0.5) * inversed;

          tooltip.left += moveToClosest.left;
          tooltip.top += moveToClosest.top;
        } else {
          // shift to center which is either closest or max
          // to find out which we calculate the distance to the center of the target
          $.extend(positions, {
            center: {
              top: Math.round(target.top + dimensions.height * 0.5),
              left: Math.round(target.left + dimensions.left * 0.5)
            }
          });

          var distancesToCenter = {
            connection: Position.getDistance(
              positions.center.left,
              positions.center.top,
              positions.connection.left,
              positions.connection.top
            ),
            max: Position.getDistance(
              positions.center.left,
              positions.center.top,
              positions.max.left,
              positions.max.top
            )
          };

          var distance =
            distances[
              distancesToCenter.connection <= distancesToCenter.max
                ? "connection"
                : "max"
            ];

          var moveToCenter = { top: 0, left: 0 };

          // the movement is on the corresponding axis, by a negative or positive margin, so inverse when needed
          var inversed = closest[axis] < positions.stem[axis] ? -1 : 1;
          moveToCenter[axis] = distance * inversed;

          tooltip.left += moveToCenter.left;
          tooltip.top += moveToCenter.top;
        }
      }
    }

    // now add offset
    if (this.options.offset) {
      var offset = $.extend({}, this.options.offset);
      offset = Position.adjustOffsetBasedOnPosition(
        offset,
        this.options.position.target,
        targetPosition
      );
      tooltip.top += offset.y;
      tooltip.left += offset.x;
    }

    // store a containment
    var containment = this.getContainment(
      {
        top: tooltip.top,
        left: tooltip.left
      },
      stemPosition
    );

    var contained = containment.horizontal && containment.vertical;
    var shift = { x: 0, y: 0 }; // movement of the stem

    // we can only correct the stem on the tooltip, so check for containment in its orientation
    var stemOrientation = Position.getOrientation(stemPosition);

    if (!containment[stemOrientation]) {
      var isHorizontalStem = stemOrientation === "horizontal",
        movements = isHorizontalStem ? ["left", "right"] : ["up", "down"],
        correctionDirection = isHorizontalStem ? "x" : "y",
        correctionDirectionTL = isHorizontalStem ? "left" : "top",
        correctPx = containment.correction[correctionDirection];

      // we need to find the negative space threshold
      var containmentLayout = this.getContainmentLayout(stemPosition),
        negativeSpaceThreshold =
          containmentLayout.position[isHorizontalStem ? "left" : "top"]; // used to be 0 but containment padding makes this variable

      if (correctPx !== 0) {
        // we can't correct by 0
        var allowedShift = skinVars.connections[stemPosition].move;
        var allowedShiftPx =
          allowedShift[movements[correctPx * -1 < 0 ? 0 : 1]];
        var multiplier = correctPx < 0 ? -1 : 1;

        if (
          allowedShiftPx >= correctPx * multiplier && // when enough allowed movement
          tooltip[correctionDirectionTL] + correctPx >= negativeSpaceThreshold
        ) {
          tooltip[correctionDirectionTL] += correctPx;
          shift[correctionDirection] = correctPx * -1;

          // now mark as contained
          contained = true;
        } else if (
          Position.getOrientation(targetPosition) ===
          Position.getOrientation(stemPosition)
        ) {
          // STEM + TOOLTIP SHIFT:
          // max shift
          tooltip[correctionDirectionTL] += allowedShiftPx * multiplier;
          shift[correctionDirection] = allowedShiftPx * multiplier * -1;

          // if we've moved into negative space we should apply a correction
          if (tooltip[correctionDirectionTL] < negativeSpaceThreshold) {
            var backPx =
              negativeSpaceThreshold - tooltip[correctionDirectionTL];

            // movement back should still be in allowed range
            // we can't move further back than the tooltip allows in total shift
            var maxBackPx =
              allowedShift[movements[0]] + allowedShift[movements[1]];
            backPx = Math.min(backPx, maxBackPx);

            // only shift the tooltip since it's already maxed out on stem shift
            tooltip[correctionDirectionTL] += backPx;

            // we can shift the stem but not beyond the maximum
            var shiftStemResult = shift[correctionDirection] - backPx;
            if (
              shiftStemResult >=
                skinVars.connections[stemPosition].move[movements[0]] &&
              shiftStemResult <=
                skinVars.connections[stemPosition].move[movements[1]]
            ) {
              shift[correctionDirection] -= backPx; // needed because otherwise the correction on the tooltip could make the stem seem disconnected
            }
          }

          // adjust containment so we can get the correct remaining correction
          containment = this.getContainment(
            {
              top: tooltip.top,
              left: tooltip.left
            },
            stemPosition
          );

          var stillRequiredPx = containment.correction[correctionDirection];

          // for these calculations we require the tooltip position without offset, adding it back later on
          var tooltipWithoutOffset = deepExtend({}, tooltip);

          if (this.options.offset) {
            tooltipWithoutOffset.left -= this.options.offset.x;
            tooltipWithoutOffset.top -= this.options.offset.y;
          }

          var positions = {
            stem: {
              top: tooltipWithoutOffset.top + tooltip.stem.connection.top,
              left: tooltipWithoutOffset.left + tooltip.stem.connection.left
            }
          };
          positions.stem[correctionDirectionTL] += shift[correctionDirection];

          var targetLayout = this.getTargetLayout();
          var stemWidth = skinVars.stemDimensions.width;
          var halfStemWidth = Math.floor(stemWidth * 0.5);
          // the containment threshold on the other side of the negative threshold, we call it positive but it's also sort of a negative
          // used to measure overflow on the right/bottom
          var positiveSpaceThreshold =
            negativeSpaceThreshold +
            containmentLayout.dimensions[isHorizontalStem ? "width" : "height"];

          if (correctionDirection === "x") {
            // find possible x
            var x = targetLayout.position.left + halfStemWidth;
            if (stillRequiredPx > 0) {
              // find leftmost
              x += targetLayout.dimensions.width - halfStemWidth * 2;
            }

            // move the tooltip and stem as far as needed and possible.
            // as far as what's possible on the stem, we allow movement from half a stem width to half a stem width on the other end of the tooltip.
            // the last check on each line is a guard against containment padding.
            if (
              (stillRequiredPx < 0 &&
                positions.stem.left + stillRequiredPx >= x &&
                tooltipWithoutOffset.left + stillRequiredPx >=
                  negativeSpaceThreshold) || // left
              (stillRequiredPx > 0 &&
                positions.stem.left + stillRequiredPx <= x &&
                tooltipWithoutOffset.left + stillRequiredPx <=
                  positiveSpaceThreshold) // right
            ) {
              tooltipWithoutOffset.left += stillRequiredPx;
            }
          } else {
            // possible y
            var y = targetLayout.position.top + halfStemWidth;
            if (stillRequiredPx > 0) {
              // find leftmost
              y += targetLayout.dimensions.height - halfStemWidth * 2;
            }

            // now see if the adjustment is possible
            if (
              (stillRequiredPx < 0 &&
                positions.stem.top + stillRequiredPx >= y &&
                tooltipWithoutOffset.top + stillRequiredPx >=
                  negativeSpaceThreshold) || // top
              (stillRequiredPx > 0 &&
                positions.stem.top + stillRequiredPx <= y &&
                tooltipWithoutOffset.top + stillRequiredPx <=
                  positiveSpaceThreshold) // bottom
            ) {
              tooltipWithoutOffset.top += stillRequiredPx;
            }
          }

          // add back the offset
          tooltip = tooltipWithoutOffset;
          if (this.options.offset) {
            tooltip.left += this.options.offset.x;
            tooltip.top += this.options.offset.y;
          }
        }
      }

      // now it could be that we've moved the tooltip into containment on one side but out of it in the other, to check against this, adjust again
      containment = this.getContainment(
        { top: tooltip.top, left: tooltip.left },
        stemPosition
      );
      contained = containment.horizontal && containment.vertical;
    }

    return {
      top: tooltip.top,
      left: tooltip.left,
      contained: contained,
      shift: shift
    };
  },

  setPosition: function(position, stemPosition) {
    var _p = this._position;

    if (!(_p && _p.top === position.top && _p.left === position.left)) {
      // handle a different container
      var container;
      if (this.options.container !== document.body) {
        if ($.type(this.options.container) === "string") {
          var target = this.target;
          if (target === "mouse") {
            target = this.element;
          }

          container = $(
            $(target)
              .closest(this.options.container)
              .first()
          );
        } else {
          container = $(container);
        }

        // we default to document body, if nothing was found
        // so only use this is we actually have an element
        if (container[0]) {
          var _offset = $(container).offset(),
            offset = {
              top: Math.round(_offset.top),
              left: Math.round(_offset.left)
            },
            scroll = {
              top: Math.round($(container).scrollTop()),
              left: Math.round($(container).scrollLeft())
            };

          position.top -= offset.top;
          position.top += scroll.top;
          position.left -= offset.left;
          position.left += scroll.left;
        }
      }

      this._position = position;

      this._tooltip.css({
        top: position.top,
        left: position.left
      });
    }

    this.skin.setStemPosition(
      stemPosition || this.options.position.tooltip,
      position.shift || { x: 0, y: 0 }
    );
  },

  getSideLine: function(layout, side) {
    var x1 = layout.position.left,
      y1 = layout.position.top,
      x2 = layout.position.left,
      y2 = layout.position.top;

    switch (side) {
      case "top":
        x2 += layout.dimensions.width;
        break;
      case "bottom":
        y1 += layout.dimensions.height;
        x2 += layout.dimensions.width;
        y2 += layout.dimensions.height;
        break;
      case "left":
        y2 += layout.dimensions.height;
        break;
      case "right":
        x1 += layout.dimensions.width;
        x2 += layout.dimensions.width;
        y2 += layout.dimensions.height;
        break;
    }

    return { x1: x1, y1: y1, x2: x2, y2: y2 };
  },

  isSideWithinContainment: function(targetSide, stemPosition, ignorePadding) {
    var containmentLayout = this.getContainmentLayout(
      stemPosition,
      ignorePadding
    );
    var targetLayout = this.getTargetLayout();
    var isWithin = false;

    var targetLine = this.getSideLine(targetLayout, targetSide);

    // if one of the points is within the box we can return true right away
    if (
      Position.isPointWithinBoxLayout(
        targetLine.x1,
        targetLine.y1,
        containmentLayout
      ) ||
      Position.isPointWithinBoxLayout(
        targetLine.x2,
        targetLine.y2,
        containmentLayout
      )
    ) {
      return true;
    } else {
      // the box forming the target might better bigger than the containment area
      // so we should check if the line forming the sides intersects with one of the lines forming the containment area
      var intersects = false;
      $.each(
        "top right bottom left".split(" "),
        $.proxy(function(i, s) {
          var line = this.getSideLine(containmentLayout, s);

          if (
            Position.intersectsLine(
              targetLine.x1,
              targetLine.y1,
              targetLine.x2,
              targetLine.y2,
              line.x1,
              line.y1,
              line.x2,
              line.y2
            )
          ) {
            intersects = true;
            return false;
          }
        }, this)
      );

      return intersects;
    }
  },

  getContainment: function(position, stemPosition) {
    var contained = {
      horizontal: true,
      vertical: true,
      correction: { y: 0, x: 0 }
    };

    if (this.options.containment) {
      var containmentLayout = this.getContainmentLayout(stemPosition);

      var dimensions = this.skin._vars.frames[Position.getSide(stemPosition)]
        .dimensions;

      if (this.options.containment) {
        if (
          position.left < containmentLayout.position.left ||
          position.left + dimensions.width >
            containmentLayout.position.left + containmentLayout.dimensions.width
        ) {
          contained.horizontal = false;

          // store the correction that would be required
          if (position.left < containmentLayout.position.left) {
            contained.correction.x =
              containmentLayout.position.left - position.left;
          } else {
            contained.correction.x =
              containmentLayout.position.left +
              containmentLayout.dimensions.width -
              (position.left + dimensions.width);
          }
        }
        if (
          position.top < containmentLayout.position.top ||
          position.top + dimensions.height >
            containmentLayout.position.top + containmentLayout.dimensions.height
        ) {
          contained.vertical = false;

          // store the correction that would be required
          if (position.top < containmentLayout.position.top) {
            contained.correction.y =
              containmentLayout.position.top - position.top;
          } else {
            contained.correction.y =
              containmentLayout.position.top +
              containmentLayout.dimensions.height -
              (position.top + dimensions.height);
          }
        }
      }
    }

    return contained;
  },

  // stemPosition is used here since it might change containment padding
  getContainmentLayout: function(stemPosition, ignorePadding) {
    var viewportScroll = {
      top: $(window).scrollTop(),
      left: $(window).scrollLeft()
    };

    var target = this.target;
    if (target === "mouse") {
      target = this.element;
    }

    var area = $(target)
      .closest(this.options.containment.selector)
      .first()[0];

    var layout;

    if (!area || this.options.containment.selector === "viewport") {
      layout = {
        dimensions: Bounds.viewport(),
        position: viewportScroll
      };
    } else {
      layout = {
        dimensions: {
          width: $(area).innerWidth(),
          height: $(area).innerHeight()
        },
        position: $(area).offset()
      };
    }

    var padding = this.options.containment.padding;
    if (padding && !ignorePadding) {
      var maxDim = Math.max(layout.dimensions.height, layout.dimensions.width);
      if (padding * 2 > maxDim) {
        padding = Math.max(Math.floor(maxDim * 0.5), 0);
      }

      if (padding) {
        layout.dimensions.width -= 2 * padding;
        layout.dimensions.height -= 2 * padding;
        layout.position.top += padding;
        layout.position.left += padding;

        // when the stem is on the left/right we don't want the padding there so
        // the padding doesn't interfere with the stem once the viewport becomes smaller
        // we only want padding on one side in those situations
        var orientation = Position.getOrientation(stemPosition);

        // left/right
        if (orientation === "vertical") {
          layout.dimensions.width += padding;

          if (Position.getSide(stemPosition) === "left") {
            layout.position.left -= padding;
          }
        } else {
          // top/bottom
          layout.dimensions.height += padding;

          if (Position.getSide(stemPosition) === "top") {
            layout.position.top -= padding;
          }
        }
      }
    }

    this._cache.layouts.containmentLayout = layout;

    return layout;
  },

  // room top/bottom/left/right on the element compared to the mouse position
  getMouseRoom: function() {
    var room = {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    };

    if (this.options.target === "mouse" && !this.is("api")) {
      var actualMousePosition = Mouse.getActualPosition(this._cache.event);
      var elementPosition = $(this.element).offset();
      var elementDimensions = {
        width: $(this.element).innerWidth(),
        height: $(this.element).innerHeight()
      };
      room = {
        top: Math.max(0, actualMousePosition.top - elementPosition.top),
        bottom: Math.max(
          0,
          elementPosition.top +
            elementDimensions.height -
            actualMousePosition.top
        ),
        left: Math.max(0, actualMousePosition.left - elementPosition.left),
        right: Math.max(
          0,
          elementPosition.left +
            elementDimensions.width -
            actualMousePosition.left
        )
      };
    }

    return room;
  },

  // Target layout
  getTargetPosition: function() {
    var position, offset;

    if (this.options.target === "mouse") {
      if (this.is("api")) {
        // when we've called this method from the API, use the element position instead
        offset = $(this.element).offset();
        position = {
          top: Math.round(offset.top),
          left: Math.round(offset.left)
        };
      } else {
        // mouse position is safe to use
        position = Mouse.getPosition(this._cache.event);
      }
    } else {
      offset = $(this.target).offset();
      position = {
        top: Math.round(offset.top),
        left: Math.round(offset.left)
      };
    }

    this._cache.layouts.targetPosition = position;

    return position;
  },
  getTargetDimensions: function() {
    if (this._cache.layouts.targetDimensions)
      return this._cache.layouts.targetDimensions;

    var dimensions;

    if (this.options.target === "mouse") {
      dimensions = Mouse.getDimensions();
    } else {
      dimensions = {
        width: $(this.target).innerWidth(),
        height: $(this.target).innerHeight()
      };
    }

    this._cache.layouts.targetDimensions = dimensions;

    return dimensions;
  },
  getTargetLayout: function() {
    if (this._cache.layouts.targetLayout)
      return this._cache.layouts.targetLayout;

    var layout = {
      position: this.getTargetPosition(),
      dimensions: this.getTargetDimensions()
    };

    this._cache.layouts.targetLayout = layout;

    return layout;
  },

  getPaddingLine: function(targetPosition) {
    var targetLayout = this.getTargetLayout();

    var side = "left";
    if (Position.getOrientation(targetPosition) === "vertical") {
      return this.getSideLine(targetLayout, Position.getSide(targetPosition));
    } else {
      if (Position.isCorner(targetPosition)) {
        var corner = Position.inverseCornerPlane(targetPosition);
        side = Position.getSide(corner);
        return this.getSideLine(targetLayout, side);
      } else {
        // middle top or bottom
        var line = this.getSideLine(targetLayout, side);

        // we have to add half the width to the lane for it to span the entire middle as a line
        var halfWidth = Math.round(targetLayout.dimensions.width * 0.5);
        line.x1 += halfWidth;
        line.x2 += halfWidth;

        return line;
      }
    }
  }
});
