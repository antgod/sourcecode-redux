import compose from './compose'

/* 中间件 格式为
store => next => action => {
  console.log('dispatch:', action);
  next(action);
  console.log('finish:', action);
}
*/
export default function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var store = createStore(reducer, preloadedState, enhancer)
    var dispatch = store.dispatch
    var chain = []

    var middlewareAPI = {
      getState: store.getState,
      // 这样中间件拿到store 可以再次 dispatch
      dispatch: (action) => dispatch(action)
    }

    // middlewareAPI作为参数执行中间件最外层。得到中间件 返回数组，既为[next => action => {...}]
    chain = middlewares.map(middleware => middleware(middlewareAPI))

    // 注意compose是逆序，也就是说，store.dispatch传递给最后一个middleware的next,执行完之后，把最后一个中间件返回给倒数第二个，next是最后一个...以此类推，最后返回第一个中间件，next为第二个中间件。
    // 执行的时候，先执行第一个中间件，next执行第二个...以此类推，最后执行store.dispatch.
    dispatch = compose(...chain)(store.dispatch)

    // 中间件依次执行。中间件任意位置可以自己手动执行next（包括初始化部分）
    return {
      ...store,
      dispatch
    }
  }
}
