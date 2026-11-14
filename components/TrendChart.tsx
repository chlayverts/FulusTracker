import { formatMoney } from "@/lib/finance";

interface TrendChartProps {
  data: readonly { day: number; amount: number }[];
  monthLabel: string;
}

/** Dependency-free bar chart of daily spending for one month. */
export function TrendChart({ data, monthLabel }: TrendChartProps) {
  const max = data.reduce((peak, point) => Math.max(peak, point.amount), 0);
  return (
    <figure className="trend">
      <div className="trend-bars" role="img" aria-label={`Pengeluaran harian ${monthLabel}`}>
        {data.map((point) => {
          const height = max > 0 ? Math.max(2, (point.amount / max) * 100) : 2;
          return (
            <span
              key={point.day}
              className={point.amount > 0 ? "trend-bar is-active" : "trend-bar"}
              style={{ height: `${height}%` }}
              title={`${point.day} ${monthLabel}: ${formatMoney(point.amount)}`}
            />
          );
        })}
      </div>
      <figcaption className="trend-axis">
        <span>1</span>
        <span>{Math.round(data.length / 2)}</span>
        <span>{data.length}</span>
      </figcaption>
    </figure>
  );
}
