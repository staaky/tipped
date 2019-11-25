var Support = (function() {
  var testElement = document.createElement("div"),
    domPrefixes = "Webkit Moz O ms Khtml".split(" ");

  function prefixed(property) {
    return testAllProperties(property, "prefix");
  }

  function testProperties(properties, prefixed) {
    for (var i in properties) {
      if (testElement.style[properties[i]] !== undefined) {
        return prefixed === "prefix" ? properties[i] : true;
      }
    }
    return false;
  }

  function testAllProperties(property, prefixed) {
    var ucProperty = property.charAt(0).toUpperCase() + property.substr(1),
      properties = (
        property +
        " " +
        domPrefixes.join(ucProperty + " ") +
        ucProperty
      ).split(" ");

    return testProperties(properties, prefixed);
  }

  // feature detect
  return {
    css: {
      animation: testAllProperties("animation"),
      transform: testAllProperties("transform"),
      prefixed: prefixed
    },

    shadow:
      testAllProperties("boxShadow") && testAllProperties("pointerEvents"),

    touch: (function() {
      try {
        return !!(
          "ontouchstart" in window ||
          (window.DocumentTouch && document instanceof DocumentTouch)
        ); // firefox for Android;
      } catch (e) {
        return false;
      }
    })()
  };
})();
