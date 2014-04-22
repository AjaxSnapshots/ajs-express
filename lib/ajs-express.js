/*
 * ajs-express
 * https://github.com//AjaxSnapshots/ajs-express
 *
 * Copyright (c) 2013-2014 AjaxSnapshots
 * Licensed under the MIT license.
 */

var https = require('https');
var http = require('http');
var url = require('url');

var scope = this;

var ajs = module.exports = function(req, res, next) {

  var DEFAULT_SERVER = 'https://api.ajaxsnapshots.com';

  var AJS_PARAMS = [
    'apikey', 'snap-time', 'remove-hidden',
    'remove-selector', 'device-width', 'device-height'
  ];

  var USER_AGENTS_NEEDING_SNAPSHOTS = [
    'FacebookExternalHit', 'LinkedInBot', 'TwitterBot'
  ];

  var IGNORED_EXTENSIONS = [
    'js',
    'css', 'less',
    'png', 'jpg', 'jpeg', 'ico', 'gif', 'tif', 'tiff',
    'psd', 'txt', 'rss', 'xml',
    'zip', 'rar', 'jar', 'exe', 'cab', 'dat',
    'pdf', 'doc', 'ppt', 'xls',
    'ai', 'avi', 'mp3', 'wav',
    'mp4', 'mpg', 'mpeg', 'm4v', 'mkf', 'm4a', 'wmv', 'mov',
    'dmg', 'iso',
    'flv', 'swf', 'svg',
    'magnet', 'torrent'
  ];

  var USER_AGENT_REGEX = new RegExp(USER_AGENTS_NEEDING_SNAPSHOTS.join('|'), 'i');
  var IGNORED_EXTENSIONS_REGEX = new RegExp('\\.(' + IGNORED_EXTENSIONS.join('|') + ')$', 'i');

  function shouldServeSnapshot(req) {

    //GET only
    if (req.method !== 'GET') {
      return false;
    }
    //prevent loops
    if (req.headers['x-ajs-calltype']) {
      return false;
    }

    //skip static resources
    if (IGNORED_EXTENSIONS_REGEX.test(req.url)) {
      return false;
    }

    //check user agent
    var user_agent = req.headers['user-agent'] || null;
    if (user_agent && USER_AGENT_REGEX.test(user_agent)) {
      return true;
    }

    //check _escaped_fragment_
    var ef = url.parse(req.url, true).query['_escaped_fragment_'];
    if (typeof ef !== 'undefined') {
      return true;
    }

    return false;
  }

  function addAJSHeader(name, headers) {
    var uname = 'X-AJS-' + name.toUpperCase();
    if (scope[name]) {
      headers[uname] = scope[name];
    }
  }

  function toOriginalURL(efURL) {
    var encHashBangPart = url.parse(efURL, true).query['_escaped_fragment_'];
    var decHashBangPart = decodeURIComponent(encHashBangPart);
    var reqURL = efURL.replace('?_escaped_fragment_=' + encHashBangPart, '#!' + decHashBangPart)
      .replace('&_escaped_fragment_=' + encHashBangPart, '#!' + decHashBangPart);
    return reqURL;
  }

  function serveSnapshot(req, res) {

    var snapServer = scope['snap-server'] || DEFAULT_SERVER;

    var protocol = req.get('X-Forwarded-Proto') || req.protocol;
    var reqUrl = protocol + '://' + req.get('host') + req.url;
    var snapReq = snapServer + '/makeSnapshot?url=' + encodeURIComponent(reqUrl);
    var options = url.parse(snapReq);

    options.headers = {};

    //pass on all req headers except HOST
    for (var name in req.headers) {
      if (req.headers.hasOwnProperty(name) && name !== 'host') {
        //ajs.set(k, config[k]);
        options.headers[name] = req.headers[name];
      }
    }

    for (var i = 0; i < AJS_PARAMS.length; i++) {
      var name = AJS_PARAMS[i];
      addAJSHeader(name, options.headers);
    }

    var proto = (snapServer.indexOf('https') === 0) ? https : http;

    //call AJAXSnapshots
    proto.get(options, function(ajsRes) {

      //build response body
      var respBody = '';
      ajsRes.on('data', function(chunk) {
        respBody += chunk;
      });

      //send response
      ajsRes.on('end', function() {

        //copy headers and body
        if (ajsRes.statusCode !== 200) {
          req.url = toOriginalURL(req.url);
          next();
        } else {
          res.set(ajsRes.headers);
          res.send(ajsRes.statusCode, respBody);
        }
      });

    }).on('error', function() {
      req.url = toOriginalURL(req.url);
      next();
    });

  }

  if (!shouldServeSnapshot(req)) {
    return next();
  } else {
    serveSnapshot(req, res);
  }
};

//takes key, value or object to bulk set, chainable
ajs.set = function(key, val) {
  if (typeof key === 'string') {
    scope[key] = '' + val;
  } else if (typeof key === 'object') {
    var config = key;
    for (var k in config) {
      if (config.hasOwnProperty(k)) {
        ajs.set(k, config[k]);
      }
    }
  }
  return ajs;
};



