import Vue from 'vue'
import http from 'axios'
import dmx from 'dmx-api'
import lq from '../lq-globals'
import SHA256 from '../lib/sha256'

const ENCODED_PASSWORD_PREFIX = '-SHA256-'

const state = {

  primaryPanel: 'lq-workspace-list',  // 'lq-workspace-list'/'lq-user-list'
  secondaryPanel: undefined,          // 'lq-workspace-form'/... or undefined if secondary panel is not engaged
  formMode: undefined,                // 'create'/'update' (String), relevant only for secondary panel forms
  editBuffer: undefined,

  workspaces: [],                     // all ZW shared workspaces + the "Team" workspace (dmx.Topics, clone() is needed)
  expandedWorkspaceIds: [],           // IDs of the workspaces that are expanded
  selectedWorkspace: undefined,       // (plain Workspace topic)

  // Note: "users" is found in root state (see linqa.js) as it also holds the user display names
  expandedUsernames: [],              // usernames of the users that are expanded (array of String)
  selectedUser: undefined             // (plain Username topic)
}

const actions = {

  showWorkspaceForm ({dispatch}, workspace) {
    const type = dmx.typeCache.getTopicType('dmx.workspaces.workspace')
    if (workspace) {
      state.formMode = 'update'
      state.editBuffer = type.newFormModel(workspace.clone())
      dispatch('setSelectedWorkspace', workspace)
    } else {
      state.formMode = 'create'
      state.editBuffer = type.newFormModel()
      // console.log('editBuffer', state.editBuffer)
    }
    dispatch('setSecondaryPanel', 'lq-workspace-form')
  },

  showUserForm ({dispatch}, user) {
    if (user) {
      state.formMode = 'update'
      dispatch('setSelectedUser', user)
    } else {
      state.formMode = 'create'
    }
    dispatch('setSecondaryPanel', 'lq-user-form')
  },

  setPrimaryPanel (_, panel) {
    state.primaryPanel = panel
    if (panel === 'lq-workspace-list' && state.selectedWorkspace) {
      state.secondaryPanel = 'lq-workspace-memberships'
    } else {
      state.secondaryPanel = undefined
    }
  },

  setSecondaryPanel (_, panel) {
    state.secondaryPanel = panel
    /* if (panel === 'lq-workspace-form' || !panel) {
      state.selectedWorkspace = undefined
    } */    // TODO
  },

  setSelectedWorkspace (_, workspace) {
    state.selectedWorkspace = workspace
  },

  setExpandedWorkspaceIds ({dispatch}, workspaceIds) {
    state.expandedWorkspaceIds = workspaceIds
    workspaceIds.forEach(id => {
      dispatch('fetchWorkspaceMemberships', id)
    })
  },

  setExpandedUsernames ({dispatch}, usernames) {
    state.expandedUsernames = usernames
    usernames.forEach(username => {
      dispatch('fetchUserMemberships', username)
    })
  },

  expandWorkspace (_, workspaceId) {
    if (!state.expandedWorkspaceIds.includes(workspaceId)) {
      state.expandedWorkspaceIds.push(workspaceId)
    }
  },

  expandUser (_, username) {
    if (!state.expandedUsernames.includes(username)) {
      state.expandedUsernames.push(username)
    }
  },

  setSelectedUser (_, user) {
    state.selectedUser = user
  },

  fetchAllZWWorkspaces ({rootState}) {
    if (!state.workspaces.length) {
      return http.get('/linqa/admin/workspaces').then(response => {
        state.workspaces = dmx.utils.instantiateMany(response.data, dmx.Topic)
        state.workspaces.push(rootState.teamWorkspace)
      })
    }
  },

  fetchWorkspaceMemberships (_, workspaceId) {
    const workspace = findWorkspace(workspaceId)
    if (!workspace.memberships) {
      return dmx.rpc.getMemberships(workspaceId).then(users => {
        Vue.set(workspace, 'memberships', users.sort(lq.topicSort))       // ad-hoc property is not reactive by default
      })
    }
  },

  fetchUserMemberships (_, username) {
    const usernameTopic = lq.getUser(username)
    if (!usernameTopic.memberships) {
      return http.get(`/linqa/admin/user/${username}/workspaces`).then(response => {
        const workspaces = response.data
        Vue.set(usernameTopic, 'memberships', workspaces)                 // ad-hoc property is not reactive by default
      })
    }
  },

  updateWorkspaceMemberships ({rootState, dispatch}, {addUserIds1, removeUserIds1, addUserIds2, removeUserIds2}) {
    const workspace = state.selectedWorkspace
    dispatch('expandWorkspace', workspace.id)
    return http.put(`/linqa/admin/workspace/${workspace.id}`, undefined, {
      params: {
        addUserIds1: addUserIds1.join(','),
        removeUserIds1: removeUserIds1.join(','),
        addUserIds2: addUserIds2.join(','),
        removeUserIds2: removeUserIds2.join(',')
      }
    }).then(response => {
      const users = response.data
      workspace.memberships = users.sort(lq.topicSort)
      collapseUsers(rootState, dispatch)
    })
  },

  updateUserMemberships ({dispatch}, {addWorkspaceIds1, removeWorkspaceIds1, addWorkspaceIds2, removeWorkspaceIds2}) {
    const user = state.selectedUser
    dispatch('expandUser', user.value)
    return http.put(`/linqa/admin/user/${user.value}`, undefined, {
      params: {
        addWorkspaceIds1: addWorkspaceIds1.join(','),
        removeWorkspaceIds1: removeWorkspaceIds1.join(','),
        addWorkspaceIds2: addWorkspaceIds2.join(','),
        removeWorkspaceIds2: removeWorkspaceIds2.join(',')
      }
    }).then(response => {
      user.memberships = response.data
      collapseWorkspaces(dispatch)
    })
  },

  createZWWorkspace ({rootState, dispatch}, {nameLang1, nameLang2}) {
    return http.post('/linqa/admin/workspace', undefined, {
      params: {nameLang1, nameLang2}
    }).then(response => {
      // update client state
      state.workspaces.push(new dmx.Topic(response.data))       // admin area: add to workspace list
      collapseUsers(rootState, dispatch)                        // admin area: force refetching user's memberships
      dispatch('fetchZWWorkspaces', undefined, {root: true})    // workspace area: add to workspace selector
    })
  },

  updateWorkspace ({rootState, dispatch}, workspace) {
    return dmx.rpc.updateTopic(workspace).then(workspace => {
      replaceWorkspace(workspace, rootState, dispatch)
      collapseUsers(rootState, dispatch)
    })
  },

  deleteWorkspace (_, workspaceId) {
    return lq.confirmDeletion('warning.delete_workspace').then(() => {
      dmx.rpc.deleteWorkspace(workspaceId)          // update server state
    }).then(() => {
      removeWorkspace(workspaceId)                  // update client state
      // TODO: collapse?
    }).catch(() => {})                              // suppress unhandled rejection on cancel
  },

  /**
   * @param   userModel   object w/ "displayName" and "emailAddress" props.
   */
  createUser ({rootState}, userModel) {
    let p
    if (DEV) {
      // Note: in development mode display name is ignored and password is fixed to '123'
      p = dmx.rpc.createUserAccount(userModel.emailAddress, encodePassword('123'))
    } else {
      const emailAddress = userModel.emailAddress
      p = http.get(`/sign-up/check/${emailAddress}`).then(response => {
        console.log('isAvailable', response.data)
        if (response.data.isAvailable) {
          return emailAddress
        } else {
          return Promise.reject(new Error(`Username "${emailAddress}" is already taken`))
        }
      }).then(emailAddress => {
        const _emailAddress = encodeURIComponent(emailAddress)
        const displayName = encodeURIComponent(userModel.displayName)
        const password = encodeURIComponent(btoa(newPassword()))
        return http.post(`/sign-up/user-account/${_emailAddress}/${_emailAddress}/${displayName}/${password}`)
          .then(response => response.data)            // Note: in Linqa username *is* email address
      })
    }
    return p.then(user => {
      rootState.users.push(user)
      rootState.users.sort(lq.topicSort)              // TODO: sort by display name (email address at the moment)
    })
  },

  updateUser ({rootState}, userModel) {
    const username = userModel.emailAddress
    const displayName = userModel.displayName
    return http.put(`/sign-up/display-name/${username}`, undefined, {
      params: {displayName}
    }).then(() => {
      updateUser(username, displayName)               // update client state
      // rootState.users.sort(lq.topicSort)           // TODO: sort by display name (email address at the moment)
    })
  },

  deleteUser ({rootState}, user) {
    return lq.confirmDeletion('warning.delete_user').then(() => {
      return http.delete(`/ldap/user/${user.value}`)  // update server state
    }).then(() => {
      removeUser(user.id, rootState)                  // update client state
    }).catch(() => {})                                // suppress unhandled rejection on cancel
  }
}

