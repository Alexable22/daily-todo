const { WEEKDAYS, weekdayOf, todayStr, nowMinutes, fmtMin } = require('../../utils/time')

const PRAISES = [
  '全部完成！心爱今天也是满分小超人',
  '计划清空！你努力的样子在发光呀',
  '打卡全成功，奖励自己一块小蛋糕吧',
  '今天的心爱，比面包超人的披风还要闪',
  '全部搞定！你就是教招卷王本王',
  '完美好收工，明天面包超人还在老地方等你',
  '起飞咯！心爱是今天最闪的正义伙伴'
]

// 连击达到 2 天以上时，庆祝语有概率换成带天数的版本
const STREAK_PRAISES = [
  '连续 {n} 天全完成！心爱是坚持小天才',
  '{n} 天连击！面包超人激动得原地转圈圈',
  '连赢 {n} 天，这个战绩值得截图炫耀'
]

const STREAK_QUOTES = [
  '已经连着 {n} 天全完成啦，心爱好厉害',
  '{n} 天连击中，面包超人给你颁了一枚小星星',
  '连续 {n} 天！再坚持一下就是传说啦',
  '偷偷数了数，心爱已经连赢 {n} 天了哦'
]

// 截屏被抓包时的台词
const CAPTURE_QUOTES = [
  '咔嚓！心爱认真的样子被存下来啦',
  '被拍到咯，比个耶',
  '这一刻的努力，截图为证！',
  '偷拍成功，原来是心爱在发光',
  '正义的瞬间，就该留影纪念'
]

// 暴击横幅：勾选时 12% 概率触发，夸的正是「这一下手感」
const CRIT_QUOTES = [
  '会心一击！这一勾又快又准',
  '暴击！面包超人在旁边看呆了',
  '乖巧攻击，直接命中！',
  '这一勾的手感，绝了',
  '任务血条见底，倒下！',
  '爱与勇气，全部灌注在这一勾里！'
]

// 双击吉祥物比心的台词
const HEART_QUOTES = [
  '比心！面包超人也爱你哦',
  '心心收到，能量充满！',
  '双向奔赴，巡逻都更有劲了',
  '心爱比的心，面包超人要用双手接住'
]

// 长按搓搓吉祥物的台词
const RUB_QUOTES = [
  '脸都被搓红啦…元气分你一半',
  '搓搓头？好啦好啦，借你好运',
  '再搓要冒火星啦，嗖——',
  '搓搓更精神，冲鸭',
  '被心爱搓过的脸，今天特别有精神'
]

// 双击任务行拍一拍的台词
const PAT_QUOTES = [
  '任务被拍醒了，火速开动',
  '别拍啦别拍啦，我马上做',
  '拍拍生效，任务精神 +1',
  '被拍过的任务跑得更快哦',
  '任务原地立正：这就开始！'
]

// 深夜晚安卡副文案（主标题固定「23 点啦，该休息咯」）
const NIGHT_LINES = [
  '今天的心爱已经很努力了，睡饱才记得牢',
  '剩下的明天再做，面包超人帮你记着呢',
  '好梦是明天的第一步，先睡为敬',
  '晚安心爱，爱和勇气在梦里也陪着你'
]

const CONFETTI_COLORS = ['#FF8FA3', '#FFC9A9', '#FFD6DC', '#B5E0C8', '#A9C9FF', '#FFE08A']

const BURST_COLORS = ['#FF8FA3', '#FFB3C1', '#FFC9D4', '#FCD9A0', '#FFE9C4']

const POKE_QUOTES = [
  '戳我干嘛，快去写题啦小懒虫',
  '再戳再戳，面包超人的披风要被戳出洞啦',
  '我在呢，陪心爱一起熬教综',
  '偷偷说：心爱比我可爱一点点',
  '刷题累了？来，抱一下再走',
  '今天的心爱，也是元气满满的小太阳',
  '别看我啦，看你的计划表去',
  '面包超人能量注入中……好啦，冲！',
  '心爱认真的侧脸，是面包超人巡逻路上最好的风景',
  '摸鱼被我抓到啦，嘿嘿不说出去',
  '慢慢来，面包超人也是一步一步飞起来的',
  '错题本想你了，快去看看它',
  '起飞咯！心爱今天也是无敌模式',
  '爱和勇气是你最好最好的朋友——还有我',
  '心爱遇到难题的话，披风借你披一下'
]

