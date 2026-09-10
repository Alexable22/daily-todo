// 把备忘录风格的整段计划文本解析成「按星期分组 + 带时间计划项」结构。
// 支持的行型：
//   周一、周三、周五        —— 星期分组标题
//   7.50-8.30 刷教综客观题  —— 时间段
//   10:00~11:00 看教综      —— 冒号/波浪号写法
//   14.00 起床              —— 单个时间点
//   早八到课上              —— 无时间，原样保留
// 手写计划常在下午改用 12 小时制（如 18.10 之后写 6.40），
// 解析时按「时间单调递增」修复：与上一条倒挂超过 2 小时则抬升 12 小时。

const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 }

const RANGE_RE = /^(\d{1,2})[.:：点时](\d{1,2})?分?\s*(?:[-–—~～]+|到|至)\s*(\d{1,2})[.:：点时](\d{1,2})?分?\s*(.*)$/
const SINGLE_RE = /^(\d{1,2})[.:：点时](\d{1,2})?分?\s*(.*)$/

function toMin(h, m) {
  const hour = Number(h)
  const minute = m == null ? 0 : Number(m)
  if (hour > 24 || minute > 59) return null
  return hour * 60 + minute
}

// 整行只由「周X」和分隔符构成才算分组标题
function matchWeekdayHeader(line) {
  const cleaned = line.replace(/[、，,\s·]/g, '')
  if (!/^周[一二三四五六日天](周[一二三四五六日天])*$/.test(cleaned)) return null
  const days = []
  const re = /周([一二三四五六日天])/g
  let m
  while ((m = re.exec(cleaned))) days.push(CN_NUM[m[1]])
  return [...new Set(days)].sort((a, b) => a - b)
}

function parseItemLine(line) {
  const range = RANGE_RE.exec(line)
  if (range) {
    const startMin = toMin(range[1], range[2])
    const endMin = toMin(range[3], range[4])
    const text = range[5].trim()
    if (startMin != null && endMin != null && text) return { startMin, endMin, text }
    return null
  }
  const single = SINGLE_RE.exec(line)
  if (single) {
    const startMin = toMin(single[1], single[2])
    const text = single[3].trim()
    if (startMin != null && text) return { startMin, endMin: null, text }
    return null
  }
  return { startMin: null, endMin: null, text: line }
}

// 按时间单调递增修复 12 小时制写法；结束时间倒挂则向后抬 12 小时（可跨午夜）
function fixMonotonic(items) {
  let prev = -1
  for (const it of items) {
    if (it.startMin == null) continue
    let lifts = 0
    while (prev >= 0 && it.startMin < prev - 120 && lifts < 2) {
      it.startMin += 720
      lifts++
    }
    if (it.endMin != null) {
      while (it.endMin <= it.startMin) it.endMin += 720
    }
    prev = it.startMin
  }
}

function parseSchedule(text) {
  const lines = String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  const sections = []
  let current = null
  for (const line of lines) {
    const weekdays = matchWeekdayHeader(line)
    if (weekdays) {
      current = { weekdays, items: [] }
      sections.push(current)
      continue
    }
    if (!current) {
      current = { weekdays: [], items: [] }
      sections.push(current)
    }
    const item = parseItemLine(line)
    if (item) current.items.push(item)
  }
  for (const s of sections) fixMonotonic(s.items)
  return sections.filter(s => s.items.length > 0)
}

module.exports = { parseSchedule }
