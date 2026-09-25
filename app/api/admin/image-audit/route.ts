import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/utils/auth'
import { auditImageDuplicates, auditOffTopicImages } from '@/lib/image-audit'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const [dups, off] = await Promise.all([auditImageDuplicates(), auditOffTopicImages()])
  return NextResponse.json({
    duplicates: dups,
    offTopic: off,
    summary: {
      dupGroups: dups.length,
      offTopicCount: off.length,
      message: dups.length ? `Phát hiện ${dups.length} nhóm trùng hình (1 ảnh dùng cho nhiều bài)` : 'Không có trùng',
    },
  })
}
