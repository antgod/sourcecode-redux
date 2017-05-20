function bindActionCreator(actionCreator, dispatch) {
  return (...args) => dispatch(actionCreator(...args))
}

/*
* params:
* actionCreators:
* export function addTodo(text) {
     return {
       type: 'ADD_TODO',
       text
     };
  }

  export function removeTodo(id) {
     return {
        type: 'REMOVE_TODO',
        id
     };
  }
* */

export default function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${actionCreators === null ? 'null' : typeof actionCreators}. ` +
      `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }
  // 拿到 actionName: addTodo removeTodo
  var keys = Object.keys(actionCreators)
  var boundActionCreators = {}
  for (var i = 0; i < keys.length; i++) {
    // addTodo
    var key = keys[i]
    // fn
    var actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      // 包装函数：在原函数上增加dispatch包装。
      // 我们直接把经过dispatch包装过函数传递给子组件，而不是让子组件拿到传递过去dispatch再去执行，这样子组件只通过传递过去的函数调用即可，完全不知道有redux的存在
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
