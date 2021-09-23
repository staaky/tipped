$.extend(Tooltip.prototype, {
  setActive: function () {
    this.is("active", true);

    //  raise the tooltip if it's visible
    if (this.visible()) {
      this.raise();
    }

    if (this.options.hideAfter) {
      this.clearTimer("idle");
    }
  },
  setIdle: function () {
    this.is("active", false);

    if (this.options.hideAfter) {
      this.setTimer(
        "idle",
        function () {
          this.clearTimer("idle");

          if (!this.is("active")) {
            this.hide();
          }
        }.bind(this),
        this.options.hideAfter
      );
    }
  },
});
