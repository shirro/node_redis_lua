redis = require 'redis'
require('redis-lua').attachLua(redis)

r = redis.createClient()

# lua command name, number of keys, script
redis.lua 'myset', 1, 'return redis.call("set", KEYS[1], ARGV[1])'
redis.lua 'myget', 1, 'return redis.call("get", KEYS[1])'

# The first time eval will be used
r.myset 'testing', 'surprise', ->
  # After that evalsha will be used with eval fallback
  r.myset 'testing', 'surprise', ->
    r.myget 'testing', (err, res) ->
      console.log err || "It worked, testing = #{res}"
      r.quit()

