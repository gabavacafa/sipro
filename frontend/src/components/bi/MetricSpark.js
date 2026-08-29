import React from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMetric, formatMetricCompact } from "@/components/bi/MetricValue";
import { formatNumber } from "@/utils/formatters";
import { BI } from "@/constants/testIds";

/**
 * MetricSpark — visualisasi mini DI DALAM kartu metrik (keluhan pemakai: "banyak cards
 * tapi minim visualisasi"). Aturan kejujuran Fase 44 tetap berlaku: metrik `kosong`
 * tidak digambar sama sekali — sparkline nol palsu sama bohongnya dengan angka 0.
 *
 * Prioritas bentuk: deret waktu → sparkline area; persen → bilah progres;
 * rincian kategori → bilah proporsi top-3.
 */

export function TrendDelta({ series, unit }) {
  const rows = (series || []).filter((s) => s?.value !== null && s?.value !== undefined);
  if (rows.length < 2) return null;
  const prev = Number(rows[rows.length - 2].value);
  const last = Number(rows[rows.length - 1].value);
  const diff = last - prev;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const tone = diff > 0 ? "text-emerald-600 dark:text-emerald-400"
    : diff < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground";
  return (
    <span data-testid={BI.cardTrend} className={cn("inline-flex items-center gap-1 text-[11px] font-medium tabular-nums", tone)}
      title={`Periode terakhir vs sebelumnya: ${formatMetric(prev, unit)} → ${formatMetric(last, unit)}`}>
      <Icon className="h-3 w-3" />
      {diff === 0 ? "tetap" : `${diff > 0 ? "+" : "−"}${formatMetric(Math.abs(diff), unit) ?? formatNumber(Math.abs(diff))}`}
      <span className="font-normal text-muted-foreground">vs sblm.</span>
    </span>
  );
}

function Sparkline({ series, code }) {
  // Deret kumulatif digambar dari `cumulative` (bukan `value` yang bisa datar): deret datar
  // membuat domain min=max sehingga garis menempel di atas dan area terisi penuh — terlihat
  // seperti balok pejal, bukan tren (temuan uji regresi). Domain juga diberi napas.
  const useCum = series.some((s) => s.cumulative !== undefined && s.cumulative !== null);
  const rows = series.map((s) => ({ ...s, v: Number(useCum ? s.cumulative : s.value) }));
  const vals = rows.map((r) => r.v);
  const lo = Math.min(...vals); const hi = Math.max(...vals);
  const pad = (hi - lo) || Math.abs(hi) || 1;
  const gid = `spark-${code}`;
  return (
    <div className="h-11 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[Math.min(0, lo), hi + pad * 0.25]} />
          <Area type="monotone" dataKey="v" stroke="hsl(var(--chart-1))" strokeWidth={1.75}
            fill={`url(#${gid})`} isAnimationActive={false} dot={false}
            activeDot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PctBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value)));
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`,
            background: "linear-gradient(90deg, hsl(var(--chart-1)) 0%, hsl(var(--chart-3)) 100%)" }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span><span>target 100%</span>
      </div>
    </div>
  );
}

function TopBars({ breakdown, unit }) {
  const rows = breakdown
    .filter((r) => r && r.value !== null && r.value !== undefined)
    .sort((a, b) => Math.abs(Number(b.value)) - Math.abs(Number(a.value)))
    .slice(0, 3);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => Math.abs(Number(r.value)))) || 1;
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={r.key || r.label || i} className="flex items-center gap-2">
          <span className="w-[36%] truncate text-[10px] text-muted-foreground" title={r.label}>
            {r.label}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full"
              style={{ width: `${(Math.abs(Number(r.value)) / max) * 100}%`,
                backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))`,
                opacity: 0.9 - i * 0.15 }} />
          </div>
          <span className="shrink-0 whitespace-nowrap text-right text-[10px] font-medium tabular-nums"
            title={formatMetric(r.value, unit) ?? ""}>
            {formatMetricCompact(r.value, unit)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MetricSpark({ metric }) {
  if (!metric || metric.state === "kosong") return null;
  const series = (metric.series || []).filter((s) => s?.value !== null && s?.value !== undefined);
  const breakdown = metric.breakdown || [];
  let body = null;
  if (series.length >= 2) body = <Sparkline series={series} code={metric.code} />;
  else if (metric.unit === "pct" && metric.value !== null && metric.value !== undefined) {
    body = <PctBar value={metric.value} />;
  } else if (breakdown.length >= 2) body = <TopBars breakdown={breakdown} unit={metric.unit} />;
  if (!body) return null;
  return <div data-testid={BI.cardSpark} className="pt-1">{body}</div>;
}