// 面包超人的一天：按 时段 × 完成状态 分桶的场景语录，{task} 会替换成进行中的任务名
const SCENE_QUOTES = {
  dawn: [
    '早安心爱！面包超人已就位，新的一天冲鸭',
    '起床啦，太阳晒小屁股咯',
    '早上脑子最清醒，先把最难的那块啃掉',
    '不吃早餐就背书，肚子会咕咕抗议的',
    '清晨第一缕元气，分你一大半',
    '带上爱和勇气，出发！'
  ],
  forenoon: [
    '上午阳光正好，适合和刷题贴贴',
    '一项一项来，面包超人在旁边帮你数着呢',
    '学累了？喝水，抬头，看窗外三秒钟',
    '专注的心爱，连面包超人路过都要夸一句',
    '上午进度过半了吗？过半奖励奶茶（自己买）',
    '正义的上午，就该用来对付教综'
  ],
  noon: [
    '中午好，饭要吃饱，书才背得动',
    '午休二十分钟，下午效率直接翻倍',
    '吃饱才有力气学习，这是宇宙的真理',
    '先吃饭！计划不会跑，饭会凉'
  ],
  afternoon: [
    '下午最容易犯困，站起来晃两圈',
    '犯困的话，捏捏自己的小脸醒一醒',
    '错题本是你的好朋友，常回来看看它',
    '偷偷给心爱充了一格面包超人能量，继续冲',
    '还有几项没勾？它们在排队等你宠幸呢'
  ],
  dusk: [
    '傍晚啦，回头看看今天的战果',
    '晚饭吃热乎的，胃暖了心才暖',
    '今天的尾巴了，漂亮收官吧',
    '晚霞是草莓味的，和心爱很配'
  ],
  night: [
    '夜深了，做不完就明天再说，我不怪你',
    '今天到这里吧，剩下的明天我陪你',
    '再熬夜，黑眼圈要把心爱的元气吃光光啦',
    '完成多少算多少，心爱已经很好了'
  ],
  midnight: [
    '这么晚还不睡呀，我陪你一会儿就去休息哦',
    '凌晨的计划明天再做也来得及，先睡吧',
    '嘘——月亮打哈欠了，心爱也晚安'
  ],
  allDone: [
    '全部完成！今天的心爱闪闪发光',
    '计划清空，面包超人开心得原地起飞',
    '心爱超棒的，明天也要一起加油呀',
    '全打卡成功！快去炫耀（适度）',
    '今天的努力，考试那天会替你说话',
    '连面包超人都要给心爱让出 C 位'
  ],
  ongoing: [
    '正在陪心爱「{task}」，专心哦',
    '「{task}」进行中，面包超人帮你盯着时间',
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
  morning: ['早上好呀，心爱今天也闪闪发光', '心爱早！面包超人今天也准时上岗', '早安，今天的计划在等你'],
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
    freezeProtected: 0,
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
    captureText: '',
    // 双击吉祥物比心 / 长按搓搓冒出的小爱心（视口坐标，两段式动画）
    hearts: [],
    // 拍一拍任务行：飘出的小字标签
    patTag: null,
    patClass: '',
    pattedId: '',
    // 暴击横幅
    critShow: false,
    critText: '',
    // 面包超人活起来：呼吸 + 随机小动作
    idleClass: '',
    // 傍晚后的星星 & 深晚安卡 & 隔夜明信片 & 里程碑
    eveningStars: false,
    nightShow: false,
    nightLine: '',
    postcardShow: false,
    postcardDateText: '',
    postcardCount: 0,
    milestoneN: 0,
    fireworks: []
  },

  timer: null,
  recordKey: '',
  recordReady: false,
  _burstSeq: 0,
  _burstFinals: {},
  _autoTimer: null,
  _captureTimer: null,
  _heartSeq: 0,
  _heartFinals: {},
  _taskTapId: '',
  _taskTapAt: 0,
  _tapTimer: null,
  _mascotTapAt: 0,
  _mascotTapTimer: null,
  _petting: false,
  _petMoved: false,
  _petTick: 0,
  _idleTimer: null,
  _idleClear: null,
  _critTimer: null,
  _patTimer: null,
  _cardTimer: null,
  _heartStagers: [],
  _postcardDate: '',
  _pendingFreezeNotice: '',
  _pendingFreezeDate: '',

  onLoad() {
    // 截屏彩蛋：模拟器和旧基础库上可能没有这个 API，注册失败也不影响页面
    if (wx.onUserCaptureScreen) {
      wx.onUserCaptureScreen(() => this.onCapture())
    }
  },

  onShow() {
    this.startTimer()
    this.startIdle()
    this.refresh().then(() => {
      this.maybeCards()
      this.maybeAutoBubble()
    })
  },

  onHide() {
    this.clearTransient()
  },

  onUnload() {
    this.clearTransient()
    if (wx.offUserCaptureScreen) wx.offUserCaptureScreen()
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
    if (this._tapTimer) {
      clearTimeout(this._tapTimer)
      this._tapTimer = null
      // 手势识别窗内切走页面时，把已经落下的单击兑现掉，别让这记勾选凭空消失
      if (this._taskTapId) this.doToggle(this._taskTapId)
    }
    this._taskTapId = ''
    this._taskTapAt = 0
    if (this._mascotTapTimer) {
      clearTimeout(this._mascotTapTimer)
      this._mascotTapTimer = null
    }
    if (this._idleTimer) {
      clearTimeout(this._idleTimer)
      this._idleTimer = null
    }
    if (this._idleClear) {
      clearTimeout(this._idleClear)
      this._idleClear = null
    }
    if (this._critTimer) {
      clearTimeout(this._critTimer)
      this._critTimer = null
    }
    if (this._patTimer) {
      clearTimeout(this._patTimer)
      this._patTimer = null
    }
    if (this._cardTimer) {
      clearTimeout(this._cardTimer)
      this._cardTimer = null
    }
    if (this._heartStagers.length) {
      this._heartStagers.forEach(clearTimeout)
      this._heartStagers = []
    }
    this.clearBursts()
    this.clearHearts()
    this._petting = false
    this._petMoved = false
    // 气泡只靠上面被清掉的定时器隐藏，必须手动复位，否则切走后气泡永久挂住
    const patch = { bubbleShow: false, captureShow: false, patTag: null, patClass: '', pattedId: '', critShow: false, idleClass: '', nightShow: false, postcardShow: false }
    this.setData(patch)
  },

  clearBursts() {
    Object.keys(this._burstFinals).forEach(k => clearTimeout(this._burstFinals[k]))
    this._burstFinals = {}
    if (this.data.bursts.length) this.setData({ bursts: [] })
  },

  clearHearts() {
    Object.keys(this._heartFinals).forEach(k => clearTimeout(this._heartFinals[k]))
    this._heartFinals = {}
    if (this.data.hearts.length) this.setData({ hearts: [] })
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
    // 页面开着跨过 18 点 / 23 点时，星星和晚安卡也要跟上
    this.setData({ eveningStars: new Date().getHours() >= 18 })
    this.maybeNightCard()
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
      // 面包超人守护卡：回扫遇到「单日空窗」且该月卡片可用时，自动护住连击。
      // used 记录「月份 -> 被护住的日期」：同一个月只能护一次，重扫时读到同一条记录视为已护过，结果幂等。
      const used = wx.getStorageSync('freeze_used') || {}
      let streak = 0
      let protectedCount = 0
      let newProtected = ''
      const protectedDates = []
      let justProtected = false
      while (true) {
        const d = todayStr(cursor)
        if (doneDates.has(d)) {
          streak++
          justProtected = false
        } else {
          const month = d.slice(0, 7)
          const wasProtected = used[month] === d
          // 护卡只桥接「单日失手」：近端要有连击在延续（streak>=1），远端前一天也必须本来就完成，
          // 否则卡片会空烧——比如首次打卡、或隔了整个周末，那不是单日失手
          const prev = new Date(cursor)
          prev.setDate(prev.getDate() - 1)
          const bridgesChain = doneDates.has(todayStr(prev))
          if (wasProtected || (streak >= 1 && bridgesChain && !used[month] && !justProtected)) {
            if (!wasProtected) {
              used[month] = d
              newProtected = d
            }
            protectedDates.push(d)
            protectedCount++
            streak++
            justProtected = true
          } else {
            break
          }
        }
        cursor.setDate(cursor.getDate() - 1)
      }
      if (newProtected) wx.setStorageSync('freeze_used', used)
      // 播报要等真正冒出气泡那一刻才记进 freeze_notified；没播出去的，下次扫描还会重新排队，不会永久丢
      const notified = wx.getStorageSync('freeze_notified') || []
      const unannounced = protectedDates.find(dd => notified.indexOf(dd) < 0)
      if (unannounced) {
        this._pendingFreezeDate = unannounced
        this._pendingFreezeNotice = `叮！面包超人的守护卡护住了 ${Number(unannounced.slice(8))} 号那天的连击，这个月的卡用掉啦`
      }
      this.setData({ streak, freezeProtected: protectedCount })
    } catch (err) {
      console.error('加载连续打卡失败', err)
    }
  },

  // 任务行手势分发：单击等 260ms 再勾选，260ms 内同一行来了第二下就是「拍一拍」；
  // 期间点了别的行，说明是在快速连勾，把上一行立刻兑现，别吞掉它的勾选。
  // 提交延时与识别窗口必须同值：窗口内第二击永远来得及先取消定时器
  toggle(e) {
    const id = e.currentTarget.dataset.id
    const now = Date.now()
    if (this._taskTapId === id && now - this._taskTapAt < 260) {
      if (this._tapTimer) {
        clearTimeout(this._tapTimer)
        this._tapTimer = null
      }
      this._taskTapId = ''
      this._taskTapAt = 0
      this.patTask(id)
      return
    }
    if (this._tapTimer) {
      clearTimeout(this._tapTimer)
      this._tapTimer = null
      if (this._taskTapId) this.doToggle(this._taskTapId)
    }
    this._taskTapId = id
    this._taskTapAt = now
    this._tapTimer = setTimeout(() => {
      this._tapTimer = null
      this._taskTapId = ''
      this._taskTapAt = 0
      this.doToggle(id)
    }, 260)
  },

  doToggle(id) {
    if (!this.recordKey || !this.recordReady) return
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
      // 先重算连击再庆祝：守护卡可能刚把今天的完成桥进连击里，celebrate 要拿到含今天的最新天数
      this.loadStreak()
      // 今天已撒过花时 celebrate 会被拦截，退回粒子爆花，别让这次勾选零反馈
      if (!this.celebrate()) this.burstAt(`#check-${id}`, 1)
    } else if (willDone) {
      // 勾上的瞬间在圆圈位置定点爆开一小撮粒子，完成度越高爆得越欢；12% 概率暴击加料
      const progress = this.data.total ? doneCount / this.data.total : 1
      let strength = progress
      if (Math.random() < 0.12) {
        this.showCrit()
        strength = Math.min(1.6, strength + 0.6)
      }
      this.burstAt(`#check-${id}`, strength)
      this.loadStreak()
    }
  },

  // 拍一拍：任务行抖一下，头顶飘出一句俏皮话
  patTask(id) {
    lightVibrate()
    this.setData({ pattedId: '', patClass: '', patTag: null }, () => {
      this.setData({ pattedId: id, patClass: 'patted' })
      wx.createSelectorQuery()
        .in(this)
        .select(`#check-${id}`)
        .boundingClientRect()
        .exec(res => {
          const r = res && res[0]
          // 页面在查询返回前被切走时 _patTimer 已被清空，别再挂出没人收尾的幽灵标签
          if (!r || !this._patTimer) return
          this.setData({
            patTag: {
              x: Math.round(r.left + r.width / 2),
              y: Math.round(r.top - 8),
              text: PAT_QUOTES[Math.floor(Math.random() * PAT_QUOTES.length)]
            }
          })
        })
      if (this._patTimer) clearTimeout(this._patTimer)
      this._patTimer = setTimeout(() => {
        this._patTimer = null
        this.setData({ pattedId: '', patClass: '', patTag: null })
      }, 1100)
    })
  },

  showCrit() {
    if (this.data.critShow) return
    let idx = Math.floor(Math.random() * CRIT_QUOTES.length)
    if (CRIT_QUOTES.length > 1 && idx === this._lastCritIdx) idx = (idx + 1) % CRIT_QUOTES.length
    this._lastCritIdx = idx
    this.setData({ critShow: true, critText: CRIT_QUOTES[idx] })
    if (this._critTimer) clearTimeout(this._critTimer)
    this._critTimer = setTimeout(() => {
      this._critTimer = null
      this.setData({ critShow: false })
    }, 1600)
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
    // data.streak 由刚跑过的 loadStreak 刷新，今天的全完成已计入（含守护卡桥接）
    const n = this.data.streak
    let milestone = 0
    if (n === 7 || n === 30 || n === 100) {
      const mk = `celebrated_m${n}`
      if (!wx.getStorageSync(mk)) {
        wx.setStorageSync(mk, true)
        milestone = n
      }
    }
    let praisePool = PRAISES
    if (milestone) {
      praisePool = [`第 ${milestone} 天！连击里程碑达成`]
    } else if (n >= 2 && Math.random() < 0.5) {
      praisePool = STREAK_PRAISES.map(s => s.split('{n}').join(n))
    }
    this.setData({
      celebrating: true,
      praise: praisePool[Math.floor(Math.random() * praisePool.length)],
      confetti,
      milestoneN: milestone,
      fireworks: milestone ? this.makeFireworks() : []
    })
    return true
  },

  // 里程碑烟花：三个放点位，每点 10 道射线，方向由外层 rotate 承担、内层小点只做「飞出+熄灭」
  makeFireworks() {
    const points = [
      { left: 18, top: 24, delay: 0 },
      { left: 78, top: 18, delay: 0.85 },
      { left: 50, top: 42, delay: 1.7 }
    ]
    return points.map(p => ({
      left: p.left,
      top: p.top,
      rays: Array.from({ length: 10 }, (_, i) => ({
        ang: Math.round(i * 36 + Math.random() * 8),
        delay: (p.delay + Math.random() * 0.15).toFixed(2),
        color: CONFETTI_COLORS[(i + p.left) % CONFETTI_COLORS.length]
      }))
    }))
  },

  closeCelebrate() {
    this.setData({ celebrating: false, milestoneN: 0, fireworks: [] })
  },

  // 面包超人的一天：打开页面且距上次主动开口超过 40 分钟时，按时段/状态冒一句
  maybeAutoBubble() {
    if (this.data.bubbleShow || this.celebratingOrCards()) return
    if (!this.data.hasTemplate || this.data.total === 0) return
    const last = Number(wx.getStorageSync('lastBubbleAt') || 0)
    if (Date.now() - last < 40 * 60 * 1000) return
    const quote = this._pendingFreezeNotice || this.pickSceneQuote()
    if (!quote) return
    this._autoTimer = setTimeout(() => {
      this._autoTimer = null
      // 触发瞬间若戳一戳气泡正挂着或正在庆祝/弹卡，这次就不插嘴，配额也不消耗
      if (this.data.bubbleShow || this.celebratingOrCards()) return
      // 守护卡播报此刻才算送达：只有真正上屏了才记 freeze_notified，跨会话可重试
      if (this._pendingFreezeDate) {
        const notified = wx.getStorageSync('freeze_notified') || []
        if (notified.indexOf(this._pendingFreezeDate) < 0) {
          notified.push(this._pendingFreezeDate)
          wx.setStorageSync('freeze_notified', notified)
        }
        this._pendingFreezeDate = ''
      }
      this._pendingFreezeNotice = ''
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
    this.setData({ pokeSeed: this.data.pokeSeed + 1 })
    this.showBubble(POKE_QUOTES[idx], 2200)
    lightVibrate()
  },

  // 气泡统一走这里：换文案前先复位，方便调用方控制时长
  showBubble(text, ms) {
    if (this._bubbleTimer) clearTimeout(this._bubbleTimer)
    this.setData({ bubbleText: text, bubbleShow: true })
    this._bubbleTimer = setTimeout(() => this.setData({ bubbleShow: false }), ms)
  },

  // 吉祥物手势分发：单击延迟 260ms 出台词，260ms 内第二击是比心（窗口与提交延时同值，不留死区）
  onMascotTap() {
    const now = Date.now()
    if (now - this._mascotTapAt < 260) {
      if (this._mascotTapTimer) {
        clearTimeout(this._mascotTapTimer)
        this._mascotTapTimer = null
      }
      this._mascotTapAt = 0
      this.heartMascot()
      return
    }
    this._mascotTapAt = now
    if (this._mascotTapTimer) clearTimeout(this._mascotTapTimer)
    this._mascotTapTimer = setTimeout(() => {
      this._mascotTapTimer = null
      this._mascotTapAt = 0
      this.pokeMascot()
    }, 260)
  },

  // 双击比心：吉祥物原地冒一大串爱心往上飘
  heartMascot() {
    wx.createSelectorQuery()
      .in(this)
      .select('.mascot-zone')
      .boundingClientRect()
      .exec(res => {
        const r = res && res[0]
        if (!r) return
        const cx = r.left + r.width / 2
        const cy = r.top + r.height * 0.6
        // 错峰冒 5 颗：定时器登记在册，页面切走时统一清掉，不会在清理后又冒出幽灵爱心
        for (let i = 0; i < 5; i++) {
          const stager = setTimeout(() => {
            this._heartStagers = this._heartStagers.filter(x => x !== stager)
            this.spawnHeart(cx + (Math.random() - 0.5) * r.width * 0.7, cy)
          }, i * 90)
          this._heartStagers.push(stager)
        }
        lightVibrate()
        this.showBubble(HEART_QUOTES[Math.floor(Math.random() * HEART_QUOTES.length)], 2200)
      })
  },

  // 一颗小爱心：起点视口坐标，两段式 setData 飘到上方后淡出（复用粒子爆花的套路）
  spawnHeart(x, y) {
    const key = `h${++this._heartSeq}`
    const base = {
      key,
      sx: Math.round(x),
      sy: Math.round(y),
      tx: Math.round(x + (Math.random() - 0.5) * 50),
      ty: Math.round(y - 90 - Math.random() * 50),
      size: 24 + Math.round(Math.random() * 18),
      color: ['#FF8FA3', '#FFB3C1', '#FF6F91'][this._heartSeq % 3]
    }
    this.setData({ hearts: this.data.hearts.concat([Object.assign({}, base, { x: base.sx, y: base.sy, o: 1, s: 0.5 })]) }, () => {
      setTimeout(() => {
        const idx = this.data.hearts.findIndex(h => h.key === key)
        if (idx < 0) return
        this.setData({ [`hearts[${idx}]`]: Object.assign({}, base, { x: base.tx, y: base.ty, o: 0, s: 1.15 }) })
      }, 30)
      this._heartFinals[key] = setTimeout(() => {
        delete this._heartFinals[key]
        this.setData({ hearts: this.data.hearts.filter(h => h.key !== key) })
      }, 1000)
    })
  },

  // 长按进入搓搓模式：手指在吉祥物上蹭，蹭到哪儿爱心冒到哪儿
  onMascotLongpress(e) {
    this._petting = true
    this._petMoved = false
    const t = e.touches && e.touches[0]
    if (t) this.spawnHeart(t.clientX, t.clientY - 10)
    lightVibrate()
  },

  // 搓搓模式：手指在吉祥物上蹭，蹭到哪儿爱心冒到哪儿
  onMascotTouchMove(e) {
    const t = e.touches && e.touches[0]
    if (!t || !this._petting) return
    this._petMoved = true
    const now = Date.now()
    if (now - this._petTick > 140) {
      this._petTick = now
      this.spawnHeart(t.clientX, t.clientY - 12)
      if (Math.random() < 0.35) lightVibrate()
    }
  },

  // touchend / touchcancel 共用：搓搓收尾，说一句收场台词
  onMascotTouchEnd() {
    const wasPetting = this._petting
    this._petting = false
    if (wasPetting && this._petMoved) this.showBubble(RUB_QUOTES[Math.floor(Math.random() * RUB_QUOTES.length)], 2200)
    this._petMoved = false
  },

  // 面包超人活起来：待机时呼吸（WXSS 常驻），每 12~21 秒随机来一个小动作
  startIdle() {
    this.stopIdle()
    const loop = () => {
      this._idleTimer = setTimeout(() => {
        if (!this._petting && !this.data.celebrating && this.data.idleClass === '') {
          const r = Math.random()
          let act = 'tilt'
          if (r < 0.3) act = 'hop'
          else if (r < 0.55) act = 'wiggle'
          else if (r < 0.6) act = 'spin'
          // 先摘 class 再挂回，连续两次抽到同一动作也能重播
          this.setData({ idleClass: '' }, () => {
            this.setData({ idleClass: `act-${act}` })
            if (this._idleClear) clearTimeout(this._idleClear)
            this._idleClear = setTimeout(() => this.setData({ idleClass: '' }), 1300)
          })
        }
        loop()
      }, 12000 + Math.floor(Math.random() * 9000))
    }
    loop()
  },

  stopIdle() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer)
      this._idleTimer = null
    }
    if (this._idleClear) {
      clearTimeout(this._idleClear)
      this._idleClear = null
    }
  },

  // 任意全屏卡片/庆祝挂起时，其他主动开口都先让路
  celebratingOrCards() {
    return this.data.celebrating || this.data.captureShow || this.data.postcardShow || this.data.nightShow
  },

  // 深晚安安卡 & 隔夜旅行明信片：进入页面稍等半秒再弹，别跟问候语撞车
  maybeCards() {
    this.setData({ eveningStars: new Date().getHours() >= 18 })
    this._cardTimer = setTimeout(() => {
      this._cardTimer = null
      if (this.maybeNightCard()) return
      this.maybePostcard()
    }, 600)
  },

  maybeNightCard() {
    const hour = new Date().getHours()
    if (hour < 23 || this.data.nightShow || this.celebratingOrCards()) return false
    // 一晚只弹一次的记账放在「点掉」那一刻：中途切走不算送达，下次进来还会再关心你
    if (wx.getStorageSync(`nightcard_${todayStr()}`)) return false
    this.setData({
      nightShow: true,
      nightLine: NIGHT_LINES[Math.floor(Math.random() * NIGHT_LINES.length)]
    })
    lightVibrate()
    return true
  },

  closeNight() {
    wx.setStorageSync(`nightcard_${todayStr()}`, true)
    this.setData({ nightShow: false })
  },

  maybePostcard() {
    if (this.data.postcardShow || this.celebratingOrCards()) return
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const yd = todayStr(y)
    const rec = wx.getStorageSync(`rec_${yd}`)
    const collected = wx.getStorageSync('postcards') || []
    if (!rec || !rec.allDone || collected.indexOf(yd) >= 0) return
    // 收藏以「展示时算好的日期」为准，跨零点后才点收下也不会收错日子
    this._postcardDate = yd
    this.setData({
      postcardShow: true,
      postcardDateText: `${y.getMonth() + 1}月${y.getDate()}日`,
      postcardCount: collected.length
    })
    lightVibrate()
  },

  collectPostcard() {
    const list = wx.getStorageSync('postcards') || []
    const yd = this._postcardDate
    if (yd && list.indexOf(yd) < 0) {
      list.unshift(yd)
      try { wx.setStorageSync('postcards', list) } catch (err) {
        console.error('收藏明信片失败', err)
      }
    }
    this._postcardDate = ''
    this.setData({ postcardShow: false, postcardCount: list.length })
  },

  // 截屏被抓到：弹一张小卡片，2.6 秒自动收，也可点掉
  onCapture() {
    // 监听是 App 级的，用户在别的页面截屏也会进来；只有今日页正在前台时才接梗，别凭空震动
    const pages = getCurrentPages()
    const top = pages[pages.length - 1]
    if (!top || top.route !== 'pages/today/today') return
    if (this.celebratingOrCards()) return
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
