const test = require('node:test')
const assert = require('node:assert')
const { serializeBackup, parseBackup, applyBackup } = require('../miniprogram/utils/backup')

function sampleStorage() {
  return {
    tpl_1: { weekday: 1, items: [{ id: 'a', startMin: 480, endMin: 510, text: '背教综' }] },
    tpl_7: { weekday: 7, items: [] },
    'rec_2026-09-01': { date: '2026-09-01', checks: { a: true }, doneCount: 1, total: 1, allDone: true },
    'celebrated_2026-09-01': true,
    lastBubbleAt: 12345,
    other_junk: 'x',
    tpl_broken: { noItems: true }
  }
}

test('serializeBackup 只收集白名单键并生成可解析 JSON', () => {
  const store = sampleStorage()
  const res = serializeBackup(k => store[k], Object.keys(store), '2026-09-14')
  assert.strictEqual(res.count, 5)
  const parsed = JSON.parse(res.text)
  assert.strictEqual(parsed.v, 1)
  assert.strictEqual(parsed.exportedAt, '2026-09-14')
  assert.deepStrictEqual(Object.keys(parsed.data).sort(),
    ['celebrated_2026-09-01', 'lastBubbleAt', 'rec_2026-09-01', 'tpl_1', 'tpl_7'])
})

test('serializeBackup 跳过值为空串（getStorageSync 的不存在返回值）', () => {
  const res = serializeBackup(k => (k === 'tpl_1' ? { items: [] } : ''), ['tpl_1', 'tpl_2'], '2026-09-14')
  assert.strictEqual(res.count, 1)
})

test('parseBackup 往返一致', () => {
  const store = sampleStorage()
  const res = serializeBackup(k => store[k], Object.keys(store), '2026-09-14')
  const back = parseBackup(res.text)
  assert.strictEqual(back.ok, true)
  assert.deepStrictEqual(back.data, {
    tpl_1: store.tpl_1,
    tpl_7: store.tpl_7,
    'rec_2026-09-01': store['rec_2026-09-01'],
    'celebrated_2026-09-01': true,
    lastBubbleAt: 12345
  })
})

test('parseBackup 拒绝非 JSON 文本', () => {
  const res = parseBackup('周一 8:00 背书')
  assert.strictEqual(res.ok, false)
  assert.ok(res.error)
})

test('parseBackup 拒绝版本号不符（即使数据本身有效）', () => {
  const res = parseBackup(JSON.stringify({ v: 2, data: { tpl_1: { items: [] } } }))
  assert.strictEqual(res.ok, false)
})

test('parseBackup 拒绝空数据与数组 data', () => {
  assert.strictEqual(parseBackup(JSON.stringify({ v: 1, data: {} })).ok, false)
  assert.strictEqual(parseBackup(JSON.stringify({ v: 1, data: [] })).ok, false)
})

test('parseBackup 丢弃白名单外和结构不对的键', () => {
  const malicious = {
    v: 1,
    data: {
      tpl_1: { items: [] },
      tpl_abc: { items: [] },
      evil_key: 'hack',
      tpl_3: { noItems: 1 },
      'rec_2026-09-01': { date: '2026-09-01', checks: {} },
      lastBubbleAt: 'not-a-number',
      'celebrated_2026-09-02': true
    }
  }
  const res = parseBackup(JSON.stringify(malicious))
  assert.strictEqual(res.ok, true)
  assert.deepStrictEqual(Object.keys(res.data).sort(), ['celebrated_2026-09-02', 'rec_2026-09-01', 'tpl_1'])
  assert.strictEqual(res.dropped, 4)
})

test('applyBackup 逐键写入并返回数量', () => {
  const written = {}
  const n = applyBackup((k, v) => { written[k] = v }, { tpl_1: { items: [] }, lastBubbleAt: 1 })
  assert.strictEqual(n, 2)
  assert.deepStrictEqual(written, { tpl_1: { items: [] }, lastBubbleAt: 1 })
})
