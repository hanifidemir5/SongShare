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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    console.log("Registered:", data);
    onClose(); // optional: close modal after registering
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
