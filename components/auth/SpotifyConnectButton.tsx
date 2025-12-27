"use client";
import { useAuth } from "@/app/contexts/AuthContext";
import React from "react";

// Props interface'ine artık gerek yok, çünkü veriyi context'ten alacağız.

const SpotifyConnectButton = () => {
  // 'profile' verisini de buradan çekiyoruz
  const { loading, connectSpotify, disconnectSpotify, profile } = useAuth();

  // Yükleme sırasında butonun kaybolmaması için basit bir loading durumu veya
  // butonun disabled hali daha şık olabilir ama şimdilik senin yapını koruyorum.
  if (loading)
    return <p className="text-xs text-gray-500">Kontrol ediliyor...</p>;

  // Bağlantı durumunu kontrol et
  const isConnected = profile?.is_spotify_connected;

  return (
    <div className="flex w-full">
      <div className="flex flex-col w-full">
        <button
          className={
            isConnected
              ? "hover:bg-red-500 hover:text-white bg-gray-100 text-left px-3 py-2 rounded-md text-green-700 transition-colors"
              : "bg-green-600 hover:bg-green-500 text-left px-3 py-2 rounded-md text-white transition-colors"
          }
          onClick={async () => {
            // Fonksiyonları asenkron çağırıp hata yönetimi eklemek iyi bir pratiktir
            if (isConnected) {
              await disconnectSpotify();
            } else {
              await connectSpotify();
            }
          }}
        >
          {isConnected ? "Spotify Bağlantısını Kes" : "Spotify İle Bağlan"}
        </button>
      </div>
    </div>
  );
};

export default SpotifyConnectButton;
