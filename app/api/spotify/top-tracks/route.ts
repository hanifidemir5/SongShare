import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.json(
            { error: 'Missing Spotify credentials' },
            { status: 500 }
        );
    }

    try {
        // 1. Get access token using Client Credentials flow
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: 'grant_type=client_credentials',
        });

        if (!tokenResponse.ok) {
            const tokenError = await tokenResponse.json();
            return NextResponse.json({ error: 'Token failed', details: tokenError }, { status: 500 });
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;

        // 2. Fetch Turkey Top 20 (using search with Turkish market)
        const turkeyResponse = await fetch(
            'https://api.spotify.com/v1/search?q=genre:pop%20year:2024&type=track&limit=20&market=TR',
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        // 3. Fetch Global Top 20 (using search with US market for international hits)
        const globalResponse = await fetch(
            'https://api.spotify.com/v1/search?q=genre:pop%20year:2024&type=track&limit=20&market=US',
            {
                headers: { Authorization: `Bearer ${access_token}` },
            }
        );

        let turkeyTracks: any[] = [];
        let globalTracks: any[] = [];

        if (turkeyResponse.ok) {
            const turkeyData = await turkeyResponse.json();
            turkeyTracks = turkeyData.tracks.items
                .filter((track: any) => track)
                .map((track: any, index: number) => ({
                    id: `turkey-${track.id}-${index}`,
                    title: track.name,
                    artist: track.artists.map((a: any) => a.name).join(', '),
                    spotifyUrl: track.external_urls.spotify,
                    albumArt: track.album?.images[0]?.url,
                    rank: index + 1,
                }));
        }

        if (globalResponse.ok) {
            const globalData = await globalResponse.json();
            globalTracks = globalData.tracks.items
                .filter((track: any) => track)
                .map((track: any, index: number) => ({
                    id: `global-${track.id}-${index}`,
                    title: track.name,
                    artist: track.artists.map((a: any) => a.name).join(', '),
                    spotifyUrl: track.external_urls.spotify,
                    albumArt: track.album?.images[0]?.url,
                    rank: index + 1,
                }));
        }

        return NextResponse.json({
            turkeyTracks,
            globalTracks
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed', message: String(error) }, { status: 500 });
    }
}
