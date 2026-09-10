const { WEEKDAYS, weekdayOf, todayStr, nowMinutes, fmtMin } = require('../../utils/time')

const PRAISES = [
  '太棒了！今天的计划全部完成',
  '面包小人为妳用力鼓掌',
  '认真过完的一天，值得被奖励',
  '妳努力的样子真的在发光',
  '全部打卡成功，好厉害呀'
]

const CONFETTI_COLORS = ['#FF8FA3', '#FFC9A9', '#FFD6DC', '#B5E0C8', '#A9C9FF', '#FFE08A']

// 给计划项附上勾选状态、进行状态和展示用时间文本；对同一输入幂等，可直接重复调用
function decorate(items, checks, nowMin) {
  const timed = items.filter(i => i.startMin != null)
  return items.map(it => {
    let status = 'casual'
    if (it.startMin != null) {
      const idx = timed.indexOf(it)
      const nextStart = idx + 1 < timed.length ? timed[idx + 1].startMin : 24 * 60
      const end = Math.min(it.endMin != null ? it.endMin : nextStart, 24 * 60)
      if (nowMin >= it.startMin && nowMin < end) status = 'ongoing'
      else if (nowMin >= end) status = 'past'
      else status = 'future'
    }
    return Object.assign({}, it, {
      done: !!checks[it.id],
      status,
      timeText: it.startMin != null
        ? (it.endMin != null ? `${fmtMin(it.startMin)} - ${fmtMin(it.endMin)}` : fmtMin(it.startMin))
        : ''
    })
  })
}

function findOngoing(list) {
  const cur = list.find(it => !it.done && it.status === 'ongoing')
  return cur ? cur.text : ''
}

function makeGreeting(hour) {
  if (hour < 6) return '夜深啦，早点休息哦'
  if (hour < 11) return '早上好，今天也要加油哦'
  if (hour < 14) return '中午好，记得好好吃饭'
  if (hour < 18) return '下午好，再坚持一下下'
  return '晚上好，收尾今天吧'
}

Page({
  data: {
    dateText: '',
    weekdayText: '',
    greeting: '',
    streak: 0,
    hasTemplate: false,
    items: [],
    checks: {},
    doneCount: 0,
    total: 0,
    percent: 0,
    allDone: false,
    ongoingText: '',
    celebrating: false,
    praise: '',
    confetti: []
  },

  timer: null,
  recordKey: '',
  recordReady: false,

  onShow() {
    this.startTimer()
    this.refresh()
  },

  onHide() {
    this.stopTimer()
  },

  onUnload() {
    this.stopTimer()
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh())
  },

  startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => this.tickStatus(), 30000)
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  tickStatus() {
    if (!this.data.items.length) return
    this.applyView(this.data.items, this.data.checks)
  },

  applyView(items, checks) {
    const list = decorate(items, checks, nowMinutes())
    const doneCount = list.filter(it => it.done).length
    const total = list.length
    const allDone = total > 0 && doneCount === total
    this.setData({
      items: list,
      doneCount,
      total,
      allDone,
      percent: total ? Math.round((doneCount / total) * 100) : 0,
      ongoingText: findOngoing(list)
    })
  },

  async refresh() {
    const now = new Date()
    this.setData({
      dateText: `${now.getMonth() + 1}月${now.getDate()}日`,
      weekdayText: WEEKDAYS[weekdayOf(now) - 1],
      greeting: makeGreeting(now.getHours())
    })
    const date = todayStr(now)
    const wd = weekdayOf(now)
    try {
      const tpl = wx.getStorageSync(`tpl_${wd}`) || null
      const record = wx.getStorageSync(`rec_${date}`) || null
      if (!tpl || !tpl.items || !tpl.items.length) {
        this.recordKey = ''
        this.recordReady = false
        this.setData({ hasTemplate: false, items: [], checks: {}, doneCount: 0, total: 0, percent: 0, allDone: false, ongoingText: '' })
        this.loadStreak()
        return
      }
      // 以模板为准调和勾选状态：模板删掉的项丢弃，新增的项补 false
      const checks = {}
      for (const it of tpl.items) checks[it.id] = !!(record && record.checks && record.checks[it.id])
      this.recordKey = `rec_${date}`
      const recordData = {
        date,
        checks,
        doneCount: tpl.items.filter(it => checks[it.id]).length,
        total: tpl.items.length,
        allDone: tpl.items.every(it => checks[it.id])
      }
      const stale = !record
        || JSON.stringify(record.checks) !== JSON.stringify(checks)
        || record.total !== recordData.total
        || record.doneCount !== recordData.doneCount
        || record.allDone !== recordData.allDone
      if (stale) wx.setStorageSync(this.recordKey, recordData)
      this.recordReady = true
      this.setData({ hasTemplate: true, checks })
      this.applyView(tpl.items, checks)
      this.loadStreak()
    } catch (err) {
      console.error('加载今日计划失败', err)
      wx.showToast({ title: '加载失败，下拉重试', icon: 'none' })
    }
  },

  loadStreak() {
    try {
      const doneDates = new Set()
      for (const key of wx.getStorageInfoSync().keys) {
        if (key.indexOf('rec_') !== 0) continue
        const r = wx.getStorageSync(key)
        if (r && r.allDone && r.date) doneDates.add(r.date)
      }
      const cursor = new Date()
      // 今天还没全部完成时，连续天数从昨天往回算
      if (!doneDates.has(todayStr(cursor))) cursor.setDate(cursor.getDate() - 1)
      let streak = 0
      while (doneDates.has(todayStr(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }
      this.setData({ streak })
    } catch (err) {
      console.error('加载连续打卡失败', err)
    }
  },

  toggle(e) {
    if (!this.recordKey || !this.recordReady) return
    const id = e.currentTarget.dataset.id
    const checks = Object.assign({}, this.data.checks, { [id]: !this.data.checks[id] })
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    this.setData({ checks })
    this.applyView(this.data.items, checks)
    const doneCount = this.data.items.filter(it => checks[it.id]).length
    const allDone = this.data.total > 0 && doneCount === this.data.total
    try {
      wx.setStorageSync(this.recordKey, {
        date: this.recordKey.slice(4),
        checks,
        doneCount,
        total: this.data.total,
        allDone
      })
    } catch (err) {
      console.error('更新勾选失败', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
    if (allDone) {
      this.celebrate()
    }
    this.loadStreak()
  },

  celebrate() {
    const key = `celebrated_${todayStr()}`
    // 同一天只撒花一次，取消再勾不重复打扰
    if (wx.getStorageSync(key)) return
    wx.setStorageSync(key, true)
    const confetti = []
    for (let i = 0; i < 26; i++) {
      confetti.push({
        left: Math.round(Math.random() * 100),
        delay: (Math.random() * 1.5).toFixed(2),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 12 + Math.round(Math.random() * 14)
      })
    }
    this.setData({
      celebrating: true,
      praise: PRAISES[Math.floor(Math.random() * PRAISES.length)],
      confetti
    })
  },

  closeCelebrate() {
    this.setData({ celebrating: false })
  },

  goImport() {
    wx.navigateTo({ url: '/pages/import/import' })
  },

  goTemplate() {
    wx.switchTab({ url: '/pages/template/template' })
  }
})
