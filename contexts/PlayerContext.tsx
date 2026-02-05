"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type Platform = "youtube" | "spotify";

export interface PlaylistItem {
    id: string;
    platform: Platform;
    title?: string;
    artist?: string;
}

interface PlayerContextValue {
    videoId: string | null;
    platform: Platform | null;
    isPlaying: boolean;
    isMinimized: boolean;
    currentIndex: number;
    playlist: PlaylistItem[];
    currentTitle: string | null;
    currentArtist: string | null;
    play: (id: string, platform: Platform, title?: string, artist?: string) => void;
    playWithPlaylist: (id: string, platform: Platform, playlist: PlaylistItem[], index: number, title?: string, artist?: string) => void;
    playNext: () => void;
    playPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
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
    const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [currentTitle, setCurrentTitle] = useState<string | null>(null);
    const [currentArtist, setCurrentArtist] = useState<string | null>(null);

    const play = (id: string, newPlatform: Platform, title?: string, artist?: string) => {
        setVideoId(id);
        setPlatform(newPlatform);
        setIsPlaying(true);
        setIsMinimized(false);
        setPlaylist([]);
        setCurrentIndex(-1);
        setCurrentTitle(title || null);
        setCurrentArtist(artist || null);
    };

    const playWithPlaylist = (id: string, newPlatform: Platform, newPlaylist: PlaylistItem[], index: number, title?: string, artist?: string) => {
        setVideoId(id);
        setPlatform(newPlatform);
        setIsPlaying(true);
        setIsMinimized(false);
        setPlaylist(newPlaylist);
        setCurrentIndex(index);
        setCurrentTitle(title || newPlaylist[index]?.title || null);
        setCurrentArtist(artist || newPlaylist[index]?.artist || null);
    };

    const playNext = () => {
        if (playlist.length > 0 && currentIndex < playlist.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextItem = playlist[nextIndex];
            setVideoId(nextItem.id);
            setPlatform(nextItem.platform);
            setCurrentIndex(nextIndex);
            setCurrentTitle(nextItem.title || null);
            setCurrentArtist(nextItem.artist || null);
        }
    };

    const playPrevious = () => {
        if (playlist.length > 0 && currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            const prevItem = playlist[prevIndex];
            setVideoId(prevItem.id);
            setPlatform(prevItem.platform);
            setCurrentIndex(prevIndex);
            setCurrentTitle(prevItem.title || null);
            setCurrentArtist(prevItem.artist || null);
        }
    };

    const hasNext = playlist.length > 0 && currentIndex < playlist.length - 1;
    const hasPrevious = playlist.length > 0 && currentIndex > 0;

    const close = () => {
        setVideoId(null);
        setPlatform(null);
        setIsPlaying(false);
        setPlaylist([]);
        setCurrentIndex(-1);
        setCurrentTitle(null);
        setCurrentArtist(null);
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
                currentIndex,
                playlist,
                currentTitle,
                currentArtist,
                play,
                playWithPlaylist,
                playNext,
                playPrevious,
                hasNext,
                hasPrevious,
                close,
                toggleMinimize,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};
