var RedisClient, createHash, lua, sha;
var __slice = Array.prototype.slice;
createHash = require('crypto').createHash;
sha = function(str) {
  return createHash('sha1').update(str).digest('hex');
};
RedisClient = null;
lua = function(name, keys, script) {
  var eval_cmd, evalsha_cmd, script_sha;
  script_sha = null;
  eval_cmd = function(db, params, cb) {
    params.unshift(script);
    params.unshift('eval');
    params.push(cb);
    return db.send_command.apply(db, params);
  };
  evalsha_cmd = function(db, params, cb) {
    params.unshift(script_sha);
    params.unshift('evalsha');
    params.push(cb);
    return db.send_command.apply(db, params);
  };
  return RedisClient.prototype[name] = function() {
    var cb, db, params, _i;
    params = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
    db = this;
    params.unshift(keys);
    if (script_sha) {
      return evalsha_cmd(db, params, function(err, res) {
        if (err && err.message.indexOf('NOSCRIPT') > 0) {
          return eval_cmd(db, params.slice(1, -1), cb);
        } else {
          return cb(err, res);
        }
      });
    } else {
      script_sha = script_sha || sha(script);
      return eval_cmd(db, params, cb);
    }
  };
};
exports.attachLua = function(redis) {
  RedisClient = redis.RedisClient;
  redis.lua = lua;
  return redis;
};