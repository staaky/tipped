function Tooltip() {
  this.initialize.apply(this, _slice.call(arguments));
}

$.extend(Tooltip.prototype, {
  supportsLoading: Support.css.transform && Support.css.animation,

  initialize: function(element, content) {
    this.element = element;
    if (!this.element) return;

    var options;
    if (
      $.type(content) === "object" &&
      !(
        _.isElement(content) ||
        _.isText(content) ||
        _.isDocumentFragment(content) ||
        content instanceof $
      )
    ) {
      options = content;
      content = null;
    } else {
      options = arguments[2] || {};
    }

    // append element options if data-tpd-options
    var dataOptions = $(element).data("tipped-options");
    if (dataOptions) {
      options = deepExtend(
        $.extend({}, options),
        eval("({" + dataOptions + "})")
      );
    }

    this.options = Options.create(options);

    // all the garbage goes in here
    this._cache = {
      dimensions: {
        width: 0,
        height: 0
      },
      events: [],
      timers: {},
      layouts: {},
      is: {},
      fnCallFn: "",
      updatedTo: {}
    };

    // queues for effects
    this.queues = {
      showhide: $({})
    };

    // title
    var title =
      $(element).attr("title") || $(element).data("tipped-restore-title");

    if (!content) {
      // grab the content off the attribute
      var dt = $(element).attr("data-tipped");

      if (dt) {
        content = dt;
      } else if (title) {
        content = title;
      }

      if (content) {
        // avoid scripts in title/data-tipped
        var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        content = content.replace(SCRIPT_REGEX, "");
      }
    }

    if (
      (!content || (content instanceof $ && !content[0])) &&
      !((this.options.ajax && this.options.ajax.url) || this.options.inline)
    ) {
      this._aborted = true;
      return;
    }

    // backup title
    if (title) {
      // backup the title so we can restore it once the tooltip is removed
      $(element).data("tipped-restore-title", title);
      $(element)[0].setAttribute("title", ""); // IE needs setAttribute
    }

    this.content = content;
    this.title = $(this.element).data("tipped-title");
    if ($.type(this.options.title) != "undefined")
      this.title = this.options.title;

    this.zIndex = this.options.zIndex || +Tooltips.options.startingZIndex;

    // make sure the element has a uids array
    var uids = $(element).data("tipped-uids"); //, initial_uid = uid;
    if (!uids) {
      uids = [];
    }

    // generate a new uid
    var uid = getUID();
    this.uid = uid;
    uids.push(uid);

    // store grown uids array back into data
    $(element).data("tipped-uids", uids);

    // mark parent tooltips as being a nest if this tooltip is created on an element within another tooltip
    var parentTooltipElement = $(this.element).closest(".tpd-tooltip")[0],
      parentTooltip;
    if (
      parentTooltipElement &&
      (parentTooltip = Tooltips.getTooltipByTooltipElement(
        parentTooltipElement
      ))
    ) {
      parentTooltip.is("nest", true);
    }

    // set the target
    var target = this.options.target;
    this.target =
      target === "mouse"
        ? this.element
        : target === "element" || !target
        ? this.element
        : _.isElement(target)
        ? target
        : target instanceof $ && target[0]
        ? target[0]
        : this.element;

    // for inline content
    if (this.options.inline) {
      this.content = $("#" + this.options.inline)[0];
    }

    // ajax might not be using ajax: { url: ... } but instead have the 2nd parameter as its url
    // we store _content
    if (this.options.ajax) {
      this.__content = this.content;
    }

    // function as content
    if ($.type(this.content) === "function") {
      this._fn = this.content;
    }

    this.preBuild();

    Tooltips.add(this);
  },

  remove: function() {
    this.unbind();

    this.clearTimers();

    // restore content if it was an element attached to the DOM before insertion
    this.restoreElementToMarker();

    this.stopLoading();
    this.abort();

    // delete the tooltip
    if (this.is("build") && this._tooltip) {
      this._tooltip.remove();
      this._tooltip = null;
    }

    var uids = $(this.element).data("tipped-uids") || [];
    var uid_index = $.inArray(this.uid, uids);
    if (uid_index > -1) {
      uids.splice(uid_index, 1);
      $(this.element).data("tipped-uids", uids);
    }

    if (uids.length < 1) {
      // restore title
      var da = "tipped-restore-title",
        r_title;
      if ((r_title = $(this.element).data(da))) {
        // only restore it when the title hasn't been altered
        if (!$(this.element)[0].getAttribute("title") != "") {
          $(this.element).attr("title", r_title);
        }
        // remove the data
        $(this.element).removeData(da);
      }

      // remove the data attribute uid
      $(this.element).removeData("tipped-uids");
    }

    // remove any delegation classes
    var classList = $(this.element).attr("class") || "",
      newClassList = classList
        .replace(/(tpd-delegation-uid-)\d+/g, "")
        .replace(/^\s\s*/, "")
        .replace(/\s\s*$/, ""); // trim whitespace
    $(this.element).attr("class", newClassList);
  },

  detach: function() {
    if (this.options.detach && !this.is("detached")) {
      if (this._tooltip) this._tooltip.detach();
      this.is("detached", true);
    }
  },

  attach: function() {
    if (this.is("detached")) {
      var container;
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
        container = $(this.options.container);
      }

      // we default to document body, if nothing was found
      if (!container[0]) container = $(document.body);

      container.append(this._tooltip);
      this.is("detached", false);
    }
  },

  preBuild: function() {
    this.is("detached", true);

    var initialCSS = {
      left: "-10000px", // TODO: remove
      top: "-10000px",
      opacity: 0,
      zIndex: this.zIndex
    };

    this._tooltip = $("<div>")
      .addClass("tpd-tooltip")
      .addClass("tpd-skin-" + this.options.skin)
      .addClass("tpd-size-" + this.options.size)
      .css(initialCSS)
      .hide();

    this.createPreBuildObservers();
  },

  build: function() {
    if (this.is("build")) return;

    this.attach();

    this._tooltip.append((this._skin = $("<div>").addClass("tpd-skin"))).append(
      (this._contentWrapper = $("<div>")
        .addClass("tpd-content-wrapper")
        .append(
          (this._contentSpacer = $("<div>")
            .addClass("tpd-content-spacer")
            .append(
              (this._titleWrapper = $("<div>")
                .addClass("tpd-title-wrapper")
                .append(
                  (this._titleSpacer = $("<div>")
                    .addClass("tpd-title-spacer")
                    .append(
                      (this._titleRelative = $("<div>")
                        .addClass("tpd-title-relative")
                        .append(
                          (this._titleRelativePadder = $("<div>")
                            .addClass("tpd-title-relative-padder")
                            .append(
                              (this._title = $("<div>").addClass("tpd-title"))
                            ))
                        ))
                    ))
                )
                .append(
                  (this._close = $("<div>")
                    .addClass("tpd-close")
                    .append(
                      $("<div>")
                        .addClass("tpd-close-icon")
                        .html("&times;")
                    ))
                ))
            )
            .append(
              (this._contentRelative = $("<div>")
                .addClass("tpd-content-relative")
                .append(
                  (this._contentRelativePadder = $("<div>")
                    .addClass("tpd-content-relative-padder")
                    .append(
                      (this._content = $("<div>").addClass("tpd-content"))
                    ))
                )
                .append(
                  (this._inner_close = $("<div>")
                    .addClass("tpd-close")
                    .append(
                      $("<div>")
                        .addClass("tpd-close-icon")
                        .html("&times;")
                    ))
                ))
            ))
        ))
    );

    this.skin = new Skin(this); // TODO: remove instances of is('skinned'), and look into why they are there

    // set radius of contenspacer to be that found on the skin
    this._contentSpacer.css({
      "border-radius": Math.max(
        this.skin._css.radius - this.skin._css.border,
        0
      )
    });

    this.createPostBuildObservers();

    this.is("build", true);
  },

  createPostBuildObservers: function() {
    // x
    this._tooltip.delegate(
      ".tpd-close, .close-tooltip",
      "click",
      $.proxy(function(event) {
        // this helps prevent the click on x to trigger a click on the body
        // which could conflict with some scripts
        event.stopPropagation();
        event.preventDefault();

        this.is("api", false);

        this.hide(true);
      }, this)
    );
  },

  createPreBuildObservers: function() {
    // what can be observed before build
    // - the element
    this.bind(this.element, "mouseenter", this.setActive); // mousemove
    this.bind(
      this._tooltip,
      // avoid double click issues
      Support.touch && Browser.MobileSafari ? "touchstart" : "mouseenter",
      this.setActive
    );

    // idle stats
    this.bind(this.element, "mouseleave", function(event) {
      this.setIdle(event);
    });
    this.bind(this._tooltip, "mouseleave", function(event) {
      this.setIdle(event);
    });

    if (this.options.showOn) {
      $.each(
        this.options.showOn,
        $.proxy(function(name, events) {
          var element,
            toggleable = false;

          switch (name) {
            case "element":
              element = this.element;

              if (
                this.options.hideOn &&
                this.options.showOn &&
                this.options.hideOn.element === "click" &&
                this.options.showOn.element === "click"
              ) {
                toggleable = true;
                this.is("toggleable", toggleable);
              }
              break;

            case "tooltip":
              element = this._tooltip;
              break;
            case "target":
              element = this.target;
              break;
          }

          if (!element) return;

          if (events) {
            // Translate mouseenter to touchstart
            // just for the tooltip to fix double click issues
            // https://davidwalsh.name/ios-hover-menu-fix
            var useEvents = events;

            this.bind(
              element,
              useEvents,
              events === "click" && toggleable
                ? function(event) {
                    this.is("api", false);
                    this.toggle();
                  }
                : function(event) {
                    this.is("api", false);
                    this.showDelayed();
                  }
            );
          }
        }, this)
      );

      // iOS requires that we track touchend time to avoid
      // links requiring a double-click
      if (Support.touch && Browser.MobileSafari) {
        this.bind(this._tooltip, "touchend", function() {
          this._tooltipTouchEndTime = new Date().getTime();
        });
      }
    }

    if (this.options.hideOn) {
      $.each(
        this.options.hideOn,
        $.proxy(function(name, events) {
          var element;

          switch (name) {
            case "element":
              // no events needed if the element toggles
              if (this.is("toggleable") && events === "click") return;
              element = this.element;
              break;
            case "tooltip":
              element = this._tooltip;
              break;
            case "target":
              element = this.target;
              break;
          }

          // if we don't have an element now we don't have to attach anything
          if (!element) return;

          if (events) {
            var useEvents = events;

            // prevent having to double-click links on iOS
            // by comparing the touchend time on the tooltip to a mouseleave/out
            // triggered on the element or target, if it is within a short duration
            // we cancel the hide event.
            // we basically track if we've moved from element/target to tooltip
            if (
              Support.touch &&
              Browser.MobileSafari &&
              /^(target|element)/.test(name) &&
              /mouse(leave|out)/.test(useEvents)
            ) {
              this.bind(element, useEvents, function(event) {
                if (
                  this._tooltipTouchEndTime &&
                  /^mouse(leave|out)$/.test(event.type)
                ) {
                  var now = new Date().getTime();
                  if (now - this._tooltipTouchEndTime < 450) {
                    // quicktap (355-369ms)
                    return;
                  }
                }
                this.is("api", false);
                this.hideDelayed();
              });
            } else {
              this.bind(element, useEvents, function(event) {
                this.is("api", false);
                this.hideDelayed();
              });
            }
          }
        }, this)
      );
    }

    if (this.options.hideOnClickOutside) {
      // add a class to check for the hideOnClickOutSide element
      $(this.element).addClass("tpd-hideOnClickOutside");

      // touchend is an iOS fix to prevent the need to double tap
      // without this it doesn't even work at all on iOS
      this.bind(
        document.documentElement,
        "click touchend",
        $.proxy(function(event) {
          if (!this.visible()) return;

          var element = $(event.target).closest(
            ".tpd-tooltip, .tpd-hideOnClickOutside"
          )[0];

          if (
            !element ||
            (element &&
              (element !== this._tooltip[0] && element !== this.element))
          ) {
            this.hide();
          }
        }, this)
      );
    }

    if (this.options.target === "mouse") {
      this.bind(
        this.element,
        "mouseenter mousemove",
        $.proxy(function(event) {
          this._cache.event = event;
        }, this)
      );
    }

    var isMouseMove = false;
    if (
      this.options.showOn &&
      this.options.target === "mouse" &&
      !this.options.fixed
    ) {
      isMouseMove = true;
    }

    if (isMouseMove) {
      this.bind(this.element, "mousemove", function(event) {
        if (!this.is("build")) return;
        this.is("api", false);
        this.position();
      });
    }
  }
});
