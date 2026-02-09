"use client";

import { useState } from "react";
import SpotifyConnectButton from "./SpotifyConnectButton";
import { useAuth } from "@/contexts/AuthContext";
import YouTubeConnectButton from "./YoutubeConnectButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faUser } from "@fortawesome/free-solid-svg-icons";

export default function LoginButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const { loading, isLoggedIn, logout, profile } = useAuth();

  if (loading) {
    console.log("DEBUG: LoginButtons - Still loading...");
    return <div className="text-white text-xs animate-pulse">Yükleniyor...</div>;
  }

  // console.log("DEBUG: LoginButtons - Rendered", { isLoggedIn, profileName: profile?.name });

  return (
    <div className="relative inline-block text-left z-50">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`btn flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-xl border transition-all duration-300 h-full ${isLoggedIn
          ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/20"
          : "bg-gray-800 border-white/10 text-white hover:bg-gray-700"
          }`}
      >
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isLoggedIn ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-400"
          }`}>
          <FontAwesomeIcon icon={faUser} className="text-xs sm:text-sm" />
        </div>

        <div className="flex flex-col items-start min-w-[60px] sm:min-w-[100px]">
          <span className="text-[10px] uppercase tracking-wider opacity-60 font-semibold hidden sm:block">
            {isLoggedIn ? "Hesabım" : "Misafir"}
          </span>
          <span className="text-xs sm:text-sm font-medium">
            {isLoggedIn ? (profile?.name || "Kullanıcı") : "Giriş Yap"}
          </span>
        </div>

        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs opacity-50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="fixed right-4 mt-3 w-[calc(100vw-2rem)] sm:absolute sm:right-0 sm:w-72 max-w-72 origin-top-right rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200"
          >
            {!isLoggedIn ? (
              <div className="space-y-3">
                <div className="px-1">
                  <h3 className="text-sm font-medium text-white">Hoş Geldiniz</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Devam etmek için bir platform seçin</p>
                </div>

                <div className="space-y-2">
                  {/* Reuse components but wrapper them for consistent width/style if needed, 
                        or user 'SpotifyConnectButton' directly if it looks good. 
                        Based on previous file read, they have their own styles. 
                        Let's wrap them in a simple div for spacing.
                    */}
                  <div className="transform transition-transform active:scale-95">
                    <SpotifyConnectButton />
                  </div>
                  <div className="transform transition-transform active:scale-95">
                    <YouTubeConnectButton />
                  </div>
                </div>

                <p className="text-[10px] text-center text-gray-500 pt-2">
                  Giriş yaparak kullanım koşullarını kabul etmiş olursunuz.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
                  Hesap İşlemleri
                </p>


                <button
                  className="w-full text-left px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium flex items-center gap-2"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
