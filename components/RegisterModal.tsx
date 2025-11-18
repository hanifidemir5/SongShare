"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "../app/ui/Modal";

export default function RegisterModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Local state for inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const { data: existingUser, error: findError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      alert("Email kullanılıyor.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: { name },
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      alert("Something went wrong, no user returned.");
      return;
    }

    // Create profile row
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id, // uuid from auth.users
      email: email,
      name: name,
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      alert("Registered, but failed to create profile.");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register">
      <div className="flex flex-col gap-3">
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn mt-2" onClick={handleRegister}>
          Register
        </button>
      </div>
    </Modal>
  );
}
