"use client";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faTimes, faArrowLeft, faMusic, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSongs } from "@/app/contexts/SongsContext";
import { getUserPlaylists } from "@/app/helpers/spotifyApi";
import { fetchSpotifyPlaylistTracks } from "@/app/helpers/fetchSpotifyPlaylistTracks";
import { fetchYouTubePlaylistTracks, getUserYouTubePlaylists } from "@/app/helpers/fetchYouTubePlaylistTracks";
import { getSpotifyIdFromYouTubeUrl } from "@/app/helpers/getSpotifyIdFromYouTubeUrl";
import { getYouTubeIdFromSpotifyUrl } from "@/app/helpers/getYouTubeUrlFromSpotify";
import { getUserToken } from "@/app/helpers/tokenManager";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { Profile } from "@/app/types";

interface ImportPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Platform = "spotify" | "youtube" | null;
type Step = "platform" | "playlist" | "preview";

interface PlaylistOption {
    id: string;
    name: string;
    trackCount?: number;
}

interface TrackToImport {
    id: string;
    title: string;
    artist: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
}

const MAX_TRACKS = 50;

export default function ImportPlaylistModal({ isOpen, onClose }: ImportPlaylistModalProps) {
    const { profile, user } = useAuth();
    const { refetchSongs } = useSongs();

    const [step, setStep] = useState<Step>("platform");
    const [platform, setPlatform] = useState<Platform>(null);
    const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistOption | null>(null);
    const [tracks, setTracks] = useState<TrackToImport[]>([]);
    const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
    const [categoryName, setCategoryName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStep("platform");
            setPlatform(null);
            setPlaylists([]);
            setSelectedPlaylist(null);
            setTracks([]);
            setTracks([]);
            setSelectedTracks(new Set());
            setCategoryName("");
            setIsLoading(false);
            setIsImporting(false);
            setImportProgress(0);
        }
    }, [isOpen]);

    // Fetch playlists when platform is selected
    const handlePlatformSelect = async (selectedPlatform: Platform) => {
        if (!selectedPlatform) return;

        setPlatform(selectedPlatform);
        setIsLoading(true);
        setStep("playlist");

        try {
            if (selectedPlatform === "spotify" && profile?.spotify_access_token) {
                const spotifyPlaylists = await getUserPlaylists(profile.spotify_access_token);
                setPlaylists(
                    spotifyPlaylists.map((pl: any) => ({
                        id: pl.id,
                        name: pl.name,
                        trackCount: pl.tracks?.total || 0,
                    }))
                );
            } else if (selectedPlatform === "youtube" && user) {
                // Fetch token from DB
                const tokenData = await getUserToken(user.id, "youtube");
                console.log("DEBUG: Token Data from DB (Platform Select):", tokenData);
                const youtubeToken = tokenData?.accessToken;

                if (youtubeToken) {
                    console.log("DEBUG: Fetching playlists with token:", youtubeToken.substring(0, 10) + "...");
                    const youtubePlaylists = await getUserYouTubePlaylists(youtubeToken);
                    console.log("DEBUG: Fetched Playlists:", youtubePlaylists);
                    setPlaylists(
                        youtubePlaylists.map((pl) => ({
                            id: pl.id,
                            name: pl.title,
                            trackCount: pl.itemCount,
                        }))
                    );
                } else {
                    console.error("DEBUG: No YouTube token found for user");
                }
            }
        } catch (error) {
            console.error("Error fetching playlists:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch tracks when playlist is selected
    const handlePlaylistSelect = async (playlist: PlaylistOption) => {
        setSelectedPlaylist(playlist);
        setIsLoading(true);
        setStep("preview");

        try {
            let fetchedTracks: TrackToImport[] = [];
            if (platform === "spotify" && profile?.spotify_access_token) {
                fetchedTracks = await fetchSpotifyPlaylistTracks(
                    playlist.id,
                    profile.spotify_access_token,
                    MAX_TRACKS
                );
            } else if (platform === "youtube" && user) {
                const tokenData = await getUserToken(user.id, "youtube");
                console.log("DEBUG: Token Data from DB (Playlist Select):", tokenData);
                const youtubeToken = tokenData?.accessToken;

                if (youtubeToken) {
                    console.log("DEBUG: Fetching tracks for playlist:", playlist.id);
                    fetchedTracks = await fetchYouTubePlaylistTracks(
                        playlist.id,
                        youtubeToken,
                        MAX_TRACKS
                    );
                    console.log("DEBUG: Fetched Tracks Count:", fetchedTracks.length);
                } else {
                    console.error("DEBUG: No YouTube token found during track fetch");
                }
            }

            setTracks(fetchedTracks);
            // Select all tracks by default
            setSelectedTracks(new Set(fetchedTracks.map((_, idx) => idx.toString())));
        } catch (error) {
            console.error("Error fetching tracks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Import tracks to database
    const handleImport = async () => {
        if (!user || selectedTracks.size === 0) return;

        // Validate category name
        const trimmedCategoryName = categoryName.trim();
        if (!trimmedCategoryName) {
            toast.error("Lütfen kategori adı girin!");
            return;
        }

        // Filter tracks to only include selected ones
        const tracksToImport = tracks.filter((_, idx) => selectedTracks.has(idx.toString()));
        if (tracksToImport.length === 0) return;

        setIsImporting(true);
        setImportProgress(0);

        try {
            // STEP 1: Create category first
            const { data: existingCategory } = await supabase
                .from("Category")
                .select("name")
                .eq("name", trimmedCategoryName)
                .eq("user_id", user.id)
                .single();

            if (existingCategory) {
                toast.warning(`"${trimmedCategoryName}" kategorisi zaten mevcut! Lütfen farklı bir isim seçin.`);
                setIsImporting(false);
                return;
            }

            // Insert new category and get its ID
            const { data: newCategory, error: categoryError } = await supabase
                .from("Category")
                .insert({
                    user_id: user.id,
                    name: trimmedCategoryName,
                    category_type: "custom",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (categoryError || !newCategory) {
                console.error("Error creating category:", categoryError);
                toast.error("Kategori oluşturulurken hata oluştu!");
                setIsImporting(false);
                return;
            }

            const categoryId = newCategory.id;

            // STEP 2: For Spotify tracks, fetch YouTube URLs
            let enrichedTracks = tracksToImport;
            if (platform === "spotify" && profile?.spotify_access_token) {
                const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
                const totalTracks = tracksToImport.length;

                enrichedTracks = await Promise.all(
                    tracksToImport.map(async (track, idx) => {
                        try {
                            // Only fetch YouTube URL if we have a Spotify URL
                            if (track.spotifyUrl && !track.youtubeUrl) {
                                const youtubeId = await getYouTubeIdFromSpotifyUrl(
                                    track.spotifyUrl,
                                    profile.spotify_access_token,
                                    youtubeApiKey
                                );
                                if (youtubeId) {
                                    track.youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
                                }
                            }
                        } catch (err) {
                            console.warn(`Could not fetch YouTube URL for ${track.title}:`, err);
                        }
                        // Update progress during YouTube fetching (first 40%)
                        setImportProgress(Math.round(((idx + 1) / totalTracks) * 40));
                        return track;
                    })
                );
            }

            // STEP 3: Check for existing songs to prevent duplicates (in this category)
            const spotifyUrls = enrichedTracks
                .filter(t => t.spotifyUrl)
                .map(t => t.spotifyUrl as string);
            const youtubeUrls = enrichedTracks
                .filter(t => t.youtubeUrl)
                .map(t => t.youtubeUrl as string);

            let existingUrls = new Set<string>();
            if (spotifyUrls.length > 0 || youtubeUrls.length > 0) {
                const { data: existingSongs } = await supabase
                    .from("Song")
                    .select("spotifyUrl, youtubeUrl")
                    .eq("addedBy", user.id)
                    .eq("Category", categoryId);

                if (existingSongs) {
                    existingSongs.forEach((song: { spotifyUrl?: string; youtubeUrl?: string }) => {
                        if (song.spotifyUrl) existingUrls.add(song.spotifyUrl);
                        if (song.youtubeUrl) existingUrls.add(song.youtubeUrl);
                    });
                }
            }

            // Filter out duplicates
            const nonDuplicateTracks = enrichedTracks.filter(track => {
                const hasSpotifyDupe = track.spotifyUrl && existingUrls.has(track.spotifyUrl);
                const hasYoutubeDupe = track.youtubeUrl && existingUrls.has(track.youtubeUrl);
                return !hasSpotifyDupe && !hasYoutubeDupe;
            });

            const skippedCount = enrichedTracks.length - nonDuplicateTracks.length;

            if (nonDuplicateTracks.length === 0) {
                toast.info(`Tüm şarkılar zaten eklenmiş! (${skippedCount} şarkı atlandı)`);
                setIsImporting(false);
                return;
            }

            // STEP 4: Insert songs with the custom category ID
            const songsToInsert = nonDuplicateTracks.map((track) => ({
                id: uuidv4(),
                title: track.title,
                artist: track.artist,
                spotifyUrl: track.spotifyUrl || null,
                youtubeUrl: track.youtubeUrl || null,
                addedBy: user.id,
                Category: categoryId, // Use category ID!
            }));

            // Insert in batches to show progress (40-100%)
            const batchSize = 10;
            for (let i = 0; i < songsToInsert.length; i += batchSize) {
                const batch = songsToInsert.slice(i, i + batchSize);
                const { error } = await supabase.from("Song").insert(batch);

                if (error) {
                    console.error("Error inserting songs:", JSON.stringify(error, null, 2));
                    console.error("Error details:", error.message, error.code, error.hint);
                    throw error;
                }

                // Progress: 40-100% for database insert
                setImportProgress(40 + Math.round(((i + batchSize) / songsToInsert.length) * 60));
            }

            // Refresh songs
            await refetchSongs();

            // Show success message
            const msg = skippedCount > 0
                ? `${nonDuplicateTracks.length} şarkı "${trimmedCategoryName}" kategorisine eklendi. ${skippedCount} şarkı zaten mevcut olduğu için atlandı.`
                : `${nonDuplicateTracks.length} şarkı "${trimmedCategoryName}" kategorisine başarıyla eklendi!`;
            toast.success(msg);

            // Close modal
            onClose();
        } catch (error: any) {
            console.error("Import failed:", error);
            const errorMessage = error?.message || "Bilinmeyen hata";
            toast.error(`İçe aktarma başarısız oldu: ${errorMessage}`);
        } finally {
            setIsImporting(false);
        }
    };

    const goBack = () => {
        if (step === "preview") {
            setStep("playlist");
            setSelectedPlaylist(null);
            setTracks([]);
        } else if (step === "playlist") {
            setStep("platform");
            setPlatform(null);
            setPlaylists([]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        {step !== "platform" && (
                            <button
                                onClick={goBack}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        <h2 className="text-lg font-semibold text-white">
                            {step === "platform" && "Platform Seç"}
                            {step === "playlist" && "Playlist Seç"}
                            {step === "preview" && "Önizleme"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    {/* Step 1: Platform Selection */}
                    {step === "platform" && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-400 mb-4">
                                Hangi platformdan playlist içe aktarmak istiyorsunuz?
                            </p>

                            {profile?.is_spotify_connected && (
                                <button
                                    onClick={() => handlePlatformSelect("spotify")}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/30 hover:bg-[#1DB954]/20 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faSpotify} className="w-6 h-6 text-[#1DB954]" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-white">Spotify</div>
                                        <div className="text-xs text-gray-400">Spotify playlistlerinden içe aktar</div>
                                    </div>
                                </button>
                            )}

                            {profile?.is_youtube_connected && (
                                <button
                                    onClick={() => handlePlatformSelect("youtube")}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 hover:bg-[#FF0000]/20 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#FF0000]/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faYoutube} className="w-6 h-6 text-[#FF0000]" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold text-white">YouTube</div>
                                        <div className="text-xs text-gray-400">YouTube playlistlerinden içe aktar</div>
                                    </div>
                                </button>
                            )}

                            {!profile?.is_spotify_connected && !profile?.is_youtube_connected && (
                                <div className="text-center py-8 text-gray-400">
                                    <FontAwesomeIcon icon={faMusic} className="w-12 h-12 mb-3 opacity-50" />
                                    <p>Playlist içe aktarmak için önce bir platform bağlayın.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Playlist Selection */}
                    {step === "playlist" && (
                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-400">
                                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
                                    <p>Playlistler yükleniyor...</p>
                                </div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <FontAwesomeIcon icon={faMusic} className="w-12 h-12 mb-3 opacity-50" />
                                    <p>Playlist bulunamadı.</p>
                                </div>
                            ) : (
                                playlists.map((playlist) => (
                                    <button
                                        key={playlist.id}
                                        onClick={() => handlePlaylistSelect(playlist)}
                                        className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium text-white">{playlist.name}</div>
                                            <div className="text-xs text-gray-400">
                                                {playlist.trackCount} şarkı
                                                {playlist.trackCount && playlist.trackCount > MAX_TRACKS && (
                                                    <span className="text-yellow-500 ml-1">(ilk {MAX_TRACKS} aktarılacak)</span>
                                                )}
                                            </div>
                                        </div>
                                        <FontAwesomeIcon
                                            icon={platform === "spotify" ? faSpotify : faYoutube}
                                            className={`w-5 h-5 ${platform === "spotify" ? "text-[#1DB954]" : "text-[#FF0000]"}`}
                                        />
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Step 3: Preview & Import */}
                    {step === "preview" && (
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-400">
                                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
                                    <p>Şarkılar yükleniyor...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-white">{selectedPlaylist?.name}</h3>
                                            <p className="text-xs text-gray-400">
                                                {selectedTracks.size} / {tracks.length} şarkı seçildi
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${platform === "spotify" ? "bg-[#1DB954]/20 text-[#1DB954]" : "bg-[#FF0000]/20 text-[#FF0000]"
                                            }`}>
                                            {platform === "spotify" ? "Spotify" : "YouTube"}
                                        </span>
                                    </div>

                                    {/* Category Name Input */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Kategori Adı <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="Örn: Rock Favorilerim, 2024 Hitleri..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Bu isimle yeni bir kategori oluşturulacak
                                        </p>
                                    </div>

                                    {/* Select All / Deselect All Toggle */}
                                    <div className="flex items-center justify-between px-2 py-2 bg-white/5 rounded-lg mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTracks.size === tracks.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTracks(new Set(tracks.map((_, idx) => idx.toString())));
                                                    } else {
                                                        setSelectedTracks(new Set());
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                                            />
                                            <span className="text-sm text-gray-300">Tümünü Seç</span>
                                        </label>
                                        <span className="text-xs text-gray-500">
                                            {selectedTracks.size} seçili
                                        </span>
                                    </div>

                                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                                        {tracks.map((track, idx) => {
                                            const isSelected = selectedTracks.has(idx.toString());
                                            return (
                                                <div
                                                    key={`${idx}-${track.id}`}
                                                    onClick={() => {
                                                        const newSelected = new Set(selectedTracks);
                                                        if (isSelected) {
                                                            newSelected.delete(idx.toString());
                                                        } else {
                                                            newSelected.add(idx.toString());
                                                        }
                                                        setSelectedTracks(newSelected);
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg text-sm cursor-pointer transition-all ${isSelected
                                                        ? "bg-indigo-600/20 border border-indigo-500/30"
                                                        : "bg-white/5 border border-transparent opacity-50"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => { }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="w-6 text-center text-gray-500 text-xs">{idx + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-medium truncate ${isSelected ? "text-white" : "text-gray-400"}`}>{track.title}</div>
                                                        <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {isImporting && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                                <span>İçe aktarılıyor...</span>
                                                <span>{importProgress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-300"
                                                    style={{ width: `${importProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {
                    step === "preview" && !isLoading && tracks.length > 0 && (
                        <div className="px-5 py-4 border-t border-white/10 flex justify-end">
                            <button
                                onClick={handleImport}
                                disabled={isImporting || selectedTracks.size === 0 || !categoryName.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                            >
                                {isImporting ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                        İçe Aktarılıyor...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                                        İçe Aktar ({selectedTracks.size} şarkı)
                                    </>
                                )}
                            </button>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
