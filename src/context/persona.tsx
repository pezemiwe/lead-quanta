import { createContext, useContext, useState, type ReactNode } from "react";

export interface Persona {
  name: string;
  role: string;
  avatar: string;
}

interface PersonaContextValue {
  persona: Persona;
  setPersona: (p: Persona) => void;
}

const STORAGE_KEY = "aq_persona";

const EMPTY: Persona = { name: "", role: "", avatar: "" };

function loadPersona(): Persona {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persona;
  } catch {
    // ignore malformed data
  }
  return EMPTY;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, _setPersona] = useState<Persona>(loadPersona);

  const setPersona = (p: Persona) => {
    _setPersona(p);
    if (p.name) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}
