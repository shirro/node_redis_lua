var cleanup, r, redis;
redis = require('redis');
require('../redis-lua').attachLua(redis);
r = redis.createClient();
cleanup = function(err) {
  if (err) {
    console.log(err);
    r.quit();
  }
  return err;
};
redis.lua('myset', 1, 'return redis.call("set", KEYS[1], ARGV[1])');
redis.lua('myget', 1, 'return redis.call("get", KEYS[1])');
r.myset('testing', 'surprise', function(err, res) {
  return cleanup(err || r.myset('testing', 'surprise', function(err, res) {
    return cleanup(err || r.myget('testing', function(err, res) {
      cleanup(err || console.log("It worked, testing = " + res));
      return r.quit();
    }));
  }));
});