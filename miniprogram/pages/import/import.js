const { parseSchedule } = require('../../utils/parser')
const { WEEKDAYS, weekdayOf, fmtMin } = require('../../utils/time')
const { upsertDoc } = require('../../utils/cloud')

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
    savedCount: 0
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
    const openid = await getApp().ready
    if (!openid) {
      wx.showToast({ title: '云服务未配置', icon: 'none' })
      return
    }
    const db = wx.cloud.database()
    const _ = db.command
    try {
      const exist = await db.collection('templates')
        .where({ weekday: _.in(sec.selected) })
        .field({ weekday: true })
        .get()
      if (exist.data.length) {
        const names = exist.data.map(d => WEEKDAYS[d.weekday - 1]).sort().join('、')
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
    } catch (err) {
      console.error('检查已有模板失败', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
      return
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
        await upsertDoc('templates', `${openid}_${day}`, {
          weekday: day,
          items,
          updatedAt: db.serverDate()
        })
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
  }
})
