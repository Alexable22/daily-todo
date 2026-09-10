const test = require('node:test')
const assert = require('node:assert')
const { parseSchedule } = require('../miniprogram/utils/parser')

test('识别星期分组标题：周一、周三、周五、周六、周日', () => {
  const s = parseSchedule('周一、周三、周五、周六、周日\n9.00-11.00 学教综8页')
  assert.strictEqual(s.length, 1)
  assert.deepStrictEqual(s[0].weekdays, [1, 3, 5, 6, 7])
})

test('单独星期标题：周二', () => {
  const s = parseSchedule('周二\n7.50-8.30 刷教综客观题')
  assert.deepStrictEqual(s[0].weekdays, [2])
})

test('时间段行解析', () => {
  const s = parseSchedule('7.50-8.30 刷教综客观题')
  assert.deepStrictEqual(s[0].items[0], { startMin: 470, endMin: 510, text: '刷教综客观题' })
})

test('单个时间点行', () => {
  const s = parseSchedule('14.00 起床')
  assert.strictEqual(s[0].items[0].startMin, 840)
  assert.strictEqual(s[0].items[0].endMin, null)
})

test('冒号与波浪号分隔符', () => {
  const s = parseSchedule('10:00~11:00 看教综')
  assert.strictEqual(s[0].items[0].startMin, 600)
  assert.strictEqual(s[0].items[0].endMin, 660)
})

test('无时间行原样保留', () => {
  const s = parseSchedule('早八到课上\n其余时间均是休息')
  assert.strictEqual(s[0].items.length, 2)
  assert.strictEqual(s[0].items[0].startMin, null)
  assert.strictEqual(s[0].items[0].text, '早八到课上')
})

test('下午 12 小时制自动转正：18.10 之后的 6.40 视为 18.40', () => {
  const s = parseSchedule('18.10 去吃饭\n6.40-7.00 复习教综\n7.00-7.30 复习第一节\n9.30 之后回宿舍\n11.00 上床睡觉')
  const it = s[0].items
  assert.strictEqual(it[1].startMin, 18 * 60 + 40)
  assert.strictEqual(it[1].endMin, 19 * 60)
  assert.strictEqual(it[2].startMin, 19 * 60)
  assert.strictEqual(it[3].startMin, 21 * 60 + 30)
  assert.strictEqual(it[4].startMin, 23 * 60)
})

test('已写 24 小时制的下午时间不被误抬升', () => {
  const s = parseSchedule('6.40-7.00 复习教综\n19.30-19.50 背一段素材\n20.35-21.10 积累文言文')
  const it = s[0].items
  assert.strictEqual(it[1].startMin, 19 * 60 + 30)
  assert.strictEqual(it[2].startMin, 20 * 60 + 35)
})

test('结束时间倒挂自动向后抬：17.55-6.20 → 18.20', () => {
  const s = parseSchedule('17.15-17.55 积累文言文\n17.55-6.20 背诵文言文')
  assert.strictEqual(s[0].items[1].endMin, 18 * 60 + 20)
})

test('一行多个时间只取第一个，整行文本保留', () => {
  const s = parseSchedule('12.10 回去吃饭 1.00 睡午觉 1.50 起床')
  assert.strictEqual(s[0].items[0].startMin, 730)
  assert.match(s[0].items[0].text, /1\.00/)
})

test('空行跳过', () => {
  const s = parseSchedule('\n\n9.00-10.00 学习\n\n')
  assert.strictEqual(s[0].items.length, 1)
})

test('空输入返回空数组', () => {
  assert.deepStrictEqual(parseSchedule(''), [])
  assert.deepStrictEqual(parseSchedule(null), [])
})

test('完整周四课表还原', () => {
  const text = `周四
早八到课上
7.50-8.30 刷教综客观题
8.40-9.20刷教综客观题并订正
中途订正和上厕所休息
10.00-11.00看教综4-5页
11.10-12.50吃饭休息时间
13.00-14.00午休
14.00起床14.15前到图书馆
14.15-16.15看教综八页
16.40-18.10看学科课
18.10去吃饭
18.40前回图书馆
6.40-7.00复习前一天的教综
19.30-19.50背一段素材
19.50-20.35刷一道学科题并订正
20.35-21.10积累文言文知识
9.10回宿舍
11.00上床睡觉`
  const s = parseSchedule(text)
  assert.deepStrictEqual(s[0].weekdays, [4])
  const it = s[0].items
  assert.strictEqual(it.length, 18)
  assert.strictEqual(it[1].startMin, 470)
  assert.strictEqual(it[7].startMin, 840)
  assert.strictEqual(it[12].startMin, 18 * 60 + 40)
  assert.strictEqual(it[12].text, '复习前一天的教综')
  assert.strictEqual(it[16].startMin, 21 * 60 + 10)
  assert.strictEqual(it[17].startMin, 23 * 60)
})
