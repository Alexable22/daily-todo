Component({
  options: { styleIsolation: 'isolated' },
  properties: {
    size: { type: Number, value: 160 },
    mood: { type: String, value: 'happy' },
    animate: { type: Boolean, value: false },
    // 外部每戳一次就 +1，变化即触发一次挤压动画
    pokeSeed: { type: Number, value: 0 }
  },
  data: { poking: false },
  observers: {
    pokeSeed(seed) {
      if (!seed) return
      if (this._pokeTimer) clearTimeout(this._pokeTimer)
      // 连戳时先摘掉 class 再挂回，CSS 动画才会重新播放
      this.setData({ poking: false }, () => {
        this.setData({ poking: true })
        this._pokeTimer = setTimeout(() => this.setData({ poking: false }), 500)
      })
    }
  },
  lifetimes: {
    detached() {
      if (this._pokeTimer) clearTimeout(this._pokeTimer)
    }
  }
})
