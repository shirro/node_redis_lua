#/usr/bin/env coffee
redis = require 'redis'
attachLua = require('redis-lua').attachLua

r = attachLua(redis).createClient()

redis.lua 'hsetmax', 2, """
  local current = tonumber(redis.call('hget',KEYS[1], KEYS[2]))
  local max = tonumber(ARGV[1])
  if current == nil or current < max then
    return redis.call('hset',KEYS[1], KEYS[2], max)
  else
    return current
  end
"""

r.hset 'stat', 'thing', 5, (err, res) ->
  console.log err || "Setting stat->thing to 5"
  r.hsetmax 'some_stat', 'some_thing', 6, (err, res) ->
    console.log err || "Set to max of 6 or current, result: #{res}"
    r.hsetmax 'some_stat', 'some_thing', 4, (err, res) ->
      console.log err || "Set to max of 4 or current, result: #{res}"
      r.quit()
