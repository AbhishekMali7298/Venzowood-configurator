import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const targetUrl = searchParams.get('url')

  if (!targetUrl || !targetUrl.startsWith('https://rest.vds-egger.com/')) {
    return new NextResponse('Invalid target URL', { status: 400 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // Send a realistic user agent to avoid bot blocking
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://www.vds-egger.com/',
      },
    })

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, { status: response.status })
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=3600')
    // Ensure CORS headers so the canvas/img can read it nicely
    headers.set('Access-Control-Allow-Origin', '*')

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Egger Proxy Error:', error)
    return new NextResponse('Internal Server Error fetching proxy image', { status: 500 })
  }
}
