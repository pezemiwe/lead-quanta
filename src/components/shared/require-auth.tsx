import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { usePersona } from "../../context/persona";
import { getModuleAccess, type ModuleId } from "../../context/permissions";

/** Redirects to /login if no persona is set (not logged in). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { persona } = usePersona();
  if (!persona.name) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Route guard for individual modules.
 * - Not logged in → /login
 * - Access "none" → /modules (access denied)
 * - Access "read-only" → renders with a read-only banner
 * - Access "full" → renders normally
 */
export function ProtectedModule({
  moduleId,
  children,
}: {
  moduleId: ModuleId;
  children: ReactNode;
}) {
  const { persona } = usePersona();
  if (!persona.name) return <Navigate to="/login" replace />;

  const access = getModuleAccess(persona.role, moduleId);
  if (access === "none") return <Navigate to="/modules" replace />;

  return (
    <>
      {access === "read-only" && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-800">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          Read-Only Access — Your role ({persona.role}) has view-only
          permissions for this module. No changes can be saved.
        </div>
      )}
      {children}
    </>
  );
}
