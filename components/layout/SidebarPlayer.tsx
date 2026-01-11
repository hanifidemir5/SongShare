"use client";
import React from "react";
import { usePlayer } from "@/app/contexts/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";

const SidebarPlayer = () => {
    const { videoId, platform, isPlaying, isMinimized, close, toggleMinimize } = usePlayer();

    if (!isPlaying || !videoId || !platform) return null;

    return (
        <div
            className={`fixed z-[100] transition-all duration-300 shadow-2xl overflow-hidden bg-black border border-white/10 ${isMinimized
                    ? "bottom-4 right-4 w-64 h-16 rounded-lg flex items-center"
                    : "bottom-4 right-4 w-80 md:w-96 aspect-video rounded-xl"
                }`}
        >
            {/* Controls Overlay */}
            <div className={`absolute top-0 right-0 z-20 flex gap-2 p-2 ${isMinimized ? "pr-2" : "bg-gradient-to-l from-black/80 to-transparent"}`}>
                <button
                    onClick={toggleMinimize}
                    className="p-1.5 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors"
                    title={isMinimized ? "Büyüt" : "Küçült"}
                >
                    <FontAwesomeIcon icon={isMinimized ? faExpand : faCompress} className="w-3 h-3" />
                </button>
                <button
                    onClick={close}
                    className="p-1.5 text-white/70 hover:text-red-400 bg-black/40 hover:bg-black/60 rounded-full transition-colors"
                    title="Kapat"
                >
                    <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                </button>
            </div>

            {/* Minimized Content Info */}
            {isMinimized && (
                <div className="flex-1 px-3 text-xs font-medium text-white/90 truncate mr-16 cursor-pointer" onClick={toggleMinimize}>
                    {platform === 'youtube' ? 'YouTube' : 'Spotify'} oynatılıyor...
                </div>
            )}

            {/* Player Frame */}
            <div className={`w-full h-full bg-black ${isMinimized ? "opacity-0 pointer-events-none absolute" : "opacity-100"}`}>
                {platform === "youtube" ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                    />
                ) : (
                    <iframe
                        className="w-full h-full bg-black"
                        src={`https://open.spotify.com/embed/track/${videoId}?utm_source=generator&theme=0`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                    />
                )}
            </div>
        </div>
    );
};

export default SidebarPlayer;
