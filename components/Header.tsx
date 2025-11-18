import { useSpotifyAuth } from "@/app/contexts/SpotifyAuthContext";
import LoginButtons from "./LoginButtons";
import { useYouTubeAuth } from "@/app/contexts/YoutubeAuthContext";
import { Profile } from "@/app/types";
import { useState } from "react";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

type Props = {
  onSearch: (q: string) => void;
  profileList: Profile[];
  currentProfile: Profile | null | undefined;
  setCurrentProfile: (profile: Profile) => void;
};

export default function Header({
  onSearch,
  currentProfile,
  profileList,
  setCurrentProfile,
}: Props) {
  const { isLoggedInWithSpotify, logoutWithSpotify } = useSpotifyAuth();
  const { isLoggedInWithYouTube, logoutWithYouTube } = useYouTubeAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSelect = (profile: Profile) => {
    setCurrentProfile(profile);
    setIsOpen(false);
  };

  const otherProfiles = profileList.filter(
    (profile) => profile.id !== currentProfile?.id
  );

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">
          Listen<span className="text-indigo-400">To</span>This
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Paylaş, keşfet ve sıradaki favorini bul ✨
        </p>
      </div>
      <input
        className="input md:w-80"
        placeholder="Ara: başlık / sanatçı / etiket"
        onChange={(e) => onSearch(e.target.value)}
      />
      <LoginButtons
        isSpotifyLoggedIn={isLoggedInWithSpotify}
        isYoutubeLoggedIn={isLoggedInWithYouTube}
        logoutSpotify={logoutWithSpotify}
        logoutYoutube={logoutWithYouTube}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
      <div className="relative inline-block text-left ">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="btn hover:!bg-none !px-4  text-sm flex items-center gap-2 "
        >
          <span>{currentProfile ? currentProfile.name : "Select User"}</span>
          <span className="hover:bg-[rgb(79_70_229/1)] transition-colors duration-300 delay-150 px-2 py-1 rounded">
            {isOpen ? (
              <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
            ) : (
              <FontAwesomeIcon icon={faArrowDown} className="w-4 h-4" />
            )}
          </span>
        </button>

        {isOpen && (
          <ul className="absolute right-0 mt-1 w-28 origin-top-right rounded-md p-2 bg-white shadow-lg ring-1 ring-black/10 divide-y divide-gray-100 z-50">
            {otherProfiles.map((Profile) => (
              <li key={Profile.id}>
                <button
                  onClick={() => handleSelect(Profile)}
                  className={`hover:bg-gray-100 text-left px-3  rounded-md text-black w-full  ${
                    Profile.id === currentProfile?.id ? "font-medium" : ""
                  }`}
                >
                  {Profile.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
