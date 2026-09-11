const { WEEKDAYS, weekdayOf, todayStr, nowMinutes, fmtMin } = require('../../utils/time')

const PRAISES = [
  '太棒了！今天的计划全部完成',
  '面包小人为妳用力鼓掌',
  '认真过完的一天，值得被奖励',
  '妳努力的样子真的在发光',
  '全部打卡成功，好厉害呀'
]

const CONFETTI_COLORS = ['#FF8FA3', '#FFC9A9', '#FFD6DC', '#B5E0C8', '#A9C9FF', '#FFE08A']

const BURST_COLORS = ['#FF8FA3', '#FFB3C1', '#FFC9D4', '#FCD9A0', '#FFE9C4']

const POKE_QUOTES = [
  '戳我做什么啦，嘿嘿',
  '加油加油，我陪着妳呢',
  '今天也是元气满满的一天',
  '累了就休息一会儿，没关系',
  '妳认真的样子，超可爱',
  '完成了记得第一时间告诉我',
  '慢慢来，一步一步就好',
  '面包力量，传给妳！',
  '偷偷说：妳比昨天更厉害了',
  '学习辛苦啦，摸摸头'
]

// 面包超人的一天：按 时段 × 完成状态 分桶的场景语录，{task} 会替换成进行中的任务名
const SCENE_QUOTES = {
  dawn: [
    '早安呀，新的一天从一口面包开始',
    '起床啦，今天的计划已经在等妳了',
    '早上记忆力最好哦，先啃最难的那块',
    '吃早餐了吗？空腹背书会饿扁的',
    '清晨的第一口元气，分妳一半'
  ],
  forenoon: [
    '上午阳光正好，适合刷题',
    '一项一项来，我在旁边给妳数数',
    '学累了就喝口水，望望远处',
    '妳专注的样子，像刚出炉的面包一样香',
    '上午的任务完成一半了吗？加油呀'
  ],
  noon: [
    '中午好，先吃饭再学习哦',
    '午休二十分钟，下午效率翻倍',
    '吃饱才有力气背书，这是我的面包哲学',
    '午饭时间到，计划先放一放也没关系'
  ],
  afternoon: [
    '下午最容易犯困，站起来拉伸一下',
    '坚持住，傍晚就在前面啦',
    '错题本是妳的好朋友，多翻翻',
    '偷偷给妳加了面包能量，继续冲',
    '做完这一科，就离全部完成更近一步'
  ],
  dusk: [
    '傍晚啦，回头看看今天完成了多少',
    '晚饭记得吃热的，暖暖胃',
    '今天剩下的不多了，收尾冲刺',
    '晚霞是粉色的，和妳的计划表很配'
  ],
  night: [
    '夜深了，做不完就明天再说，我不怪妳',
    '今天到这里就好啦，剩下的明天我陪妳',
    '别熬太晚，黑眼圈会吃掉面包能量的',
    '完成多少是多少，妳已经很棒了'
  ],
  midnight: [
    '这么晚还不睡呀，我陪妳一会儿就去休息哦',
    '凌晨的计划明天再做也来得及，先睡吧',
    '嘘——月亮都困了，妳也休息吧'
  ],
  allDone: [
    '全部完成！今天的妳闪闪发光',
    '计划清空，面包小人吃得圆滚滚',
    '妳超棒的，明天也要一起加油',
    '全部打卡成功，奖励自己一下吧',
    '今天的努力，考试都会记得'
  ],
  ongoing: [
    '正在陪妳「{task}」，专心哦',
    '「{task}」进行中，我帮妳看着时间',
    '现在是「{task}」时间，不许走神'
  ]
}

function sceneBucket(hour) {
  if (hour < 9) return 'dawn'
  if (hour < 12) return 'forenoon'
  if (hour < 14) return 'noon'
  if (hour < 18) return 'afternoon'
  return 'dusk'
}

