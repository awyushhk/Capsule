export async function getYouTubeMetadata(videoId: string) {
  const url = `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return {
      title: data.title as string,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return {
      title: 'Unknown Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

export function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    const v = url.searchParams.get('v');
    if (v) return v;
    const shorts = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shorts) return shorts[1];
    if (url.hostname === 'youtu.be') return url.pathname.slice(1);
  } catch {
    // maybe just an ID was passed
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  }
  return null;
}