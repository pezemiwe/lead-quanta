import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type EntityId = "lacl" | "lpfa" | "lhl" | "lcil" | "consolidated";

export interface Entity {
  id: EntityId;
  shortName: string;
  name: string;
  regulator: string;
  aum: number;
  colour: string;
}

export const ENTITIES: Entity[] = [
  {
    id: "lacl",
    shortName: "LACL",
    name: "Leadway Assurance Company Limited",
    regulator: "NAICOM",
    aum: 298_000_000_000,
    colour: "#F7941D",
  },
  {
    id: "lpfa",
    shortName: "LPFA",
    name: "Leadway Pensure PFA Limited",
    regulator: "PENCOM",
    aum: 142_000_000_000,
    colour: "#1E3A5F",
  },
  {
    id: "lhl",
    shortName: "LHL",
    name: "Leadway Health Limited",
    regulator: "NHIA",
    aum: 18_000_000_000,
    colour: "#1A7A4A",
  },
  {
    id: "lcil",
    shortName: "LCIL",
    name: "Leadway Capital & Investments Limited",
    regulator: "SEC",
    aum: 54_000_000_000,
    colour: "#7A5A1A",
  },
  {
    id: "consolidated",
    shortName: "All Entities",
    name: "Leadway Holdings Group — Consolidated",
    regulator: "Multi-Regulator",
    aum: 512_000_000_000,
    colour: "#3A3A6A",
  },
];

const STORAGE_KEY = "lq_entity";

function loadEntity(): EntityId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw as EntityId) ?? "lacl";
  } catch {
    return "lacl";
  }
}

interface EntityContextValue {
  entity: Entity;
  setEntityId: (id: EntityId) => void;
  entities: Entity[];
}

const EntityContext = createContext<EntityContextValue | null>(null);

export function EntityProvider({ children }: { children: ReactNode }) {
  const [entityId, setEntityIdState] = useState<EntityId>(loadEntity);

  const setEntityId = (id: EntityId) => {
    setEntityIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  const entity = ENTITIES.find((e) => e.id === entityId) ?? ENTITIES[0];

  return (
    <EntityContext.Provider value={{ entity, setEntityId, entities: ENTITIES }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity must be used within EntityProvider");
  return ctx;
}
