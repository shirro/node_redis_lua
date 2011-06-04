#
# Copyright 2010 Paul Shirren <shirro@shirro.com>
#
# MIT licenced
#
# Patch lua commands into node-redis prototype. Does not assume node-redis
# has been patched with scripting support so can use standard version.

createHash = require('crypto').createHash
RedisClient = require('redis').RedisClient

sha = (str) ->
  createHash('sha1').update(str).digest('hex')

#### Eample usage
#     r = require('redis').createClient()
#     lua = require('node_redis_lua').lua
#
#     lua 'myset', 2, 'return redis.call("set", KEYS[1], KEYS[2])'
#     lua 'myget', 1, 'return redis.call("get", KEYS[1])'
#
#     r.myset 'testing', 'surprise', (err, res) ->
#       err || r.myset 'testing', 'surprise', (err, res) ->
#         err || r.myget 'testing', (err, res) ->
#           err || console.log "It worked, testing = #{res}"
#           r.quit()

exports.lua = (name, keys, script) ->

  script_sha = null

  # Use send_command to work with unpatched node-redis without eval, evalsha
  eval_cmd = (redis, params, cb) ->
    params.unshift script
    params.unshift 'eval'
    params.push cb
    redis.send_command.apply redis, params

  evalsha_cmd = (redis, params, cb) ->
    params.unshift script_sha
    params.unshift 'evalsha'
    params.push cb
    redis.send_command.apply redis, params

  # Add our new Lua command into the RedisClient prototype so it looks
  # like native redis
  RedisClient.prototype[name] = (params..., cb) ->
    redis = this
    params.unshift keys

    if script_sha
      evalsha_cmd redis, params, (err, res) ->
        # Is this really the right way to test?
        if err and err.message.indexOf('NOSCRIPT') > 0
          eval_cmd redis, params.slice(1,-1), cb
        else
          cb err, res
    else
      script_sha = script_sha or sha script
      eval_cmd redis, params, cb

