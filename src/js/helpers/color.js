var Color = (function() {
  var names = {
    _default: "#000000",
    aqua: "#00ffff",
    black: "#000000",
    blue: "#0000ff",
    fuchsia: "#ff00ff",
    gray: "#808080",
    green: "#008000",
    lime: "#00ff00",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    purple: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    teal: "#008080",
    white: "#ffffff",
    yellow: "#ffff00"
  };

  function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
  }

  function rgb2hex(rgb) {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }

  return {
    toRGB: function(str) {
      if (/^rgba?\(/.test(str)) {
        return rgb2hex(str);
      } else {
        // first try color name to hex
        if (names[str]) str = names[str];

        // assume already hex, just normalize #rgb #rrggbb
        var hex = str.replace("#", "");
        if (!/^(?:[0-9a-fA-F]{3}){1,2}$/.test(hex)) return names._default;

        if (hex.length == 3) {
          hex =
            hex.charAt(0) +
            hex.charAt(0) +
            hex.charAt(1) +
            hex.charAt(1) +
            hex.charAt(2) +
            hex.charAt(2);
        }

        return "#" + hex;
      }
    }
  };
})();
