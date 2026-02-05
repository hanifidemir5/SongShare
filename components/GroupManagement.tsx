"use client";
import React, { useState } from 'react';
import { useSongs } from '@/contexts/SongsContext';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'react-toastify';

export default function GroupManagement() {
    const { profile } = useAuth();
    const { createGroup, joinGroup, leaveGroup, currentProfile, groupDetails } = useSongs();
    const [joinCode, setJoinCode] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [mode, setMode] = useState<'view' | 'join' | 'create'>('view');

    if (!profile) return null;

    // User ALREADY has a group
    if (currentProfile?.group_id) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Grubum</h3>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-mono">
                        {currentProfile.group_role === 'admin' ? 'Yönetici' : 'Üye'}
                    </span>
                </div>

                <div className="bg-black/40 rounded-lg p-4 mb-6">
                    <p className="text-gray-400 text-sm mb-1">Davet Kodu</p>
                    <div className="flex items-center gap-3">
                        <code className="text-2xl font-mono text-indigo-400 tracking-wider font-bold">
                            {groupDetails?.code || '******'}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(groupDetails?.code || '');
                                toast.success("Kopyalandı!");
                            }}
                            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                        >
                            Kopyala
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Arkadaşlarına bu kodu göndererek gruba davet et.</p>
                </div>

                <button
                    onClick={() => {
                        if (confirm("Gruptan ayrılmak istediğine emin misin?")) {
                            leaveGroup();
                        }
                    }}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors text-sm font-medium"
                >
                    Gruptan Ayrıl
                </button>
            </div>
        );
    }

    // User has NO group
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Bir Gruba Katıl</h3>
            <p className="text-gray-400 text-sm mb-6">Arkadaşlarınla müzik paylaşmak için bir grup oluştur veya katıl.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Create Section */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-colors">
                    <h4 className="font-semibold text-indigo-400 mb-4">Grup Oluştur</h4>
                    <input
                        type="text"
                        placeholder="Grup Adı"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-3"
                    />
                    <button
                        onClick={() => createGroup(newGroupName)}
                        disabled={!newGroupName.trim()}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Oluştur
                    </button>
                </div>

                {/* Join Section */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-green-500/50 transition-colors">
                    <h4 className="font-semibold text-green-400 mb-4">Gruba Katıl</h4>
                    <input
                        type="text"
                        placeholder="Grup ID veya Davet Kodu"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 mb-3 font-mono"
                    />
                    <button
                        onClick={() => joinGroup(joinCode.trim())}
                        disabled={joinCode.trim().length < 6}
                        className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Katıl
                    </button>
                </div>
            </div>
        </div>
    );
}
