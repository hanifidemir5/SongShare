"use client";

import { useState, useEffect } from "react";
import SongTable from "./SongTable/SongTable";
import { Song } from "@/types";
import { CustomCategory } from "@/contexts/SongsContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeadphones, faStar, faHistory, faChartLine, faGlobe, faListUl, faTrash, faExclamationTriangle, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useSongs } from "@/contexts/SongsContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

type Props = {
    recommendedSongs: Song[];
    favoriteSongs: Song[];
    myPlaylistSongs?: Song[];
    customCategories: CustomCategory[];
    recentlyPlayed: Song[];
    topTracks?: Song[];
    globalTopTracks?: Song[];
};

export default function PlaylistTabs({ recommendedSongs, favoriteSongs, myPlaylistSongs, customCategories, recentlyPlayed, topTracks, globalTopTracks }: Props) {
    const { isLoggedIn, user } = useAuth();
    const { refetchSongs, currentProfile } = useSongs();

    // Check if viewing another user's profile
    const isViewingOtherProfile = user && currentProfile && user.id !== currentProfile.id;
    const hasNoContent = customCategories.length === 0 && recommendedSongs.length === 0 && favoriteSongs.length === 0;

    // Default tab logic:
    // 1. Custom Categories (if any)
    // 2. Recently Played (if logged in and viewing own profile)
    // 3. Top 20 (only on own profile)
    const getInitialTab = () => {
        // Always show first custom category if available
        if (customCategories.length > 0) return customCategories[0].id;

        // For other profiles without custom categories, return empty (will show empty state)
        if (isViewingOtherProfile) return "";

        // Own profile fallbacks
        if (isLoggedIn && recentlyPlayed.length > 0) return "history";
        if (topTracks && topTracks.length > 0) return "topTracks";
        return "globalTop";
    };

    const [activeTab, setActiveTab] = useState<string>(getInitialTab());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CustomCategory | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset active tab when profile changes
    useEffect(() => {
        setActiveTab(getInitialTab());
    }, [currentProfile?.id, customCategories.length]);

    const handleDeletePlaylist = async () => {
        if (!user || !myPlaylistSongs || myPlaylistSongs.length === 0) return;

        setIsDeleting(true);
        try {
            // Delete all songs with category "myPlaylist" for this user
            const { error } = await supabase
                .from("song")
                .delete()
                .eq("addedBy", user.id)
                .eq("category", "myPlaylist");

            if (error) {
                toast.error("Playlist silinirken hata oluştu!");
                return;
            }

            // Refresh songs
            await refetchSongs();

            // Switch to recommended tab
            setActiveTab("recommended");
            setShowDeleteModal(false);
        } catch (error) {
            toast.error("Silme işlemi başarısız oldu.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!user || !categoryToDelete) return;

        setIsDeleting(true);
        try {
            // Delete all songs in this category
            const { error: songError } = await supabase
                .from("song")
                .delete()
                .eq("addedBy", user.id)
                .eq("playlist_id", categoryToDelete.id);

            if (songError) {
                toast.error("Şarkılar silinirken hata oluştu!");
                return;
            }

            // Delete the category itself
            const { error: catError } = await supabase
                .from("playlist")
                .delete()
                .eq("id", categoryToDelete.id)
                .eq("user_id", user.id);

            if (catError) {
                toast.error("Kategori silinirken hata oluştu!");
                return;
            }

            // Refresh songs
            await refetchSongs();

            // Switch to recommended tab
            setActiveTab("recommended");
            setCategoryToDelete(null);
        } catch (error) {
            toast.error("Silme işlemi başarısız oldu.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Show empty state for other users with no playlists
    if (isViewingOtherProfile && hasNoContent) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
                        <FontAwesomeIcon icon={faListUl} className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Henüz Playlist Yok
                    </h3>
                    <p className="text-gray-400 text-center max-w-md">
                        <span className="font-medium text-indigo-400">{currentProfile?.name || 'Bu kullanıcı'}</span> henüz bir playlist oluşturmamış.
                    </p>
                </div>
            </div>
        );
    }

    // Determine if Top 20 tabs should be shown (only on own profile)
    const showSystemPlaylists = !isViewingOtherProfile;

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            {/* Mobile Navigation (Dropdown) */}
            <div className="md:hidden w-full relative z-10 mb-4">
                <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as any)}
                    className="w-full bg-gray-900/50 backdrop-blur-sm border border-white/10 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-indigo-500 font-medium transition-all"
                >
                    {isLoggedIn && (
                        <>
                            {customCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name} ({category.songCount})
                                </option>
                            ))}
                            {recentlyPlayed.length > 0 && (
                                <option value="history">Son Çalınanlar</option>
                            )}
                        </>
                    )}
                    {showSystemPlaylists && topTracks && topTracks.length > 0 && (
                        <option value="topTracks">Türkiye Top 20</option>
                    )}
                    {showSystemPlaylists && globalTopTracks && globalTopTracks.length > 0 && (
                        <option value="globalTop">Global Top 20</option>
                    )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <FontAwesomeIcon icon={faChevronDown} />
                </div>
            </div>

            {/* Tab Navigation (Desktop) */}
            <div className="hidden md:flex flex-wrap gap-2 p-1 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 w-fit">

                {/* Only show these tabs for logged in users */}
                {isLoggedIn && (
                    <>
                        {/* Custom Categories - Dynamic Tabs */}
                        {customCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveTab(category.id)}
                                className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${activeTab === category.id
                                    ? "bg-orange-600 text-white shadow-lg shadow-orange-500/25"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faListUl} className={activeTab === category.id ? "text-white" : "text-orange-400"} />
                                {category.name}
                                <span className="text-[10px] opacity-75">({category.songCount})</span>
                            </button>
                        ))}


                        {recentlyPlayed.length > 0 && (
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${activeTab === "history"
                                    ? "bg-green-600 text-white shadow-lg shadow-green-500/25"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faHistory} />
                                Son Çalınanlar
                            </button>
                        )}
                    </>
                )}

                {/* Turkey Top 20 - visible only on own profile */}
                {showSystemPlaylists && topTracks && topTracks.length > 0 && (
                    <button
                        onClick={() => setActiveTab("topTracks")}
                        className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${activeTab === "topTracks"
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-500/25"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <FontAwesomeIcon icon={faChartLine} />
                        Türkiye Top 20
                    </button>
                )}

                {/* Global Top 20 - visible only on own profile */}
                {showSystemPlaylists && globalTopTracks && globalTopTracks.length > 0 && (
                    <button
                        onClick={() => setActiveTab("globalTop")}
                        className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${activeTab === "globalTop"
                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/25"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <FontAwesomeIcon icon={faGlobe} />
                        Global Top 20
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">
                {/* Custom Categories - Dynamic Content */}
                {customCategories.map((category) => (
                    activeTab === category.id && isLoggedIn && (
                        <div key={category.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <FontAwesomeIcon icon={faListUl} className="text-orange-400" />
                                    {category.name}
                                    <span className="text-sm text-gray-400 font-normal">({category.songCount} şarkı)</span>
                                </h2>
                                {!isViewingOtherProfile && (
                                    <button
                                        onClick={() => setCategoryToDelete(category)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all"
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                                        Kategoriyi Sil
                                    </button>
                                )}
                            </div>
                            <SongTable
                                title=""
                                songs={category.songs}
                            />
                        </div>
                    )
                ))}
                {activeTab === "history" && isLoggedIn && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Spotify Son Çalınanlar"
                            songs={recentlyPlayed}
                            isSystemPlaylist={true}
                        />
                    </div>
                )}
                {showSystemPlaylists && activeTab === "topTracks" && topTracks && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Türkiye Top 20"
                            songs={topTracks}
                            isSystemPlaylist={true}
                        />
                    </div>
                )}
                {showSystemPlaylists && activeTab === "globalTop" && globalTopTracks && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Global Top 20"
                            songs={globalTopTracks}
                            isSystemPlaylist={true}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal - Custom Category */}
            {categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setCategoryToDelete(null)}
                    />
                    <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Kategoriyi Sil</h3>
                                <p className="text-sm text-gray-400">Bu işlem geri alınamaz!</p>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-6">
                            <strong>"{categoryToDelete.name}"</strong> kategorisini ve içindeki <strong>{categoryToDelete.songCount}</strong> şarkıyı silmek istediğinizden emin misiniz?
                            Bu işlem kalıcıdır ve geri alınamaz.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setCategoryToDelete(null)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDeleteCategory}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                        Siliniyor...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                        Evet, Sil
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal - myPlaylist */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    />
                    <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Playlisti Sil</h3>
                                <p className="text-sm text-gray-400">Bu işlem geri alınamaz!</p>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-6">
                            <strong>{myPlaylistSongs?.length}</strong> şarkı içeren playlistinizi silmek istediğinizden emin misiniz?
                            Bu işlem kalıcıdır ve geri alınamaz.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDeletePlaylist}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                        Siliniyor...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                        Evet, Sil
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
