(function() {
  var RedisClient, createHash, sha;
  var __slice = Array.prototype.slice;
  createHash = require('crypto').createHash;
  RedisClient = require('redis').RedisClient;
  sha = function(str) {
    return createHash('sha1').update(str).digest('hex');
  };
  exports.lua = function(name, keys, script) {
    var eval_cmd, evalsha_cmd, script_sha;
    script_sha = null;
    eval_cmd = function(redis, params, cb) {
      params.unshift(script);
      params.unshift('eval');
      params.push(cb);
      return redis.send_command.apply(redis, params);
    };
    evalsha_cmd = function(redis, params, cb) {
      params.unshift(script_sha);
      params.unshift('evalsha');
      params.push(cb);
      return redis.send_command.apply(redis, params);
    };
    return RedisClient.prototype[name] = function() {
      var cb, params, redis, _i;
      params = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      redis = this;
      params.unshift(keys);
      if (script_sha) {
        return evalsha_cmd(redis, params, function(err, res) {
          if (err && err.message.indexOf('NOSCRIPT') > 0) {
            return eval_cmd(redis, params.slice(1, -1), cb);
          } else {
            return cb(err, res);
          }
        });
      } else {
        script_sha = script_sha || sha(script);
        return eval_cmd(redis, params, cb);
      }
    };
  };
}).call(this);
