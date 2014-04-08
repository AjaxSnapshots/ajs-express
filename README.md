ExpressJS Middleware for AjaxSnapshots
====================

Many modern websites have a substantial part of their HTML content generated in the browser using Javascript. This is the case for sites built with AngularJS, EmberJS, BackboneJS and Sencha Touch.

Search engines like Google aren't good at indexing these sites because they don't run the Javascript before indexing their pages. Social network bots like those from Facebook and Twitter have similar problems when they try to create a preview of a shared page that is generated using Javascript.

Fortunately Google came up with a solution to this problem: [The Crawlable AJAX Specification](https://developers.google.com/webmasters/ajax-crawling/). This provides a _safe_ way for sites to provide Google with snapshots of their pages' HTML _after_ all necessary Javascript has run. This specification has been [widely adopted](blog.ajaxsnapshots.com/2013/11/googles-crawlable-ajax-specification.html) and is supported by Bing, Yandex and some social bots.

[AjaxSnapshots](https://ajaxsnapshots.com) makes it easy to start using the _The Crawlable AJAX Specification_ by providing a SaaS based implemention that's easy to plug in at web server level. 

This project provides ExpressJS Middleware that lets you add _The Crawlable AJAX Specification_ to an ExpressJS (on NodeJS) based website in a few lines of code.

##SEO enabling and ExpressJS site

####Prerequisistes:

For full details see our [configuration guide](https://ajaxsnapshots.com/configGuide). Here is a summary of the prerequisites.

If your site uses __hash #__ based URLs like http://mysite.com#mypage change this so that you are using __hashbang #!__ URLs like http://mysite.com#!mypage instead. If you have sitemap.xml file make sure it contains the __hashbang__ URLs too.

If your site uses hashless, e.g. `pushState()` based URLs add the following header to all of you pages. (If you're not sure just add it - it wont do any harm)

```html
<meta content="!" name="fragment">
```

####ExpressJS Configuration

First install the AjaxSnapshots ExpressJS module

```js
$ npm install ajs-express --save
```

Then in your ExpressJS code import the module, configure it with your API Key (from your account page) and _use_ the middleware. 

```js
var ajs = require('ajs-express');

//set api key
ajs.set('apikey','put-your-apikey-here');

//use the middleware (add this to your app early to make sure 
//everything that should be snapshotted is)
app.use(ajs);
```

That's all!

####Configuration Options

This section covers several other configuration options you can use. For a fuller discussion see our [API Documentation](https://ajaxsnapshots.com/apidocs).

All configuration options are set using the `set` method. This can take a key-value pair or a configuration object as follows:

```js
var ajs = require('ajs-express');

//key-value based configuration
ajs.set('foo','bar');
ajs.set('baz','elf');

//equivalent config-object based configuration
ajs.set({
  foo:'bar',
  baz:'elf'
});

```

The available configuration options are:

* __apikey__ (mandatory) Your API Key (it's on your account page)
* __snap-time__ (default: 5000) This lets you specify how long in milliseconds we should wait after the page's onload event fires before we take the snapshot. Note that the snapshot will be taken earlier than this if either our on-page [Javascript API](https://ajaxsnapshots.com/apidocs#JavascriptAPI) is used to specify an exact time for the snapshot or 40 seconds has elapsed since we started loading your page.
* __remove-hidden__ (default: true) If true then all hidden elements in the page body except for scripts and stylesheets will be removed before returning the snapshot. The term hidden is defined as per the `:hidden` JQuery 2.0 selector, except that we do not remove `head`, `meta`, `link`, `style` or `title` elements.
* __remove-selector__ (default: undefined) If set this is should be a valid JQuery 2.0 selector. All matching elements on your page will be removed before returning the snapshot.
* __device-width__ (default: 1280) Sets the width in pixels of the headless browser used to render your page. Setting this can be important when you are using responsive pages that show different content at different page sizes.
* __device-height__ (default: 800) Sets the height in pixels of the headless browser used to render your page. Setting this can be important when you are using responsive pages that show different content at different page sizes.

####Learn More

For more on how to get your [AngularJS](http://angularjs.org/), [EmberJS](http://emberjs.com/), [BackBoneJS](http://backbonejs.org/), [Sencha](http://www.sencha.com/) or other Javascript sites properly indexed by Google and other search engines visit us a https://ajaxsnapshots.com





