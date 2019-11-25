$.extend(Tooltip.prototype, {
  createElementMarker: function(callback) {
    // marker for inline content
    if (
      !this.elementMarker &&
      this.content &&
      _.element.isAttached(this.content)
    ) {
      // save the original display on the element
      $(this.content).data(
        "tpd-restore-inline-display",
        $(this.content).css("display")
      );

      // put an inline marker before the element
      this.elementMarker = $("<div>").hide();

      $(this.content).before($(this.elementMarker).hide());
    }
  },

  restoreElementToMarker: function() {
    var rid;

    if (this.elementMarker && this.content) {
      // restore old visibility
      if ((rid = $(this.content).data("tpd-restore-inline-display"))) {
        $(this.content).css({ display: rid });
      }

      $(this.elementMarker)
        .before(this.content)
        .remove();
    }
  },

  startLoading: function() {
    if (this.is("loading")) return;

    // make sure the tooltip is build, otherwise there won't be a skin
    this.build();

    // always set this flag
    this.is("loading", true);

    // can exit now if no spinner through options
    if (!this.options.spinner) return;

    this._tooltip.addClass("tpd-is-loading");

    this.skin.startLoading();

    // if we're showing for the first time, force show
    if (!this.is("resize-to-content")) {
      this.position();
      this.raise();
      this._show();
    }
  },

  stopLoading: function() {
    // make sure the tooltip is build, otherwise there won't be a skin
    this.build();

    this.is("loading", false);

    if (!this.options.spinner) return;

    this._tooltip.removeClass("tpd-is-loading");

    this.skin.stopLoading();
  },

  // abort
  abort: function() {
    this.abortAjax();
    this.abortSanitize();
    this.is("refreshed-before-sanitized", false);
  },

  abortSanitize: function() {
    if (this._cache.voila) {
      this._cache.voila.abort();
      this._cache.voila = null;
    }
  },

  abortAjax: function() {
    if (this._cache.xhr) {
      this._cache.xhr.abort();
      this._cache.xhr = null;
      this.is("updated", false);
      this.is("updating", false);
    }
  },

  update: function(callback) {
    if (this.is("updating")) return;

    // mark as updating
    this.is("updating", true);

    this.build();

    var type = this.options.inline
      ? "inline"
      : this.options.ajax
      ? "ajax"
      : _.isElement(this.content) ||
        _.isText(this.content) ||
        _.isDocumentFragment(this.content)
      ? "element"
      : this._fn
      ? "function"
      : "html";

    // it could be that when we update the element that it gets so much content that it overlaps the current mouse position
    // for just a few ms, enough to trigger a mouseleave event. To work around this we hide the tooltip if it was visible.
    // hide the content container while updating, using visibility instead of display to work around
    // issues with scripts that depend on display
    this._contentWrapper.css({ visibility: "hidden" });

    // from here we go into routes that should always return a prepared element to be inserted
    switch (type) {
      case "html":
      case "element":
      case "inline":
        // if we've already updated, just forward to the callback
        if (this.is("updated")) {
          if (callback) callback();
          return;
        }

        this._update(this.content, callback);
        break;

      case "function":
        if (this.is("updated")) {
          if (callback) callback();
          return;
        }

        var updateWith = this._fn(this.element);

        // if there's nothing to update with, abort
        if (!updateWith) {
          this.is("updating", false);
          if (callback) callback(true); // true means aborted in this case
          return;
        }

        this._update(updateWith, callback);
        break;

      case "ajax":
        var ajaxOptions = this.options.ajax || {};

        var url = ajaxOptions.url || this.__content,
          data = ajaxOptions.data || {},
          type = ajaxOptions.type || "GET", // jQuery default
          dataType = ajaxOptions.dataType;

        var initialOptions = { url: url, data: data };
        if (type) $.extend(initialOptions, { type: type }); // keep jQuery initial type intact
        if (dataType) $.extend(initialOptions, { dataType: dataType }); // keep intelligent guess intact

        // merge initial options with given
        var options = $.extend({}, initialOptions, ajaxOptions);

        // remove method from the request, we want to use type only to support jQuery 1.9-
        if (options.method) {
          options = $.extend({}, options);
          delete options.method;
        }

        // make sure there are callbacks
        $.each(
          "complete error success".split(" "),
          $.proxy(function(i, cb) {
            if (!options[cb]) {
              if (cb === "success") {
                // when no success callback is given create a callback that sets
                // the responseText as content, otherwise we use the given one
                options[cb] = function(data, textStatus, jqXHR) {
                  return jqXHR.responseText;
                };
              } else {
                // for every other callback use an empty one
                options[cb] = function() {};
              }
            }

            options[cb] = _.wrap(
              options[cb],
              $.proxy(function(proceed) {
                var args = _slice.call(arguments, 1),
                  jqXHR = $.type(args[0] === "object") ? args[0] : args[2]; // success callback has jqXHR as 3th arg, complete and error as 1st

                // don't store aborts
                if (jqXHR.statusText && jqXHR.statusText === "abort") return;

                // we should cache each individual callback here and make that fetchable
                if (this.options.cache) {
                  AjaxCache.set(
                    {
                      url: options.url,
                      type: options.type,
                      data: options.data
                    },
                    cb,
                    args
                  );
                }

                this._cache.xhr = null;

                // proceed is the callback at this point (complete/success/error)
                // we expect it's return value to hold the value to update the tooltip with
                var updateWith = proceed.apply(this, args);
                if (updateWith) {
                  this._update(updateWith, callback);
                }
              }, this)
            );
          }, this)
        );

        // try cache first, for entries that have previously been successful
        var entry;
        if (
          this.options.cache &&
          (entry = AjaxCache.get(options)) &&
          entry.callbacks.success
        ) {
          // if there is a cache, still call success and complete, but clear out the api
          $.each(
            entry.callbacks,
            $.proxy(function(cb, args) {
              if ($.type(options[cb]) === "function") {
                options[cb].apply(this, args);
              }
            }, this)
          );

          // stop here and avoid the request
          return;
        }

        // first check cache for possible update object and avoid load if we have one
        this.startLoading();

        this._cache.xhr = $.ajax(options);

        break;
    }
  },

  _update: function(content, callback) {
    // defaults
    var data = {
      title: this.options.title,
      close: this.options.close
    };

    if (
      $.type(content) === "string" ||
      _.isElement(content) ||
      _.isText(content) ||
      _.isDocumentFragment(content) ||
      content instanceof $
    ) {
      data.content = content;
    } else {
      $.extend(data, content);
    }

    var content = data.content,
      title = data.title,
      close = data.close;

    // store the new content, title and close so dimension/positioning functions can work with it
    this.content = content;
    this.title = title;
    this.close = close;

    // create a marker for when the content is an element attached to the DOM
    this.createElementMarker();

    // make sure the content is visible
    if (_.isElement(content) || content instanceof $) {
      $(content).show();
    }

    // append instantly
    this._content.html(this.content);

    this._title.html(title && $.type(title) === "string" ? title : "");
    this._titleWrapper[title ? "show" : "hide"]();
    this._close[
      (this.title || this.options.title) && close ? "show" : "hide"
    ]();

    var hasInnerClose = close && !(this.options.title || this.title),
      hasInnerCloseNonOverlap =
        close && !(this.options.title || this.title) && close !== "overlap",
      hasTitleCloseNonOverlap =
        close && (this.options.title || this.title) && close !== "overlap";
    this._inner_close[hasInnerClose ? "show" : "hide"]();
    this._tooltip[(hasInnerCloseNonOverlap ? "add" : "remove") + "Class"](
      "tpd-has-inner-close"
    );
    this._tooltip[(hasTitleCloseNonOverlap ? "add" : "remove") + "Class"](
      "tpd-has-title-close"
    );

    // possible remove padding
    this._content[(this.options.padding ? "remove" : "add") + "Class"](
      "tpd-content-no-padding"
    );

    this.finishUpdate(callback);
  },

  sanitize: function(callback) {
    // if the images loaded plugin isn't loaded, just callback
    if (
      !this.options.voila || // also callback on manual disable
      this._content.find("img").length < 1 // or when no images need preloading
    ) {
      this.is("sanitized", true);
      if (callback) callback();
      return;
    }

    // Voila uses img.complete and polling to detect if an image loaded
    // but if the src of an image is changed, complete will still be true
    // even as it's loading a new source. so we have to fallback to onload
    // to allow for src updates.
    this._cache.voila = Voila(
      this._content,
      { method: "onload" },
      $.proxy(function(instance) {
        // mark images as sanitized so we can avoid sanitizing them again
        // for an instant refresh() later
        this._markImagesAsSanitized(instance.images);

        if (this.is("refreshed-before-sanitized")) {
          this.is("refreshed-before-sanitized", false);
          this.sanitize(callback);
        } else {
          // finish up
          this.is("sanitized", true);
          if (callback) callback();
        }
      }, this)
    );
  },

  // expects a voila.image instance
  _markImagesAsSanitized: function(images) {
    $.each(images, function(i, image) {
      var img = image.img;
      $(img).data("completed-src", image.img.src);
    });
  },

  _hasAllImagesSanitized: function() {
    var sanitizedAll = true;

    // as soon as we find one image that isn't sanitized
    // or sanitized based on the wrong source we
    // have to sanitize again
    this._content.find("img").each(function(i, img) {
      var completedSrc = $(img).data("completed-src");
      if (!(completedSrc && img.src === completedSrc)) {
        sanitizedAll = false;
        return false;
      }
    });

    return sanitizedAll;
  },

  refresh: function() {
    if (!this.visible()) return;

    // avoid refreshing while sanitize() still needs to finish up
    if (!this.is("sanitized")) {
      // mark the need to re-sanitize
      this.is("refreshed-before-sanitized", true);

      return;
    }

    // mark as refreshing
    this.is("refreshing", true);

    // clear potential timers
    this.clearTimer("refresh-spinner");

    if (
      !this.options.voila ||
      this._content.find("img").length < 1 ||
      this._hasAllImagesSanitized()
    ) {
      // still use should-update-dimensions because text could also have updated
      this.is("should-update-dimensions", true);

      this.position();
      this.is("refreshing", false);
    } else {
      // mark as unsanitized so we sanitize again even after a hide
      this.is("sanitized", false);

      this._contentWrapper.css({ visibility: "hidden" });

      this.startLoading();

      this.sanitize(
        $.proxy(function() {
          this._contentWrapper.css({ visibility: "visible" });

          this.stopLoading();

          // set the update dimensions marker again since a position() call
          // on mousemove during refresh could have caused it to be unset
          this.is("should-update-dimensions", true);

          this.position();
          this.is("refreshing", false);
        }, this)
      );
    }
  },

  finishUpdate: function(callback) {
    this.is("updated", true);
    this.is("updating", false);

    if ($.type(this.options.afterUpdate) === "function") {
      // make sure visibility is visible during this
      var isHidden = this._contentWrapper.css("visibility");
      if (isHidden) this._contentWrapper.css({ visibility: "visible" });

      this.options.afterUpdate(this._content[0], this.element);

      if (isHidden) this._contentWrapper.css({ visibility: "hidden" });
    }

    if (callback) callback();
  }
});
