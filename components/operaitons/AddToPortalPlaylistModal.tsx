
import React, { useState, useEffect } from "react";
import { Song } from "@/app/types";
import { useSongs } from "@/app/contexts/SongsContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";

interface AddToPortalPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    song: Song | null;
}

export default function AddToPortalPlaylistModal({ isOpen, onClose, song }: AddToPortalPlaylistModalProps) {
    const { currentProfile, refreshData } = useSongs();
    const { user } = useAuth();
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchCategories();
        }
    }, [isOpen, user]);

    const fetchCategories = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('playlist')
            .select('id, name')
            .eq('user_id', user.id)
            .or('category_type.eq.custom,category_type.is.null')
            .order('created_at', { ascending: false });

        if (data) {
            setCategories(data);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !user) return;
        setIsCreating(true);

        try {
            const newId = uuidv4();
            const { error } = await supabase
                .from('playlist')
                .insert([{
                    id: newId,
                    name: newCategoryName.trim(),
                    user_id: user.id,
                    category_type: 'custom',
                    subtitle: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;

            toast.success("Yeni playlist oluşturuldu!");
            await fetchCategories();
            setSelectedCategoryId(newId);
            setShowCreateInput(false);
            setNewCategoryName("");
            // Trigger global refresh to update sidebar/main view
            await refreshData();
        } catch (error: any) {
            console.error("Error creating category:", error);
            toast.error("Playlist oluşturulamadı.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddToPlaylist = async () => {
        if (!song || !selectedCategoryId || !user) return;
        setIsLoading(true);

        try {
            // Create a copy of the song for the new category
            const newSong: Song = {
                id: uuidv4(),
                title: song.title,
                artist: song.artist,
                youtubeUrl: song.youtubeUrl,
                spotifyUrl: song.spotifyUrl,
                addedBy: user.id, // User owns this entry
                playlist_id: selectedCategoryId,
            };

            const { error } = await supabase.from('song').insert([newSong]);

            if (error) throw error;

            toast.success("Şarkı playlist'e eklendi!");
            await refreshData();
            onClose();
        } catch (error: any) {
            console.error("Error adding song to playlist:", error);
            toast.error("Şarkı eklenirken hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-2xl w-[400px] border border-gray-700 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white">Portal Playlist'e Ekle</h3>
                        {song && <p className="text-sm text-gray-400 mt-1">{song.title} - {song.artist}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faTimes} className="text-lg" />
                    </button>
                </div>

                <div className="space-y-3">
                    {!showCreateInput ? (
                        <>
                            {categories.length > 0 ? (
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">Playlist Seçin</label>
                                    <select
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                    Henüz hiç portal playlist'iniz yok.
                                </div>
                            )}

                            <button
                                onClick={() => setShowCreateInput(true)}
                                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} /> Yeni Playlist Oluştur
                            </button>
                        </>
                    ) : (
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 space-y-2">
                            <label className="text-xs text-gray-400">Yeni Playlist Adı</label>
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                                    placeholder="Örn: 90lar Pop"
                                />
                                <button
                                    onClick={handleCreateCategory}
                                    disabled={isCreating || !newCategoryName.trim()}
                                    className="btn bg-green-600 hover:bg-green-500 text-white text-xs px-3 rounded"
                                >
                                    {isCreating ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : "Ekle"}
                                </button>
                                <button
                                    onClick={() => setShowCreateInput(false)}
                                    className="btn bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 rounded"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleAddToPlaylist}
                        disabled={!selectedCategoryId || isLoading}
                        className="w-full btn bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? "Ekleniyor..." : "Seçili Playlist'e Ekle"}
                    </button>
                </div>
            </div>
        </div>
    );
}
