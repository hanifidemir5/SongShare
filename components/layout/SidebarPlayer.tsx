"use client";
import React from "react";
import { usePlayer } from "@/app/contexts/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCompress, faExpand, faStepForward, faStepBackward } from "@fortawesome/free-solid-svg-icons";

const SidebarPlayer = () => {
    const {
        videoId,
        platform,
        isPlaying,
        isMinimized,
        close,
        toggleMinimize,
        playNext,
        playPrevious,
        hasNext,
        hasPrevious,
        currentTitle,
        currentArtist,
        currentIndex,
        playlist
    } = usePlayer();

    // Draggable Logic
    const [position, setPosition] = React.useState<{ x: number, y: number } | null>(null);
    const isDragging = React.useRef(false);
    const dragOffset = React.useRef({ x: 0, y: 0 });
    const playerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            e.preventDefault();
            const newX = e.clientX - dragOffset.current.x;
            const newY = e.clientY - dragOffset.current.y;
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = 'default';
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) return;
            // e.preventDefault(); // Often better NOT to preventDefault globally on touch unless necessary to stop scroll, but check behavior.

            const touch = e.touches[0];
            const newX = touch.clientX - dragOffset.current.x;
            const newY = touch.clientY - dragOffset.current.y;
            setPosition({ x: newX, y: newY });
        };

        const handleTouchEnd = () => {
            isDragging.current = false;
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false }); // passive false might be needed if we preventDefault
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!playerRef.current) return;
        if ((e.target as HTMLElement).closest('button')) return;

        isDragging.current = true;
        document.body.style.cursor = 'move';

        const rect = playerRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        if (!position) setPosition({ x: rect.left, y: rect.top });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!playerRef.current) return;
        if ((e.target as HTMLElement).closest('button')) return;

        isDragging.current = true;
        document.body.style.cursor = 'move';

        const rect = playerRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        dragOffset.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };

        if (!position) setPosition({ x: rect.left, y: rect.top });
    };

    if (!isPlaying || !videoId || !platform) return null;

    // Dynamic styles for positioning
    const style: React.CSSProperties = position
        ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            bottom: 'auto',
            right: 'auto',
            transform: 'none'
        }
        : {};

    const showControls = hasNext || hasPrevious;

    return (
        <div
            ref={playerRef}
            style={style}
            className={`fixed z-[100] transition-shadow duration-300 shadow-2xl overflow-hidden bg-black border border-white/10 ${!position ? (isMinimized ? "bottom-4 right-4" : "bottom-4 right-4") : ""
                } ${isMinimized
                    ? "w-72 h-14 rounded-lg flex items-center"
                    : "w-72 md:w-80 rounded-xl"
                }`}
        >
            {/* Controls Overlay & Drag Handle */}
            <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className={`absolute top-0 right-0 z-20 flex gap-2 p-2 w-full justify-end cursor-move ${isMinimized ? "pr-2" : "bg-gradient-to-l from-black/80 to-transparent"}`}
            >
                <div className="flex gap-2"> {/* Wrapper for buttons to exclude from drag */}
                    <button
                        onClick={toggleMinimize}
                        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
                        title={isMinimized ? "Büyüt" : "Küçült"}
                    >
                        <FontAwesomeIcon icon={isMinimized ? faExpand : faCompress} className="w-3 h-3" />
                    </button>
                    <button
                        onClick={close}
                        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-red-400 bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
                        title="Kapat"
                    >
                        <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Minimized Content Info */}
            {isMinimized && (
                <div className="flex-1 px-3 text-xs font-medium text-white/90 truncate mr-16 cursor-pointer select-none" onClick={toggleMinimize}>
                    {currentTitle ? (
                        <div className="flex flex-col">
                            <span className="truncate font-semibold">{currentTitle}</span>
                            {currentArtist && <span className="truncate text-white/60 text-[10px]">{currentArtist}</span>}
                        </div>
                    ) : (
                        <span>{platform === 'youtube' ? 'YouTube' : 'Spotify'} oynatılıyor...</span>
                    )}
                </div>
            )}

            {/* Player Frame */}
            <div className={`w-full bg-black ${isMinimized ? "opacity-0 pointer-events-none absolute h-full" : "opacity-100 h-[152px]"}`}>
                {platform === "youtube" ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full pointer-events-auto"
                    />
                ) : (
                    <iframe
                        className="w-full h-full bg-black pointer-events-auto"
                        src={`https://open.spotify.com/embed/track/${videoId}?utm_source=generator&theme=0&autoplay=1`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay *; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    />
                )}
            </div>

            {/* Next/Previous Controls - Only shown when playlist exists */}
            {showControls && !isMinimized && (
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/90 to-black/50 border-t border-white/5">
                    {/* Song Info */}
                    <div className="flex-1 min-w-0 pr-3">
                        {currentTitle && (
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-white truncate">{currentTitle}</span>
                                {currentArtist && <span className="text-[10px] text-white/60 truncate">{currentArtist}</span>}
                            </div>
                        )}
                        {playlist.length > 0 && (
                            <span className="text-[10px] text-white/40">{currentIndex + 1} / {playlist.length}</span>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={playPrevious}
                            disabled={!hasPrevious}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${hasPrevious
                                ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                                : "bg-white/5 text-white/30 cursor-not-allowed"
                                }`}
                            title="Önceki"
                        >
                            <FontAwesomeIcon icon={faStepBackward} className="w-3 h-3" />
                        </button>
                        <button
                            onClick={playNext}
                            disabled={!hasNext}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${hasNext
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                                : "bg-white/5 text-white/30 cursor-not-allowed"
                                }`}
                            title="Sonraki"
                        >
                            <FontAwesomeIcon icon={faStepForward} className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidebarPlayer;
