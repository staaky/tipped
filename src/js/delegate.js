$.extend(Tipped, {
  delegate: function () {
    Delegations.add.apply(Delegations, _slice.call(arguments));
  },

  undelegate: function () {
    Delegations.remove.apply(Delegations, _slice.call(arguments));
  },
});

var Delegations = {
  _uid: 0,
  _delegations: {},

  add: function (selector, content, options) {
    var options;
    if (typeof content === "object" && !_.isElement(content)) {
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
      options: ttOptions,
    };

    var handler = function (event) {
      // store the uid so we don't create a second tooltip
      $(this).addClass("tpd-delegation-uid-" + uid);

      // now create the tooltip
      var tooltip = new Tooltip(this, content, options);

      // store any cached pageX/Y on it
      tooltip._cache.event = event;

      tooltip.setActive();

      tooltip.showDelayed();
    };

    this._delegations[uid].removeTitleHandler = this.removeTitle.bind(this);
    $(document).on(
      "mouseenter",
      selector + ":not(.tpd-delegation-uid-" + uid + ")",
      this._delegations[uid].removeTitleHandler
    );

    this._delegations[uid].handler = handler;
    $(document).on(
      ttOptions.showOn.element,
      selector + ":not(.tpd-delegation-uid-" + uid + ")",
      handler
    );
  },

  // puts the title into data-tipped-restore-title,
  // this way tooltip creation picks up on it
  // without showing the native title tooltip
  removeTitle: function (event) {
    var element = event.currentTarget;

    var title = $(element).attr("title");

    // backup title
    if (title) {
      $(element).data("tipped-restore-title", title);
      $(element)[0].setAttribute("title", ""); // IE needs setAttribute
    }
  },

  remove: function (selector) {
    $.each(
      this._delegations,
      function (uid, delegation) {
        if (delegation.selector === selector) {
          $(document)
            .off(
              "mouseenter",
              selector + ":not(.tpd-delegation-uid-" + uid + ")",
              delegation.removeTitleHandler
            )
            .off(
              delegation.options.showOn.element,
              selector + ":not(.tpd-delegation-uid-" + uid + ")",
              delegation.handler
            );
          delete this._delegations[uid];
        }
      }.bind(this)
    );
  },

  removeAll: function () {
    $.each(
      this._delegations,
      function (uid, delegation) {
        $(document)
          .off(
            "mouseenter",
            delegation.selector + ":not(.tpd-delegation-uid-" + uid + ")",
            delegation.removeTitleHandler
          )
          .off(
            delegation.options.showOn.element,
            delegation.selector + ":not(.tpd-delegation-uid-" + uid + ")",
            delegation.handler
          );
        delete this._delegations[uid];
      }.bind(this)
    );
  },
};
