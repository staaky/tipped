var Tooltips = {
  tooltips: {},

  options: {
    defaultSkin: "dark",
    startingZIndex: 999999
  },

  _emptyClickHandler: function() {},

  init: function() {
    this.reset();

    this._resizeHandler = $.proxy(this.onWindowResize, this);
    $(window).bind("resize orientationchange", this._resizeHandler);

    if (Browser.MobileSafari) {
      $("body").bind("click", this._emptyClickHandler);
    }
  },

  reset: function() {
    Tooltips.removeAll();

    Delegations.removeAll();

    if (this._resizeHandler) {
      $(window).unbind("resize orientationchange", this._resizeHandler);
    }

    if (Browser.MobileSafari) {
      $("body").unbind("click", this._emptyClickHandler);
    }
  },

  onWindowResize: function() {
    if (this._resizeTimer) {
      window.clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    }

    this._resizeTimer = _.delay(
      $.proxy(function() {
        var visible = this.getVisible();
        $.each(visible, function(i, tooltip) {
          tooltip.clearUpdatedTo();

          tooltip.position();
        });
      }, this),
      15
    );
  },

  _getTooltips: function(element, noClosest) {
    var uids = [],
      tooltips = [],
      u;

    if (_.isElement(element)) {
      if ((u = $(element).data("tipped-uids"))) uids = uids.concat(u);
    } else {
      // selector
      $(element).each(function(i, el) {
        if ((u = $(el).data("tipped-uids"))) uids = uids.concat(u);
      });
    }

    if (!uids[0] && !noClosest) {
      // find a uids string
      var closestTooltip = this.getTooltipByTooltipElement(
        $(element).closest(".tpd-tooltip")[0]
      );
      if (closestTooltip && closestTooltip.element) {
        u = $(closestTooltip.element).data("tipped-uids") || [];
        if (u) uids = uids.concat(u);
      }
    }

    if (uids.length > 0) {
      $.each(
        uids,
        $.proxy(function(i, uid) {
          var tooltip;
          if ((tooltip = this.tooltips[uid])) {
            tooltips.push(tooltip);
          }
        }, this)
      );
    }

    return tooltips;
  },

  // Returns the element for which the tooltip was created when given a tooltip element or any element within that tooltip.
  findElement: function(element) {
    var tooltips = [];

    if (_.isElement(element)) {
      tooltips = this._getTooltips(element);
    }

    return tooltips[0] && tooltips[0].element;
  },

  get: function(element) {
    var options = $.extend(
      {
        api: false
      },
      arguments[1] || {}
    );

    var matched = [];
    if (_.isElement(element)) {
      matched = this._getTooltips(element);
    } else if (element instanceof $) {
      // when a jQuery object, search every element
      element.each(
        $.proxy(function(i, el) {
          var tooltips = this._getTooltips(el, true);
          if (tooltips.length > 0) {
            matched = matched.concat(tooltips);
          }
        }, this)
      );
    } else if ($.type(element) === "string") {
      // selector
      $.each(this.tooltips, function(i, tooltip) {
        if (tooltip.element && $(tooltip.element).is(element)) {
          matched.push(tooltip);
        }
      });
    }

    // if api is set we'll mark the given tooltips as using the API
    if (options.api) {
      $.each(matched, function(i, tooltip) {
        tooltip.is("api", true);
      });
    }

    return matched;
  },

  getTooltipByTooltipElement: function(element) {
    if (!element) return null;
    var matched = null;
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.is("build") && tooltip._tooltip[0] === element) {
        matched = tooltip;
      }
    });
    return matched;
  },

  getBySelector: function(selector) {
    var matched = [];
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.element && $(tooltip.element).is(selector)) {
        matched.push(tooltip);
      }
    });
    return matched;
  },

  getNests: function() {
    var matched = [];
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.is("nest")) {
        // safe cause when a tooltip is a nest it's already build
        matched.push(tooltip);
      }
    });
    return matched;
  },

  show: function(selector) {
    $(this.get(selector)).each(function(i, tooltip) {
      tooltip.show(false, true); // not instant, but without delay
    });
  },

  hide: function(selector) {
    $(this.get(selector)).each(function(i, tooltip) {
      tooltip.hide();
    });
  },

  toggle: function(selector) {
    $(this.get(selector)).each(function(i, tooltip) {
      tooltip.toggle();
    });
  },

  hideAll: function(but) {
    $.each(this.getVisible(), function(i, tooltip) {
      if (but && but === tooltip) return;
      tooltip.hide();
    });
  },

  refresh: function(selector) {
    // find only those tooltips that are visible
    var tooltips;
    if (selector) {
      // filter out only those visible
      tooltips = $.grep(this.get(selector), function(tooltip, i) {
        return tooltip.is("visible");
      });
    } else {
      // all visible tooltips
      tooltips = this.getVisible();
    }

    $.each(tooltips, function(i, tooltip) {
      tooltip.refresh();
    });
  },

  getVisible: function() {
    var visible = [];
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.visible()) {
        visible.push(tooltip);
      }
    });
    return visible;
  },

  isVisibleByElement: function(element) {
    var visible = false;
    if (_.isElement(element)) {
      $.each(this.getVisible() || [], function(i, tooltip) {
        if (tooltip.element === element) {
          visible = true;
          return false;
        }
      });
    }
    return visible;
  },

  getHighestTooltip: function() {
    var Z = 0,
      h;
    $.each(this.tooltips, function(i, tooltip) {
      if (tooltip.zIndex > Z) {
        Z = tooltip.zIndex;
        h = tooltip;
      }
    });
    return h;
  },

  resetZ: function() {
    // the zIndex only has to be restore when there are no visible tooltip
    // use find to $break when a a visible tooltip is found
    if (this.getVisible().length <= 1) {
      $.each(this.tooltips, function(i, tooltip) {
        // only reset on tooltip that don't have the zIndex option set
        if (tooltip.is("build") && !tooltip.options.zIndex) {
          tooltip._tooltip.css({
            zIndex: (tooltip.zIndex = +Tooltips.options.startingZIndex)
          });
        }
      });
    }
  },

  // AjaxCache
  clearAjaxCache: function() {
    // if there's an _cache.xhr running, abort it for all tooltips
    // set updated state to false for all
    $.each(
      this.tooltips,
      $.proxy(function(i, tooltip) {
        if (tooltip.options.ajax) {
          // abort possible running request
          if (tooltip._cache && tooltip._cache.xhr) {
            tooltip._cache.xhr.abort();
            tooltip._cache.xhr = null;
          }

          // reset state
          tooltip.is("updated", false);
          tooltip.is("updating", false);
          tooltip.is("sanitized", false); // sanitize again
        }
      }, this)
    );

    AjaxCache.clear();
  },

  add: function(tooltip) {
    this.tooltips[tooltip.uid] = tooltip;
  },

  remove: function(element) {
    var tooltips = this._getTooltips(element);
    this.removeTooltips(tooltips);
  },

  removeTooltips: function(tooltips) {
    if (!tooltips) return;

    $.each(
      tooltips,
      $.proxy(function(i, tooltip) {
        var uid = tooltip.uid;

        delete this.tooltips[uid];

        tooltip.remove(); // also removes uid from element
      }, this)
    );
  },

  // remove all tooltips that are not attached to the DOM
  removeDetached: function() {
    // first find all nests
    var nests = this.getNests(),
      detached = [];
    if (nests.length > 0) {
      $.each(nests, function(i, nest) {
        if (nest.is("detached")) {
          detached.push(nest);
          nest.attach();
        }
      });
    }

    $.each(
      this.tooltips,
      $.proxy(function(i, tooltip) {
        if (tooltip.element && !_.element.isAttached(tooltip.element)) {
          this.remove(tooltip.element);
        }
      }, this)
    );

    // restore previously detached nests
    // if they haven't been removed
    $.each(detached, function(i, nest) {
      nest.detach();
    });
  },

  removeAll: function() {
    $.each(
      this.tooltips,
      $.proxy(function(i, tooltip) {
        if (tooltip.element) {
          this.remove(tooltip.element);
        }
      }, this)
    );
    this.tooltips = {};
  },

  setDefaultSkin: function(name) {
    this.options.defaultSkin = name || "dark";
  },

  setStartingZIndex: function(index) {
    this.options.startingZIndex = index || 0;
  }
};

// Extra position functions, used in Options
Tooltips.Position = {
  inversedPosition: {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
    middle: "middle",
    center: "center"
  },

  getInversedPosition: function(position) {
    var positions = Position.split(position),
      left = positions[1],
      right = positions[2],
      orientation = Position.getOrientation(position),
      options = $.extend(
        {
          horizontal: true,
          vertical: true
        },
        arguments[1] || {}
      );

    if (orientation === "horizontal") {
      if (options.vertical) {
        left = this.inversedPosition[left];
      }
      if (options.horizontal) {
        right = this.inversedPosition[right];
      }
    } else {
      // vertical
      if (options.vertical) {
        right = this.inversedPosition[right];
      }
      if (options.horizontal) {
        left = this.inversedPosition[left];
      }
    }

    return left + right;
  },

  // what we do here is inverse topleft -> bottomleft instead of bottomright
  // and lefttop -> righttop instead of rightbottom
  getTooltipPositionFromTarget: function(position) {
    var positions = Position.split(position);
    return this.getInversedPosition(
      positions[1] + this.inversedPosition[positions[2]]
    );
  }
};
