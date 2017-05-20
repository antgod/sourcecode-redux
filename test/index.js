const Redux = require('../lib/index')

function counter1(state, action) {}


function r1(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1
  }
  return state
}

function r2(state = 0, action) {
  switch (action.type) {
    case 'DECREMENT':
      return state - 1
  }
  return state
}

const reducer = Redux.combineReducers({
  r1,r2
})

const logger = store => next => action => {
  console.log('logger: ', action);
  next(action);
  console.log('logger finish: ', action);
}

const write = store => next => action => {
  console.log('write:', action);
  next(action);
  console.log('write finish:', action);
}

const finalCreateStore = Redux.compose(
  Redux.applyMiddleware(logger, write)
)(Redux.createStore)

// 1. const store = compose(applyMiddleware(logger, write))(createStore)(reducer)
// 2. const store = Redux.applyMiddleware(mid1, mid2, mid3, ...)(Redux.createStore)(reducer, null);
// 3. const store = Redux.createStore(reducer, null, applyMiddleware(logger, write))

var store = finalCreateStore(counter1)

function render() {
  console.log(store.getState())
}

const unsubscriber1 = store.subscribe(render)
const unsubscriber2 = store.subscribe(render)
// 取消订阅函数
unsubscriber1()

setTimeout(()=> {
  console.log('--------分割线---------')
  store.dispatch({ type: 'INCREMENT' })

  // 更新reducer
  console.log('--------分割线---------')
  store.replaceReducer(reducer)    // 打印初始化状态 0

  console.log('--------分割线---------')
  store.dispatch({ type: 'INCREMENT' }) // 打印1
}, 1000)