// 模拟器/旧基础库上 vibrateShort 可能不存在或同步抛错，调用方照常走自己的逻辑
function lightVibrate() {
  if (!wx.vibrateShort) return
  try {
    const p = wx.vibrateShort({ type: 'light' })
    if (p && p.catch) p.catch(() => {})
  } catch (err) {}
}

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
    confetti: [],
    pokeSeed: 0,
    bubbleText: '',
    bubbleShow: false,
    bursts: []
  },

  timer: null,
  recordKey: '',
  recordReady: false,
  _burstSeq: 0,
  _burstFinals: {},
  _autoTimer: null,

  onShow() {
    this.startTimer()
    this.refresh().then(() => this.maybeAutoBubble())
  },

  onHide() {
    this.clearTransient()
  },

  onUnload() {
    this.clearTransient()
  },

  clearTransient() {
    this.stopTimer()
    if (this._bubbleTimer) {
      clearTimeout(this._bubbleTimer)
      this._bubbleTimer = null
    }
    if (this._autoTimer) {
      clearTimeout(this._autoTimer)
      this._autoTimer = null
    }
    this.clearBursts()
    // 气泡只靠上面被清掉的定时器隐藏，必须手动复位，否则切走后气泡永久挂住
    if (this.data.bubbleShow) this.setData({ bubbleShow: false })
  },

  clearBursts() {
    Object.keys(this._burstFinals).forEach(k => clearTimeout(this._burstFinals[k]))
    this._burstFinals = {}
    if (this.data.bursts.length) this.setData({ bursts: [] })
  },

  onPageScroll() {
    // 粒子钉在触发瞬间的视口坐标上，页面一滚就和卡片脱节，滚动时直接收掉
    this.clearBursts()
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
    const willDone = !this.data.checks[id]
    const checks = Object.assign({}, this.data.checks, { [id]: willDone })
    this.setData({ checks })
    this.applyView(this.data.items, checks)
    lightVibrate()
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
      // 今天已撒过花时 celebrate 会被拦截，退回粒子爆花，别让这次勾选零反馈
      if (!this.celebrate()) this.burstAt(`#check-${id}`)
    } else if (willDone) {
      // 勾上的瞬间在圆圈位置定点爆开一小撮粒子
      this.burstAt(`#check-${id}`)
    }
    this.loadStreak()
  },

  burstAt(selector) {
    wx.createSelectorQuery()
      .in(this)
      .select(selector)
      .boundingClientRect()
      .exec(res => {
        const r = res && res[0]
        if (!r) return
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        // 每颗粒子带两份坐标：起点（圆心）和终点（沿随机角度散开）
        const particles = []
        for (let i = 0; i < 12; i++) {
          const ang = Math.random() * Math.PI * 2
          const dist = 46 + Math.random() * 56
          particles.push({
            sx: cx.toFixed(1),
            sy: cy.toFixed(1),
            tx: (cx + Math.cos(ang) * dist).toFixed(1),
            ty: (cy + Math.sin(ang) * dist).toFixed(1),
            color: BURST_COLORS[i % BURST_COLORS.length],
            size: (6 + Math.random() * 9).toFixed(1),
            round: Math.random() < 0.5
          })
        }
        const key = `b${++this._burstSeq}`
        const view = this.burstView(key, particles, false)
        this.setData({ bursts: this.data.bursts.concat(view) }, () => {
          // 下一拍把粒子推到终点并淡出，配合 WXSS transition 形成“炸开”
          setTimeout(() => {
            const idx = this.data.bursts.findIndex(b => b.key === key)
            if (idx < 0) return
            this.setData({ [`bursts[${idx}]`]: this.burstView(key, particles, true) })
          }, 30)
          this._burstFinals[key] = setTimeout(() => {
            delete this._burstFinals[key]
            this.setData({ bursts: this.data.bursts.filter(b => b.key !== key) })
          }, 700)
        })
      })
  },

  burstView(key, particles, exploded) {
    return {
      key,
      particles: particles.map(p => ({
        x: exploded ? p.tx : p.sx,
        y: exploded ? p.ty : p.sy,
        o: exploded ? 0 : 1,
        s: exploded ? 1 : 0.3,
        size: p.size,
        color: p.color,
        round: p.round
      }))
    }
  },

  celebrate() {
    const key = `celebrated_${todayStr()}`
    // 同一天只撒花一次，取消再勾不重复打扰
    if (wx.getStorageSync(key)) return false
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
    return true
  },

  closeCelebrate() {
    this.setData({ celebrating: false })
  },

  // 面包超人的一天：打开页面且距上次主动开口超过 40 分钟时，按时段/状态冒一句
  maybeAutoBubble() {
    if (this.data.bubbleShow || this.data.celebrating) return
    if (!this.data.hasTemplate || this.data.total === 0) return
    const last = Number(wx.getStorageSync('lastBubbleAt') || 0)
    if (Date.now() - last < 40 * 60 * 1000) return
    const quote = this.pickSceneQuote()
    if (!quote) return
    this._autoTimer = setTimeout(() => {
      this._autoTimer = null
      // 触发瞬间若戳一戳气泡正挂着或正在庆祝，这次就不插嘴，配额也不消耗
      if (this.data.bubbleShow || this.data.celebrating) return
      // 真正要展示了才记时间，900ms 内切走不会白扣 40 分钟配额
      wx.setStorageSync('lastBubbleAt', Date.now())
      this.setData({ bubbleText: quote, bubbleShow: true })
      this._bubbleTimer = setTimeout(() => this.setData({ bubbleShow: false }), 2600)
    }, 900)
  },

  pickSceneQuote() {
    const { allDone, ongoingText, doneCount, total } = this.data
    const hour = new Date().getHours()
    let pool
    if (allDone) pool = SCENE_QUOTES.allDone
    else if (hour < 6) pool = SCENE_QUOTES.midnight
    else if (hour >= 21) pool = SCENE_QUOTES.night
    else if (ongoingText && Math.random() < 0.5) pool = SCENE_QUOTES.ongoing
    else pool = SCENE_QUOTES[sceneBucket(hour)]
    let idx = Math.floor(Math.random() * pool.length)
    if (pool.length > 1 && idx === this._lastSceneIdx) idx = (idx + 1) % pool.length
    this._lastSceneIdx = idx
    const text = pool[idx]
    return ongoingText ? text.split('{task}').join(ongoingText) : text
  },

  pokeMascot() {
    let idx = Math.floor(Math.random() * POKE_QUOTES.length)
    // 连续两次抽到同一句很出戏，错开一条
    if (POKE_QUOTES.length > 1 && idx === this._lastPokeIdx) idx = (idx + 1) % POKE_QUOTES.length
    this._lastPokeIdx = idx
    if (this._bubbleTimer) clearTimeout(this._bubbleTimer)
    this.setData({
      pokeSeed: this.data.pokeSeed + 1,
      bubbleText: POKE_QUOTES[idx],
      bubbleShow: true
    })
    this._bubbleTimer = setTimeout(() => this.setData({ bubbleShow: false }), 2200)
    lightVibrate()
  },

  goImport() {
    wx.navigateTo({ url: '/pages/import/import' })
  },

  goTemplate() {
    wx.switchTab({ url: '/pages/template/template' })
  }
})
