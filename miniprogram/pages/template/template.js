const { WEEKDAYS, weekdayOf, fmtMin, hmToMin } = require('../../utils/time')
const { upsertDoc } = require('../../utils/cloud')

function genId() {
  return `i${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`
}

function withTimeText(it) {
  return Object.assign({}, it, {
    timeText: it.startMin != null
      ? (it.endMin != null ? `${fmtMin(it.startMin)} - ${fmtMin(it.endMin)}` : fmtMin(it.startMin))
      : ''
  })
}

// 有时间的项按开始时间插入到合适位置，无时间的追加到末尾
function insertByTime(items, item) {
  if (item.startMin == null) return [...items, item]
  const idx = items.findIndex(it => it.startMin != null && it.startMin > item.startMin)
  if (idx < 0) return [...items, item]
  return [...items.slice(0, idx), item, ...items.slice(idx)]
}

Page({
  data: {
    weekdays: WEEKDAYS,
    current: 1,
    items: [],
    loading: true,
    cloudError: false,
    form: { text: '', startText: '', endText: '', editingId: '' }
  },

  inited: false,
  openid: '',

  async onShow() {
    const openid = await getApp().ready
    if (!openid) {
      this.setData({ cloudError: true, loading: false })
      return
    }
    this.openid = openid
    this.setData({ cloudError: false })
    if (!this.inited) {
      this.inited = true
      this.setData({ current: weekdayOf() })
    }
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    const db = wx.cloud.database()
    try {
      const res = await db.collection('templates').where({ weekday: this.data.current }).limit(1).get()
      const items = (res.data[0] && res.data[0].items) || []
      this.setData({ items: items.map(withTimeText), loading: false })
    } catch (err) {
      console.error('加载模板失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    }
  },

  switchDay(e) {
    const day = e.currentTarget.dataset.day
    if (day === this.data.current) return
    this.setData({
      current: day,
      form: { text: '', startText: '', endText: '', editingId: '' }
    })
    this.load()
  },

  onTextInput(e) {
    this.setData({ 'form.text': e.detail.value })
  },

  onStartChange(e) {
    this.setData({ 'form.startText': e.detail.value })
  },

  onEndChange(e) {
    this.setData({ 'form.endText': e.detail.value })
  },

  clearEnd() {
    this.setData({ 'form.endText': '' })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.items.find(it => it.id === id)
    if (!item) return
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: ({ tapIndex }) => {
        if (tapIndex === 0) this.startEdit(item)
        else if (tapIndex === 1) this.removeItem(item)
      }
    })
  },

  startEdit(item) {
    this.setData({
      form: {
        text: item.text,
        startText: item.startMin != null ? fmtMin(item.startMin) : '',
        endText: item.endMin != null ? fmtMin(item.endMin) : '',
        editingId: item.id
      }
    })
  },

  cancelEdit() {
    this.setData({ form: { text: '', startText: '', endText: '', editingId: '' } })
  },

  async removeItem(item) {
    const ok = await new Promise(resolve =>
      wx.showModal({
        title: '删除计划项',
        content: `确定删除「${item.text}」吗？`,
        confirmText: '删除',
        success: r => resolve(r.confirm)
      })
    )
    if (!ok) return
    const items = this.data.items.filter(it => it.id !== item.id)
    this.setData({ items })
    this.save(items)
  },

  submit() {
    const form = this.data.form
    const text = form.text.trim()
    if (!text) {
      wx.showToast({ title: '先写点内容哦', icon: 'none' })
      return
    }
    const startMin = form.startText ? hmToMin(form.startText) : null
    const endMin = form.endText ? hmToMin(form.endText) : null
    if (endMin != null && startMin == null) {
      wx.showToast({ title: '选了结束时间也要选开始时间哦', icon: 'none' })
      return
    }
    if (startMin != null && endMin != null && endMin <= startMin) {
      wx.showToast({ title: '结束时间要晚于开始时间哦', icon: 'none' })
      return
    }
    const item = { id: form.editingId || genId(), startMin, endMin, text }
    const items = form.editingId
      ? this.data.items.map(it => (it.id === item.id ? withTimeText(item) : it))
      : insertByTime(this.data.items, withTimeText(item))
    this.setData({
      items,
      form: { text: '', startText: '', endText: '', editingId: '' }
    })
    this.save(items)
  },

  async save(items) {
    try {
      await upsertDoc('templates', `${this.openid}_${this.data.current}`, {
        weekday: this.data.current,
        items: items.map(({ id, startMin, endMin, text }) => ({ id, startMin, endMin, text })),
        updatedAt: wx.cloud.database().serverDate()
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      console.error('保存模板失败', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  },

  goImport() {
    wx.navigateTo({ url: '/pages/import/import' })
  }
})
