var Options = {
  create: (function() {
    var BASE, RESET;

    // hideOn helper
    function toDisplayObject(input, display) {
      var on;
      if ($.type(input) === "string") {
        on = {
          element:
            (RESET[display] && RESET[display].element) || BASE[display].element,
          event: input
        };
      } else {
        on = deepExtend($.extend({}, BASE[display]), input);
      }

      return on;
    }

    // hideOn helper
    function initialize(options) {
      BASE = Tipped.Skins.base;
      RESET = deepExtend($.extend({}, BASE), Tipped.Skins["reset"]);
      initialize = create;
      return create(options);
    }

    function middleize(position) {
      if (position.match(/^(top|left|bottom|right)$/)) {
        position += "middle";
      }

      position.replace("center", "middle").replace(" ", "");

      return position;
    }

    function presetiffy(options) {
      var preset, behavior;
      if (options.behavior && (behavior = Tipped.Behaviors[options.behavior])) {
        preset = deepExtend($.extend({}, behavior), options);
      } else {
        preset = options;
      }

      return preset;
    }

    function create(options) {
      var selected_skin = options.skin
        ? options.skin
        : Tooltips.options.defaultSkin;
      var SELECTED = $.extend({}, Tipped.Skins[selected_skin] || {});
      // make sure the skin option is set
      if (!SELECTED.skin) {
        SELECTED.skin = Tooltips.options.defaultSkin || "dark";
      }

      var MERGED_SELECTED = deepExtend(
        $.extend({}, RESET),
        presetiffy(SELECTED)
      ); // work presets into selected skin

      var MERGED = deepExtend(
        $.extend({}, MERGED_SELECTED),
        presetiffy(options)
      ); // also work presets into the given options

      // Ajax
      if (MERGED.ajax) {
        var RESET_ajax = RESET.ajax || {},
          BASE_ajax = BASE.ajax;

        if ($.type(MERGED.ajax) === "boolean") {
          // true
          MERGED.ajax = {
            //method: RESET_ajax.type || BASE_ajax.type
          };
        }
        // otherwise it must be an object
        MERGED.ajax = deepExtend($.extend({}, BASE_ajax), MERGED.ajax);
      }

      var position;
      var targetPosition = (targetPosition =
        (MERGED.position && MERGED.position.target) ||
        ($.type(MERGED.position) === "string" && MERGED.position) ||
        (RESET.position && RESET.position.target) ||
        ($.type(RESET.position) === "string" && RESET.position) ||
        (BASE.position && BASE.position.target) ||
        BASE.position);
      targetPosition = middleize(targetPosition);

      var tooltipPosition =
        (MERGED.position && MERGED.position.tooltip) ||
        (RESET.position && RESET.position.tooltip) ||
        (BASE.position && BASE.position.tooltip) ||
        Tooltips.Position.getInversedPosition(targetPosition);
      tooltipPosition = middleize(tooltipPosition);

      if (MERGED.position) {
        if ($.type(MERGED.position) === "string") {
          MERGED.position = middleize(MERGED.position);
          position = {
            target: MERGED.position,
            tooltip: Tooltips.Position.getTooltipPositionFromTarget(
              MERGED.position
            )
          };
        } else {
          // object
          position = { tooltip: tooltipPosition, target: targetPosition };
          if (MERGED.position.tooltip) {
            position.tooltip = middleize(MERGED.position.tooltip);
          }
          if (MERGED.position.target) {
            position.target = middleize(MERGED.position.target);
          }
        }
      } else {
        position = {
          tooltip: tooltipPosition,
          target: targetPosition
        };
      }

      // make sure the 2 positions are on the same plane when centered
      // this aligns the sweet spot when repositioning based on the stem
      if (
        Position.isCorner(position.target) &&
        Position.getOrientation(position.target) !==
          Position.getOrientation(position.tooltip)
      ) {
        // switch over the target only, cause we shouldn't be resetting the stem on the tooltip
        position.target = Position.inverseCornerPlane(position.target);
      }

      // if we're hooking to the mouse we want the center
      if (MERGED.target === "mouse") {
        var orientation = Position.getOrientation(position.target);

        // force center alignment on the mouse
        if (orientation === "horizontal") {
          position.target = position.target.replace(/(left|right)/, "middle");
        } else {
          position.target = position.target.replace(/(top|bottom)/, "middle");
        }
      }

      // if the target is the mouse we set the position to 'bottomright' so the position system can work with it
      MERGED.position = position;

      // Offset
      var offset;
      if (MERGED.target === "mouse") {
        // get the offset of the base class
        offset = $.extend({}, BASE.offset);
        $.extend(offset, Tipped.Skins["reset"].offset || {});

        if (options.skin) {
          $.extend(
            offset,
            (
              Tipped.Skins[options.skin] ||
              Tipped.Skins[Tooltips.options.defaultSkin] ||
              {}
            ).offset || {}
          );
        }

        // find out what the offset should be
        offset = Position.adjustOffsetBasedOnPosition(
          BASE.offset,
          BASE.position,
          position.target,
          true
        );

        // now put any given options on top of that
        if (options.offset) {
          offset = $.extend(offset, options.offset || {});
        }
      } else {
        offset = {
          x: MERGED.offset.x,
          y: MERGED.offset.y
        };
      }

      MERGED.offset = offset;

      // hideOnClickOutside
      if (MERGED.hideOn && MERGED.hideOn === "click-outside") {
        MERGED.hideOnClickOutside = true;
        MERGED.hideOn = false;
        MERGED.fadeOut = 0; // instantly fadeout for better UI
      }

      if (MERGED.showOn) {
        // showOn and hideOn should not abide by inheritance,
        // otherwise we'd always have the BASE/RESET object for it as starting point
        var showOn = MERGED.showOn;

        if ($.type(showOn) === "string") {
          showOn = { element: showOn };
        }

        MERGED.showOn = showOn;
      }

      if (MERGED.hideOn) {
        var hideOn = MERGED.hideOn;

        if ($.type(hideOn) === "string") {
          hideOn = { element: hideOn };
        }

        MERGED.hideOn = hideOn;
      }

      // normalize inline
      if (MERGED.inline) {
        if ($.type(MERGED.inline) !== "string") {
          MERGED.inline = false;
        }
      }

      // fadeIn 0 on IE < 9 to prevent text transform during fade
      if (Browser.IE && Browser.IE < 9) {
        $.extend(MERGED, { fadeIn: 0, fadeOut: 0, hideDelay: 0 });
      }

      if (MERGED.spinner) {
        if (!Spin.supported) {
          MERGED.spinner = false;
        } else {
          if ($.type(MERGED.spinner) === "boolean") {
            MERGED.spinner = RESET.spinner || BASE.spinner || {};
          }
        }
      }

      if (!MERGED.container) {
        MERGED.container = document.body;
      }

      if (MERGED.containment) {
        if ($.type(MERGED.containment) === "string") {
          MERGED.containment = {
            selector: MERGED.containment,
            padding:
              (RESET.containment && RESET.containment.padding) ||
              (BASE.padding && BASE.containment.padding)
          };
        }
      }

      // normalize shadow, setting it to true should only mean it's enabled when supported
      if (MERGED.shadow) {
        MERGED.shadow = Support.shadow;
      }

      return MERGED;
    }

    return initialize;
  })()
};
