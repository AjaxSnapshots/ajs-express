/*
 * ajaxexpress
 * https://github.com//ajaxexpress
 *
 * Copyright (c) 2014 AjaxSnapshots
 * Licensed under the MIT license.
 */

'use strict';

var http = require('http');
var url = require('url');

exports = function(req, res, next) {

  var scope = this;

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

    //GET only
    if (req.method !== 'GET') {
      return false;
    }
    //prevent loops
    if (req.headers['X-AJS-CALLTYPE']) {
      return false;
    }

    //skip static resources
    if (IGNORED_EXTENSIONS_REGEX.test(req.url)) {
      return false;
    }

    //check user agent
    var USER_AGENT = req.headers['user-agent'] || null;
    if (USER_AGENT && USER_AGENT_REGEX.test(USER_AGENT)) {
      return true;
    }

    //check _escaped_fragment_
    if (url.parse(req.url, true).query['_escaped_fragment_']) {
      return true;
    }

    return false;
  }

  function addAJSHeader(name, options) {
    var uname = 'X-AJS-' + name.toUpperCase();
    if (scope[name]) {
      options.headers[uname] = scope[name];
    }
  }

  function serveSnapshot(req, res) {

    //also need to deal with cloudflare
    var protocol = req.get('X-Forwarded-Proto') || req.protocol;
    var reqUrl = protocol + "://" + req.get('host') + req.url;
    var snapReq = API_PREFIX + '?url=' + encodeURIComponent(reqUrl);
    var options = url.parse(snapReq);

    //copy request headers and add AJS config headers
    options.headers = req.headers;
    for (var i = 0; i < AJS_PARAMS.length(); i++) {
      var name = AJS_PARAMS[i];
      addAJSHeader(name, options.headers);
    }

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

  if (!shouldServeSnapshot(req)) {
    return next();
  } else {
    serveSnapshot(req, res);
  }


};

exports.set = function(key, val) {
  this[key] = val;
  return this;
};


