/*
 * ajaxexpress
 * https://github.com//ajaxexpress
 *
 * Copyright (c) 2014 AjaxSnapshots
 * Licensed under the MIT license.
 */

'use strict';

console.log("pre-loading ajs-express");

var http = require('http');
var url = require('url');

module.exports = function() {

  var scope = {};

  function snapmw(req, res, next) {

    console.log("loading ajs-express: " + scope['apikey']);

    //var API_PREFIX = 'https://api.ajaxsnapshots.com/makeSnapshot';
    var API_PREFIX = 'http://localhost:6745/makeSnapshot';
    var AJS_PARAMS = ['apikey', 'snap-time', 'remove-hidden', 'remove-selector', 'device-width', 'device-height'];
    var USER_AGENTS_NEEDING_SNAPSHOTS = ['FacebookExternalHit', 'LinkedInBot', 'TwitterBot'];
    var IGNORED_EXTENSIONS = ['js',
      'css',
      'less',
      'png',
      'jpg',
      'jpeg',
      'ico',
      'gif',
      'tif',
      'tiff',
      'psd',
      'txt',
      'rss',
      'xml',
      'zip',
      'rar',
      'jar',
      'exe',
      'cab',
      'pdf',
      'doc',
      'ppt',
      'xls',
      'ai',
      'avi',
      'mp3',
      'wav',
      'mp4',
      'mpg',
      'mpeg',
      'm4v',
      'mkf',
      'm4a',
      'wmv',
      'mov',
      'psd',
      'dat',
      'dmg',
      'iso',
      'flv',
      'swf',
      'svg',
      'magnet', 'torrent'];

    var USER_AGENT_REGEX = new RegExp(USER_AGENTS_NEEDING_SNAPSHOTS.join('|'), 'i');
    var IGNORED_EXTENSIONS_REGEX = new RegExp('\\.(' + IGNORED_EXTENSIONS.join('|') + ')$', 'i');

    function shouldServeSnapshot(req) {

      console.log("shouldServeSnapshot: " + req.url);

      //GET only
      if (req.method !== 'GET') {
        console.log("NOT GET");
        return false;
      }
      //prevent loops
      if (req.headers['X-AJS-CALLTYPE']) {
        console.log("LOOP");
        return false;
      }

      //skip static resources
      if (IGNORED_EXTENSIONS_REGEX.test(req.url)) {
        console.log("IGNORED_EXT");
        return false;
      }

      //check user agent
      var USER_AGENT = req.headers['user-agent'] || null;
      if (USER_AGENT && USER_AGENT_REGEX.test(USER_AGENT)) {
        console.log("USER_AGENT_TRIGGER");
        return true;
      }

      //check _escaped_fragment_
      console.log("TEST " + JSON.stringify(url.parse(req.url, true)));

      var ef = url.parse(req.url, true).query['_escaped_fragment_'];
      if (typeof ef !== 'undefined') {
        console.log("FRAGMENT_TRIGGER");
        return true;
      }
      console.log("DEFAULT_FALSE");
      return false;
    }

    function addAJSHeader(name, headers) {
      console.log("Add header: " + name);
      var uname = 'X-AJS-' + name.toUpperCase();
      if (scope[name]) {
        console.log("Found header: " + scope[name]);
        headers[uname] = scope[name];
      }
    }

    function serveSnapshot(req, res) {

      console.log("serveSnapshot");

      //also need to deal with cloudflare
      var protocol = req.get('X-Forwarded-Proto') || req.protocol;
      var reqUrl = protocol + "://" + req.get('host') + req.url;
      var snapReq = API_PREFIX + '?url=' + encodeURIComponent(reqUrl);
      var options = url.parse(snapReq);

      //copy request headers and add AJS config headers
      options.headers = req.headers;
      for (var i = 0; i < AJS_PARAMS.length; i++) {
        var name = AJS_PARAMS[i];
        addAJSHeader(name, options.headers);
      }

      console.log(JSON.stringify(options.headers));

      //call AJAXSnapshots
      http.get(options, function(ajsRes) {

        //build response body
        var respBody = "";
        ajsRes.on('data', function(chunk) {
          respBody += chunk;
        });

        ajsRes.on('end', function() {
          //copy headers and body
          res.set(ajsRes.headers);
          res.send(ajsRes.statusCode, respBody);
        }).on('error', function() {
          //one error skip snapshotting.
          next();
        });

      });

    }

    console.log("testing ajs-express");
    if (!shouldServeSnapshot(req)) {
      return next();
    } else {
      serveSnapshot(req, res);
    }

  };


  function set(key, val) {
    console.log("setting " +  key  + " -> " + val);
    scope[key] = val;
    return scope;
  };

  return {
    snapmw:snapmw,
    set:set
  }

}();


