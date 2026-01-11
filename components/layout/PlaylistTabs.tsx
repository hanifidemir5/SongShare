"use client";

import { useState } from "react";
import SongTable from "./SongTable/SongTable";
import { Song } from "@/app/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeadphones, faStar, faHistory } from "@fortawesome/free-solid-svg-icons";

type Props = {
    recommendedSongs: Song[];
    favoriteSongs: Song[];
    recentlyPlayed: Song[];
};

export default function PlaylistTabs({ recommendedSongs, favoriteSongs, recentlyPlayed }: Props) {
    const [activeTab, setActiveTab] = useState<"recommended" | "favorites" | "history">(
        "recommended"
    );

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5 w-fit">
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
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300 ease-in-out">
                {activeTab === "recommended" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Şu Sıralar Dinlediklerim"
                            songs={recommendedSongs}
                        />
                    </div>
                )}
                {activeTab === "favorites" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Tüm Zamanlar En Sevdiklerim"
                            songs={favoriteSongs}
                        />
                    </div>
                )}
                {activeTab === "history" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SongTable
                            title="Spotify Son Çalınanlar"
                            songs={recentlyPlayed}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
