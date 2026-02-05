"use client";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faArrowLeft, faExchangeAlt, faCheck, faExclamationTriangle, faListCheck, faMusic } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPlaylists } from "@/lib/helpers/spotifyApi";
import { fetchSpotifyPlaylistTracks } from "@/lib/helpers/fetchSpotifyPlaylistTracks";
import { fetchYouTubePlaylistTracks, getUserYouTubePlaylists } from "@/lib/helpers/fetchYouTubePlaylistTracks";
import { createSpotifyPlaylist } from "@/lib/helpers/createSpotifyPlaylist";
import { createYouTubePlaylist } from "@/lib/helpers/createYouTubePlaylist";
import { addToSpotifyPlaylist } from "@/lib/helpers/addToSpotifyPlaylist";
import { addToYouTubePlaylist } from "@/lib/helpers/addToYoutubePlaylist";
import { toast } from "react-toastify";
import { Song } from "@/types";
import PlatformSelector from "../PlatformSelector";

interface MovePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Platform = "spotify" | "youtube" | null;
type Step = "source-platform" | "source-playlist" | "preview" | "target-config" | "processing" | "results";

interface PlaylistOption {
    id: string;
    name: string;
    trackCount?: number;
}

interface FetchedTrack {
    id: string; // unique ID
    title: string;
    artist: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
}

interface MigrationResult {
    track: FetchedTrack;
    status: "success" | "error";
    message?: string;
}

const MAX_TRACKS = 50;

