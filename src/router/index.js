import Vue from 'vue'
import Router from 'vue-router'
import PeerSeven from '@/components/PeerSeven'
import PeerEight from '@/components/PeerEight'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/peer7',
      name: 'PeerSeven',
      component: PeerSeven
    },{
      path: '/peer8',
      name: 'PeerEight',
      component: PeerEight
    }

  ]
})
