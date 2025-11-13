import { supabase } from "@/lib/supabaseClient";
import { randomInt, randomUUID } from "crypto";

export async function registerOrGetUser(profile: any) {
  // First check if user exists
  const { data: existingUser, error: findError } = await supabase
    .from("User")
    .select("*")
    .eq("spotify_id", profile.id)
    .maybeSingle();

  if (findError) {
    console.error("Error querying user:", findError);
    return null;
  }

  if (existingUser) return existingUser;

  // Insert new user
  const { data: newUser, error: insertError } = await supabase
    .from("User")
    .insert({
      id: Math.floor(Math.random() * 256),
      spotify_id: profile.id,
      name: profile.display_name,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting user:", insertError);
    return null;
  }

  return newUser;
}
