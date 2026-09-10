// 粗略的 WXML 结构校验：标签配对 + 自闭合检查。小程序没有官方编译器之外的静态检查，这里兜底最基本的不闭合错误
const fs = require('fs')
const path = require('path')

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) yield* walk(p)
    else if (name.endsWith('.wxml')) yield p
  }
}

let failed = 0
for (const file of walk(path.join(__dirname, '..', 'miniprogram'))) {
  const src = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const stack = []
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g
  let m
  let ok = true
  while ((m = re.exec(src))) {
    const [, closing, tag, , selfClose] = m
    if (closing) {
      const top = stack.pop()
      if (top !== tag) {
        console.error(`${file}: 闭合标签 </${tag}> 与栈顶 <${top || '空'}> 不匹配`)
        ok = false
        break
      }
    } else if (!selfClose) {
      stack.push(tag)
    }
  }
  if (ok && stack.length) {
    console.error(`${file}: 存在未闭合标签 <${stack.join('>, <')}>`)
    ok = false
  }
  if (ok) console.log(`OK ${path.relative(process.cwd(), file)}`)
  else failed = 1
}
process.exit(failed)
