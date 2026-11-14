import type { CategoryTotal } from "@/lib/finance";

export const CHART_COLORS = [
  "#177c58",
  "#2f9d74",
  "#57b892",
  "#8fd0b4",
  "#c2a25a",
  "#d98b52",
  "#c25f5f",
  "#7d7d92",
];

interface DonutChartProps {
  data: readonly CategoryTotal[];
  total: number;
  label?: string;
}

const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Dependency-free SVG donut. Slice positions come from prefix sums so nothing
 * is mutated during render.
 */
export function DonutChart({ data, total, label = "Total pengeluaran" }: DonutChartProps) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : 0;
  const visible = data.slice(0, CHART_COLORS.length);

  const lengths = visible.map((slice) => (safeTotal > 0 ? (slice.amount / safeTotal) * circumference : 0));
  const offsets = lengths.map((_, index) => lengths.slice(0, index).reduce((sum, value) => sum + value, 0));

  const slices = visible.map((slice, index) => {
    const length = Math.max(0, lengths[index] - 2);
    return {
      key: slice.category,
      color: CHART_COLORS[index % CHART_COLORS.length],
      dash: `${length} ${circumference - length}`,
      rotation: (offsets[index] / circumference) * 360 - 90,
    };
  });

  return (
    <div className="donut">
      <svg viewBox="0 0 160 160" role="img" aria-label={`${label}: ${data.length} kategori`}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--donut-track)" strokeWidth="18" />
        {slices.map((slice) => (
          <circle
            key={slice.key}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth="18"
            strokeLinecap="butt"
            strokeDasharray={slice.dash}
            transform={`rotate(${slice.rotation} 80 80)`}
          />
        ))}
      </svg>
      <div className="donut-center">
        <small>Pengeluaran</small>
        <strong>{data.length === 0 ? "—" : compact.format(safeTotal)}</strong>
      </div>
    </div>
  );
}
