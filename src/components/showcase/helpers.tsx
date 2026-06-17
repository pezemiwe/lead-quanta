export const NAV = [
  "Logo & Brand",
  "Colours",
  "Typography",
  "Buttons",
  "Inputs & Select",
  "Loaders & Skeletons",
  "Badges",
  "Stat Cards",
  "Tabs",
  "Tables",
  "Empty States",
  "Progress Steps",
  "Section Cards",
  "Modals",
  "Tooltips",
  "Toasts",
];

export const sid = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const S = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <section id={sid(label)} className="scroll-mt-20 space-y-5">
    <h2 className="border-b border-border pb-3 text-base font-semibold text-dark-gray">
      {label}
    </h2>
    {children}
  </section>
);

export const Row = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) => (
  <div className="space-y-2">
    {label && (
      <p className="text-xs font-semibold uppercase tracking-wider text-dark-gray/35">
        {label}
      </p>
    )}
    <div className="flex flex-wrap items-start gap-3">{children}</div>
  </div>
);
