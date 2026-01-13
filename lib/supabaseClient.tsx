import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL veya Key bulunamadı! .env dosyasını kontrol et."
  );
}

// İşte API Key buraya girilmeli. Buraya girdikten sonra
// connectSpotify gibi fonksiyonlar bu key'i otomatik kullanır.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
