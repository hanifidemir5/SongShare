"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type Person = "Fatma" | "Hanifi";

type PersonContextType = {
  person: Person;
  togglePerson: () => void;
  setPerson: (p: Person) => void;
};

const PersonContext = createContext<PersonContextType | undefined>(undefined);

export function PersonProvider({ children }: { children: ReactNode }) {
  const [person, setPerson] = useState<Person>("Fatma");

  const togglePerson = () => {
    setPerson((prev) => (prev === "Fatma" ? "Hanifi" : "Fatma"));
  };

  return (
    <PersonContext.Provider value={{ person, togglePerson, setPerson }}>
      {children}
    </PersonContext.Provider>
  );
}

// Hook
export function usePerson() {
  const context = useContext(PersonContext);
  if (!context) throw new Error("usePerson must be used within PersonProvider");
  return context;
}
