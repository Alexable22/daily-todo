const test = require('node:test')
const assert = require('node:assert')
const { fmtMin, hmToMin, weekdayOf, todayStr } = require('../miniprogram/utils/time')

test('fmtMin 格式化分钟数', () => {
  assert.strictEqual(fmtMin(470), '07:50')
  assert.strictEqual(fmtMin(1140), '19:00')
  assert.strictEqual(fmtMin(0), '00:00')
  assert.strictEqual(fmtMin(1500), '次日 01:00')
  assert.strictEqual(fmtMin(null), '')
})

test('hmToMin 解析 picker 返回值', () => {
  assert.strictEqual(hmToMin('07:50'), 470)
  assert.strictEqual(hmToMin('19:00'), 1140)
  assert.strictEqual(hmToMin('abc'), null)
})

test('weekdayOf 周一为 1 周日为 7', () => {
  assert.strictEqual(weekdayOf(new Date(2026, 8, 7)), 1)
  assert.strictEqual(weekdayOf(new Date(2026, 8, 10)), 4)
  assert.strictEqual(weekdayOf(new Date(2026, 8, 13)), 7)
})

test('todayStr 本地日期格式', () => {
  assert.strictEqual(todayStr(new Date(2026, 8, 10)), '2026-09-10')
})
