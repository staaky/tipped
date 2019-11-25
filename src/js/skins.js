Tipped.Skins = {
  // base skin, don't modify! (create custom skins in a separate file)
  base: {
    afterUpdate: false,
    ajax: {},
    cache: true,
    container: false,
    containment: {
      selector: "viewport",
      padding: 5
    },
    close: false,
    detach: true,
    fadeIn: 200,
    fadeOut: 200,
    showDelay: 75,
    hideDelay: 25,
    hideAfter: false,
    hideOn: { element: "mouseleave" },
    hideOthers: false,
    position: "top",
    inline: false,
    offset: { x: 0, y: 0 },
    onHide: false,
    onShow: false,
    padding: true,
    radius: true,
    shadow: true,
    showOn: { element: "mousemove" },
    size: "medium",
    spinner: true,
    stem: true,
    target: "element",
    voila: true
  },

  // Every other skin inherits from this one
  reset: {
    ajax: false,
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseleave"
    },
    showOn: {
      element: "mouseenter",
      tooltip: "mouseenter"
    }
  }
};

$.each(
  "dark light gray red green blue lightyellow lightblue lightpink".split(" "),
  function(i, s) {
    Tipped.Skins[s] = {};
  }
);
