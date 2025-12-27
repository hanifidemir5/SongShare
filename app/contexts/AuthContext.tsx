import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

// Tip tanımlamalarını 'any'den kurtarmak iyi olur ama şimdilik böyle bırakıyorum.
interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  isLoggedIn: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  connectSpotify: () => Promise<void>;
  connectYouTube: () => Promise<void>;
  disconnectYouTube: () => Promise<void>;
  disconnectSpotify: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data.session?.user ?? null;

      setUser(authUser);
      setIsLoggedIn(Boolean(authUser));

      if (authUser) await fetchProfile(authUser.id);

      setLoading(false);
    };

    getInitialSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authUser = session?.user ?? null;

        setUser(authUser);
        setIsLoggedIn(Boolean(authUser));

        if (authUser) await fetchProfile(authUser.id);
        else setProfile(null);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [fetchProfile]);

  // --- DÜZELTİLDİ: Logout işlemi veritabanını sıfırlamamalı ---
  const logout = async () => {
    // Sadece tarayıcı tarafındaki tokenları temizle
    localStorage.removeItem("youtube_token");
    localStorage.removeItem("spotify_token");

    // Supabase oturumunu kapat
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setIsLoggedIn(false);

    // İsteğe bağlı: Kullanıcıyı anasayfaya yönlendir veya toast göster
    toast.info("Çıkış yapıldı.");
  };

  async function connectSpotify() {
    // Konsol logları hata ayıklama için kalabilir
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "spotify",
      options: {
        // Kullanıcı giriş yaptıktan sonra döneceği adres
        redirectTo: "http://localhost:3000/services/auth/spotify/callback",

        // İzinler (Scopes)
        scopes: [
          "user-read-email",
          "playlist-read-private",
          "playlist-modify-private",
          "playlist-modify-public",
          "playlist-read-collaborative",
        ].join(" "),

        // Ek parametreler
        queryParams: {
          show_dialog: "true", // Her seferinde hesap seçme/onay ekranını zorlar
        },
      },
    });

    if (error) {
      console.error("Spotify Giriş Hatası:", error.message);
    }
  }

  const disconnectSpotify = async () => {
    if (!profile?.id) return;

    await supabase
      .from("profiles")
      .update({ is_spotify_connected: false })
      .eq("id", profile.id);

    localStorage.removeItem("spotify_token");
    await fetchProfile(profile.id);
    toast.success("Spotify bağlantısı kaldırıldı!");
  };

  async function connectYouTube() {
    console.log("YouTube işlemi başlatılıyor...");

    // Ortak ayarlar (Hem login hem link için aynı)
    const options = {
      redirectTo: "http://localhost:3000/services/auth/youtube/callback",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      scopes: [
        "email",
        "profile",
        "https://www.googleapis.com/auth/youtube.readonly",
      ].join(" "),
    };

    // --- SENARYO 1: Kullanıcı Zaten Giriş Yapmışsa (Hesap Bağlama) ---
    if (user) {
      console.log("Mevcut kullanıcıya YouTube hesabı bağlanıyor...");
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: options,
      });
      if (error) console.error("YouTube Bağlama Hatası:", error);
    }

    // --- SENARYO 2: Kullanıcı Misafir ise (Giriş Yapma) ---
    else {
      console.log("YouTube ile giriş yapılıyor...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: options,
      });
      if (error) console.error("YouTube Giriş Hatası:", error);
    }
  }

  const disconnectYouTube = async () => {
    if (!profile?.id) return;

    await supabase
      .from("profiles")
      .update({ is_youtube_connected: false })
      .eq("id", profile.id);

    localStorage.removeItem("youtube_token");
    await fetchProfile(profile.id);
    toast.success("YouTube bağlantısı kaldırıldı!");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        fetchProfile,
        isLoggedIn,
        logout,
        connectSpotify,
        connectYouTube,
        disconnectYouTube,
        disconnectSpotify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
