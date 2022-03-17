/**
 * The router.
 * - Initializes app state according to start URL.
 * - Adapts app state when URL changes.
 */

import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from './components/zw-login'
import Workspace from './components/zw-workspace'
import Admin from './components/admin/zw-admin'
import store from './store'
import dmx from 'dmx-api'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      path: '/',
      name: 'root'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/workspace/:workspaceId',
      name: 'workspace',
      component: Workspace
    },
    {
      path: '/admin',
      name: 'admin',
      component: Admin
    }
  ]
})

router.beforeEach((to, from, next) => {
  store.state.ready.then(() => {
    if (store.state.username || to.name === 'login') {
      if (to.name === 'root') {
        store.dispatch('getInitialWorkspaceId').then(workspaceId => {
          next({name: 'workspace', params: {workspaceId}})
        })
      } else {
        next()
      }
    } else {
      next({name: 'login'})
    }
  })
})

const state = {
  router
}

const actions = {

  /**
   * @param   workspaceId   optional
   */
  callWorkspaceRoute (_, workspaceId) {
    const id = workspaceId || store.state.workspace.id
    router.push({
      name: 'workspace',
      params: {workspaceId: id}
    })
  },

  callAdminRoute () {
    router.push({name: 'admin'})
  }
}

export default router

store.registerModule('routerModule', {state, actions})
store.watch(
  state => state.routerModule.router.currentRoute,
  (to, from) => {
    // console.log('Route watcher', to, from)
    navigate(to, from)
  }
)

/**
 * Adapts app state when route changes.
 */
function navigate (to, from) {
  if (to.name === 'workspace') {
    const workspaceId = id(to.params.workspaceId)
    if (workspaceId !== store.state.workspace?.id) {
      store.dispatch('setWorkspace', workspaceId)
    }
  }
}

/**
 * Converts the given value into Number.
 *
 * @return  the number, or undefined if `undefined`/`null` is given.
 *          Never returns `null`.
 *
 * @throws  if the given value is not one of Number/String/undefined/null.
 */
function id (v) {
  // Note: Number(undefined) is NaN, and NaN != NaN is true!
  // Note: dmx.utils.getCookie may return null, and Number(null) is 0 (and typeof null is 'object')
  if (typeof v === 'number') {
    return v
  } else if (typeof v === 'string') {
    return Number(v)
  } else if (v !== undefined && v !== null) {
    throw Error(`id() expects one of [number|string|undefined|null], got ${v}`)
  }
}
