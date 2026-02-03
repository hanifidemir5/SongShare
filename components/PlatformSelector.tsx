import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";

type Platform = "spotify" | "youtube";

interface PlatformSelectorProps {
    onSelect: (platform: Platform) => void;
    showSpotify?: boolean;
    showYoutube?: boolean;
    className?: string;
    selectedPlatform?: Platform | null;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
    onSelect,
    showSpotify = false,
    showYoutube = false,
    className = "",
    selectedPlatform
}) => {
    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            {showSpotify && (
                <button
                    onClick={() => onSelect("spotify")}
                    className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#1DB954]/5 border hover:bg-[#1DB954]/10 hover:border-[#1DB954]/50 transition-all duration-300 ${selectedPlatform === "spotify"
                            ? "border-[#1DB954] ring-1 ring-[#1DB954] bg-[#1DB954]/10"
                            : "border-[#1DB954]/20"
                        }`}
                >
                    <FontAwesomeIcon
                        icon={faSpotify}
                        className="w-16 h-16 text-[#1DB954] drop-shadow-lg group-hover:scale-110 transition-transform"
                    />
                    <div className="font-bold text-lg text-white">Spotify</div>
                </button>
            )}

            {showYoutube && (
                <button
                    onClick={() => onSelect("youtube")}
                    className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#FF0000]/5 border hover:bg-[#FF0000]/10 hover:border-[#FF0000]/50 transition-all duration-300 ${selectedPlatform === "youtube"
                            ? "border-[#FF0000] ring-1 ring-[#FF0000] bg-[#FF0000]/10"
                            : "border-[#FF0000]/20"
                        }`}
                >
                    <FontAwesomeIcon
                        icon={faYoutube}
                        className="w-16 h-16 text-[#FF0000] drop-shadow-lg group-hover:scale-110 transition-transform"
                    />
                    <div className="font-bold text-lg text-white">YouTube</div>
                </button>
            )}
        </div>
    );
};

export default PlatformSelector;
