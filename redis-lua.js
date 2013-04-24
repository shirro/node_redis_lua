
var
  createHash = require('crypto').createHash,
  sha = function(str) {return createHash('sha1').update(str).digest('hex');};

function eval_cmd(db, script, params, cb) {
  params.unshift(script);
  db.send_command.call(db, 'eval', params, cb);
}

function evalsha_cmd(db, script_sha, params, cb) {
  params.unshift(script_sha);
  db.send_command.call(db, 'evalsha', params, cb);
}

function keyval(cb) {
  return function(err, res) {
    var
      hash = {},
      i,
      key,
      val;

    if (err) {
      cb(err);
    } else if (res.length % 2 !== 0 ) {
      cb('result length not even');
    } else {
      for(i=0; i<res.length; i +=2) {
        key = res[i].toString();
        val = res[i+1];
        hash[key] = val;
      }
      cb(null, hash);
    }
  };
}

exports.attachLua = function(redis) {
  redis.lua = function(name, num_keys, script, keyed) {
    var
      script_sha;

    function eval_cmd_callback(cb, err, res) {
        if (!err) {
            script_sha = script_sha || sha(script);
        }
        cb(err, res);
    }

    redis.RedisClient.prototype[name] = function() {
      var
        cb,
        db,
        that = this,
        params;

      params = [].slice.call(arguments, 0, arguments.length);
      if (params.length > 0 && typeof params[params.length-1] == 'function') {
          cb = params.pop();
      } else {
        cb = function(){};
      }

      if (keyed) {
        cb = keyval(cb);
      }

      params.unshift(num_keys);

      if (script_sha) {
        evalsha_cmd(that, script_sha, params, function(err, res) {
          if (err && typeof err.message === 'string' && err.message.indexOf('NOSCRIPT') > 0) {
            script_sha = undefined;
            eval_cmd(that, script, params.slice(1, -1), eval_cmd_callback.bind(null, cb));
          } else {
            cb(err, res);
          }
        });
      } else {
        eval_cmd(that, script, params, eval_cmd_callback.bind(null, cb));
      }
    };
  };
  return redis;
};

