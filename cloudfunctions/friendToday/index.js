const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数部署在腾讯云，默认时区按 UTC 处理，这里手动转东八区取「今天」
function cnNow() {
  return new Date(Date.now() + 8 * 3600 * 1000)
}

function todayStr() {
  const d = cnNow()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function weekdayOf() {
  return (cnNow().getUTCDay() + 6) % 7 + 1
}

// 只返回「调用者自己绑定过」的朋友进度，binds 记录即授权凭据
exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const binds = await db.collection('binds').where({ _openid: OPENID }).limit(50).get()
  const date = todayStr()
  const wd = weekdayOf()
  const list = []
  for (const b of binds.data) {
    const [tplRes, recRes] = await Promise.all([
      db.collection('templates').where({ _openid: b.friendOpenid, weekday: wd }).limit(1).get(),
      db.collection('records').where({ _openid: b.friendOpenid, date }).limit(1).get()
    ])
    const tpl = tplRes.data[0]
    const rec = recRes.data[0]
    const checks = (rec && rec.checks) || {}
    const items = ((tpl && tpl.items) || []).map(it => ({
      text: it.text,
      startMin: it.startMin,
      endMin: it.endMin,
      done: !!checks[it.id]
    }))
    list.push({
      friendOpenid: b.friendOpenid,
      nickname: b.nickname || '好朋友',
      total: items.length,
      doneCount: items.filter(i => i.done).length,
      allDone: items.length > 0 && items.every(i => i.done),
      items
    })
  }
  return { list, date }
}
