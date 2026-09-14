const { parseSchedule } = require('../../utils/parser')
const { WEEKDAYS, weekdayOf, fmtMin, todayStr } = require('../../utils/time')
const { serializeBackup, parseBackup, applyBackup } = require('../../utils/backup')

function itemTimeText(it) {
  if (it.startMin == null) return ''
  return it.endMin != null ? `${fmtMin(it.startMin)} - ${fmtMin(it.endMin)}` : fmtMin(it.startMin)
}

// WXML 表达式不支持方法调用，星期芯片的选中态在这里预计算
function buildDays(selected) {
  return WEEKDAYS.map((name, i) => ({ day: i + 1, name, active: selected.indexOf(i + 1) >= 0 }))
}

Page({
  data: {
    rawText: '',
    weekdays: WEEKDAYS,
    sections: [],
    parsed: false,
    saving: false,
    savedCount: 0,
    backupText: '',
    canUndo: false
  },

  onShow() {
    let has = false
    try { has = !!wx.getStorageSync('prerestore_backup') } catch (err) {}
    this.setData({ canUndo: has })
  },

  onInput(e) {
    this.setData({ rawText: e.detail.value })
  },

  doParse() {
    const raw = this.data.rawText.trim()
    if (!raw) {
      wx.showToast({ title: '先粘贴计划文本哦', icon: 'none' })
      return
    }
    const parsed = parseSchedule(raw)
    if (!parsed.length) {
      wx.showToast({ title: '没有识别到计划内容', icon: 'none' })
      return
    }
    const todayWd = weekdayOf()
    const sections = parsed.map((s, idx) => {
      // 没有星期标题的段落默认存到今天
      const selected = s.weekdays.length ? s.weekdays.slice() : [todayWd]
      return {
        key: idx,
        selected,
        days: buildDays(selected),
        items: s.items.map((it, i) => ({
          key: i,
          startMin: it.startMin,
          endMin: it.endMin,
          text: it.text,
          timeText: itemTimeText(it)
        }))
      }
    })
    this.setData({ sections, parsed: true, savedCount: 0 })
  },

  toggleWeekday(e) {
    const { section, day } = e.currentTarget.dataset
    const selected = this.data.sections[section].selected.slice()
    const idx = selected.indexOf(day)
    if (idx >= 0) selected.splice(idx, 1)
    else selected.push(day)
    selected.sort((a, b) => a - b)
    this.setData({
      [`sections[${section}].selected`]: selected,
      [`sections[${section}].days`]: buildDays(selected)
    })
  },

  removeItem(e) {
    const { section, key } = e.currentTarget.dataset
    const sec = this.data.sections[section]
    const items = sec.items.filter(it => it.key !== key)
    this.setData({ [`sections[${section}].items`]: items })
  },

  async saveSection(e) {
    if (this.data.saving) return
    const sec = this.data.sections[e.currentTarget.dataset.section]
    if (!sec.selected.length) {
      wx.showToast({ title: '先选择保存到星期几', icon: 'none' })
      return
    }
    if (!sec.items.length) {
      wx.showToast({ title: '这一段没有可保存的计划项', icon: 'none' })
      return
    }
    const existedDays = sec.selected.filter(d => {
      const t = wx.getStorageSync(`tpl_${d}`)
      return t && t.items && t.items.length
    })
    if (existedDays.length) {
      const names = existedDays.map(d => WEEKDAYS[d - 1]).join('、')
      const ok = await new Promise(resolve =>
        wx.showModal({
          title: '覆盖确认',
          content: `${names} 已有计划，保存会覆盖原来的内容`,
          confirmText: '覆盖',
          cancelText: '再想想',
          success: r => resolve(r.confirm)
        })
      )
      if (!ok) return
    }

    this.setData({ saving: true })
    try {
      for (const day of sec.selected) {
        const items = sec.items.map((it, i) => ({
          id: `i${Date.now().toString(36)}_${day}_${i}`,
          startMin: it.startMin,
          endMin: it.endMin,
          text: it.text
        }))
        wx.setStorageSync(`tpl_${day}`, { weekday: day, items })
      }
      const names = sec.selected.map(d => WEEKDAYS[d - 1]).join('、')
      const rest = this.data.sections.filter(s => s.key !== sec.key)
      this.setData({
        sections: rest,
        saving: false,
        savedCount: this.data.savedCount + 1,
        rawText: rest.length ? this.data.rawText : ''
      })
      wx.showToast({ title: `已保存到${names}`, icon: 'success' })
    } catch (err) {
      console.error('保存导入失败', err)
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  },

  goTemplate() {
    wx.switchTab({ url: '/pages/template/template' })
  },

  onBackupInput(e) {
    this.setData({ backupText: e.detail.value })
  },

  exportBackup() {
    try {
      const info = wx.getStorageInfoSync()
      const res = serializeBackup(k => wx.getStorageSync(k), info.keys, todayStr())
      if (!res.count) {
        wx.showToast({ title: '还没有可备份的数据', icon: 'none' })
        return
      }
      wx.setClipboardData({
        data: res.text,
        success: () => wx.showModal({
          title: '已复制备份',
          content: `共 ${res.count} 条数据。打开手机备忘录粘贴保存好，恢复时复制它粘到下面就行`,
          showCancel: false
        }),
        fail: () => wx.showToast({ title: '复制失败，请重试', icon: 'none' })
      })
    } catch (err) {
      console.error('导出备份失败', err)
      wx.showToast({ title: '导出失败，请重试', icon: 'none' })
    }
  },

  async restoreBackup() {
    const raw = this.data.backupText.trim()
    if (!raw) {
      wx.showToast({ title: '先把备份文本粘贴进来哦', icon: 'none' })
      return
    }
    const res = parseBackup(raw)
    if (!res.ok) {
      wx.showToast({ title: res.error, icon: 'none' })
      return
    }
    const count = Object.keys(res.data).length
    const ok = await new Promise(resolve =>
      wx.showModal({
        title: '恢复确认',
        content: `备份里的 ${count} 条数据会覆盖当前对应的计划和记录，不在备份里的保持不变`,
        confirmText: '恢复',
        cancelText: '再想想',
        success: r => resolve(r.confirm)
      })
    )
    if (!ok) return
    try {
      // 覆盖前先把当前数据留底到非备份键，误恢复时还有救
      const info = wx.getStorageInfoSync()
      const snap = serializeBackup(k => wx.getStorageSync(k), info.keys, todayStr())
      if (snap.count) wx.setStorageSync('prerestore_backup', snap.text)
      const n = applyBackup((k, v) => wx.setStorageSync(k, v), res.data)
      this.setData({ backupText: '' })
      wx.showToast({ title: `已恢复 ${n} 条数据`, icon: 'success' })
    } catch (err) {
      console.error('恢复备份失败', err)
      wx.showToast({ title: '恢复失败，请重试', icon: 'none' })
    }
  },

  // 恢复前留的底只够退一步：撤销后快照即清空，再恢复会重新留今天的底
  async undoRestore() {
    let snap = ''
    try { snap = wx.getStorageSync('prerestore_backup') || '' } catch (err) {}
    if (!snap) {
      this.setData({ canUndo: false })
      wx.showToast({ title: '没有可撤销的恢复', icon: 'none' })
      return
    }
    const res = parseBackup(snap)
    if (!res.ok) {
      try { wx.removeStorageSync('prerestore_backup') } catch (err) {}
      this.setData({ canUndo: false })
      wx.showToast({ title: '留底已失效', icon: 'none' })
      return
    }
    const count = Object.keys(res.data).length
    const ok = await new Promise(resolve =>
      wx.showModal({
        title: '撤销上次恢复',
        content: `会把 ${count} 条数据退回恢复前的样子，恢复之后又改过的会被覆盖`,
        confirmText: '撤销',
        cancelText: '再想想',
        success: r => resolve(r.confirm)
      })
    )
    if (!ok) return
    try {
      applyBackup((k, v) => wx.setStorageSync(k, v), res.data)
      try { wx.removeStorageSync('prerestore_backup') } catch (err) {}
      this.setData({ canUndo: false })
      wx.showToast({ title: `已退回 ${count} 条数据`, icon: 'success' })
    } catch (err) {
      console.error('撤销恢复失败', err)
      wx.showToast({ title: '撤销失败，请重试', icon: 'none' })
    }
  }
})
