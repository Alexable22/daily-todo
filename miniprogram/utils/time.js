const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function pad(n) {
  return String(n).padStart(2, '0')
}

// 本地日期 → 'YYYY-MM-DD'
function todayStr(d) {
  d = d || new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 周一为 1，周日为 7
function weekdayOf(d) {
  d = d || new Date()
  return (d.getDay() + 6) % 7 + 1
}

function nowMinutes(d) {
  d = d || new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// 分钟数 → 'HH:MM'；超过 24 小时（跨午夜）显示为「次日 HH:MM」
function fmtMin(min) {
  if (min == null) return ''
  if (min >= 24 * 60) return `次日 ${pad(Math.floor(min / 60) - 24)}:${pad(min % 60)}`
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

// 'HH:MM'（picker 返回值）→ 分钟数
function hmToMin(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

module.exports = { WEEKDAYS, todayStr, weekdayOf, nowMinutes, fmtMin, hmToMin }
