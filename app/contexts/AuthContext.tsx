import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  connectSpotify: () => Promise<void>;
  disconnectSpotify: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // NEW STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      const authUser = data.session?.user ?? null;

      setUser(authUser);
      setIsLoggedIn(Boolean(authUser)); // update state

      if (authUser) await fetchProfile(authUser.id);

      setLoading(false);
    };

    getInitialSession();

    // Listen for login/logout changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const authUser = session?.user ?? null;

        setUser(authUser);
        setIsLoggedIn(Boolean(authUser)); // update whenever auth changes

        if (authUser) await fetchProfile(authUser.id);
        else setProfile(null);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
  };

  // LOGOUT FUNCTION
  const logout = async () => {
    if (user?.is_spotify_connected == true) {
      await supabase
        .from("profiles")
        .update({
          is_spotify_connected: false,
        })
        .eq("id", user.id);
    }

    if (user?.is_youtube_connected == true) {
      await supabase
        .from("profiles")
        .update({
          is_youtube_connected: false,
        })
        .eq("id", user.id);
    }

    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setIsLoggedIn(false); // <--- important!
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isLoggedIn,
        logout,
        connectSpotify: async () => {},
        disconnectSpotify: async () => {},
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
