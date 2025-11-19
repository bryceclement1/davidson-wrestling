import type { TeamDashboardData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";

interface Props {
  data: TeamDashboardData;
}

type Highlight = {
  label: string;
  getValue: (data: TeamDashboardData) => string | number;
  isPercent?: boolean;
};

const highlights: Highlight[] = [
  { label: "Team Record", getValue: (data) => data.overall.record },
  { label: "Matches Logged", getValue: (data) => data.matchesLogged },
  { label: "Points For", getValue: (data) => data.overall.pointsFor },
  { label: "Points Allowed", getValue: (data) => data.overall.pointsAgainst },
  {
    label: "First TD Win %",
    getValue: (data) => data.outcomePredictors.firstTakedownWinPct,
    isPercent: true,
  },
  {
    label: "RT Point %",
    getValue: (data) => data.topBottom.ridingTimePointPct.us,
    isPercent: true,
  },
];

export function SeasonSummary({ data }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {highlights.map(({ label, getValue, isPercent }) => {
        const rawValue = getValue(data);
        const display =
          typeof rawValue === "number" && isPercent
            ? `${Math.round(rawValue * 100)}%`
            : rawValue;

        return (
          <Card key={label} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--neutral-gray)]">
              {label}
            </p>
            <p className="text-2xl font-semibold text-[var(--brand-navy)]">
              {display}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
