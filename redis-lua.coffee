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
RedisClient = require('redis').RedisClient

sha = (str) ->
  createHash('sha1').update(str).digest('hex')

#### Example usage
#     r = require('redis').createClient()
#     lua = require('node_redis_lua').lua
#
#     lua 'mycmd', num_keys, lua_script
#
#     r.mycmd 'key', 'value', callback

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

