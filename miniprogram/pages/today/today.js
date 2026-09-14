const { WEEKDAYS, weekdayOf, todayStr, nowMinutes, fmtMin } = require('../../utils/time')

const PRAISES = [
  '全部完成！心爱今天也是满分小面包',
  '计划清空！妳努力的样子在发光呀',
  '打卡全成功，奖励自己一块小蛋糕吧',
  '今天的心爱，比刚出炉的面包还棒',
  '全部搞定！妳就是教招卷王本王',
  '完美好收工，明天也要来找我哦'
]

// 连击达到 2 天以上时，庆祝语有概率换成带天数的版本
const STREAK_PRAISES = [
  '连续 {n} 天全完成！心爱是坚持小天才',
  '{n} 天连击！面包小人激动得转圈圈',
  '连赢 {n} 天，这个战绩值得截图炫耀'
]

const STREAK_QUOTES = [
  '已经连着 {n} 天全完成啦，心爱好厉害',
  '{n} 天连击中，妳是面包小镇最闪的星',
  '连续 {n} 天！再坚持一下就是传说啦',
  '偷偷数了数，妳已经连赢 {n} 天了哦'
]

// 截屏被抓包时的台词
const CAPTURE_QUOTES = [
  '咔嚓！心爱认真的样子被存下来啦',
  '被拍到咯，比个耶',
  '这一刻的努力，截图为证！',
  '偷拍成功，原来是心爱在学习'
]

const CONFETTI_COLORS = ['#FF8FA3', '#FFC9A9', '#FFD6DC', '#B5E0C8', '#A9C9FF', '#FFE08A']

const BURST_COLORS = ['#FF8FA3', '#FFB3C1', '#FFC9D4', '#FCD9A0', '#FFE9C4']

const POKE_QUOTES = [
  '戳我干嘛，快去写题啦小懒虫',
  '再戳再戳就把面包分妳一半',
  '我在呢，陪心爱一起熬教综',
  '偷偷说：妳比我可爱一点点',
  '刷题累了？来，抱一下再走',
  '今天的妳，也是元气满满的小太阳',
  '别看我啦，看妳的计划表去',
  '面包力量注入中……好啦，冲！',
  '妳认真的侧脸，是面包店最好的风景',
  '摸鱼被我抓到啦，嘿嘿不说出去',
  '慢慢来，面包烤急了会糊的',
  '错题本想妳了，快去看看它'
]

