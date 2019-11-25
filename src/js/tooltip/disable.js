$.extend(Tooltip.prototype, {
  disable: function() {
    if (this.is("disabled")) return;
    this.is("disabled", true);
  },

  enable: function() {
    if (!this.is("disabled")) return;
    this.is("disabled", false);
  }
});
