"use client";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faArrowLeft, faCheck, faFileCsv, faMusic, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/app/contexts/AuthContext";
import { getUserPlaylists } from "@/app/helpers/spotifyApi";
import { fetchSpotifyPlaylistTracks } from "@/app/helpers/fetchSpotifyPlaylistTracks";
import { fetchYouTubePlaylistTracks, getUserYouTubePlaylists } from "@/app/helpers/fetchYouTubePlaylistTracks";
import { toast } from "react-toastify";

interface ExportPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Platform = "spotify" | "youtube" | null;
type Step = "source-platform" | "source-playlist" | "preview";

interface PlaylistOption {
    id: string;
    name: string;
    trackCount?: number;
}

interface FetchedTrack {
    id: string; // unique ID
    title: string;
    artist: string;
    album?: string;
    duration?: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
}

const MAX_TRACKS = 50;

export default function ExportPlaylistModal({ isOpen, onClose }: ExportPlaylistModalProps) {
    const { profile } = useAuth();

    // State
    const [step, setStep] = useState<Step>("source-platform");
    const [sourcePlatform, setSourcePlatform] = useState<Platform>(null);
    const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistOption | null>(null);

    // Preview State
    const [fetchedTracks, setFetchedTracks] = useState<FetchedTrack[]>([]);
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

    // Pagination State
    const [offset, setOffset] = useState(0); // For Spotify
    const [youtubePageToken, setYoutubePageToken] = useState<string | undefined>(undefined); // For YouTube
    const [hasMore, setHasMore] = useState(false);

    // Processing State
    const [isLoading, setIsLoading] = useState(false);

    const resetState = () => {
        setStep("source-platform");
        setSourcePlatform(null);
        setPlaylists([]);
        setSelectedPlaylist(null);
        setIsLoading(false);
        setFetchedTracks([]);
        setSelectedTrackIds(new Set());
        setOffset(0);
        setYoutubePageToken(undefined);
        setHasMore(false);
    };

    useEffect(() => {
        if (!isOpen) {
            resetState();
        }
    }, [isOpen]);

    // 1. Select Source Platform
    const handlePlatformSelect = async (platform: Platform) => {
        setSourcePlatform(platform);
        setStep("source-playlist");
        setIsLoading(true);

        try {
            if (platform === "spotify") {
                const { accessToken } = await import("@/app/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
                if (accessToken) {
                    const data = await getUserPlaylists(accessToken);
                    setPlaylists(data.map((pl: any) => ({
                        id: pl.id,
                        name: pl.name,
                        trackCount: pl.tracks?.total || 0
                    })));
                } else {
                    toast.warning("Spotify token alınamadı or expired.");
                }
            } else if (platform === "youtube") {
                const { accessToken } = await import("@/app/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
                if (accessToken) {
                    const data = await getUserYouTubePlaylists(accessToken);
                    setPlaylists(data.map((pl) => ({
                        id: pl.id,
                        name: pl.title,
                        itemCount: pl.itemCount
                    })));
                } else {
                    toast.error("YouTube oturumu zaman aşımına uğradı. Lütfen profilden tekrar bağlanın.");
                }
            }
        } catch (error) {
            console.error("Error fetching playlists:", error);
            const errorMsg = (error as any)?.error?.message || (error as any)?.message || "Playlistler yüklenemedi.";
            toast.error("Hata: " + errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Fetch Source Playlist Tracks (Initial)
    const handlePlaylistSelect = async (playlist: PlaylistOption) => {
        setSelectedPlaylist(playlist);

        setIsLoading(true);
        setStep("preview");
        setOffset(0);
        setYoutubePageToken(undefined);
        setFetchedTracks([]);

        try {
            let newTracks: any[] = [];

            // Initial Fetch (Offset 0 / No Token)
            if (sourcePlatform === "spotify") {
                const { accessToken } = await import("@/app/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
                if (accessToken) {
                    newTracks = await fetchSpotifyPlaylistTracks(playlist.id, accessToken, MAX_TRACKS, 0);
                    if (newTracks.length === MAX_TRACKS) {
                        setOffset(MAX_TRACKS);
                        setHasMore(true);
                    } else {
                        setHasMore(false);
                    }
                }
            } else if (sourcePlatform === "youtube") {
                const { accessToken } = await import("@/app/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
                if (accessToken) {
                    const result = await fetchYouTubePlaylistTracks(playlist.id, accessToken, MAX_TRACKS, undefined);
                    newTracks = result.tracks;
                    setYoutubePageToken(result.nextPageToken);
                    setHasMore(!!result.nextPageToken);
                }
            }

            const mappedTracks: FetchedTrack[] = newTracks.map((t, idx) => ({
                id: t.id || `track-${idx}`,
                title: t.title,
                artist: t.artist,
                album: t.album, // Optional if helper returns it
                duration: t.duration, // Optional if helper returns it
                spotifyUrl: t.spotifyUrl,
                youtubeUrl: t.youtubeUrl
            }));

            setFetchedTracks(mappedTracks);
            // Default select all
            setSelectedTrackIds(new Set(mappedTracks.map(t => t.id)));

        } catch (error) {
            console.error("Error fetching tracks:", error);
            toast.error("Şarkılar listelenemedi.");
            setStep("source-playlist");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (!selectedPlaylist || !sourcePlatform) return;
        setIsLoading(true);

        try {
            let newTracks: any[] = [];

            if (sourcePlatform === "spotify") {
                const { accessToken } = await import("@/app/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
                if (accessToken) {
                    newTracks = await fetchSpotifyPlaylistTracks(selectedPlaylist.id, accessToken, MAX_TRACKS, offset);
                    if (newTracks.length === MAX_TRACKS) {
                        setOffset(prev => prev + MAX_TRACKS);
                        setHasMore(true);
                    } else {
                        setHasMore(false);
                    }
                }
            } else if (sourcePlatform === "youtube") {
                const { accessToken } = await import("@/app/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
                if (accessToken) {
                    const result = await fetchYouTubePlaylistTracks(selectedPlaylist.id, accessToken, MAX_TRACKS, youtubePageToken);
                    newTracks = result.tracks;
                    setYoutubePageToken(result.nextPageToken);
                    setHasMore(!!result.nextPageToken);
                }
            }

            const mappedTracks: FetchedTrack[] = newTracks.map((t, idx) => ({
                id: t.id || `track-${Date.now()}-${idx}`,
                title: t.title,
                artist: t.artist,
                album: t.album,
                duration: t.duration,
                spotifyUrl: t.spotifyUrl,
                youtubeUrl: t.youtubeUrl
            }));

            setFetchedTracks(prev => [...prev, ...mappedTracks]);

            // Auto-select loaded tracks
            setSelectedTrackIds(prev => {
                const newSet = new Set(prev);
                mappedTracks.forEach(t => newSet.add(t.id));
                return newSet;
            });

        } catch (error) {
            console.error("Error loading more tracks:", error);
            toast.error("Daha fazla şarkı yüklenemedi.");
        } finally {
            setIsLoading(false);
        }
    };

    // Preview Checkbox Logic
    const toggleTrack = (id: string) => {
        const newSet = new Set(selectedTrackIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTrackIds(newSet);
    };

    const toggleAll = () => {
        if (selectedTrackIds.size === fetchedTracks.length) {
            setSelectedTrackIds(new Set());
        } else {
            setSelectedTrackIds(new Set(fetchedTracks.map(t => t.id)));
        }
    };

    // 4. Download CSV
    const handleDownload = () => {
        if (selectedTrackIds.size === 0) {
            toast.warn("Lütfen en az bir şarkı seçin.");
            return;
        }

        const tracksToExport = fetchedTracks.filter(t => selectedTrackIds.has(t.id));

        // CSV Header
        const headers = ["Title", "Artist", "Album", "Duration", "Platform URL"];

        // CSV Rows
        const rows = tracksToExport.map(t => {
            const title = `"${(t.title || "").replace(/"/g, '""')}"`;
            const artist = `"${(t.artist || "").replace(/"/g, '""')}"`;
            const album = `"${(t.album || "").replace(/"/g, '""')}"`; // Helper might not return album yet, but placeholder is fine
            const duration = `"${(t.duration || "")}"`;
            const url = `"${t.spotifyUrl || t.youtubeUrl || ""}"`;

            return [title, artist, album, duration, url].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");

        // Create Blob and Download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);

        const safeName = (selectedPlaylist?.name || "playlist").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `${safeName}_export.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`✅ ${tracksToExport.length} şarkı dışa aktarıldı!`);
        onClose();
    };

    const goBack = () => {
        if (step === "source-playlist") setStep("source-platform");
        if (step === "preview") setStep("source-playlist");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[#121212] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#181818]">
                    <div className="flex items-center gap-3">
                        {step !== "source-platform" && (
                            <button onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            Playlist Dışa Aktar (.csv)
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 dark-scrollbar">
                    {/* Step 1: Source Platform */}
                    {step === "source-platform" && (
                        <div className="grid grid-cols-2 gap-4">
                            {profile?.is_spotify_connected && (
                                <button onClick={() => handlePlatformSelect("spotify")} className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#1DB954]/5 border border-[#1DB954]/20 hover:bg-[#1DB954]/10 hover:border-[#1DB954]/50 transition-all duration-300">
                                    <FontAwesomeIcon icon={faSpotify} className="w-16 h-16 text-[#1DB954] drop-shadow-lg group-hover:scale-110 transition-transform" />
                                    <div className="font-bold text-lg text-white">Spotify Playlists</div>
                                </button>
                            )}
                            {profile?.is_youtube_connected && (
                                <button onClick={() => handlePlatformSelect("youtube")} className="group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#FF0000]/5 border border-[#FF0000]/20 hover:bg-[#FF0000]/10 hover:border-[#FF0000]/50 transition-all duration-300">
                                    <FontAwesomeIcon icon={faYoutube} className="w-16 h-16 text-[#FF0000] drop-shadow-lg group-hover:scale-110 transition-transform" />
                                    <div className="font-bold text-lg text-white">YouTube Playlists</div>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 2: Source Playlist */}
                    {step === "source-playlist" && (
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    loading...
                                </div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">Playlist bulunamadı.</div>
                            ) : (
                                playlists.map(pl => (
                                    <button key={pl.id} onClick={() => handlePlaylistSelect(pl)} className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between group transition-all">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center shrink-0">
                                                <FontAwesomeIcon icon={faMusic} className="text-gray-500" />
                                            </div>
                                            <span className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">{pl.name}</span>
                                        </div>
                                        <span className="text-xs font-mono text-gray-500 bg-black/20 px-2 py-1 rounded">{pl.trackCount} track</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Step 3: Preview (Track Selection) */}
                    {step === "preview" && (
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#121212] z-10 py-2">
                                <span className="text-sm text-gray-400">{selectedTrackIds.size} / {fetchedTracks.length} seçildi</span>
                                <button onClick={toggleAll} className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded hover:bg-indigo-500/10 transition-colors">
                                    {selectedTrackIds.size === fetchedTracks.length ? "Hepsini Kaldır" : "Hepsini Seç"}
                                </button>
                            </div>

                            <div className="space-y-1 mb-6 border border-white/10 rounded-xl bg-black/20 p-1">
                                {fetchedTracks.map((track, index) => (
                                    <div key={index} onClick={() => toggleTrack(track.id)} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 rounded-lg ${selectedTrackIds.has(track.id) ? 'bg-indigo-500/10' : ''}`}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedTrackIds.has(track.id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'}`}>
                                            {selectedTrackIds.has(track.id) && <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-medium truncate">{track.title}</div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className="truncate max-w-[150px]">{track.artist}</span>
                                                {track.duration && track.duration !== "-" && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                        <span>{track.duration}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {hasMore && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleLoadMore(); }}
                                        disabled={isLoading}
                                        className="w-full py-3 mt-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-dashed border-gray-700 hover:border-gray-500"
                                    >
                                        {isLoading ? "Yükleniyor..." : "Daha Fazla Yükle (+50)"}
                                    </button>
                                )}
                            </div>

                            <button onClick={handleDownload} className="w-full py-4 rounded-xl bg-white text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all sticky bottom-0 z-10 shadow-xl flex items-center justify-center gap-2">
                                <FontAwesomeIcon icon={faFileCsv} className="text-green-600" />
                                İndir ({selectedTrackIds.size} Şarkı)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .dark-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .dark-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .dark-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .dark-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
