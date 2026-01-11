"use client";
import React from "react";
import { usePlayer } from "@/app/contexts/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";

const SidebarPlayer = () => {
    const { videoId, platform, isPlaying, isMinimized, close, toggleMinimize } = usePlayer();

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

    return (
        <div
            ref={playerRef}
            style={style}
            className={`fixed z-[100] transition-shadow duration-300 shadow-2xl overflow-hidden bg-black border border-white/10 ${!position ? (isMinimized ? "bottom-4 right-4" : "bottom-4 right-4") : ""
                } ${isMinimized
                    ? "w-64 h-16 rounded-lg flex items-center"
                    : "w-80 h-[154px] md:w-96 aspect-video rounded-xl"
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
                    {platform === 'youtube' ? 'YouTube' : 'Spotify'} oynatılıyor...
                </div>
            )}

            {/* Player Frame */}
            <div className={` w-full h-full bg-black ${isMinimized ? "opacity-0 pointer-events-none absolute" : "opacity-100"}`}>
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
        </div>
    );
};

export default SidebarPlayer;
