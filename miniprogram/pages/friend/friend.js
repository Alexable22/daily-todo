const { fmtMin } = require('../../utils/time')

function friendItemTimeText(it) {
  if (it.startMin == null) return ''
  return it.endMin != null ? `${fmtMin(it.startMin)} - ${fmtMin(it.endMin)}` : fmtMin(it.startMin)
}

Page({
  data: {
    cloudError: false,
    loading: true,
    myCode: '',
    codeInput: '',
    nicknameInput: '',
    friends: []
  },

  async onShow() {
    const openid = await getApp().ready
    if (!openid) {
      this.setData({ cloudError: true, loading: false })
      return
    }
    this.setData({ cloudError: false, myCode: openid })
    this.loadFriends()
  },

  async loadFriends() {
    this.setData({ loading: true })
    const db = wx.cloud.database()
    try {
      const bindRes = await db.collection('binds').limit(50).get()
      const binds = bindRes.data
      let friends = []
      if (binds.length) {
        const res = await wx.cloud.callFunction({ name: 'friendToday' })
        friends = (res.result.list || []).map(f => {
          const bind = binds.find(b => b.friendOpenid === f.friendOpenid)
          return Object.assign({}, f, {
            bindId: bind ? bind._id : '',
            expanded: false,
            percent: f.total ? Math.round((f.doneCount / f.total) * 100) : 0,
            items: f.items.map(it => Object.assign({}, it, { timeText: friendItemTimeText(it) }))
          })
        })
      }
      this.setData({ friends, loading: false })
    } catch (err) {
      console.error('加载朋友进度失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    }
  },

  copyCode() {
    wx.setClipboardData({ data: this.data.myCode })
  },

  onCodeInput(e) {
    this.setData({ codeInput: e.detail.value })
  },

  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value })
  },

  async bindFriend() {
    const code = this.data.codeInput.trim()
    if (!code) {
      wx.showToast({ title: '先粘贴朋友的邀请码', icon: 'none' })
      return
    }
    if (code === this.data.myCode) {
      wx.showToast({ title: '不能绑定自己哦', icon: 'none' })
      return
    }
    const db = wx.cloud.database()
    try {
      const exist = await db.collection('binds').where({ friendOpenid: code }).limit(1).get()
      if (exist.data.length) {
        wx.showToast({ title: '已经绑定过啦', icon: 'none' })
        return
      }
      await db.collection('binds').add({
        data: {
          friendOpenid: code,
          nickname: this.data.nicknameInput.trim() || '好朋友',
          createdAt: db.serverDate()
        }
      })
      this.setData({ codeInput: '', nicknameInput: '' })
      wx.showToast({ title: '绑定成功', icon: 'success' })
      this.loadFriends()
    } catch (err) {
      console.error('绑定朋友失败', err)
      wx.showToast({ title: '绑定失败，请重试', icon: 'none' })
    }
  },

  toggleExpand(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ [`friends[${idx}].expanded`]: !this.data.friends[idx].expanded })
  },

  async removeBind(e) {
    const idx = e.currentTarget.dataset.index
    const friend = this.data.friends[idx]
    const ok = await new Promise(resolve =>
      wx.showModal({
        title: '解除绑定',
        content: `不再看「${friend.nickname}」的进度了吗？`,
        confirmText: '解除',
        success: r => resolve(r.confirm)
      })
    )
    if (!ok || !friend.bindId) return
    const db = wx.cloud.database()
    try {
      await db.collection('binds').doc(friend.bindId).remove()
      wx.showToast({ title: '已解除', icon: 'success' })
      this.loadFriends()
    } catch (err) {
      console.error('解除绑定失败', err)
      wx.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  }
})
