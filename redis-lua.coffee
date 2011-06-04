#
# Copyright 2010 Paul Shirren <shirro@shirro.com>
#
# [MIT licenced](http://opensource.org/licenses/mit-license.php)
#
# Patch lua commands into node-redis prototype. Does not assume node-redis
# has been patched with scripting support so can use standard version.
#
# The [source is on github](https://github.com/shirro/node_redis_lua)

createHash = require('crypto').createHash

sha = (str) ->
  createHash('sha1').update(str).digest('hex')

#### Example usage
#     redis = require('redis')
#     require('redis_lua').attachclient(redis)
#     r = redis.createClient()
#
#     redis.lua 'mycmd', num_keys, lua_script
#
#     r.mycmd 'key', 'value', callback

RedisClient = null


lua = (name, keys, script) ->

  script_sha = null

  # Use send_command to work with unpatched node-db without eval, evalsha
  eval_cmd = (db, params, cb) ->
    params.unshift script
    params.unshift 'eval'
    params.push cb
    db.send_command.apply db, params

  evalsha_cmd = (db, params, cb) ->
    params.unshift script_sha
    params.unshift 'evalsha'
    params.push cb
    db.send_command.apply db, params

  # Add our new Lua command into the RedisClient prototype so it looks
  # like native db
  RedisClient.prototype[name] = (params..., cb) ->
    db = this
    params.unshift keys

    if script_sha
      evalsha_cmd db, params, (err, res) ->
        # Is this really the right way to test?
        if err and err.message.indexOf('NOSCRIPT') > 0
          eval_cmd db, params.slice(1,-1), cb
        else
          cb err, res
    else
      script_sha = script_sha or sha script
      eval_cmd db, params, cb

exports.attachLua = (redis) ->
  RedisClient = redis.RedisClient
  redis.lua = lua
  redis
