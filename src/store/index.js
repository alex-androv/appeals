import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    appeals: []
  },
  mutations: {
    SET_APPEALS(state, appeals) {
      state.appeals = appeals
    }
  },
  actions: {
    setAppeals({ commit }, appeals) {
      commit('SET_APPEALS', appeals)
    }
  },
  modules: {
  }
})