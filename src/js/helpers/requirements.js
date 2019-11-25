var Requirements = {
  scripts: {
    'jQuery': {
      required: '1.7',
      available: window.jQuery && jQuery.fn.jquery
    }
  },

  check: (function() {
    // Version check, works with 1.2.10.99_beta2 notations
    var VERSION_STRING = /^(\d+(\.?\d+){0,3})([A-Za-z_-]+[A-Za-z0-9]+)?/;

    function convertVersionString(versionString) {
      var vA = versionString.match(VERSION_STRING),
          nA = vA && vA[1] && vA[1].split('.') || [],
          v  = 0;
      for (var i = 0, l = nA.length; i < l; i++)
        v += parseInt(nA[i] * Math.pow(10, 6 - i * 2));

      return vA && vA[3] ? v - 1 : v;
    }

    return function require(script) {
      if (!this.scripts[script].available ||
        (convertVersionString(this.scripts[script].available) <
          convertVersionString(this.scripts[script].required))
        && !this.scripts[script].notified) {
        // mark this alert so it only shows up once
        this.scripts[script].notified = true;
        warn('Tipped requires ' + script + ' >= ' + this.scripts[script].required);
      }
    };
  })()
};
