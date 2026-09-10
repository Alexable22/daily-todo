// 客户端数据库没有「有则改、无则增」的接口，这里先 update，影响 0 条时再 add
async function upsertDoc(collection, id, data) {
  const db = wx.cloud.database()
  const res = await db.collection(collection).doc(id).update({ data })
  if (res.stats.updated === 0) {
    await db.collection(collection).add({ _id: id, data })
  }
}

module.exports = { upsertDoc }