// 面包超人的一天：按 时段 × 完成状态 分桶的场景语录，{task} 会替换成进行中的任务名
const SCENE_QUOTES = {
  dawn: [
    '早安心爱！新的一天从一口热面包开始',
    '起床啦，太阳晒面包屁股咯',
    '早上脑子最清醒，先把最难的那块啃掉',
    '不吃早餐就背书，会饿成小面包干的',
    '清晨第一缕元气，分妳一大半'
  ],
  forenoon: [
    '上午阳光正好，适合和刷题贴贴',
    '一项一项来，我在旁边帮妳数着呢',
    '学累了？喝水，抬头，看窗外三秒钟',
    '专注的心爱，像刚出炉的吐司一样香',
    '上午进度过半了吗？过半奖励奶茶（自己买）'
  ],
  noon: [
    '中午好，饭要吃饱，书才背得动',
    '午休二十分钟，下午效率直接翻倍',
    '吃饱才有力气学习，这是面包的哲学',
    '先吃饭！计划不会跑，饭会凉'
  ],
  afternoon: [
    '下午最容易犯困，站起来晃两圈',
    '犯困的话，捏捏自己的小脸醒一醒',
    '错题本是妳的好朋友，常回来看看它',
    '偷偷给妳的面包加了果酱，继续冲',
    '还有几项没勾？它们在排队等妳宠幸呢'
  ],
  dusk: [
    '傍晚啦，回头看看今天的战果',
    '晚饭吃热乎的，胃暖了心才暖',
    '今天的尾巴了，收个漂亮的官吧',
    '晚霞是草莓味的，和妳很配'
  ],
  night: [
    '夜深了，做不完就明天再说，我不怪妳',
    '今天到这里吧，剩下的明天我陪妳',
    '再熬夜，黑眼圈要把面包能量吃光了',
    '完成多少算多少，妳已经很好了'
  ],
  midnight: [
    '这么晚还不睡呀，我陪妳一会儿就去休息哦',
    '凌晨的计划明天再做也来得及，先睡吧',
    '嘘——月亮打哈欠了，心爱也晚安'
  ],
  allDone: [
    '全部完成！今天的心爱闪闪发光',
    '计划清空，面包小人吃得圆滚滚',
    '妳超棒的，明天也要一起加油呀',
    '全打卡成功！快去炫耀（适度）',
    '今天的努力，考试那天会替妳说话'
  ],
  ongoing: [
    '正在陪妳「{task}」，专心哦',
    '「{task}」进行中，我帮妳盯着时间',
    '现在是「{task}」时间，小脑袋不许飘走'
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

// 无时间的计划项过了 17:00 还没勾，也进入蔫巴状态
const WILT_MIN = 17 * 60

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
    const done = !!checks[it.id]
    return Object.assign({}, it, {
      done,
      status,
      // 蔫巴：错过的定时项 + 傍晚还没勾的随性项，用「蔫了…」小牌子温柔提醒
      wilted: !done && (status === 'past' || (it.startMin == null && nowMin >= WILT_MIN)),
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

const GREETINGS = {
  night: ['夜深啦，心爱早点休息哦', '这么晚啦，梦里也要背书吗', '夜色温柔，别熬太久哦'],
  morning: ['早上好呀，今天也闪闪发光', '心爱早！面包已经烤好啦', '早安，今天的计划在等妳'],
  noon: ['中午好，吃饱饱再学习', '午安心爱，午休一下下嘛'],
  afternoon: ['下午好，再坚持一下下', '下午的心爱也很棒', '下午茶时间到了没呀'],
  evening: ['晚上好，收尾今天吧', '晚上好心爱，冲刺啦']
}

function makeGreeting(hour) {
  const pool = hour < 6 ? GREETINGS.night
    : hour < 11 ? GREETINGS.morning
    : hour < 14 ? GREETINGS.noon
    : hour < 18 ? GREETINGS.afternoon
    : GREETINGS.evening
  return pool[Math.floor(Math.random() * pool.length)]
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
    bursts: [],
    captureShow: false,
    captureText: ''
  },

  timer: null,
  recordKey: '',
  recordReady: false,
  _burstSeq: 0,
  _burstFinals: {},
  _autoTimer: null,
  _captureTimer: null,

  onLoad() {
    // 截屏彩蛋：模拟器和旧基础库上可能没有这个 API，注册失败也不影响页面
    if (wx.onUserCaptureScreen) {
      wx.onUserCaptureScreen(() => this.onCapture())
    }
  },

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
    if (this._captureTimer) {
      clearTimeout(this._captureTimer)
      this._captureTimer = null
    }
    this.clearBursts()
    // 气泡只靠上面被清掉的定时器隐藏，必须手动复位，否则切走后气泡永久挂住
    if (this.data.bubbleShow) this.setData({ bubbleShow: false })
    if (this.data.captureShow) this.setData({ captureShow: false })
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
      if (!this.celebrate()) this.burstAt(`#check-${id}`, 1)
    } else if (willDone) {
      // 勾上的瞬间在圆圈位置定点爆开一小撮粒子，完成度越高爆得越欢
      const progress = this.data.total ? doneCount / this.data.total : 1
      this.burstAt(`#check-${id}`, progress)
    }
    this.loadStreak()
  },

  burstAt(selector, strength) {
    wx.createSelectorQuery()
      .in(this)
      .select(selector)
      .boundingClientRect()
      .exec(res => {
        const r = res && res[0]
        if (!r) return
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        // 强度 0~1：粒子数 10→20、飞散半径随之放大，勾到后面越炸越欢
        const count = Math.round(10 + strength * 10)
        const baseDist = 38 + strength * 28
        const randDist = 38 + strength * 44
        // 每颗粒子带两份坐标：起点（圆心）和终点（沿随机角度散开）
        const particles = []
        for (let i = 0; i < count; i++) {
          const ang = Math.random() * Math.PI * 2
          const dist = baseDist + Math.random() * randDist
          particles.push({
            sx: cx.toFixed(1),
            sy: cy.toFixed(1),
            tx: (cx + Math.cos(ang) * dist).toFixed(1),
            ty: (cy + Math.sin(ang) * dist).toFixed(1),
            color: BURST_COLORS[i % BURST_COLORS.length],
            size: (6 + Math.random() * (7 + strength * 5)).toFixed(1),
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
    // 此时 data.streak 还是「截至今早」的连击数，今天的完成让它 +1
    let praisePool = PRAISES
    if (this.data.streak + 1 >= 2 && Math.random() < 0.5) {
      praisePool = STREAK_PRAISES.map(s => s.split('{n}').join(this.data.streak + 1))
    }
    this.setData({
      celebrating: true,
      praise: praisePool[Math.floor(Math.random() * praisePool.length)],
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
    const { allDone, ongoingText, doneCount, total, streak } = this.data
    const hour = new Date().getHours()
    // 连击中时偶尔抢过话头夸连击，其余走时段/状态语录
    if (!allDone && hour >= 6 && hour < 21 && streak >= 2 && Math.random() < 0.3) {
      return STREAK_QUOTES[Math.floor(Math.random() * STREAK_QUOTES.length)].split('{n}').join(streak)
    }
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

  // 截屏被抓到：弹一张小卡片，2.6 秒自动收，也可点掉
  onCapture() {
    if (this.data.celebrating || this.data.captureShow) return
    this.setData({
      captureShow: true,
      captureText: CAPTURE_QUOTES[Math.floor(Math.random() * CAPTURE_QUOTES.length)]
    })
    lightVibrate()
    this._captureTimer = setTimeout(() => this.setData({ captureShow: false }), 2600)
  },

  closeCapture() {
    if (this._captureTimer) {
      clearTimeout(this._captureTimer)
      this._captureTimer = null
    }
    this.setData({ captureShow: false })
  },

  goImport() {
    wx.navigateTo({ url: '/pages/import/import' })
  },

  goTemplate() {
    wx.switchTab({ url: '/pages/template/template' })
  }
})