const getters = {
  sortedWorkspaces () {
    return state.workspaces.sort(lq.workspaceSort)
  }
}

export default {
  namespaced: true,
  state,
  actions,
  getters
}

// state helper

function findWorkspace (id) {
  const ws = state.workspaces.find(ws => ws.id === id)
  if (!ws) {
    throw Error(`Workspace ${id} not found`)
  }
  return ws
}

function removeWorkspace (id) {
  const i = state.workspaces.findIndex(ws => ws.id === id)
  if (i === -1) {
    throw Error('removeWorkspace')
  }
  state.workspaces.splice(i, 1)
}

function removeUser (id, rootState) {
  const i = rootState.users.findIndex(u => u.id === id)
  if (i === -1) {
    throw Error('removeUser')
  }
  rootState.users.splice(i, 1)
}

function replaceWorkspace (workspace, rootState, dispatch) {
  // admin state
  let i = state.workspaces.findIndex(ws => ws.id === workspace.id)
  if (i === -1) {
    throw Error('replaceWorkspace')
  }
  Vue.set(state.workspaces, i, workspace)
  dispatch('fetchWorkspaceMemberships', workspace.id)
  // root state
  i = rootState.workspaces.findIndex(ws => ws.id === workspace.id)
  if (i >= 0) {
    workspace.assoc = rootState.workspaces[i].assoc     // transfer membership of current user
    Vue.set(rootState.workspaces, i, workspace)
  }
}

function updateUser(username, displayName) {
  const children = lq.getUser(username).children
  if (!children['dmx.signup.display_name']) {   // TODO: refactor
    Vue.set(children, 'dmx.signup.display_name', {})
  }
  children['dmx.signup.display_name'].value = displayName
}

function collapseWorkspaces (dispatch) {
  state.workspaces.forEach(workspace => {
    delete workspace.memberships                // force refetch once needed
    dispatch('setExpandedWorkspaceIds', [])     // TODO: don't collapse but refetch later on when needed
  })
}

function collapseUsers (rootState, dispatch) {
  rootState.users.forEach(user => {
    delete user.memberships                     // force refetch once needed
    dispatch('setExpandedUsernames', [])        // TODO: don't collapse but refetch later on when needed
  })
}

// helper

function encodePassword (password) {
  return ENCODED_PASSWORD_PREFIX + SHA256(password)
}

function newPassword () {
  return Math.floor(Number.MAX_SAFE_INTEGER * Math.random())
}
