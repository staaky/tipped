var Mouse = {
  _buffer: { pageX: 0, pageY: 0 },
  _dimensions: {
    width: 30, // should both be even
    height: 30
  },
  _shift: {
    x: 2,
    y: 10 // correction so the tooltip doesn't appear on top of the mouse
  },

  // a modified version of the actual position, to match the box
  getPosition: function(event) {
    var position = this.getActualPosition(event);

    return {
      left:
        position.left -
        Math.round(this._dimensions.width * 0.5) +
        this._shift.x,
      top:
        position.top - Math.round(this._dimensions.height * 0.5) + this._shift.y
    };
  },

  getActualPosition: function(event) {
    var position =
      event && $.type(event.pageX) === "number" ? event : this._buffer;

    return {
      left: position.pageX,
      top: position.pageY
    };
  },

  getDimensions: function() {
    return this._dimensions;
  }
};
