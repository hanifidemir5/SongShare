// /app/helpers/authUtils.ts

import { supabase } from "@/lib/supabaseClient";

// Tipi zorlamak yerine ExtendedUserIdentity tipini dışarıda tanımlayabiliriz
// (Daha önceki yanıtlarda önerilen en iyi yöntem, ancak şimdilik 'any' ile devam edilebilir).

/**
 * Spotify Access Token ve Refresh Token'ı Supabase oturumundan çeker.
 * @returns {Promise<{accessToken: string | null, refreshToken: string | null}>} Token nesnesi
 */
export async function getSpotifyTokens() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      console.error(
        "Kullanıcı oturumu bulunamadı veya bir hata oluştu:",
        error?.message
      );
      return { accessToken: null, refreshToken: null };
    }

    const accessToken = data.session?.provider_token ?? null;
    const refreshToken = data.session?.provider_refresh_token ?? null;

    return { accessToken, refreshToken };
  } catch (err) {
    console.error("Spotify token alma sırasında beklenmeyen hata:", err);
    return { accessToken: null, refreshToken: null };
  }
}

export async function getYouTubeTokens() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session) return { accessToken: null, refreshToken: null };

  const accessToken = data.session.provider_token ?? null;
  const refreshToken = data.session.provider_refresh_token ?? null;

  return { accessToken, refreshToken };
}
