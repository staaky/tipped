var Bounds = {
  viewport: function() {
    var vp;
    if (Browser.MobileSafari || (Browser.Android && Browser.Gecko)) {
      vp = { width: window.innerWidth, height: window.innerHeight };
    } else {
      vp = {
        height: $(window).height(),
        width: $(window).width()
      };
    }

    return vp;
  }
};
