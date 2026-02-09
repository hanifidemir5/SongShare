import Link from "next/link";
import LoginButtons from "./auth/LoginButtons";
import { Profile } from "@/types";
import { useState } from "react";
import { faArrowUp, faArrowDown, faCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


type Props = {
  onSearch: (q: string) => void;
  profileList: Profile[];
  currentProfile: Profile | null | undefined;
  setCurrentProfile: (profile: Profile) => void;
  user: any;
};

export default function Header({
  onSearch,
  currentProfile,
  profileList,
  setCurrentProfile,
  user,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (profile: Profile) => {
    setCurrentProfile(profile);
    setIsOpen(false);
  };

  // Filter to only show profiles in the same group (if user has a group)
  const groupFilteredProfiles = currentProfile?.group_id
    ? profileList.filter(
      (profile) => profile.group_id === currentProfile.group_id
    )
    : profileList;

  const otherProfiles = groupFilteredProfiles.filter(
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
        <div className="mt-2 text-xs">
          {!user ? (
            <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
              Misafir Modu (Giriş Yapılmadı)
            </span>
          ) : user.id === currentProfile?.id ? (
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Kendi Profilin
            </span>
          ) : (
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              Başkasının Profilini İnteliyorsun
            </span>
          )}
        </div>
      </div>
      <input
        className="input md:w-80"
        placeholder="Ara: başlık / sanatçı / etiket"
        onChange={(e) => onSearch(e.target.value)}
      />
      {/* Action buttons container - all aligned */}
      <div className="flex items-stretch gap-2 sm:gap-3 flex-wrap md:flex-nowrap justify-end">
        <LoginButtons />
        {/* Only show profile selector for logged in users */}
        {user && (
          <>
            <div className="relative inline-block text-left z-40">
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="btn !bg-gray-800 hover:!bg-gray-700 text-white !px-2 sm:!px-4 py-2 text-sm flex items-center gap-2 sm:gap-3 rounded-xl border border-white/5 transition-all duration-200 h-full"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold hidden sm:block">
                    Görüntülenen
                  </span>
                  <span className="font-medium text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate">
                    {currentProfile ? currentProfile.name : "Seçiniz"}
                  </span>
                </div>
                <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                  <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3 text-indigo-400" />
                </span>
              </button>

              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-64 origin-top-right rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-white/5 mb-2">
                      <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                        Profil Seç
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Grup üyelerinin listelerini görüntüle
                      </p>
                    </div>

                    <div className="max-h-64 overflow-y-auto custom-scrollbar px-2 space-y-1">
                      {groupFilteredProfiles.map((Profile) => (
                        <button
                          key={Profile.id}
                          onClick={() => handleSelect(Profile)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group ${Profile.id === currentProfile?.id
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                          <span className="font-medium">{Profile.name}</span>
                          {Profile.id === currentProfile?.id && (
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link href="/settings" className="btn !bg-gray-800 hover:!bg-gray-700 text-white !px-2 sm:!px-3 rounded-xl border border-white/5 transition-all duration-200 flex items-center self-stretch" title="Ayarlar">
              <FontAwesomeIcon icon={faCog} className="w-4 h-4 text-gray-400" />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
