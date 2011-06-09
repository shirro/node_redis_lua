var
  redis = require('redis');

require('redis-lua').attachLua(redis);

r = redis.createClient();

script = 'return {"k1", "v1", "k2", "v2"}';
redis.lua('hashlike', 0, script, 'keyed');

r.hashlike(function(err, res) {
  if (err) throw err;
  console.log( res);
  r.quit();
});
