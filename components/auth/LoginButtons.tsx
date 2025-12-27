"use client";

import { useState } from "react";
import SpotifyConnectButton from "./SpotifyConnectButton";
import { useAuth } from "@/app/contexts/AuthContext";
import YouTubeConnectButton from "./YoutubeConnectButton";

export default function LoginButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const { loading, isLoggedIn, logout, profile } = useAuth();

  // Yükleme sırasında basit bir yazı veya spinner
  if (loading) return <div className="text-white">...</div>;

  return (
    <div className="relative inline-block text-left">
      {/* Ana Buton: Giriş yapılmışsa isim, yapılmamışsa genel başlık */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn w-48 text-white px-6 py-2 rounded-lg shadow-md bg-indigo-600 hover:bg-indigo-700 transition-colors"
      >
        {isLoggedIn ? profile?.name || "Hesabım" : "Giriş Yap / Bağlan"}
      </button>

      {/* Dropdown Menü */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-[rgb(79_70_229/1)] shadow-lg ring-1 ring-black/10 z-50 p-2"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex flex-col gap-2">
            {/* 1. KISIM: PLATFORM BUTONLARI (Her zaman görünür) */}
            {/* Bu butonlar kendi içlerinde "Bağlan" veya "Bağlantıyı Kes" durumunu yönetir */}
            <SpotifyConnectButton />
            <YouTubeConnectButton />

            {/* 2. KISIM: ÇIKIŞ BUTONU (Sadece giriş yapılmışsa görünür) */}
            {isLoggedIn && (
              <>
                {/* Ayırıcı Çizgi */}
                <div className="border-t border-indigo-400/30 my-1"></div>

                <button
                  className="w-full text-left px-3 py-2 rounded-md text-white hover:bg-red-500 transition-colors text-sm font-medium"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  Çıkış Yap
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
