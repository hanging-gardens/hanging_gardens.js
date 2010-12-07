var distribution = require('./distribution')
,   archive      = require('./archive')
,   url          = require('url')
,   dir          = require('../util/dir')
,   path         = require('path')
,   cryp         = require('crypto')
,   fs           = require('fs')
;

var _reenter
,   _validate_bare
,   _reenter_dist
,   _validate_dist
,   _reenter_fetch
,   _fetch
,   _unpack
;

exports.cache = function(packages, config, callback){
  var acc
  ,   name
  ;

  acc =
  { packages:            packages
  , config:              config
  , validate_bare_queue: []
  , validate_dist_queue: []
  , fetch_queue:         []
  , unpack_queue:        []
  };

  for (name in packages) {
    if (name != '_application')
      acc.validate_bare_queue.push(name);
  }

  dir.ensure_path(path.join(config.cache_dir, '.dist'), function(err){
    if (err){
      callback(err, undefined);
      return;
    }

    _reenter(acc, callback);
  });
};

_reenter = function(acc, callback){
  if (acc.validate_bare_queue.length > 0) {
    _validate_bare(acc, callback);
  } else if (acc.validate_dist_queue.length > 0) {
    _reenter_dist(acc, callback);
  } else if (acc.fetch_queue.length > 0) {
    _reenter_fetch(acc, callback);
  } else if (acc.unpack_queue.length > 0) {
    _unpack(acc, callback);
  } else {
    callback(undefined, acc.packages);
  }
};

_validate_bare = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.validate_bare_queue.shift();
  package = acc.packages[name];

  package._root = path.join(acc.config.cache_dir, package.name, package.version);

  path.exists(package._root, function(exists){
    if (!exists) {
      acc.validate_dist_queue.push(name);
    }

    _reenter(acc, callback);
  });
};

_reenter_dist = function(acc, callback){
  var name
  ,   package
  ,   dist
  ;

  if (!acc.validate_dist_queue_dists) {
    name    = acc.validate_dist_queue.shift();
    package = acc.packages[name];

    acc.validate_dist_queue_name  = name;
    acc.validate_dist_queue_dists = [];

    for (dist in package.dist) {
      acc.validate_dist_queue_dists.push(dist);
    }

    _reenter_dist(acc, callback);
  } else if (acc.validate_dist_queue_dists.length > 0) {
    _validate_dist(acc, callback);
  } else {
    if (acc.package_dist) {
      name = acc.validate_dist_queue_name;
      dist = acc.package_dist;
      delete acc['validate_dist_queue_dists'];
      delete acc['validate_dist_queue_name'];
      delete acc['package_dist'];
      acc.unpack_queue.push([name, dist]);
      _reenter(acc, callback);
    } else {
      name = acc.validate_dist_queue_name;
      acc.fetch_queue.push(name);
      _reenter(acc, callback);
    }
  }
};

_validate_dist = function(acc, callback){
  var name
  ,   dist
  ,   package
  ,   hash
  ,   dist_path
  ;

  name    = acc.validate_dist_queue_name;
  dist    = acc.validate_dist_queue_dists.shift();
  package = acc.packages[name];

  hash = cryp.createHash('sha1');
  hash.update(dist + package.dist[dist] + package.name + package.version);
  hash = hash.digest('hex');

  dist_path = path.join(acc.config.cache_dir, '.dist', hash);

  path.exists(dist_path, function(exists){
    if (exists) {
      acc.package_dist = dist;
      acc.validate_dist_queue_dists = [];
      package.dist_path = dist_path;
      _reenter_dist(acc, callback);
    } else {
      _reenter_dist(acc, callback);
    }
  });
};

_reenter_fetch = function(acc, callback){
  var name
  ,   package
  ,   dist
  ;

  if (!acc.fetch_queue_dists) {
    name    = acc.fetch_queue.shift();
    package = acc.packages[name];

    acc.fetch_queue_name  = name;
    acc.fetch_queue_dists = [];

    for (dist in package.dist) {
      acc.fetch_queue_dists.push(dist);
    }

    _reenter_fetch(acc, callback);
  } else if (acc.fetch_queue_dists.length > 0) {
    _fetch(acc, callback);
  } else {
    if (acc.package_dist) {
      name = acc.fetch_queue_name;
      dist = acc.package_dist;
      delete acc['fetch_queue_dists'];
      delete acc['fetch_queue_name'];
      delete acc['package_dist'];
      acc.unpack_queue.push([name, dist]);
      _reenter(acc, callback);
    } else {
      name = acc.fetch_queue_name;
      callback(new Error("Failed to fetch "+ name), undefined);
    }
  }
};

_fetch = function(acc, callback){
  var name
  ,   package
  ,   hash
  ,   dist
  ,   dist_url
  ,   dist_type
  ;

  name    = acc.fetch_queue_name;
  dist    = acc.fetch_queue_dists.shift();
  package = acc.packages[name];

  hash = cryp.createHash('sha1');
  hash.update(dist + package.dist[dist] + package.name + package.version);
  hash = hash.digest('hex');

  dist_path = path.join(acc.config.cache_dir, '.dist', hash);

  dist_url  = url.parse(package.dist[dist]);
  dist_type = dist_url.protocol.substr(0, dist_url.protocol.length - 1);

  distribution[dist_type](dist_url, dist_path, function(err){
    if (err){
      _reenter_fetch(acc, callback);
      return;
    }

    package.dist_path = dist_path;
    acc.fetch_queue_dists = [];
    acc.package_dist      = dist;

    _reenter_fetch(acc, callback);
  });
};

_unpack = function(acc, callback){
  var name
  ,   package
  ,   dist
  ;

  dist       = acc.unpack_queue.shift();
  name       = dist[0];
  dist       = dist[1];
  package    = acc.packages[name];
  cache_path = path.join(acc.config.cache_dir, name, package.version);

  dir.ensure_path(path.dirname(cache_path), function(err){
    if (err) {
      callback(err, undefined);
      return;
    }

    archive[dist](package.dist_path, cache_path, function(err){
      if (err) {
        callback(err, undefined);
        return;
      }

      _reenter(acc, callback);
    });
  });
};
