var cleanup, lua, r;
r = require('redis').createClient();
lua = require('redis-lua').lua;
cleanup = function(err) {
  if (err) {
    console.log(err);
    r.quit();
  }
  return err;
};
lua('myset', 1, 'return redis.call("set", KEYS[1], ARGV[1])');
lua('myget', 1, 'return redis.call("get", KEYS[1])');
r.myset('testing', 'surprise', function(err, res) {
  return cleanup(err || r.myset('testing', 'surprise', function(err, res) {
    return cleanup(err || r.myget('testing', function(err, res) {
      cleanup(err || console.log("It worked, testing = " + res));
      return r.quit();
    }));
  }));
});