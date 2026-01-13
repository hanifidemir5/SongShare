"use client";

import { useState } from "react";
import SongTable from "./SongTable/SongTable";
import { Song } from "@/app/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeadphones, faStar, faHistory, faChartLine, faGlobe, faListUl, faTrash, faExclamationTriangle, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSongs } from "@/app/contexts/SongsContext";
import { supabase } from "@/lib/supabaseClient";

type Props = {
    recommendedSongs: Song[];
    favoriteSongs: Song[];
    myPlaylistSongs?: Song[];
    recentlyPlayed: Song[];
    topTracks?: Song[];
    globalTopTracks?: Song[];
};

export default function PlaylistTabs({ recommendedSongs, favoriteSongs, myPlaylistSongs, recentlyPlayed, topTracks, globalTopTracks }: Props) {
    const { isLoggedIn, user } = useAuth();
    const { refetchSongs } = useSongs();

    // Default tab: if logged in, show recommended; if guest, show topTracks
    const [activeTab, setActiveTab] = useState<"recommended" | "favorites" | "myPlaylist" | "history" | "topTracks" | "globalTop">(
        isLoggedIn ? "recommended" : "topTracks"
    );
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeletePlaylist = async () => {
        if (!user || !myPlaylistSongs || myPlaylistSongs.length === 0) return;

        setIsDeleting(true);
        try {
            // Delete all songs with category "myPlaylist" for this user
            const { error } = await supabase
                .from("Song")
                .delete()
                .eq("addedBy", user.id)
                .eq("category", "myPlaylist");

            if (error) {
                console.error("Error deleting playlist:", error);
                alert("Playlist silinirken hata oluştu!");
                return;
            }

            // Refresh songs
            await refetchSongs();

            // Switch to recommended tab
            setActiveTab("recommended");
            setShowDeleteModal(false);
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Silme işlemi başarısız oldu.");
        } finally {
            setIsDeleting(false);
        }
    };

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
                            <option value="recommended">Şu Sıralar Dinlediklerim</option>
                            <option value="favorites">Favoriler</option>
                            {myPlaylistSongs && myPlaylistSongs.length > 0 && (
                                <option value="myPlaylist">Benim Playlistim ({myPlaylistSongs?.length})</option>
                            )}
                            {recentlyPlayed.length > 0 && (
                                <option value="history">Son Çalınanlar</option>
                            )}
                        </>
                    )}
                    {topTracks && topTracks.length > 0 && (
                        <option value="topTracks">Türkiye Top 20</option>
                    )}
                    {globalTopTracks && globalTopTracks.length > 0 && (
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
                        <button
                            onClick={() => setActiveTab("recommended")}
                            className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${activeTab === "recommended"
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <FontAwesomeIcon icon={faHeadphones} className={activeTab === "recommended" ? "animate-bounce-slow" : ""} />
                            Şu Sıralar Dinlediklerim
                        </button>
                        <button
                            onClick={() => setActiveTab("favorites")}
                            className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${activeTab === "favorites"
                                ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/25"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <FontAwesomeIcon icon={faStar} className={activeTab === "favorites" ? "text-white" : "text-yellow-500"} />
                            Favoriler
                        </button>

                        {/* Benim Playlistim - only show if there are songs */}
                        {myPlaylistSongs && myPlaylistSongs.length > 0 && (
                            <button
                                onClick={() => setActiveTab("myPlaylist")}
                                className={`flex items-center gap-2 px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 ${activeTab === "myPlaylist"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faListUl} className={activeTab === "myPlaylist" ? "text-white" : "text-purple-400"} />
                                Benim Playlistim
                            </button>
                        )}

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

                {/* Turkey Top 20 - visible to everyone */}
                {topTracks && topTracks.length > 0 && (
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

                {/* Global Top 20 - visible to everyone */}
                {globalTopTracks && globalTopTracks.length > 0 && (
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
                {activeTab === "recommended" && isLoggedIn && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Şu Sıralar Dinlediklerim"
                            songs={recommendedSongs}
                        />
                    </div>
                )}
                {activeTab === "favorites" && isLoggedIn && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Tüm Zamanlar En Sevdiklerim"
                            songs={favoriteSongs}
                        />
                    </div>
                )}
                {activeTab === "myPlaylist" && isLoggedIn && myPlaylistSongs && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FontAwesomeIcon icon={faListUl} className="text-purple-400" />
                                Benim Playlistim
                                <span className="text-sm text-gray-400 font-normal">({myPlaylistSongs.length} şarkı)</span>
                            </h2>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all"
                            >
                                <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                                Playlisti Sil
                            </button>
                        </div>
                        <SongTable
                            title=""
                            songs={myPlaylistSongs}
                        />
                    </div>
                )}
                {activeTab === "history" && isLoggedIn && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Spotify Son Çalınanlar"
                            songs={recentlyPlayed}
                        />
                    </div>
                )}
                {activeTab === "topTracks" && topTracks && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Türkiye Top 20"
                            songs={topTracks}
                        />
                    </div>
                )}
                {activeTab === "globalTop" && globalTopTracks && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Global Top 20"
                            songs={globalTopTracks}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
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
