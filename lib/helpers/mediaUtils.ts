export function extractYoutubeId(url: string | undefined | null): string | null {
    if (!url) return null;

    // Standard full URL: https://www.youtube.com/watch?v=VIDEO_ID
    // Short URL: https://youtu.be/VIDEO_ID
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
}

export function extractSpotifyId(url: string | undefined | null): string | null {
    if (!url) return null;

    // https://open.spotify.com/track/TRACK_ID
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}
