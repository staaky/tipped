# Tipped

_A complete Tooltip solution based on [jQuery](https://jquery.com)._

- [Tipped](#tipped)
  - [Usage](#usage)
    - [Installation](#installation)
    - [Basic Usage](#basic-usage)
    - [Inline](#inline)
    - [Elements](#elements)
    - [Functions](#functions)
    - [Ajax](#ajax)
    - [JSON](#json)
    - [Event Delegation](#event-delegation)
  - [Options](#options)
    - [Custom Behaviors](#custom-behaviors)
  - [Callbacks](#callbacks)
  - [Skins](#skins)
    - [Default Options](#default-options)
    - [Behaviors](#behaviors)
    - [Sizes](#sizes)
    - [Default Skin](#default-skin)
  - [API](#api)

## Usage

### Installation

Download Tipped and include it below the latest 3.x release of jQuery:

```html
<script
  type="text/javascript"
  src="https://code.jquery.com/jquery-3.6.0.min.js"
></script>
<script type="text/javascript" src="/tipped/dist/js/tipped.min.js"></script>
<link rel="stylesheet" type="text/css" href="/tipped/dist/css/tipped.css" />
```

Alternatively Tipped can be installed using [npm](https://npmjs.com/package/@staaky/tipped):

```bash
npm install @staaky/tipped
```

### Basic Usage

`Tipped.create` can be used to create one or more tooltips at the same time. It accepts a CSS Selector or HTML Element as the first parameter:

```js
$(function () {
  Tipped.create("#element-id", "Some tooltip text");
});
```

If no string is given as the second argument Tipped will look for it in the `title` attribute. By using this multiple tooltips can be created using a single CSS Selector:

```html
<span class="has-tooltip" title="First tooltip">I have a tooltip</span>
<span class="has-tooltip" title="Second tooltip">I also have a tooltip</span>

<script type="text/javascript">
  $(function () {
    Tipped.create(".has-tooltip");
  });
</script>
```

Additional [options](#options) can be provided as the last argument:

```js
Tipped.create("#demo-options", "Options are awesome", { position: "topleft" });
```

Options can also be set on elements using the `data-tipped-options` attribute. Those options will overwrite the ones provided through `Tipped.create`:

```html
<span class="x-small-tooltip" title="Red" data-tipped-options="skin: 'red'"
  >Red</span
>
<span class="x-small-tooltip" title="Green" data-tipped-options="skin: 'green'"
  >Green</span
>
<span class="x-small-tooltip" title="Blue" data-tipped-options="skin: 'blue'"
  >Blue</span
>

<script type="text/javascript">
  $(function () {
    Tipped.create(".x-small-tooltip", { size: "x-small" });
  });
</script>
```

When using the data-attribute it's important to ask yourself if you really need
it. In the example above it would probably have been better to use a separate
class and Tipped.create call for each color, that would avoid unnecessary
styling in the markup and make the code more maintainable. We'll see more
practical use of the `data-tipped-options` attribute when using
[Inline](#inline) and [Ajax](#ajax) tooltips.

More complex tooltips that define [Callbacks](#callbacks) are best created entirely through `Tipped.create`:

```js
Tipped.create(
  "#demo-options-callbacks",
  "This tooltip is a bit more advanced",
  {
    skin: "light",
    position: "topleft",
    close: true,
    hideOn: false,
    onShow: function (content, element) {
      $(element).addClass("highlight");
    },
    afterHide: function (content, element) {
      $(element).removeClass("highlight");
    },
  }
);
```

### Inline

Anything on the page can be pulled into a tooltip by giving the `inline` option the `id` of the element to pull into the tooltip:

```html
<span class="inline" data-tipped-options="inline: 'inline-tooltip-1'"
  >Inline 1</span
>
<div id="inline-tooltip-1" style="display:none">Moved into the tooltip</div>

<span class="inline" data-tipped-options="inline: 'inline-tooltip-2'"
  >Inline 2</span
>
<div id="inline-tooltip-2" style="display:none">Another one</div>

<script type="text/javascript">
  $(function () {
    Tipped.create(".inline");
  });
</script>
```

**Note:** Keep in mind that an `id` [**needs to be unique**](https://www.w3.org/TR/html401/struct/global.html#adef-id) for a page to validate. Each element with an inline tooltip requires its own unique inline element. Since this element is moved into the tooltip and not cloned (that would invalidate the page) it cannot be reused.

### Elements

Elements can be used as tooltip content, dynamically created or taken from the page. When taking elements from the page this works almost the same as using the `inline` option but without being restricted in using an `id`:

```html
<span id="element-dynamic">Dynamic</span>

<span id="element-inline">Inline</span>
<div class="move-into-tooltip" style="display:none">Moved into the tooltip</div>

<script type="text/javascript">
  $(function () {
    Tipped.create("#element-dynamic", $("<i/>").html("Dynamically created"));
    Tipped.create(
      "#element-inline",
      $("#element-inline").next(".move-into-tooltip")[0]
    );
  });
</script>
```

### Functions

A function can be used as content for the tooltip. It should return the content to be pushed into the tooltip. Its first argument refers to the element the tooltip was created for:

```html
<span id="function" data-content="Bold">Function</span>

<script type="text/javascript">
  $(function () {
    Tipped.create("#function", function (element) {
      return "<strong>" + $(element).data("content") + "<\/strong>";
    });
  });
</script>
```

The return value of the function will be cached by default. The `cache` option can be used to disable this and call the function every time the tooltip is shown:

```html
<span id="function-no-cache">Function - No cache</span>

<script type="text/javascript">
  $(function () {
    Tipped.create(
      "#function-no-cache",
      function () {
        var random = Math.floor(Math.random() * 1000) + 1;
        return "Random number: " + random;
      },
      {
        cache: false,
      }
    );
  });
</script>
```

Instead of return a string an object can be used to set both title and content:

```html
<span class="function" data-content="Some content" data-title="A title"
  >Function 1</span
>
<span class="function" data-content="This tooltip doesn't have a title"
  >Function 2</span
>

<script type="text/javascript">
  $(function () {
    Tipped.create(
      ".function",
      function (element) {
        return {
          title: $(element).data("title"),
          content: $(element).data("content"),
        };
      },
      {
        skin: "light",
      }
    );
  });
</script>
```

### Ajax

The `ajax` option can be used to make Ajax requests, it accepts the same settings as [`jQuery.ajax()`](https://api.jquery.com/jQuery.ajax/). A simple Ajax request that updates a tooltip would look like this:

```html
<span id="ajax-example" data-tipped-options="ajax: { url: 'hello-world.php' }"
  >Ajax</span
>

<script type="text/javascript">
  $(function () {
    Tipped.create("#ajax-example");
  });
</script>
```

When using a `success` callback the tooltip won't automatically be updated with the response. This allows the response to be modified before proceeding with the update. Use `return` in the callback to update the tooltip with a modified response:

```html
<span id="ajax-callback">Ajax Callback</span>

<script type="text/javascript">
  $(function () {
    Tipped.create("#ajax-callback", {
      ajax: {
        url: "hello-world.php",
        success: function (data, textStatus, jqXHR) {
          return jqXHR.responseText + ", this is a modified response";
        },
      },
    });
  });
</script>
```

**Important:** Using `return` within a success callback doesn't update the tooltip straight away. Use [afterUpdate](#callbacks) for a reliable callback after the tooltip has been updated.

Ajax request become more useful when sending along data with the request to modify the response on the server side:

```html
<span
  class="ajax-artist"
  data-tipped-options="ajax: {
  data: { artist: 'norahjones' }
}"
  >Norah Jones</span
>
<span
  class="ajax-artist"
  data-tipped-options="ajax: {
  data: { artist: 'theglitchmob' }
}"
  >The Glitch Mob</span
>

<script type="text/javascript">
  $(document).ready(function () {
    Tipped.create(".ajax-artist", {
      ajax: {
        url: "artist.php",
        type: "post",
      },
      skin: "light",
      size: "large",
      radius: false,
      position: "topleft",
    });
  });
</script>
```

### JSON

Since the [ajax](#ajax) implementation makes it possible to modify the response before proceeding with the update it can also be used to handle JSON to create the content of a tooltip:

```html
<span id="json-vimeo">JSON - Vimeo</span>

<script type="text/javascript">
  $(function () {
    Tipped.create("#json-vimeo", {
      ajax: {
        url: "//vimeo.com/api/oembed.json?url=http://vimeo.com/6428069&maxwidth=280&maxheight=280",
        success: function (data, textStatus, jqXHR) {
          return {
            title: data.title,
            content: data.html,
          };
        },
      },
      close: true,
      hideOn: false,
      skin: "light",
      radius: false,
      position: "topleft",
    });
  });
</script>
```

### Event Delegation

When there are a lot of tooltips on the page it'll make sense to use event delegation to lighten the load on the page. `Tipped.delegate` can be used for this, it doesn't create tooltips when called, instead it creates tooltips once an event is triggered that requires a tooltip to be shown.

`Tipped.delegate` accepts a CSS Selector, followed by optional content and/or options:

```html
<span class="delegation-example" title="Created with event delegation"
  >Delegation 1</span
>
<span class="delegation-example" title="Another one">Delegation 2</span>

<script type="text/javascript">
  $(function () {
    Tipped.delegate(".delegation-example", {
      skin: "blue",
    });
  });
</script>
```

## Options

Options can be provided as the last argument when using `Tipped.create`:

```js
Tipped.create("#example", "Options!", { position: "topleft" });
```

Alternatively they can be set on elements using the `data-tipped-options` attribute:

```html
<span id="example" data-tipped-options="position: 'topleft'">example</span>
```

Options defined with the data-attribute will overwrite those defined using `Tipped.create`.

<table>
<thead>
  <tr>
    <th>Option</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`ajax`

</td><td>

Update the content of the tooltip with the response of an ajax requests, it accepts the same settings as [`jQuery.ajax()`](https://api.jquery.com/jQuery.ajax/):

```
ajax: {
  url: 'example.php',
  type: 'post',
  data: { id: 204481 }
}
```

When using a `success` callback the tooltip won't automatically be updated with the response. This allows the response to be modified before proceeding with the update. Use `return` in the callback to update the tooltip with a modified response:

```
ajax: {
  url: 'example.json',
  success: function(data, textStatus, jqXHR) {
    return data.content + " modified!";
  }
}
```

Both the content and the title of the tooltip can be set this way:

```
ajax: {
  url: 'example.json',
  success: function(data, textStatus, jqXHR) {
    return {
      title: data.title,
      content: data.content
    };
  }
}
```

Set the `cache` option to false to disable caching of the ajax request, this will create a new request each time the tooltip is opened.

```
ajax: { url: 'example.php' },
cache: false
```

</td></tr>
<tr><td valign="top">

`behavior`

</td><td>

Load a number of preset options for common tooltip usecases. Other options defined on the tooltip will extend these presets. Possible behaviors are: `hide`, `mouse` and `sticky`.

The `hide` behavior hides the tooltip on mouseenter:

```
behavior: 'hide'
```

With the `mouse` behavior the tooltip will follow the mouse and hide on mouseenter:

```
behavior: 'mouse'
```

Using `sticky` the tooltip shows up at the initial mouse position and stays there. This is ideal for use on text to get a correct tooltip position even when an element has a linebreak.

```
behavior: 'sticky'
```

### Custom Behaviors

Behaviors are stored in `Tipped.Behaviors`, you can add your own by extending it. If you every find yourself recycling groups of options, consider adding a behavior:

```js
// add a behavior
$.extend(Tipped.Behaviors, {
  "custom-slow": {
    fadeIn: 600,
    fadeOut: 600,
  },
});

// use it with the behavior option
Tipped.create("#custom-behavior-slow", "Slowly!", {
  behavior: "custom-slow",
  skin: "light",
});
```

</td></tr>
<tr><td valign="top">

`cache`

</td><td>

Can be used to disable caching for Ajax and Function based tooltips:

```
cache: false
```

</td></tr>
<tr><td valign="top">

`container`

</td><td>

Sets the element the tooltip is appended to, defaults to `document.body`:

```
container: $('#scroll')[0]
```

When given a selector string, an element will be searched for in the parent node tree up from the element the tooltip is attached to:

```
container: '.scrolling-container'
```

**Note:** Parts of the tooltip will not be visible if the container element has hidden overflow. This can be somewhat avoided by also using the `containment` option to attempt to keep the tooltip within the container.

**Note:** Tooltips use `position:absolute` to position themselves within the container, so the container element will have to allow for absolute positioning. It might be needed to set `position:relative` or `position:absolute` on the container itself.

</td></tr>
<tr><td valign="top">

`containment`

</td><td>

Tooltips are kept within the viewport, this can be disabled with the `containment` option:

```
containment: false
```

Set `padding` to change the padding between the tooltip and the edges of the viewport:

```
containment: { padding: 5 }
```

Use `selector` to keep the tooltip within a specific element. This has to be a CSS selector pointing to an element in the parent node tree of the element that has the tooltip attached to it.

```
containment: {
  selector: '#page',
  padding: 0
}
```

</td></tr>
<tr><td valign="top">

`close`

</td><td>

Shows a close button when set to true, combined with the `hideOn` option it can be used to create a tooltip that only closes itself with this button:

```
close: true,
hideOn: false
```

When the tooltip has a `title` the close button will be moved into the title bar. The title bar can also be enabled without a title:

```
close: true,
hideOn: false,
title: true
```

Setting the close option to _'overlap'_ creates a close button that overlaps the tooltip content:

```
close: 'overlap',
hideOn: false
```

Elements within a tooltip with the class `close-tooltip` will automatically become a close button.

```html
<a href="javascript:;" class="close-tooltip">click to close</a>
```

</td></tr>
<tr><td valign="top">

`detach`

</td><td>

Tooltips are detached from the body element once hidden. Setting `detach` to _false_ will keep them attached even when hidden.

```
detach: false
```

</td></tr>
<tr><td valign="top">

`fadeIn`

</td><td>

The duration of the fadein effect in miliseconds.

```
fadeIn: 200
```

</td></tr>
<tr><td valign="top">

`fadeOut`

</td><td>

The duration of the fadein fadeout in miliseconds.

```
fadeOut: 200
```

</td></tr>
<tr><td valign="top">

`fixed`

</td><td>

When set to _true_ the tooltip won't follow the mouse and stay in its initial position, it's useful when combined with the mouse as target:

```
fixed: true,
target: 'mouse'
```

</td></tr>
<tr><td valign="top">

`hideAfter`

</td><td>

Hides the tooltip after a delay in miliseconds of not hovering the tooltip or its element:

```
hideAfter: 2000
```

</td></tr>
<tr><td valign="top">

`hideDelay`

</td><td>

A delay in miliseconds before the tooltip hides.

```
hideDelay: 25
```

</td></tr>
<tr><td valign="top">

`hideOn`

</td><td>

An event that triggers the tooltip to hide.

```
hideOn: 'click'
```

For more control this can also be an object that sets events for the `element` and `tooltip`:

```
hideOn: {
  element: 'mouseleave',
  tooltip: 'mouseenter'
}
```

Set this option to _false_ to disable hiding the tooltip through events:

```
hideOn: false
```

</td></tr>
<tr><td valign="top">

`hideOnClickOutside`

</td><td>

When set to _true_ the tooltip will hide after a click outside of it or its element:

```
hideOnClickOutside: true
```

</td></tr>
<tr><td valign="top">

`hideOthers`

</td><td>

Hides all visible tooltips before showing the tooltip when set to _true_.

```
hideOthers: true
```

</td></tr>
<tr><td valign="top">

`inline`

</td><td>

Sets the `id` of an element to pull into the tooltip.

```
inline: 'pull-into-tooltip'
```

</td></tr>
<tr><td valign="top">

`maxWidth`

</td><td>

Sets the maximum width of the tooltip content.

```
maxWidth: 200
```

</td></tr>
<tr><td valign="top">

`offset`

</td><td>

Can be used to set `x` and/or `y` offset of the tooltip.

```
offset: { y: -5 }
```

```
offset: { x: 10, y: 5 }
```

**Note:** It's recommended to use the `position` option and only use offset when further tweaking is needed.

</td></tr>
<tr><td valign="top">

`padding`

</td><td>

Disables the padding defined in CSS when set to _false_, enabled by default.

```
padding: false
```

</td></tr>
<tr><td valign="top">

`position`

</td><td>

Sets the position of the tooltip in relation to its target.

Possible values are: `topleft`, `top`, `topright`, `righttop`, `right`, `rightbottom`, `bottomleft`, `bottom`, `bottomright`, `lefttop`, `left` and `leftbottom`.

```
position: 'topleft'
```

For more advanced positioning you can set the position based on how the tooltip and its target are connected:

```
position: {
  target: 'bottom',
  tooltip: 'topleft'
}
```

</td></tr>
<tr><td valign="top">

`radius`

</td><td>

Disables the `border-radius` defined in CSS when set to _false_, enabled by default.

```
radius: false
```

</td></tr>
<tr><td valign="top">

`shadow`

</td><td>

Disables the shadow defined in CSS when set to _false_, enabled by default.

```
shadow: false
```

</td></tr>
<tr><td valign="top">

`showDelay`

</td><td>

A delay in miliseconds before the tooltip appears, by default this is set to a slight delay so tooltips don't instantly appear when moving the mouse over the page:

```
showDelay: 75
```

</td></tr>
<tr><td valign="top">

`showOn`

</td><td>

An event that triggers the tooltip to show.

```
showOn: 'click'
```

For more control this can also be an object that sets events for the `element` and `tooltip`:

```
showOn: {
  element: 'mouseenter',
  tooltip: 'mouseenter'
}
```

Set this option to _false_ to disable showing the tooltip through events.

```
showOn: false
```

</td></tr>
<tr><td valign="top">

`size`

</td><td>

Adjusts the tooltip to one of the following sizes: `x-small`, `small`, `medium` or `large`.

```
size: 'x-small'
```

See the documentation on [Skins](#skins) for examples on how to add custom sizes.

</td></tr>
<tr><td valign="top">

`skin`

</td><td>

Sets a skin for the tooltip. If any options have been defined for this skin they will be used as the starting options for the tooltip. All other given options will extend those.

Possible values: `dark`, `light`, `gray`, `red`, `green`, `blue`, `lightyellow`, `lightblue` and `lightpink`.

```
skin: 'light'
```

See the documentation on [Skins](#skins) for examples on creating and using skins.

</td></tr>
<tr><td valign="top">

`stem`

</td><td>

Disables the stem when set to _false_.

```
stem: false
```

</td></tr>
<tr><td valign="top">

`spinner`

</td><td>

A spinner is shown while ajax requests are loading or when Tipped is waiting for images within the tooltip content to finish loading. It can be disabled by setting this option to _false_:

```
spinner: false
```

</td></tr>
<tr><td valign="top">

`target`

</td><td>

Defines where the tooltip will appear. Possible values for target are `element`, `mouse` or an _HTMLElement_.

```
target: 'mouse'
```

```
target: $('#different-element')[0]
```

</td></tr>
<tr><td valign="top">

`title`

</td><td>

Can be used to enable the title bar and optionally set a title to go with it.

```
title: true
```

```
title: "I have a title"
```

</td></tr>
<tr><td valign="top">

`voila`

</td><td>

Can be used to disable [Voilà](https://github.com/staaky/voila), a library that waits for images in the tooltip to finish loading so the tooltip gets proper dimensions.

If you disable it, make sure the tooltip content has dimensions set.

```
voila: false
```

**Tip:** To have the benefit of Voilà without showing a loading icon as it waits consider using `spinner:false` instead.

</td></tr>
<tr><td valign="top">

`zIndex`

</td><td>

By default no zIndex is set. This will have all tooltips increment their z-index starting from the default 999999 or the z-index set by `Tipped.setStartingZIndex`.

If you need control over the z-index you can set it using this option. Setting `zIndex` makes the z-index of the tooltip **static**. This disables the default behavior where tooltips increment z-index when they get focus.

```
zIndex: 1500000
```

</td></tr>
</tbody></table>

## Callbacks

Callbacks can be used alongside other [Options](#options).

<table>
<thead>
  <tr>
    <th>Callback</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`afterHide`

</td><td>

A function to call after the tooltip is fully hidden.

```js
afterHide: function(content, element) {
  console.log('Hidden tooltip for:', element);
}
```

</td></tr>
<tr><td valign="top">

`afterUpdate`

</td><td>

A function to call after the content of the tooltip updates. The first argument will be the element containing the `content` of the tooltip, the second argument the `element` that triggered the tooltip.

```js
afterUpdate: function(content, element) {
  $(content).css({ background: 'red' });
  $(element).css({ background: 'green' });
}
```

</td></tr>
<tr><td valign="top">

`onShow`

</td><td>

A function to call when the tooltip shows up.

```js
onShow: function(content, element) {
  console.log('Showing the tooltip for:', element);
}
```

</td></tr>
</tbody></table>

## Skins

Tooltip skins are created entirely in CSS, new skins can be added with just a few lines of code:

```css
/* purple */
.tpd-skin-purple .tpd-content,
.tpd-skin-purple .tpd-title,
.tpd-skin-purple .tpd-close {
  color: #fff;
}
.tpd-skin-purple .tpd-background-content {
  background-color: #5b45e3;
}
.tpd-skin-purple .tpd-background {
  border-width: 1px;
  border-color: rgba(6, 0, 12, 0.6);
}
.tpd-skin-purple .tpd-background-title {
  background-color: #5b45e3;
}
/* line below the title */
.tpd-skin-purple .tpd-title-wrapper {
  border-bottom: 1px solid #2a1fb4;
}
/* shadow */
.tpd-skin-purple .tpd-background-shadow {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
}
/* spinner */
.tpd-skin-purple .tpd-spinner-spin {
  border-color: rgba(255, 255, 255, 0.2);
  border-left-color: #fff;
}
/* links */
.tpd-skin-purple a {
  color: #ddd;
}
.tpd-skin-purple a:hover {
  color: #c6c6c6;
}
```

Once the CSS has been added the skin can be used by the `skin` option:

```
skin: 'purple'
```

**Important:** When adding custom skins it's recommended to do this in separate files, this will allow upgrading of Tipped without breaking anything.

### Default Options

Default options can be set for a skin by extending `Tipped.Skins`:

```js
$.extend(Tipped.Skins, {
  purple: {
    radius: false,
    shadow: false,
  },
});
```

### Behaviors

It's recommended to avoid storing options on a skin that involve things other than layout. Tipped provides [Behaviors](#custom-behaviors) to help with this. If you need to recycle options, it's best to create a behavior and use it alongside the skin option:

```js
// add a custom behavior
$.extend(Tipped.Behaviors, {
  "custom-slow": {
    fadeIn: 600,
    fadeOut: 600,
  },
});

// use behavior alongside the skin option
Tipped.create("#custom-behavior-slow", "Slowly!", {
  behavior: "custom-slow",
  skin: "purple",
});
```

### Sizes

Extra sizes can be added through CSS:

```css
/* huge */
.tpd-size-huge .tpd-content,
.tpd-size-huge .tpd-title {
  padding: 15px;
  font-size: 15px;
  line-height: 20px;
}
.tpd-size-huge .tpd-background {
  border-radius: 10px;
}
.tpd-size-huge .tpd-stem {
  width: 24px;
  height: 12px;
  margin-left: 8px; /* space from the side */
  margin-top: 2px; /* space between stem and target */
}
.tpd-size-huge.tpd-no-radius .tpd-stem {
  margin-left: 10px;
}
.tpd-size-huge .tpd-close {
  margin: 11px 5px 11px 5px;
}
.tpd-size-huge .tpd-close-icon {
  font-size: 32px;
}
.tpd-size-huge .tpd-spinner {
  width: 66px;
  height: 50px;
}
.tpd-size-huge .tpd-spinner-spin {
  margin: 14px 0 0 22px;
}
.tpd-size-huge .tpd-spinner-spin,
.tpd-size-huge .tpd-spinner-spin:after {
  width: 22px;
  height: 22px;
}
```

Use them with the size option:

```
size: 'huge'
```

### Default Skin

To change the default skin for all tooltips use `Tipped.setDefaultSkin`:

```js
Tipped.setDefaultSkin("purple");
```

## API

The API can be used to generate and control tooltips through Javascript.

<table>
<thead>
  <tr>
    <th>Method</th>
    <th></th>
  </tr>
</thead>
<tbody>
<tr><td valign="top">

`Tipped.clearAjaxCache`

<td><td>

Clears the ajax cache for all tooltips, a new request will be made the next time they're shown.

```js
Tipped.clearAjaxCache();
```

</td></tr>
<tr><td valign="top">

`Tipped.create`

<td><td>

Creates one or more tooltips using a CSS Selector or an HTMLElement. This method returns a Collection that allows chaining of `show`, `hide`, `toggle`, `disable`, `enable`, `refresh` and `remove`.

```js
$(function () {
  var collection = Tipped.create(".tipped");
  setTimeout(function () {
    collection.show();
  }, 5000);
});
```

</td></tr>
<tr><td valign="top">

`Tipped.delegate`

<td><td>

Use event delegation to create tooltips based on a CSS Selector, this will work even for elements added to the page later on.

```js
Tipped.delegate(".tipped", { position: "topleft" });
```

See [Event Delegation](#event-delegation) for more details and examples on using this method.

**Note:** Methods like `Tipped.show` don't work on delegated tooltips because they're not created right away. Delegated tooltips are created once an event is triggered that would show them. Use `Tipped.create` to create tooltips that are immediately accessible to other API methods.

</td></tr>
<tr><td valign="top">

`Tipped.disable`

<td><td>

Disables tooltips, making it impossible to show or hide them.

```js
Tipped.disable(".tipped");
```

</td></tr>
<tr><td valign="top">

`Tipped.enable`

<td><td>

Enable tooltips previously disabled with `Tipped.disable`.

```js
Tipped.enable(".tipped");
```

</td></tr>
<tr><td valign="top">

`Tipped.findElement`

<td><td>

Returns the element for which the tooltip was created when given a tooltip element or any element within that tooltip.

```js
var element = Tipped.findElement($("#element-within-tooltip")[0]);
```

The methods `get`, `show`, `hide`, `toggle`, `refresh` and `remove` all use `Tipped.findElement()` internally so you can do the following within a tooltip:

```html
<span onclick="Tipped.hide(this);">click to close</span>
```

</td></tr>
<tr><td valign="top">

`Tipped.get`

<td><td>

Retrieves a collection off tooltips created through `Tipped.create` using a CSS Selector or HTMLElement.

```js
Tipped.create("#content .tipped");
var collection = Tipped.get("#content .tipped");
collection.show();
```

</td></tr>
<tr><td valign="top">

`Tipped.hide`

<td><td>

Hides one more tooltips using a CSS Selector or HTMLElement.

```js
Tipped.hide("#some-element");
```

Giving this method an element within a tooltip that doesn't have its own tooltip will also hide the tooltip:

```js
Tipped.hide($("#element-within-tooltip")[0]);
```

</td></tr>
<tr><td valign="top">

`Tipped.hideAll`

<td><td>

Hides all tooltips.

```js
Tipped.hideAll();
```

</td></tr>
<tr><td valign="top">

`Tipped.init`

<td><td>

Restores Tipped to its initial state, removing all tooltips in the process.

```js
Tipped.init();
```

</td></tr>
<tr><td valign="top">

`Tipped.refresh`

<td><td>

Forces a refresh of one or more tooltips, this will update dimensions and reposition them:

```js
Tipped.refresh("#some-element");
```

Giving this method an element within a tooltip that doesn't have its own tooltip will also cause the tooltip to refresh:

```js
Tipped.refresh($("#element-within-tooltip")[0]);
```

Not using any parameters will refresh all visible tooltips:

```js
Tipped.refresh();
```

</td></tr>
<tr><td valign="top">

`Tipped.remove`

<td><td>

Removes one or more tooltips using a CSS Selector or HTMLElement.

```js
Tipped.remove("#content .tipped");
```

</td></tr>
<tr><td valign="top">

`Tipped.setDefaultSkin`

<td><td>

Sets a different default skin.

```js
Tipped.setDefaultSkin("light");
```

</td></tr>
<tr><td valign="top">

`Tipped.setStartingZIndex`

<td><td>

Sets the default starting z-index for all tooltips, the default is 999999.

```js
Tipped.setStartingZIndex(999999);
```

</td></tr>
<tr><td valign="top">

`Tipped.show`

<td><td>

Shows one or more tooltips using a CSS Selector or HTMLElement.

```js
Tipped.show("#some-element");
```

The CSS Selector makes it easy to target groups of tooltips.

```js
Tipped.show(".story span.tipped");
```

</td></tr>
<tr><td valign="top">

`Tipped.toggle`

<td><td>

Toggle display of a tooltip, accepts a CSS Selector or HTMLElement.

```js
Tipped.toggle("#toggle-me");
```

</td></tr>
<tr><td valign="top">

`Tipped.undelegate`

<td><td>

Stop delegation started with `Tipped.delegate`.

```js
Tipped.undelegate(".tipped");
```

</td></tr>
<tr><td valign="top">

`Tipped.visible`

<td><td>

Returns _true_ if a given element has a visible tooltip, or when given a CSS selector it will return the amount of visible tooltips.

```js
if (Tipped.visible("#some-element")) {
  // do something
}
```

```js
var visibleCount = Tipped.visible(".has-tooltip");
```

When no arguments are given the amount of visible tooltips on the entire page is returned:

```js
console.log("There are " + Tipped.visible() + " visible tooltips on the page");
```

</td></tr>
</tbody></table>

---

Tipped has been open-sourced under the [Creative Commons BY 4.0 license](https://creativecommons.org/licenses/by/4.0) as of nov. 25 2019.
