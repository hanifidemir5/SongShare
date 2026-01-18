import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL veya Key bulunamadı! .env dosyasını kontrol et."
  );
}

// Basic Supabase Client - Simplified Configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * PREVIOUS ENHANCED CONFIGURATION (COMMENTED OUT):
 * 
 * If you need to re-enable enhanced session management, uncomment below:
 * 
 * export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
 *   auth: {
 *     // Extended timeout for initial session detection (default: 10s, now: 30s)
 *     detectSessionInUrl: true,
 *     flowType: 'pkce', // More secure auth flow
 *     
 *     // Session persistence (stores in localStorage by default)
 *     persistSession: true,
 *     
 *     // Auto-refresh tokens before they expire
 *     autoRefreshToken: true,
 *     
 *     // Storage key (default is fine, but explicit is better)
 *     storageKey: 'supabase.auth.token',
 *   },
 *   global: {
 *     headers: {
 *       'x-application-name': 'listentothis',
 *     },
 *   },
 *   // Network timeout for all requests (default: 10s, now: 30s for better reliability)
 *   // This applies to all Supabase operations, not just auth
 *   db: {
 *     schema: 'public',
 *   },
 *   realtime: {
 *     params: {
 *       eventsPerSecond: 10,
 *     },
 *   },
 * });
 * 
 * SESSION TOKEN MANAGEMENT - Handled Automatically by Supabase:
 * ✅ Access tokens (expire after 1 hour) - auto-refreshed
 * ✅ Refresh tokens - stored securely
 * ✅ Token rotation - happens automatically
 * ✅ Session persistence - across page reloads
 * 
 * You DON'T need to manually:
 * - Refresh tokens
 * - Store tokens (Supabase uses secure storage)
 * - Handle token expiration
 */
