$.extend(Tipped, {
  delegate: function() {
    Delegations.add.apply(Delegations, _slice.call(arguments));
  },

  undelegate: function() {
    Delegations.remove.apply(Delegations, _slice.call(arguments));
  }
});

var Delegations = {
  _uid: 0,
  _delegations: {},

  add: function(selector, content, options) {
    var options;
    if ($.type(content) === "object" && !_.isElement(content)) {
      options = content;
      content = null;
    } else {
      options = arguments[2] || {};
    }

    var uid = ++this._uid;

    var ttOptions = Options.create($.extend({}, options));

    this._delegations[uid] = {
      uid: uid,
      selector: selector,
      content: content,
      options: ttOptions
    };

    var handler = function(event) {
      // store the uid so we don't create a second tooltip
      $(this).addClass("tpd-delegation-uid-" + uid);

      // now create the tooltip
      var tooltip = new Tooltip(this, content, options);

      // store any cached pageX/Y on it
      tooltip._cache.event = event;

      tooltip.setActive();

      tooltip.showDelayed();
    };

    this._delegations[uid].removeTitleHandler = $.proxy(this.removeTitle, this);
    $(document).delegate(
      selector + ":not(.tpd-delegation-uid-" + uid + ")",
      "mouseenter",
      this._delegations[uid].removeTitleHandler
    );

    this._delegations[uid].handler = handler;
    $(document).delegate(
      selector + ":not(.tpd-delegation-uid-" + uid + ")",
      ttOptions.showOn.element,
      handler
    );
  },

  // puts the title into data-tipped-restore-title,
  // this way tooltip creation picks up on it
  // without showing the native title tooltip
  removeTitle: function(event) {
    var element = event.currentTarget;

    var title = $(element).attr("title");

    // backup title
    if (title) {
      $(element).data("tipped-restore-title", title);
      $(element)[0].setAttribute("title", ""); // IE needs setAttribute
    }
  },

  remove: function(selector) {
    $.each(
      this._delegations,
      $.proxy(function(uid, delegation) {
        if (delegation.selector === selector) {
          $(document)
            .undelegate(
              selector + ":not(.tpd-delegation-uid-" + uid + ")",
              "mouseenter",
              delegation.removeTitleHandler
            )
            .undelegate(
              selector + ":not(.tpd-delegation-uid-" + uid + ")",
              delegation.options.showOn.element,
              delegation.handler
            );
          delete this._delegations[uid];
        }
      }, this)
    );
  },

  removeAll: function() {
    $.each(
      this._delegations,
      $.proxy(function(uid, delegation) {
        $(document)
          .undelegate(
            delegation.selector + ":not(.tpd-delegation-uid-" + uid + ")",
            "mouseenter",
            delegation.removeTitleHandler
          )
          .undelegate(
            delegation.selector + ":not(.tpd-delegation-uid-" + uid + ")",
            delegation.options.showOn.element,
            delegation.handler
          );
        delete this._delegations[uid];
      }, this)
    );
  }
};
