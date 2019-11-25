Tipped.Behaviors = {
  hide: {
    showOn: {
      element: "mouseenter",
      tooltip: false
    },
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseenter"
    }
  },

  mouse: {
    showOn: {
      element: "mouseenter",
      tooltip: false
    },
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseenter"
    },
    target: "mouse",
    showDelay: 100,
    fadeIn: 0,
    hideDelay: 0,
    fadeOut: 0
  },

  sticky: {
    showOn: {
      element: "mouseenter",
      tooltip: "mouseenter"
    },
    hideOn: {
      element: "mouseleave",
      tooltip: "mouseleave"
    },
    // more show delay solves issues positioning at the initial mouse
    // position when elements span multiple lines/line-breaks, since
    // the mouse won't be positioning close to the edge
    showDelay: 150,
    target: "mouse",
    fixed: true
  }
};
