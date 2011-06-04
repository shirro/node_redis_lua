var cleanup, lua, r, rp;
r = require('redis').createClient();
lua = require('redis-lua').lua;
rp = require('redis').print;
cleanup = function(err) {
  if (err) {
    console.log(err);
    r.quit();
    process.exit;
  }
  return err;
};
lua('hsetmax', 2, "local current = tonumber(redis.call('hget',KEYS[1], KEYS[2]))\nlocal max = tonumber(ARGV[1])\nif current == nil or current < max then\n  return redis.call('hset',KEYS[1], KEYS[2], max)\nelse\n  return current\nend");
r.hset('stat', 'thing', 5, function(err, res) {
  console.log("Setting stat->thing to 5");
  return cleanup(err || r.hsetmax('some_stat', 'some_thing', 6, function(err, res) {
    console.log("Set to max of 6 or current, result: " + res);
    return cleanup(err || r.hsetmax('some_stat', 'some_thing', 4, function(err, res) {
      console.log("Set to max of 4 or current, result: " + res);
      return r.quit();
    }));
  }));
});