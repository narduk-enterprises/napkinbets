import { loadPoolData } from '#server/services/napkinbets/pools'
import { loadNapkinbetsGroup } from '#server/services/napkinbets/social'

export default defineEventHandler(async (event) => {
  const slug = String(event.context.params?.slug)
  const groupDetail = await loadNapkinbetsGroup(event, slug)

  // Pass includeContext: false for speed unless we want featured games on group pages
  const poolData = await loadPoolData(event, {
    groupId: groupDetail.group.id,
    includeContext: false,
  })

  return poolData
})