export default function MovePlaylistModal({ isOpen, onClose }: MovePlaylistModalProps) {
    const { profile, user } = useAuth();

    // State
    const [step, setStep] = useState<Step>("source-platform");
    const [sourcePlatform, setSourcePlatform] = useState<Platform>(null);
    const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistOption | null>(null);
    const [newPlaylistName, setNewPlaylistName] = useState("");

    // Preview State
    const [fetchedTracks, setFetchedTracks] = useState<FetchedTrack[]>([]);
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

    // Pagination State
    const [offset, setOffset] = useState(0); // For Spotify
    const [youtubePageToken, setYoutubePageToken] = useState<string | undefined>(undefined); // For YouTube
    const [hasMore, setHasMore] = useState(false);

    // Processing State
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [log, setLog] = useState<string[]>([]);
    const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);

    const resetState = () => {
        setStep("source-platform");
        setSourcePlatform(null);
        setPlaylists([]);
        setSelectedPlaylist(null);
        setNewPlaylistName("");
        setIsLoading(false);
        setProgress(0);
        setStatusMessage("");
        setLog([]);
        setFetchedTracks([]);
        setSelectedTrackIds(new Set());
        setMigrationResults([]);
        setOffset(0);
        setYoutubePageToken(undefined);
        setHasMore(false);
    };

    useEffect(() => {
        if (!isOpen) {
            resetState();
        }
    }, [isOpen]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    // 1. Select Source Platform
    const handlePlatformSelect = async (platform: Platform) => {
        setSourcePlatform(platform);
        setStep("source-playlist");
        setIsLoading(true);

        try {
            if (platform === "spotify") {
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
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
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
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

    // Helper to fetch tracks (Initial or Load More)
    const fetchTracks = async (isLoadMore: boolean = false) => {
        if (!selectedPlaylist || !sourcePlatform) return;

        setIsLoading(true);
        if (!isLoadMore) {
            setStep("preview");
            setFetchedTracks([]);
            setOffset(0);
            setYoutubePageToken(undefined);
        }

        try {
            let newTracks: any[] = [];
            let nextToken: string | undefined = undefined;
            const currentOffset = isLoadMore ? offset : 0;
            const currentPageToken = isLoadMore ? youtubePageToken : undefined;

            if (sourcePlatform === "spotify") {
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
                if (accessToken) {
                    newTracks = await fetchSpotifyPlaylistTracks(selectedPlaylist.id, accessToken, MAX_TRACKS, currentOffset);
                    if (newTracks.length === MAX_TRACKS) {
                        setOffset(currentOffset + MAX_TRACKS);
                        setHasMore(true);
                    } else {
                        setHasMore(false);
                    }
                }
            } else if (sourcePlatform === "youtube") {
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
                if (accessToken) {
                    const result = await fetchYouTubePlaylistTracks(selectedPlaylist.id, accessToken, MAX_TRACKS, currentPageToken);
                    newTracks = result.tracks;
                    setYoutubePageToken(result.nextPageToken);
                    setHasMore(!!result.nextPageToken);
                }
            }

            const mappedTracks: FetchedTrack[] = newTracks.map((t, idx) => ({
                id: t.id || `track-${Date.now()}-${idx}`,
                title: t.title,
                artist: t.artist,
                spotifyUrl: t.spotifyUrl,
                youtubeUrl: t.youtubeUrl
            }));

            setFetchedTracks(prev => isLoadMore ? [...prev, ...mappedTracks] : mappedTracks);

            // Auto-select new tracks if "Select All" was effectively active? No, safer to not auto-select loaded tracks to avoid confusion.
            // But for initial load, maybe select all?
            if (!isLoadMore) {
                setSelectedTrackIds(new Set(mappedTracks.map(t => t.id)));
            }

        } catch (error) {
            console.error("Error fetching tracks:", error);
            toast.error("Şarkılar listelenemedi.");
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Fetch Source Playlist Tracks (Initial)
    const handlePlaylistSelect = async (playlist: PlaylistOption) => {
        setSelectedPlaylist(playlist);
        setNewPlaylistName(playlist.name);
        // We set state here, but fetchTracks uses state. React state updates are async.
        // So we pass params or use useEffect. 
        // Better to direct call logic here or ensure state is updated.
        // Since we are setting selectedPlaylist now, we can passes it to fetch logic if we refactor,
        // or just inline the initial call here to avoid race conditions.

        // Let's call a modified version that accepts the playlist to be sure.
        // Actually, 'fetchTracks' relies on 'selectedPlaylist' state which might not be updated yet.
        // I'll update 'fetchTracks' to accept explicit playlist/platform to be safe, or just duplicate logic slightly for initial call.
        // Refactoring 'fetchTracks' to handle arguments is cleaner.

        // Actually, let's keep it simple: 
        // Initial load logic here. 'Load More' logic separate. They share the core fetch.

        // Wait, I can't easily reuse 'fetchTracks' if it uses state that I just set.
        // I will implement the logic inside handlePlaylistSelect for initial load, 
        // and 'handleLoadMore' for subsequent.

        setIsLoading(true);
        setStep("preview");
        setOffset(0);
        setYoutubePageToken(undefined);
        setFetchedTracks([]);

        try {
            let newTracks: any[] = [];

            // Initial Fetch (Offset 0 / No Token)
            if (sourcePlatform === "spotify") {
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
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
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
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
                spotifyUrl: t.spotifyUrl,
                youtubeUrl: t.youtubeUrl
            }));

            setFetchedTracks(mappedTracks);
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
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
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
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
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
                spotifyUrl: t.spotifyUrl,
                youtubeUrl: t.youtubeUrl
            }));

            setFetchedTracks(prev => [...prev, ...mappedTracks]);
            // Do NOT auto-select loaded tracks, user might have unchecked some. 
            // Or maybe they want to? Let's assume they want to select them if they clicked/scrolled? 
            // Usually "Load More" appends unselected or auto-selected. 
            // Let's auto-select them for convenience since the default is "Select All".
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

    // 3. Confirm Selection -> Name Config
    const confirmPreview = () => {
        if (selectedTrackIds.size === 0) {
            toast.warn("Lütfen en az bir şarkı seçin.");
            return;
        }
        setStep("target-config");
    };

    // 4. Start Migration (Execute)
    // ... existing handleMigrate ...


    // 4. Start Migration (Execute)
    const handleMigrate = async () => {
        if (!user || !selectedPlaylist || !sourcePlatform) return;

        const targetPlatform = sourcePlatform === "spotify" ? "youtube" : "spotify";
        const tracksToMigrate = fetchedTracks.filter(t => selectedTrackIds.has(t.id));

        setIsLoading(true);
        setStep("processing");
        setProgress(0);
        setStatusMessage("Hedef playlist oluşturuluyor...");
        setMigrationResults([]); // Reset results
        addLog(`Başlatılıyor: ${sourcePlatform} -> ${targetPlatform} (${tracksToMigrate.length} şarkı)`);

        try {
            // A. Create Target Playlist
            let targetPlaylistId: string | null = null;
            let targetToken: string | null = null;

            if (targetPlatform === "spotify") {
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
                targetToken = accessToken;
                if (accessToken) {
                    const pl = await createSpotifyPlaylist(accessToken, newPlaylistName);
                    targetPlaylistId = pl?.id || null;
                }
            } else {
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getYouTubeTokens());
                targetToken = accessToken;
                if (accessToken) {
                    const pl = await createYouTubePlaylist(accessToken, newPlaylistName);
                    targetPlaylistId = pl?.id || null;
                }
            }

            if (!targetPlaylistId || !targetToken) {
                throw new Error("Hedef playlist oluşturulamadı.");
            }

            addLog(`Playlist oluşturuldu: ${newPlaylistName}`);
            setProgress(10);

            // B. Process Tracks Loop
            const total = tracksToMigrate.length;
            const results: MigrationResult[] = [];

            // Fresh Spotify Token for conversions
            let conversionSpotifyToken: string | null = null;
            if (profile?.is_spotify_connected) {
                const { accessToken } = await import("@/lib/helpers/getSpotifyToken").then(m => m.getSpotifyTokens());
                conversionSpotifyToken = accessToken;
            }

            for (let i = 0; i < total; i++) {
                const track = tracksToMigrate[i];
                setStatusMessage(`İşleniyor (${i + 1}/${total}): ${track.title}`);

                const songObj: Song = {
                    id: "temp",
                    title: track.title,
                    artist: track.artist,
                    spotifyUrl: track.spotifyUrl || "",
                    youtubeUrl: track.youtubeUrl || "",
                    addedBy: user.id,
                    playlist_id: "temp"
                };

                try {
                    let success = false;
                    let message = "";

                    if (targetPlatform === "spotify") {
                        // YouTube -> Spotify
                        const query = `${track.artist} ${track.title}`;
                        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
                            headers: { Authorization: `Bearer ${targetToken}` }
                        });
                        const searchData = await searchRes.json();
                        const spotifyTrack = searchData.tracks?.items?.[0];

                        if (spotifyTrack) {
                            songObj.spotifyUrl = spotifyTrack.external_urls.spotify;
                            // Silent call
                            const result = await addToSpotifyPlaylist(targetToken, songObj, targetPlaylistId, true);
                            success = result.success;
                            if (!success) message = result.message || "Ekleme başarısız";
                        } else {
                            message = "Spotify'da bulunamadı";
                            success = false;
                        }
                    } else {
                        // Spotify -> YouTube
                        // Silent call
                        const result = await addToYouTubePlaylist(targetToken, songObj, targetPlaylistId, conversionSpotifyToken, true);
                        success = result.success;
                        if (!success) message = result.message || "Ekleme başarısız";
                    }

                    if (success) {
                        results.push({ track, status: "success" });
                        addLog(`✅ Eklendi: ${track.title}`);
                    } else {
                        results.push({ track, status: "error", message: message || "Hata" });
                        addLog(`❌ Hata: ${track.title} - ${message}`);
                    }
                } catch (err: any) {
                    const msg = err.message || "Bilinmeyen hata";
                    results.push({ track, status: "error", message: msg });
                    addLog(`❌ Hata: ${track.title} - ${msg}`);
                }

                setProgress(10 + Math.round(((i + 1) / total) * 90));
            }

            setMigrationResults(results);
            setStatusMessage("Tamamlandı!");
            setStep("results"); // Move to results step

        } catch (error) {
            console.error("Migration failed:", error);
            setStatusMessage("Hata oluştu.");
            const errorMsg = (error as any)?.error?.message || (error as any)?.message || "İşlem sırasında bir hata oluştu.";
            toast.error("Kritik Hata: " + errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        if (step === "source-playlist") setStep("source-platform");
        if (step === "preview") setStep("source-playlist");
        if (step === "target-config") setStep("preview");
        if (step === "results") onClose(); // Close on back from results
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[#121212] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#181818]">
                    <div className="flex items-center gap-3">
                        {step !== "source-platform" && step !== "processing" && step !== "results" && (
                            <button onClick={goBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {step === "results" ? "Transfer Özeti" : "Playlist Taşı"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 dark-scrollbar">
                    {/* Step 1: Source Platform */}
                    {step === "source-platform" && (
                        <div className="p-2">
                            <PlatformSelector
                                onSelect={(platform) => handlePlatformSelect(platform)}
                                showSpotify={!!profile?.is_spotify_connected}
                                showYoutube={!!profile?.is_youtube_connected}
                            />
                        </div>
                    )}

                    {/* Step 2: Source Playlist */}
                    {step === "source-playlist" && (
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-3"></div>
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
                                            <span className="font-medium text-white truncate group-hover:text-[#1DB954] transition-colors">{pl.name}</span>
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
                                <button onClick={toggleAll} className="text-xs font-bold uppercase tracking-wider text-[#1DB954] hover:text-[#1ed760] px-3 py-1 rounded hover:bg-[#1DB954]/10 transition-colors">
                                    {selectedTrackIds.size === fetchedTracks.length ? "Hepsini Kaldır" : "Hepsini Seç"}
                                </button>
                            </div>

                            <div className="space-y-1 mb-6 border border-white/10 rounded-xl bg-black/20 p-1">
                                {fetchedTracks.map((track, index) => (
                                    <div key={index} onClick={() => toggleTrack(track.id)} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 rounded-lg ${selectedTrackIds.has(track.id) ? 'bg-[#1DB954]/5' : ''}`}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedTrackIds.has(track.id) ? 'bg-[#1DB954] border-[#1DB954]' : 'border-gray-600'}`}>
                                            {selectedTrackIds.has(track.id) && <FontAwesomeIcon icon={faCheck} className="text-black text-xs" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-medium truncate">{track.title}</div>
                                            <div className="text-xs text-gray-400 truncate">{track.artist}</div>
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

                            <button onClick={confirmPreview} className="w-full py-4 rounded-xl bg-white text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all sticky bottom-0 z-10 shadow-xl">
                                Devam Et ({selectedTrackIds.size})
                            </button>
                        </div>
                    )}

                    {/* Step 4: Target Config */}
                    {step === "target-config" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 mx-auto ${sourcePlatform === "spotify" ? "bg-[#1DB954]/20 text-[#1DB954]" : "bg-[#FF0000]/20 text-[#FF0000]"}`}>
                                        <FontAwesomeIcon icon={sourcePlatform === "spotify" ? faSpotify : faYoutube} className="w-8 h-8" />
                                    </div>
                                    <div className="text-sm font-medium text-white">Kaynak</div>
                                </div>
                                <FontAwesomeIcon icon={faExchangeAlt} className="text-gray-500 w-5 h-5" />
                                <div className="text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 mx-auto ${sourcePlatform === "spotify" ? "bg-[#FF0000]/20 text-[#FF0000]" : "bg-[#1DB954]/20 text-[#1DB954]"}`}>
                                        <FontAwesomeIcon icon={sourcePlatform === "spotify" ? faYoutube : faSpotify} className="w-8 h-8" />
                                    </div>
                                    <div className="text-sm font-medium text-white">Hedef</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">YENİ PLAYLIST ADI</label>
                                <input
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    className="w-full bg-[#2a2a2a] border border-transparent focus:border-[#1DB954] focus:bg-[#333] rounded-lg px-4 py-3 text-white outline-none transition-all placeholder-gray-500 font-medium"
                                    placeholder="Playlist Adı"
                                />
                            </div>

                            <button
                                onClick={handleMigrate}
                                disabled={!newPlaylistName.trim()}
                                className="w-full py-4 rounded-xl bg-[#1DB954] text-black font-bold hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#1DB954]/20"
                            >
                                Taşıma İşlemini Başlat
                            </button>
                        </div>
                    )}

                    {/* Step 5: Processing */}
                    {step === "processing" && (
                        <div className="flex flex-col items-center justify-center h-full py-8 space-y-6">
                            <div className="w-16 h-16 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>

                            <div className="w-full text-center">
                                <h3 className="text-xl font-bold text-white mb-2">Taşınıyor...</h3>
                                <p className="text-gray-400 mb-6">{statusMessage}</p>

                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto mb-2">
                                    <div className="h-full bg-[#1DB954] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">%{progress}</div>
                            </div>

                            <div className="w-full bg-black/40 rounded-lg p-3 h-32 overflow-y-auto text-xs font-mono text-gray-500 border border-white/5">
                                {log.map((l, i) => (
                                    <div key={i} className="mb-1">{l}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Results */}
                    {step === "results" && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 mb-6">
                                {/* Success Column */}
                                <div className="flex flex-col bg-[#1db954]/5 border border-[#1db954]/20 rounded-xl overflow-hidden">
                                    <div className="bg-[#1db954]/10 p-3 text-center border-b border-[#1db954]/20">
                                        <h4 className="text-[#1db954] font-bold text-sm flex items-center justify-center gap-2">
                                            <FontAwesomeIcon icon={faCheck} />
                                            Başarılı ({migrationResults.filter(r => r.status === "success").length})
                                        </h4>
                                    </div>
                                    <div className="p-3 overflow-y-auto flex-1 space-y-2 dark-scrollbar">
                                        {migrationResults.filter(r => r.status === "success").map((res, i) => (
                                            <div key={i} className="bg-[#1db954]/10 px-3 py-2 rounded border border-[#1db954]/10">
                                                <div className="text-sm text-white truncate">{res.track.title}</div>
                                                <div className="text-xs text-[#1db954]/70 truncate">{res.track.artist}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Error Column */}
                                <div className="flex flex-col bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl overflow-hidden">
                                    <div className="bg-[#ef4444]/10 p-3 text-center border-b border-[#ef4444]/20">
                                        <h4 className="text-[#ef4444] font-bold text-sm flex items-center justify-center gap-2">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            Başarısız ({migrationResults.filter(r => r.status === "error").length})
                                        </h4>
                                    </div>
                                    <div className="p-3 overflow-y-auto flex-1 space-y-2 dark-scrollbar">
                                        {migrationResults.filter(r => r.status === "error").map((res, i) => (
                                            <div key={i} className="bg-[#ef4444]/10 px-3 py-2 rounded border border-[#ef4444]/10">
                                                <div className="text-sm text-white truncate">{res.track.title}</div>
                                                <div className="text-xs text-[#ef4444]/70 truncate">{res.message}</div>
                                            </div>
                                        ))}
                                        {migrationResults.filter(r => r.status === "error").length === 0 && (
                                            <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                                                Hata yok!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button onClick={onClose} className="w-full py-4 rounded-xl bg-white text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Kapat
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
