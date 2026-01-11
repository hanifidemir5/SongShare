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
      try {
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user ?? null;

        setUser(authUser);
        setIsLoggedIn(Boolean(authUser));

        if (authUser) {
          try {
            await fetchProfile(authUser.id);
          } catch (fetchError) {
            console.error("Profile fetch error during init:", fetchError);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Expose a troubleshooting function to window
    (window as any).resetSession = async () => {
      console.log("Resetting session...");
      localStorage.clear();
      await supabase.auth.signOut();
      window.location.reload();
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
    try {
      toast.info("Çıkış yapılıyor...");

      // 0. Disconnect Providers (Requested: "logout from all platforms")
      // This ensures next login is fresh
      if (profile?.is_spotify_connected) await disconnectSpotify();
      if (profile?.is_youtube_connected) await disconnectYouTube();

      // 1. Immediate Local Cleanup (Optimistic UI)
      setUser(null);
      setProfile(null);
      setIsLoggedIn(false);

      // 2. Clear Tokens
      localStorage.removeItem("youtube_token");
      localStorage.removeItem("spotify_token");
      // Optional: Clear everything if we want to be nuclear
      // localStorage.clear(); 

      // 3. Attempt Server SignOut with Timeout
      // We don't want to block the user if Supabase is unreachable
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));

      await Promise.race([signOutPromise, timeoutPromise]);

    } catch (error) {
      console.error("Logout error (ignored):", error);
    } finally {
      // 4. Always Reload to reset application state
      window.location.reload();
    }
  };

  async function connectSpotify() {
    // Check if we are already linked (to prevent multiple links)
    const isSpotifyLinked = user?.identities?.some(
      (id: any) => id.provider === "spotify"
    );

    const options = {
      redirectTo: "http://localhost:3000/services/auth/spotify/callback",
      scopes: [
        "user-read-email",
        "playlist-read-private",
        "playlist-modify-private",
        "playlist-modify-public",
        "playlist-read-collaborative",
      ].join(" "),
      queryParams: {
        show_dialog: "true",
      },
    };

    if (user) {
      if (isSpotifyLinked) {
        console.log("User already linked to Spotify. Refreshing session (SignIn)...");
        // Refresh Logic
        await supabase.auth.signInWithOAuth({
          provider: "spotify",
          options: options,
        });
      } else {
        // Not linked -> Use LinkIdentity

        // SAFETY CHECK: Store current user ID to verify in callback
        if (typeof window !== "undefined") {
          localStorage.setItem("latest_link_user_id", user.id);
        }

        const { error } = await supabase.auth.linkIdentity({
          provider: "spotify",
          options: options,
        });

        if (error) {
          console.error("Spotify Bağlama Hatası:", error);
        }
      }
    } else {
      // Guest Login
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "spotify",
        options: options,
      });
      if (error) console.error("Spotify Giriş Hatası:", error);
    }
  }

  const disconnectSpotify = async () => {
    if (!profile?.id) return;

    // 1. Unlink from Supabase Auth
    const spotifyIdentity = user?.identities?.find(
      (id: any) => id.provider === "spotify"
    );
    console.log("DEBUG: Spotify Identity Full Object:", JSON.stringify(spotifyIdentity, null, 2));

    let identityUUID = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (spotifyIdentity?.id && uuidRegex.test(spotifyIdentity.id)) {
      identityUUID = spotifyIdentity.id;
    } else if (spotifyIdentity?.identity_id && uuidRegex.test(spotifyIdentity.identity_id)) {
      identityUUID = spotifyIdentity.identity_id;
    }

    if (identityUUID) {
      const { error } = await supabase.auth.unlinkIdentity(identityUUID);
      if (error) console.error("Spotify Unlink Error:", error);
    } else {
      console.warn("DEBUG: Could not find a valid UUID for Spotify Identity. Skipping unlinkIdentity to prevent crash.");
    }

    // 2. Update Profile
    await supabase
      .from("profiles")
      .update({ is_spotify_connected: false })
      .eq("id", profile.id);

    // 3. Cleanup Local
    localStorage.removeItem("spotify_token");
    await fetchProfile(profile.id);
    toast.success("Spotify bağlantısı kaldırıldı!");

    // Auto-logout check
    if (!profile.is_youtube_connected) {
      setTimeout(() => logout(), 1000);
    }
  };

  async function connectYouTube() {
    const options = {
      redirectTo: "http://localhost:3000/services/auth/youtube/callback",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      scopes: [
        "email",
        "profile",
        "https://www.googleapis.com/auth/youtube",
      ].join(" "),
    };

    // --- SENARYO 1: Kullanıcı Zaten Giriş Yapmışsa (Hesap Bağlama) ---
    if (user) {
      // SAFETY CHECK: Store current user ID to verify in callback
      // This is crucial because if we fallback to "SignIn" in the callback, 
      // we need to know if we accidentally switched users.
      if (typeof window !== "undefined") {
        localStorage.setItem("latest_link_user_id", user.id);
      }

      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: options,
      });
      if (error) console.error("YouTube Bağlama Hatası:", error);
    }

    // --- SENARYO 2: Kullanıcı Misafir ise (Giriş Yapma) ---
    else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: options,
      });
      if (error) console.error("YouTube Giriş Hatası:", error);
    }
  }

  const disconnectYouTube = async () => {
    if (!profile?.id) return;

    // 1. Unlink from Supabase Auth
    const googleIdentity = user?.identities?.find(
      (id: any) => id.provider === "google"
    );
    console.log("DEBUG: Google Identity Full Object:", JSON.stringify(googleIdentity, null, 2));

    let identityUUID = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (googleIdentity?.id && uuidRegex.test(googleIdentity.id)) {
      identityUUID = googleIdentity.id;
    } else if (googleIdentity?.identity_id && uuidRegex.test(googleIdentity.identity_id)) {
      identityUUID = googleIdentity.identity_id;
    }

    if (identityUUID) {
      console.log("DEBUG: Found valid UUID for Unlink:", identityUUID);
      const { error } = await supabase.auth.unlinkIdentity(identityUUID);
      if (error) console.error("YouTube Unlink Error:", error);
    } else {
      console.warn("DEBUG: Could not find a valid UUID for Google Identity. Skipping unlinkIdentity to prevent crash.");
    }

    // 2. Update Profile
    await supabase
      .from("profiles")
      .update({ is_youtube_connected: false })
      .eq("id", profile.id);

    // 3. Cleanup Local
    localStorage.removeItem("youtube_token");
    await fetchProfile(profile.id);
    toast.success("YouTube bağlantısı kaldırıldı!");

    // Auto-logout check
    if (!profile.is_spotify_connected) {
      setTimeout(() => logout(), 1000);
    }
  };

  // Expose functions to window (Safe location)
  useEffect(() => {
    (window as any).disconnectSpotify = disconnectSpotify;
    (window as any).disconnectYouTube = disconnectYouTube;
    (window as any).resetSession = async () => {
      console.log("Resetting session...");
      localStorage.clear();
      await supabase.auth.signOut();
      window.location.reload();
    };
  }, [disconnectSpotify, disconnectYouTube]);

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
