import { supabase } from "@/lib/supabaseClient";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  try {
    // 1. Create account in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name, // custom user field stored in auth.user.user_metadata
        },
      },
    });

    if (error) throw error;

    return {
      success: true,
      user: data.user,
    };
  } catch (err: any) {
    console.error("Register error:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}
