"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCog } from "@fortawesome/free-solid-svg-icons";
import SpotifyConnectButton from "@/components/auth/SpotifyConnectButton";
import YoutubeConnectButton from "@/components/auth/YoutubeConnectButton";
import GroupManagement from "@/components/GroupManagement";

function ConnectionsSection() {
    const searchParams = useSearchParams();
    const highlight = searchParams.get("highlight");

    return (
        <section
            id="connections"
            className={`bg-gray-900/50 border rounded-xl p-6 transition-all duration-1000 ${highlight === "connections"
                    ? "border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/50"
                    : "border-white/10"
                }`}
        >
            <h2 className="text-xl font-bold mb-4 text-indigo-400">Hesap Bağlantıları</h2>
            <p className="text-sm text-gray-400 mb-6">
                Müzik platformlarını bağlayarak playlistlerini senkronize edebilir ve şarkı paylaşabilirsin.
            </p>

            <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="text-green-500">Spotify</span>
                    </h3>
                    <SpotifyConnectButton />
                </div>

                <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="text-red-500">YouTube</span>
                    </h3>
                    <YoutubeConnectButton />
                </div>
            </div>
        </section>
    );
}

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-24">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <Link
                        href="/"
                        className="btn bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Geri Dön</span>
                    </Link>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FontAwesomeIcon icon={faCog} className="text-gray-400" />
                        Ayarlar
                    </h1>
                </div>

                {/* content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left Column: Account Connections */}
                    <div className="space-y-6">
                        <Suspense fallback={<div>Yükleniyor...</div>}>
                            <ConnectionsSection />
                        </Suspense>
                    </div>

                    {/* Right Column: Group Management */}
                    <div className="space-y-6">
                        <section>
                            <GroupManagement />
                        </section>
                    </div>

                </div>

            </div>
        </div>
    );
}
