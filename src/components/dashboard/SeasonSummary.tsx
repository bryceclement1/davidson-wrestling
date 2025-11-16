import type { TeamDashboardData } from "@/types/analytics";
import { Card } from "@/components/ui/Card";

interface Props {
  data: TeamDashboardData;
}

const highlights = [
  { key: "record", label: "Team Record" },
  { key: "matchesLogged", label: "Matches Logged" },
  { key: "totalPointsFor", label: "Points For" },
  { key: "totalPointsAgainst", label: "Points Allowed" },
  { key: "firstTakedownWinPct", label: "First TD Win %" },
  { key: "ridingTimeAdvantagePct", label: "Riding Time Adv %" },
] as const;

export function SeasonSummary({ data }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {highlights.map(({ key, label }) => {
        const value = data[key];
        const display =
          typeof value === "number" && key.includes("Pct")
            ? `${Math.round(value * 100)}%`
            : value;

        return (
          <Card key={key} className="space-y-2">
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
