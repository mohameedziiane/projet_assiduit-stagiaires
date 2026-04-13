import { useEffect, useMemo, useRef } from "react";
import Chart from "chart.js/auto";

const defaultLegend = {
  display: true,
  position: "bottom",
  labels: {
    color: "#525252",
    boxWidth: 12,
    boxHeight: 12,
    usePointStyle: true,
    pointStyle: "circle",
    padding: 16,
    font: {
      size: 12,
      weight: "500",
    },
  },
};

const defaultTooltip = {
  backgroundColor: "#ffffff",
  titleColor: "#171717",
  bodyColor: "#525252",
  borderColor: "rgba(212, 212, 212, 0.9)",
  borderWidth: 1,
  padding: 10,
  displayColors: true,
};

export default function ChartJsPanel({
  title,
  subtitle,
  badgeLabel,
  type,
  data,
  options,
  height = 260,
  emptyMessage = "Aucune donnée à afficher.",
  className = "content-card chart-panel",
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const hasData = useMemo(() => {
    if (!data || !Array.isArray(data.datasets) || data.datasets.length === 0) {
      return false;
    }

    return data.datasets.some((dataset) =>
      Array.isArray(dataset.data)
        ? dataset.data.some((value) => Number(value) > 0)
        : false
    );
  }, [data]);

  useEffect(() => {
    if (!canvasRef.current || !hasData) {
      return undefined;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const defaultScales =
      type === "doughnut"
        ? undefined
        : {
            x: {
              ticks: {
                color: "#737373",
                font: {
                  size: 11,
                  weight: "500",
                },
              },
              grid: {
                display: false,
              },
              border: {
                color: "rgba(212, 212, 212, 0.8)",
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: "#737373",
                font: {
                  size: 11,
                  weight: "500",
                },
              },
              grid: {
                color: "rgba(229, 229, 229, 0.85)",
              },
              border: {
                color: "rgba(212, 212, 212, 0.8)",
              },
            },
          };

    const mergedOptions = {
      responsive: true,
      maintainAspectRatio: false,
      ...options,
      scales: {
        ...(defaultScales || {}),
        ...(options?.scales || {}),
      },
      plugins: {
        legend: {
          ...defaultLegend,
          ...(options?.plugins?.legend || {}),
        },
        tooltip: {
          ...defaultTooltip,
          ...(options?.plugins?.tooltip || {}),
        },
        ...(options?.plugins || {}),
      },
    };

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options: mergedOptions,
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, hasData, options, type]);

  return (
    <section className={className}>
      <div className="chart-panel-header">
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {badgeLabel ? <span className="group-average-badge">{badgeLabel}</span> : null}
      </div>

      {!hasData ? (
        <div className="empty-state chart-empty-state">
          <strong>Aucune statistique disponible</strong>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div
          className={`chartjs-shell${type === "doughnut" ? " chartjs-shell-doughnut" : ""}`}
          style={{ height: `${height}px` }}
        >
          <canvas ref={canvasRef} />
        </div>
      )}
    </section>
  );
}
