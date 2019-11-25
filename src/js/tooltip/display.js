$.extend(Tooltip.prototype, {
  // make sure there are no animations queued up, and stop any animations currently going on
  stop: function() {
    // cancel when we call this function before the tooltip is created
    if (!this._tooltip) return;

    var shq = this.queues.showhide;
    // clear queue
    shq.queue([]);
    // stop possible show/hide event
    this._tooltip.stop(1, 0);
  },

  showDelayed: function(event) {
    if (this.is("disabled")) return;

    // cancel hide timer
    this.clearTimer("hide");

    // if there is a show timer we don't have to start another one
    if (this.is("visible") || this.getTimer("show")) return;

    // otherwise we start one
    this.setTimer(
      "show",
      $.proxy(function() {
        this.clearTimer("show");
        this.show();
      }, this),
      this.options.showDelay || 1
    );
  },

  show: function() {
    this.clearTimer("hide");

    // don't show tooltip already visible or on hidden targets, those would end up at (0, 0)
    if (
      this.visible() ||
      this.is("disabled") ||
      !$(this.target).is(":visible")
    ) {
      return;
    }

    this.is("visible", true);

    this.attach();

    this.stop();
    var shq = this.queues.showhide;

    // update
    if (!(this.is("updated") || this.is("updating"))) {
      shq.queue(
        $.proxy(function(next_updated) {
          this._onResizeDimensions = { width: 0, height: 0 };

          this.update(
            $.proxy(function(aborted) {
              if (aborted) {
                this.is("visible", false);
                this.detach();
                return;
              }

              next_updated();
            }, this)
          );
        }, this)
      );
    }

    // sanitize every time
    // we've moved this outside of the update in 4.3
    // allowing the update to finish without conflicting with the sanitize
    // that might even be performed later or cancelled
    shq.queue(
      $.proxy(function(next_ready_to_show) {
        if (!this.is("sanitized")) {
          this._contentWrapper.css({ visibility: "hidden" });

          this.startLoading();

          this.sanitize(
            $.proxy(function() {
              this.stopLoading();
              this._contentWrapper.css({ visibility: "visible" });
              this.is("resize-to-content", true);
              next_ready_to_show();
            }, this)
          );
        } else {
          // already sanitized
          this.stopLoading(); // always stop loading
          this._contentWrapper.css({ visibility: "visible" }); // and make visible
          this.is("resize-to-content", true);
          next_ready_to_show();
        }
      }, this)
    );

    // position and raise
    // we always do this because when the tooltip hides and ajax updates, we'd otherwise have incorrect dimensions
    shq.queue(
      $.proxy(function(next_position_raise) {
        this.position();
        this.raise();
        next_position_raise();
      }, this)
    );

    // onShow callback
    shq.queue(
      $.proxy(function(next_onshow) {
        // only fire it here if we've already updated
        if (this.is("updated") && $.type(this.options.onShow) === "function") {
          //
          var visible = new Visible(this._tooltip);
          this.options.onShow(this._content[0], this.element); // todo: update
          visible.restore();
          next_onshow();
        } else {
          next_onshow();
        }
      }, this)
    );

    // Fade-in
    shq.queue(
      $.proxy(function(next_show) {
        this._show(/*instant ? 0 :*/ this.options.fadeIn, function() {
          next_show();
        });
      }, this)
    );
  },

  _show: function(duration, callback) {
    duration =
      ($.type(duration) === "number" ? duration : this.options.fadeIn) || 0;
    callback =
      callback || ($.type(arguments[0]) == "function" ? arguments[0] : false);

    // hide others
    if (this.options.hideOthers) {
      Tooltips.hideAll(this);
    }

    this._tooltip.fadeTo(
      duration,
      1,
      $.proxy(function() {
        if (callback) callback();
      }, this)
    );
  },

  hideDelayed: function() {
    // cancel show timer
    this.clearTimer("show");

    // if there is a hide timer we don't have to start another one
    if (this.getTimer("hide") || !this.visible() || this.is("disabled")) return;

    // otherwise we start one
    this.setTimer(
      "hide",
      $.proxy(function() {
        this.clearTimer("hide");
        this.hide();
      }, this),
      this.options.hideDelay || 1 // always at least some delay
    );
  },

  hide: function(instant, callback) {
    this.clearTimer("show");
    if (!this.visible() || this.is("disabled")) return;

    this.is("visible", false);

    this.stop();
    var shq = this.queues.showhide;

    // instantly cancel ajax/sanitize/refresh
    shq.queue(
      $.proxy(function(next_aborted) {
        this.abort();
        next_aborted();
      }, this)
    );

    // Fade-out
    shq.queue(
      $.proxy(function(next_fade_out) {
        this._hide(instant, next_fade_out);
      }, this)
    );

    // if all tooltips are hidden now we can reset Tooltips.zIndex.current
    shq.queue(function(next_resetZ) {
      Tooltips.resetZ();
      next_resetZ();
    });

    // update on next open
    shq.queue(
      $.proxy(function(next_update_on_show) {
        this.clearUpdatedTo();
        next_update_on_show();
      }, this)
    );

    if ($.type(this.options.afterHide) === "function" && this.is("updated")) {
      shq.queue(
        $.proxy(function(next_afterhide) {
          this.options.afterHide(this._content[0], this.element); // TODO: update
          next_afterhide();
        }, this)
      );
    }

    // if we have a non-caching ajax or function based tooltip, reset updated
    // after afterHide callback since it checks for this
    if (!this.options.cache && (this.options.ajax || this._fn)) {
      shq.queue(
        $.proxy(function(next_non_cached_reset) {
          this.is("updated", false);
          this.is("updating", false);
          this.is("sanitized", false); // sanitize again
          next_non_cached_reset();
        }, this)
      );
    }

    // callback
    if ($.type(callback) === "function") {
      shq.queue(function(next_callback) {
        callback();
        next_callback();
      });
    }

    // detach last
    shq.queue(
      $.proxy(function(next_detach) {
        this.detach();
        next_detach();
      }, this)
    );
  },

  _hide: function(instant, callback) {
    callback =
      callback || ($.type(arguments[0]) === "function" ? arguments[0] : false);

    this.attach();

    // we use fadeTo instead of fadeOut because it has some bugs with detached/reattached elements (jQuery)
    this._tooltip.fadeTo(
      instant ? 0 : this.options.fadeOut,
      0,
      $.proxy(function() {
        // stop loading after a complete hide to make sure a loading icon
        // fades out without switching to content during a hide()
        this.stopLoading();

        // the next show should resize to spinner
        // if it has to sanitize again
        // the logic behind that is handled in show()
        this.is("resize-to-content", false);

        // jQuerys fadein/out is bugged when working with elements that get detached elements
        // fading to 0 doesn't mean we hide at the end, so force that
        this._tooltip.hide();

        if (callback) callback();
      }, this)
    );
  },

  toggle: function() {
    if (this.is("disabled")) return;
    this[this.visible() ? "hide" : "show"]();
  },

  raise: function() {
    // if zIndex is set on the tooltip we don't raise it.
    if (!this.is("build") || this.options.zIndex) return;
    var highestTooltip = Tooltips.getHighestTooltip();

    if (
      highestTooltip &&
      highestTooltip !== this &&
      this.zIndex <= highestTooltip.zIndex
    ) {
      this.zIndex = highestTooltip.zIndex + 1;
      this._tooltip.css({ "z-index": this.zIndex });

      if (this._tooltipShadow) {
        this._tooltipShadow.css({ "z-index": this.zIndex });

        this.zIndex = highestTooltip.zIndex + 2;
        this._tooltip.css({ "z-index": this.zIndex });
      }
    }
  }
});
