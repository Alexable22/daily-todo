const { ENV_ID } = require('./env')

App({
  globalData: {
    openid: ''
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库过低，请使用 2.2.3 以上版本以支持云能力')
      this.ready = Promise.resolve('')
      return
    }
    // 只有一个云环境时 env 可留空，自动使用默认环境
    wx.cloud.init({ env: ENV_ID || undefined, traceUser: true })
    this.ready = wx.cloud.callFunction({ name: 'login' })
      .then(res => {
        this.globalData.openid = res.result.openid
        return res.result.openid
      })
      .catch(err => {
        console.error('login 云函数调用失败，请检查云开发配置', err)
        return ''
      })
  }
})
