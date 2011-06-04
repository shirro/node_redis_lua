redis = require 'redis'
require('../redis-lua').attachLua(redis)

r = redis.createClient()

cleanup = (err) ->
  if err
    console.log err
    r.quit()
  err

# lua command name, number of keys, script
redis.lua 'myset', 1, 'return redis.call("set", KEYS[1], ARGV[1])'
redis.lua 'myget', 1, 'return redis.call("get", KEYS[1])'

# The first time eval will be used
r.myset 'testing', 'surprise', (err, res) ->
  # After that evalsha will be used with eval fallback
  cleanup err or r.myset 'testing', 'surprise', (err, res) ->
    cleanup err or r.myget 'testing', (err, res) ->
      cleanup err or console.log "It worked, testing = #{res}"
      r.quit()

