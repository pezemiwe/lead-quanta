import { SectionCard } from "../..";
import { S } from "../helpers";

const TYPE_SCALE: [string, string, string][] = [
  [
    "Heading XL",
    "text-[28px] font-semibold tracking-tight",
    "Impairment Analytics Dashboard",
  ],
  [
    "Heading LG",
    "text-xl font-semibold tracking-tight",
    "ECL Calculation Report",
  ],
  ["Heading MD", "text-base font-semibold", "Stage Distribution"],
  ["Heading SM", "text-sm font-semibold", "Loan Portfolio Overview"],
  [
    "Body MD",
    "text-sm",
    "The expected credit loss is calculated using a three-stage IFRS 9 model.",
  ],
  [
    "Body SM",
    "text-xs",
    "PD × LGD × EAD = ECL | Probability of Default at 12-month horizon.",
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
