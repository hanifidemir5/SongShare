"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "../../../app/ui/Modal";

export default function RegisterModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!name || !cleanEmail || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Registered successfully!");
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register">
      <form className="flex flex-col gap-3" onSubmit={handleRegister}>
        <input
          className="input"
          placeholder="Name"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn mt-2" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </Modal>
  );
}
