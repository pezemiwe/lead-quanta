import { Logo, CollapsedLogo } from "../..";
import { S } from "../helpers";

export function LogoBrandSection() {
  return (
    <S label="Logo & Brand">
      <div className="flex flex-wrap items-end gap-10">
        <div className="space-y-2">
          <p className="text-xs text-dark-gray/40">Full logo</p>
          <Logo />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-dark-gray/40">Collapsed (36px)</p>
          <CollapsedLogo size={36} />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-dark-gray/40">Collapsed (24px)</p>
          <CollapsedLogo size={24} />
        </div>
      </div>
    </S>
  );
}
