var Position = {
  positions: [
    "topleft",
    "topmiddle",
    "topright",
    "righttop",
    "rightmiddle",
    "rightbottom",
    "bottomright",
    "bottommiddle",
    "bottomleft",
    "leftbottom",
    "leftmiddle",
    "lefttop"
  ],

  regex: {
    toOrientation: /^(top|left|bottom|right)(top|left|bottom|right|middle|center)$/,
    horizontal: /^(top|bottom)/,
    isCenter: /(middle|center)/,
    side: /^(top|bottom|left|right)/
  },

  toDimension: (function() {
    var translate = {
      top: "height",
      left: "width",
      bottom: "height",
      right: "width"
    };

    return function(position) {
      return translate[position];
    };
  })(),

  isCenter: function(position) {
    return !!position.toLowerCase().match(this.regex.isCenter);
  },

  isCorner: function(position) {
    return !this.isCenter(position);
  },

  //returns 'horizontal' or 'vertical' based on the options object
  getOrientation: function(position) {
    return position.toLowerCase().match(this.regex.horizontal)
      ? "horizontal"
      : "vertical";
  },

  getSide: function(position) {
    var side = null,
      matches = position.toLowerCase().match(this.regex.side);
    if (matches && matches[1]) side = matches[1];
    return side;
  },

  split: function(position) {
    return position.toLowerCase().match(this.regex.toOrientation);
  },

  _flip: {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left"
  },
  flip: function(position, corner) {
    var split = this.split(position);

    if (corner) {
      return this.inverseCornerPlane(
        this.flip(this.inverseCornerPlane(position))
      );
    } else {
      return this._flip[split[1]] + split[2];
    }
  },

  inverseCornerPlane: function(position) {
    if (Position.isCorner(position)) {
      var split = this.split(position);
      return split[2] + split[1];
    } else {
      return position;
    }
  },

  adjustOffsetBasedOnPosition: function(
    offset,
    defaultTargetPosition,
    targetPosition
  ) {
    var adjustedOffset = $.extend({}, offset);
    var orientationXY = { horizontal: "x", vertical: "y" };
    var inverseXY = { x: "y", y: "x" };

    var inverseSides = {
      top: { right: "x" },
      bottom: { left: "x" },
      left: { bottom: "y" },
      right: { top: "y" }
    };

    var defaultOrientation = Position.getOrientation(defaultTargetPosition);
    if (defaultOrientation === Position.getOrientation(targetPosition)) {
      // we're on the same orientation
      // inverse when needed
      if (
        Position.getSide(defaultTargetPosition) !==
        Position.getSide(targetPosition)
      ) {
        var inverse = inverseXY[orientationXY[defaultOrientation]];
        adjustedOffset[inverse] *= -1;
      }
    } else {
      // moving to a side
      // flipXY
      var fx = adjustedOffset.x;
      adjustedOffset.x = adjustedOffset.y;
      adjustedOffset.y = fx;

      //  inversing x or y might be required based on movement
      var inverseSide =
        inverseSides[Position.getSide(defaultTargetPosition)][
          Position.getSide(targetPosition)
        ];
      if (inverseSide) {
        adjustedOffset[inverseSide] *= -1;
      }

      // nullify x or y
      // move to left/right (vertical) = nullify y
      adjustedOffset[
        orientationXY[Position.getOrientation(targetPosition)]
      ] = 0;
    }

    return adjustedOffset;
  },

  getBoxFromPoints: function(x1, y1, x2, y2) {
    var minX = Math.min(x1, x2),
      maxX = Math.max(x1, x2),
      minY = Math.min(y1, y2),
      maxY = Math.max(y1, y2);

    return {
      left: minX,
      top: minY,
      width: Math.max(maxX - minX, 0),
      height: Math.max(maxY - minY, 0)
    };
  },

  isPointWithinBox: function(x1, y1, bx1, by1, bx2, by2) {
    var box = this.getBoxFromPoints(bx1, by1, bx2, by2);

    return (
      x1 >= box.left &&
      x1 <= box.left + box.width &&
      y1 >= box.top &&
      y1 <= box.top + box.height
    );
  },
  isPointWithinBoxLayout: function(x, y, layout) {
    return this.isPointWithinBox(
      x,
      y,
      layout.position.left,
      layout.position.top,
      layout.position.left + layout.dimensions.width,
      layout.position.top + layout.dimensions.height
    );
  },

  getDistance: function(x1, y1, x2, y2) {
    return Math.sqrt(
      Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2)
    );
  },

  intersectsLine: (function() {
    var ccw = function(x1, y1, x2, y2, x3, y3) {
      var cw = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
      return cw > 0 ? true : cw < 0 ? false : true;
    };

    return function(x1, y1, x2, y2, x3, y3, x4, y4, isReturnPosition) {
      if (!isReturnPosition) {
        /* http://www.bryceboe.com/2006/10/23/line-segment-intersection-algorithm/comment-page-1/ */
        return (
          ccw(x1, y1, x3, y3, x4, y4) != ccw(x2, y2, x3, y3, x4, y4) &&
          ccw(x1, y1, x2, y2, x3, y3) != ccw(x1, y1, x2, y2, x4, y4)
        );
      }

      /* http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345 */
      var s1_x, s1_y, s2_x, s2_y;
      s1_x = x2 - x1;
      s1_y = y2 - y1;
      s2_x = x4 - x3;
      s2_y = y4 - y3;

      var s, t;
      s = (-s1_y * (x1 - x3) + s1_x * (y1 - y3)) / (-s2_x * s1_y + s1_x * s2_y);
      t = (s2_x * (y1 - y3) - s2_y * (x1 - x3)) / (-s2_x * s1_y + s1_x * s2_y);

      if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
        var atX = x1 + t * s1_x;
        var atY = y1 + t * s1_y;
        return { x: atX, y: atY };
      }

      return false; // No collision
    };
  })()
};
