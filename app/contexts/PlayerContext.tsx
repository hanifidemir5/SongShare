"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type Platform = "youtube" | "spotify";

interface PlayerContextValue {
    videoId: string | null;
    platform: Platform | null;
    isPlaying: boolean;
    isMinimized: boolean;
    play: (id: string, platform: Platform) => void;
    close: () => void;
    toggleMinimize: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayer must be used within a PlayerProvider");
    }
    return context;
};

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [videoId, setVideoId] = useState<string | null>(null);
    const [platform, setPlatform] = useState<Platform | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const play = (id: string, newPlatform: Platform) => {
        setVideoId(id);
        setPlatform(newPlatform);
        setIsPlaying(true);
        setIsMinimized(false); // Auto expand on new play
    };

    const close = () => {
        setVideoId(null);
        setPlatform(null);
        setIsPlaying(false);
    };

    const toggleMinimize = () => {
        setIsMinimized((prev) => !prev);
    };

    return (
        <PlayerContext.Provider
            value={{
                videoId,
                platform,
                isPlaying,
                isMinimized,
                play,
                close,
                toggleMinimize,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};
