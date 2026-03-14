import type { CurrentVideoInfo } from "../types";

/**
 * Extract the video ID from a YouTube URL.
 * Handles: /watch?v=ID, /shorts/ID, youtu.be/ID
 */
export function getVideoIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Standard watch URL: /watch?v=ID
    const vParam = urlObj.searchParams.get("v");
    if (vParam) return vParam;

    // Shorts URL: /shorts/ID
    const shortsMatch = urlObj.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    // youtu.be short links: youtu.be/ID
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1) || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Attempt to get the video title from the current YouTube page.
 * Tries multiple selectors in order of reliability.
 */
export function getVideoTitle(): string {
  // DOM h1 is most accurate and updates quickly on SPA nav
  const h1 =
    document.querySelector<HTMLElement>(
      "h1.ytd-watch-metadata yt-formatted-string",
    ) ||
    document.querySelector<HTMLElement>("#above-the-fold #title h1") ||
    document.querySelector<HTMLElement>(
      "ytd-watch-metadata h1 yt-formatted-string",
    );

  if (h1?.textContent?.trim()) {
    return h1.textContent.trim();
  }

  // OG tag as fallback (sometimes lags behind on SPA nav)
  const og = document.querySelector<HTMLMetaElement>(
    'meta[property="og:title"]',
  );
  if (og?.content)
    return og.content.replace(/\s*[-|]\s*YouTube\s*$/, "").trim();

  // document.title as last resort
  return document.title.replace(/\s*[-|]\s*YouTube\s*$/, "").trim();
}

/** Clean up the " - YouTube" suffix from titles */
function cleanTitle(title: string): string {
  return title.replace(/\s*[-|]\s*YouTube\s*$/, "").trim();
}

/**
 * Get the best thumbnail URL for a video.
 * YouTube provides several resolutions; maxresdefault is best.
 */
export function getThumbnailUrl(videoId: string): string {
  // maxresdefault may 404 for older/unlisted videos
  // hqdefault is always available (480x360)
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Capture complete info about the currently playing YouTube video.
 * Returns null if not on a video page.
 */
export function getCurrentVideoInfo(): CurrentVideoInfo | null {
  const videoId = getVideoIdFromUrl(window.location.href);
  if (!videoId) return null;

  const title = getVideoTitle();
  const thumbnail = getThumbnailUrl(videoId);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  return { videoId, title, thumbnail, url };
}

/** Check if the current page is a YouTube video watch page */
export function isVideoPage(): boolean {
  return (
    window.location.hostname === "www.youtube.com" &&
    (window.location.pathname === "/watch" ||
      window.location.pathname.startsWith("/shorts/"))
  );
}
