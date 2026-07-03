import { NextRequest, NextResponse } from 'next/server';
import { runAutoSeo, runKeywordResearch } from '@/lib/auto-seo';

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const isResearch = url.searchParams.get('research') === '1';

  if (isResearch) {
    const result = await runKeywordResearch();
    return NextResponse.json({
      success: result.success,
      message: result.message,
      topics: result.topics,
    });
  }



  return NextResponse.json({
    success: result.success,
    message: result.message,
    slug: result.slug,
    title: result.title,
  });
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}
