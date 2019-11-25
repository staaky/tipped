/*!
 * Tipped - <%= pkg.description %> - v<%= pkg.version %>
 * (c) 2012-<%= grunt.template.today("yyyy") %> Nick Stakenburg
 *
 * http://www.tippedjs.com
 *
 * @license: https://creativecommons.org/licenses/by/4.0
 */

// UMD wrapper
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    root.Tipped = factory(jQuery);
  }
}(this, function($) {
