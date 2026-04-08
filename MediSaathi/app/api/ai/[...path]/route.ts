import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

async function proxyToFastAPI(req: NextRequest) {
  const url = new URL(req.url)
  // Extract the path after /api/ai/ → forward to FastAPI as /api/...
  const pathSegments = url.pathname.replace('/api/ai/', '')
  const targetUrl = `${FASTAPI_URL}/api/${pathSegments}${url.search}`

  try {
    const headers: Record<string, string> = {
      'Content-Type': req.headers.get('content-type') || 'application/json',
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = await req.text()
    }

    const response = await fetch(targetUrl, fetchOptions)
    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('FastAPI proxy error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'AI service unavailable. Make sure the FastAPI backend is running.',
      },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  return proxyToFastAPI(req)
}

export async function POST(req: NextRequest) {
  return proxyToFastAPI(req)
}

export async function PUT(req: NextRequest) {
  return proxyToFastAPI(req)
}

export async function DELETE(req: NextRequest) {
  return proxyToFastAPI(req)
}
