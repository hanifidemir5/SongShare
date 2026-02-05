import { supabase } from "@/lib/supabaseClient";

/**
 * Save or update user token in the database
 */
export async function saveUserToken(
    userId: string,
    provider: "spotify" | "google" | "youtube", // 'youtube' is often treated as 'google' in Supabase, but keeping flexible
    accessToken: string,
    refreshToken?: string | null
) {
    if (!userId || !accessToken) return;

    // Normalize provider name if needed (e.g. youtube -> google)
    // For now assuming we store as passed, or match Supabase provider names.
    // Common convention: stick to what Supabase returns or strict enums.

    const { error } = await supabase.from("user_tokens").upsert(
        {
            user_id: userId,
            provider: provider,
            access_token: accessToken,
            refresh_token: refreshToken || null,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, provider" }
    );

    if (error) {
        console.error(`Error saving ${provider} token:`, error);
    } else {
        console.log(`${provider} token saved to DB.`);
    }
}

/**
 * Retrieve user token from the database
 */
export async function getUserToken(
    userId: string,
    provider: "spotify" | "google" | "youtube"
) {
    const { data, error } = await supabase
        .from("user_tokens")
        .select("access_token, refresh_token, updated_at")
        .eq("user_id", userId)
        .eq("provider", provider)
        .single();

    if (error || !data) {
        // console.warn(`No ${provider} token found in DB for user ${userId}`);
        return null;
    }

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        updatedAt: data.updated_at,
    };
}
