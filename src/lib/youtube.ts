export function parseYouTubeId(input: string): string | null {
  const url = input.trim()
  const m =
    url.match(/(?:youtu\.be\/)([\w-]{11})/) ||
    url.match(/[?&]v=([\w-]{11})/) ||
    url.match(/youtube\.com\/(?:embed|shorts|live|v)\/([\w-]{11})/)
  return m ? m[1] : null
}

export const thumbFor = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

export async function fetchOEmbed(url: string): Promise<{ title: string; thumbnail_url: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const j = (await res.json()) as { title?: string; thumbnail_url?: string }
    return { title: j.title ?? '', thumbnail_url: j.thumbnail_url ?? '' }
  } catch {
    return null
  }
}
