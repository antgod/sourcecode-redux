import { ActionTypes } from './createStore'
import isPlainObject from 'lodash/isPlainObject'
import warning from './utils/warning'

var NODE_ENV = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development'

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type
  var actionName = actionType && `"${actionType.toString()}"` || 'an action'

  return (
    `Given action ${actionName}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state.`
  )
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers)
  var argumentName = action && action.type === ActionTypes.INIT ?
    'preloadedState argument passed to createStore' :
    'previous state received by the reducer'

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }

  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      ({}).toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }

  var unexpectedKeys = Object.keys(inputState).filter(key =>
    !reducers.hasOwnProperty(key) &&
    !unexpectedKeyCache[key]
  )

  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}

//function r1(state, action) {}
//function r2(state, action) {}
//
//const reducer = combineReducers({
//  r1,
//  r2
//})

// 这样store就有两个键：r1和r2，分别存储每个reducer的返回结果
// 也就是说，使用combineReducers把全局store按命名空间进行隔离。隔离的方式就是reducer的名字。
// { r1: state, r2: state }
export default function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers)
  // 内部创建保存reducers的变量
  var finalReducers = {}

  // 保存reducer，也做了数据过滤
  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i]

    if (NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  var finalReducerKeys = Object.keys(finalReducers)

  if (NODE_ENV !== 'production') {
    var unexpectedKeyCache = {}
  }

  // 如果每个reducer没有返回值
  var sanityError
  try {
    assertReducerSanity(finalReducers)
  } catch (e) {
    sanityError = e
  }

  return function combination(state = {}, action) {
    if (sanityError) {
      throw sanityError
    }

    if (NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache)
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    var hasChanged = false
    var nextState = {}
    for (var i = 0; i < finalReducerKeys.length; i++) {
      // 每个reducer的key, r1
      var key = finalReducerKeys[i]
      // 每个reducer的值, r1函数
      var reducer = finalReducers[key]
      // key的上一次状态，也就是state['r1']
      var previousStateForKey = state[key]
      // 执行每个reducer，把上一次的状态和action传入，返回一个新的状态
      var nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      // 下次的状态更新
      nextState[key] = nextStateForKey
      // 判断是否变化
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // 如果有变化，返回变化后的状态
    return hasChanged ? nextState : state
  }
}
