import { SectionCard } from "../..";
import { S } from "../helpers";

const TYPE_SCALE: [string, string, string][] = [
  [
    "Heading XL",
    "text-[28px] font-semibold tracking-tight",
    "Investment Portfolio Dashboard",
  ],
  [
    "Heading LG",
    "text-xl font-semibold tracking-tight",
    "Fair Value Valuation Report",
  ],
  ["Heading MD", "text-base font-semibold", "Portfolio by Classification"],
  ["Heading SM", "text-sm font-semibold", "Investment Book Overview"],
  [
    "Body MD",
    "text-sm",
    "Fair values are computed using IFRS 13 hierarchy with real-time FMDQ market data.",
  ],
  [
    "Body SM",
    "text-xs",
    "Modified Duration × DV01 × Rate Shock = P&L Impact | FGN yield curve as at 28 May 2026.",
  ],
  [
    "Label",
    "text-xs font-semibold uppercase tracking-widest text-dark-gray/50",
    "PORTFOLIO ANALYSIS",
  ],
  ["Mono", "font-mono text-sm text-primary", "₦ 1,234,567,890.00"],
];

export function TypographySection() {
  return (
    <S label="Typography">
      <SectionCard noPadding className="overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {TYPE_SCALE.map(([style, cls, sample]) => (
              <tr key={style} className="border-b border-border last:border-0">
                <td className="w-28 px-5 py-4 text-xs text-dark-gray/40">
                  {style}
                </td>
                <td className={`px-5 py-4 ${cls}`}>{sample}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </S>
  );
}
