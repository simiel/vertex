export function getYouTubeVideoId(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null
    if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || null
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null
    }
  } catch { return null }
  return null
}
