import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

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
  const [isLoggedIn, setIsLoggedIn] = useState(false); // --- FIX 1: Wrap fetchProfile in useCallback for stability ---

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  }, []); // Empty dependency array means this function is stable

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
    ); // Add fetchProfile to dependencies to satisfy exhaustive-deps lint rule

    return () => subscription.subscription.unsubscribe();
  }, [fetchProfile]); // LOGOUT FUNCTION

  const logout = async () => {
    if (profile?.is_spotify_connected) {
      await supabase
        .from("profiles")
        .update({
          is_spotify_connected: false,
          is_youtube_connected: false,
        })
        .eq("id", user.id);
    }

    if (profile?.is_youtube_connected) {
      await supabase
        .from("profiles")
        .update({
          is_youtube_connected: false,
        })
        .eq("id", user.id);
    }

    localStorage.removeItem("youtube_token");
    localStorage.removeItem("spotify_token");

    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setIsLoggedIn(false);
  };

  async function connectSpotify() {
    await supabase.auth.linkIdentity({
      provider: "spotify",
      options: {
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
      },
    });
  }

  const disconnectSpotify = async () => {
    await supabase
      .from("profiles")
      .update({
        is_spotify_connected: false,
      })
      .eq("id", profile?.id);

    localStorage.removeItem("spotify_token");

    await fetchProfile(profile?.id);

    toast.success("Spotify bağlantısı kaldırıldı!");
  };

  async function connectYouTube() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
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
      },
    });
  }

  const disconnectYouTube = async () => {
    await supabase
      .from("profiles")
      .update({
        is_youtube_connected: false,
      })
      .eq("id", profile?.id);

    localStorage.removeItem("youtube_token");

    await fetchProfile(profile?.id);
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
            {children}   {" "}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
