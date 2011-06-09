
var 
  createHash = require('crypto').createHash,
  sha = function(str) {return createHash('sha1').update(str).digest('hex');};

function eval_cmd(db, script, params, cb) {
  params.unshift(script);
  params.unshift('eval');
  params.push(cb);
  db.send_command.apply(db, params);
}

function evalsha_cmd(db, script_sha, params, cb) {
  params.unshift(script_sha);
  params.unshift('evalsha');
  params.push(cb);
  db.send_command.apply(db, params);
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
    
    redis.RedisClient.prototype[name] = function() {
      var
        cb,
        db,
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
        evalsha_cmd(this, script_sha, params, function(err, res) {
          if (err && err.message.indexOf('NOSCRIPT') > 0) {
            eval_cmd(this, script, params.slice(1, -1), cb);
          } else {
            cb(err, res);
          }
        });
      } else {
        script_sha = script_sha || sha(script);
        eval_cmd(this, script, params, cb);
      }
    };
  };
  return redis;
};

