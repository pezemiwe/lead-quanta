export const CollapsedLogo = ({ size = 40 }: { size?: number }) => (
  <div
    className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_4px_14px_-4px_rgba(247,148,29,0.45)] ring-2 ring-primary/40"
    style={{ width: size, height: size }}
  >
    <img
      src="/lead-logo.jpg"
      alt="Leadway Holdings"
      className="h-full w-full object-cover object-left"
      draggable={false}
    />
  </div>
);

export const Logo = ({ collapsed = false }: { collapsed?: boolean }) => {
  if (collapsed) {
    return (
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_4px_14px_-4px_rgba(247,148,29,0.35)] ring-1 ring-primary/30">
        <img
          src="/lead-logo.jpg"
          alt="Leadway Holdings"
          className="h-full w-full object-cover object-left"
          draggable={false}
        />
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-3">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_6px_18px_-4px_rgba(247,148,29,0.40)] ring-2 ring-primary/30">
        <img
          src="/lead-logo.jpg"
          alt="Leadway Holdings"
          className="h-full w-full object-cover object-left"
          draggable={false}
        />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-primary">
          Leadway Quanta
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-dark-gray/45">
          Analytics Platform
        </p>
      </div>
    </div>
  );
};
