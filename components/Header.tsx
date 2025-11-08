import { useSpotifyAuth } from "@/app/contexts/SpotifyAuthContext";
import LoginButtons from "./LoginButtons";
import { useYouTubeAuth } from "@/app/contexts/YoutubeAuthContext";
import { User } from "@/app/types";
import { useState } from "react";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
type Props = {
  onSearch: (q: string) => void;
  userList: User[];
  currentUser: User | null | undefined;
  setCurrentUser: (user: User) => void;
};

export default function Header({
  onSearch,
  currentUser,
  userList,
  setCurrentUser,
}: Props) {
  const { isLoggedInWithSpotify, logoutWithSpotify } = useSpotifyAuth();
  const { isLoggedInWithYouTube, logoutWithYouTube } = useYouTubeAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (user: User) => {
    setCurrentUser(user);
    setIsOpen(false);
  };

  const otherUsers = userList.filter((user) => user.id !== currentUser?.id);

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
      />
      <div className="relative inline-block text-left">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="btn hover:!bg-none !px-4 !py-3 text-sm flex items-center gap-2"
        >
          <span>{currentUser ? currentUser.name : "Select User"}</span>
          <span className="hover:bg-[rgb(79_70_229/1)] transition-colors duration-300 delay-150 px-2 py-1 rounded">
            {isOpen ? (
              <FontAwesomeIcon icon={faArrowUp} className="w-4 h-4" />
            ) : (
              <FontAwesomeIcon icon={faArrowDown} className="w-4 h-4" />
            )}
          </span>
        </button>

        {isOpen && (
          <ul className="absolute flex flex-col left-0 mt-1 w-full border border-[rgb(131,127,204)] gap-1 shadow-md z-10">
            {otherUsers.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => handleSelect(user)}
                  className={`btn block !rounded-none !w-full text-left px-3 py-2 text-sm  ${
                    user.id === currentUser?.id ? "font-medium" : ""
                  }`}
                >
                  {user.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
