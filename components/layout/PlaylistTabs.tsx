"use client";

import { useState } from "react";
import SongTable from "./SongTable/SongTable";
import { Song } from "@/app/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeadphones, faStar, faHistory, faChartLine, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/app/contexts/AuthContext";

type Props = {
    recommendedSongs: Song[];
    favoriteSongs: Song[];
    recentlyPlayed: Song[];
    topTracks?: Song[];
    globalTopTracks?: Song[];
};

export default function PlaylistTabs({ recommendedSongs, favoriteSongs, recentlyPlayed, topTracks, globalTopTracks }: Props) {
    const { isLoggedIn } = useAuth();

    // Default tab: if logged in, show recommended; if guest, show topTracks
    const [activeTab, setActiveTab] = useState<"recommended" | "favorites" | "history" | "topTracks" | "globalTop">(
        isLoggedIn ? "recommended" : "topTracks"
    );

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 w-fit">

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
        </div>
    );
}
