$.extend(Tooltip.prototype, {
  // states
  is: function(question, answer) {
    if ($.type(answer) === "boolean") {
      this._cache.is[question] = answer;
    }

    return this._cache.is[question];
  },

  visible: function() {
    return this.is("visible");
  }
});
