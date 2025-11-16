"use client";

import type { TeamPeriodStat } from "@/types/analytics";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

interface Props {
  data: TeamPeriodStat[];
}

export function PeriodBreakdownChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="periodLabel"
            tickLine={false}
            axisLine={false}
            stroke="#6C757D"
          />
          <Tooltip
            cursor={{ fill: "rgba(0,34,68,0.05)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as TeamPeriodStat;
              return (
                <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-xl">
                  <p className="font-semibold text-[var(--brand-navy)]">
                    {point.periodLabel}
                  </p>
                  <p className="text-[var(--neutral-gray)]">
                    Avg Diff:{" "}
                    <span
                      className={
                        point.pointsDifferential >= 0
                          ? "text-[var(--success-green)]"
                          : "text-[var(--danger-red)]"
                      }
                    >
                      {point.pointsDifferential.toFixed(1)}
                    </span>
                  </p>
                  <p className="text-[var(--neutral-gray)]">
                    TDs: {point.takedownsFor} / {point.takedownsAgainst}
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="pointsDifferential"
            radius={[12, 12, 0, 0]}
            fill="#002244"
            label={{ position: "top", fill: "#002244", fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
