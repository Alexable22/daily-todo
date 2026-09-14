// 备份的序列化/校验/恢复：纯函数，wx 存储调用由页面层完成
// 白名单外的键一律不导出不恢复，防止备份文本被塞进来历不明的数据
const KEY_RE = /^(tpl_[1-7]|rec_\d{4}-\d{2}-\d{2}|celebrated_\d{4}-\d{2}-\d{2}|lastBubbleAt)$/

function validEntry(key, val) {
  if (key === 'lastBubbleAt') return typeof val === 'number'
  if (key.indexOf('tpl_') === 0) return !!val && Array.isArray(val.items)
  if (key.indexOf('rec_') === 0) {
    return !!val && typeof val === 'object' && val.checks && typeof val.checks === 'object' && typeof val.date === 'string'
  }
  return true
}

function collectKeys(keys) {
  return keys.filter(k => KEY_RE.test(k))
}

function serializeBackup(getter, keys, dateStr) {
  const data = {}
  for (const k of collectKeys(keys)) {
    const v = getter(k)
    // getStorageSync 对不存在的键返回 ''，视为无数据跳过
    if (v !== '' && v != null) data[k] = v
  }
  return { text: JSON.stringify({ v: 1, exportedAt: dateStr, data }), count: Object.keys(data).length }
}

function parseBackup(text) {
  let obj
  try {
    obj = JSON.parse(text)
  } catch (err) {
    return { ok: false, error: '这不是有效的备份文本' }
  }
  if (!obj || obj.v !== 1 || !obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { ok: false, error: '备份格式不对' }
  }
  const data = {}
  let dropped = 0
  for (const k of Object.keys(obj.data)) {
    if (KEY_RE.test(k) && validEntry(k, obj.data[k])) data[k] = obj.data[k]
    else dropped++
  }
  if (dropped) console.warn('恢复备份时丢弃了不认识的键', dropped)
  const n = Object.keys(data).length
  if (!n) return { ok: false, error: '备份里没有可恢复的数据' }
  if (n > 5000) return { ok: false, error: '备份数量异常，已停止恢复' }
  return { ok: true, data, dropped }
}

function applyBackup(setter, data) {
  let n = 0
  for (const k of Object.keys(data)) {
    setter(k, data[k])
    n++
  }
  return n
}

module.exports = { serializeBackup, parseBackup, applyBackup, collectKeys }
