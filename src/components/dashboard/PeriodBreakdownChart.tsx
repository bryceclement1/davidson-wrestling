"use client";

import type { TeamPeriodStat } from "@/types/analytics";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  LabelList,
} from "recharts";

interface Props {
  data: TeamPeriodStat[];
}

export function PeriodBreakdownChart({ data }: Props) {
  const filtered = data.filter((period) => period.periodOrder <= 3);
  const chartData = filtered.map((period) => {
    const matches = period.matchesLogged || 0;
    const avgFor =
      matches > 0 ? period.takedownsFor / matches : period.takedownsFor;
    return {
      ...period,
      avgFor,
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
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
              const point = payload[0].payload as TeamPeriodStat & {
                avgFor: number;
              };
              return (
                <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm shadow-xl">
                  <p className="font-semibold text-[var(--brand-navy)]">
                    {point.periodLabel}
                  </p>
                  <p className="text-[var(--neutral-gray)]">
                    Avg TDs For: {point.avgFor.toFixed(2)}
                  </p>
                  <p className="text-[var(--neutral-gray)]">
                    Logs Counted: {point.matchesLogged ?? 0}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="avgFor" radius={[12, 12, 0, 0]} fill="#002244">
            <LabelList
              dataKey="avgFor"
              position="top"
              fill="#002244"
              fontSize={12}
              formatter={(value: number) => value.toFixed(2)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
