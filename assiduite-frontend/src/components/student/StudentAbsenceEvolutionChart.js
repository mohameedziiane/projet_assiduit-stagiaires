import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";

const FILTER_OPTIONS = [3, 6, 12];

function buildMonthSequence(monthCount) {
  const now = new Date();
  const months = [];

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "");

    months.push({
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }

  return months;
}

function buildGroupAverageSeries(months, groupAverage) {
  const base = Number(groupAverage) || 0;
  const multipliers = [0.88, 1.04, 0.96, 1.08, 0.92, 1.02, 0.9, 1.05, 0.94, 1.07, 0.98, 1.01];

  return months.map((_, index) => Number((base * multipliers[index % multipliers.length]).toFixed(1)));
}

function getFilterTone(value) {
  return value >= 0 ? "danger" : "positive";
}

function createOrGetTooltip(container) {
  let tooltipEl = container.querySelector(".stagiaire-chart-tooltip");

  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "stagiaire-chart-tooltip";
    container.appendChild(tooltipEl);
  }

  return tooltipEl;
}

export default function StudentAbsenceEvolutionChart({
  data,
  groupAverage,
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const chartShellRef = useRef(null);
  const [range, setRange] = useState(6);
  const [hoveredBar, setHoveredBar] = useState(null);

  const normalizedSeries = useMemo(() => {
    const byKey = new Map(
      (Array.isArray(data) ? data : []).map((item) => [item.key, Number(item.value) || 0])
    );
    const allMonths = buildMonthSequence(12);
    const groupSeries = buildGroupAverageSeries(allMonths, groupAverage);

    return allMonths.map((month, index) => ({
      ...month,
      personal: byKey.get(month.key) || 0,
      group: groupSeries[index],
    }));
  }, [data, groupAverage]);

  const visibleSeries = useMemo(
    () => normalizedSeries.slice(-range),
    [normalizedSeries, range]
  );

  const currentMonthStat = useMemo(() => {
    const current = visibleSeries[visibleSeries.length - 1];

    if (!current) {
      return { currentAbsences: 0, diff: 0 };
    }

    return {
      currentAbsences: current.personal,
      diff: Number((current.personal - current.group).toFixed(1)),
    };
  }, [visibleSeries]);

  useEffect(() => {
    if (!canvasRef.current || visibleSeries.length === 0) {
      return undefined;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const tooltipContainer = chartShellRef.current;

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: visibleSeries.map((item) => item.label),
        datasets: [
          {
            label: "Vos absences",
            data: visibleSeries.map((item) => item.personal),
            backgroundColor: (context) => {
              const datasetIndex = context.datasetIndex;
              const dataIndex = context.dataIndex;

              if (
                hoveredBar &&
                (hoveredBar.datasetIndex !== datasetIndex || hoveredBar.index !== dataIndex)
              ) {
                return "rgba(29, 158, 117, 0.3)";
              }

              return "#1D9E75";
            },
            borderRadius: 6,
            borderSkipped: false,
            categoryPercentage: 0.72,
            barPercentage: 0.82,
          },
          {
            label: "Moyenne du groupe",
            data: visibleSeries.map((item) => item.group),
            backgroundColor: (context) => {
              const datasetIndex = context.datasetIndex;
              const dataIndex = context.dataIndex;

              if (
                hoveredBar &&
                (hoveredBar.datasetIndex !== datasetIndex || hoveredBar.index !== dataIndex)
              ) {
                return "rgba(209, 209, 204, 0.3)";
              }

              return "#D1D1CC";
            },
            borderRadius: 6,
            borderSkipped: false,
            categoryPercentage: 0.72,
            barPercentage: 0.82,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        onHover: (_, elements) => {
          if (elements.length > 0) {
            const element = elements[0];
            setHoveredBar({
              datasetIndex: element.datasetIndex,
              index: element.index,
            });
          } else {
            setHoveredBar(null);
          }
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
            external(context) {
              if (!tooltipContainer) {
                return;
              }

              const tooltipEl = createOrGetTooltip(tooltipContainer);
              const { tooltip } = context;

              if (!tooltip || tooltip.opacity === 0) {
                tooltipEl.style.opacity = "0";
                return;
              }

              const dataIndex = tooltip.dataPoints?.[0]?.dataIndex ?? 0;
              const month = visibleSeries[dataIndex];

              if (!month) {
                tooltipEl.style.opacity = "0";
                return;
              }

              const diff = Number((month.personal - month.group).toFixed(1));
              const diffColor = diff >= 0 ? "#B91C1C" : "#1D9E75";
              const diffLabel =
                diff >= 0
                  ? `+${diff} au dessus de la moyenne`
                  : `${diff} en dessous de la moyenne`;

              tooltipEl.innerHTML = `
                <div class="stagiaire-chart-tooltip-title">${month.label}</div>
                <div class="stagiaire-chart-tooltip-line">
                  <span>Vos absences</span>
                  <strong>${month.personal}</strong>
                </div>
                <div class="stagiaire-chart-tooltip-line">
                  <span>Moyenne groupe</span>
                  <strong>${month.group}</strong>
                </div>
                <div class="stagiaire-chart-tooltip-diff" style="color:${diffColor}">
                  ${diffLabel}
                </div>
              `;

              const { offsetLeft, offsetTop } = tooltipContainer;
              tooltipEl.style.opacity = "1";
              tooltipEl.style.left = `${offsetLeft + tooltip.caretX + 12}px`;
              tooltipEl.style.top = `${offsetTop + tooltip.caretY - 18}px`;
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: "#888780",
              font: {
                size: 12,
                weight: "500",
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "#F0F0EA",
              drawBorder: false,
            },
            border: {
              display: false,
            },
            ticks: {
              precision: 0,
              color: "#888780",
              font: {
                size: 12,
                weight: "500",
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [hoveredBar, visibleSeries]);

  return (
    <div className="chart-card stagiaire-evolution-card">
      <div className="stagiaire-evolution-head">
        <div>
          <h3>Évolution des absences</h3>
          <p>Comparaison mensuelle par groupe</p>
        </div>

        <div className="stagiaire-evolution-legend" aria-label="Légende du graphique">
          <span className="stagiaire-evolution-legend-item">
            <i className="legend-swatch legend-swatch-teal" />
            Vos absences
          </span>
          <span className="stagiaire-evolution-legend-item">
            <i className="legend-swatch legend-swatch-gray" />
            Moyenne du groupe
          </span>
        </div>
      </div>

      <div className="stagiaire-evolution-toolbar">
        <div className="stagiaire-evolution-badges">
          <span className="stagiaire-mini-badge teal">
            <small>Ce mois</small>
            <strong>{currentMonthStat.currentAbsences} absences</strong>
          </span>
          <span className={`stagiaire-mini-badge ${getFilterTone(currentMonthStat.diff)}`}>
            <small>vs groupe</small>
            <strong>
              {currentMonthStat.diff > 0 ? "+" : ""}
              {currentMonthStat.diff}
            </strong>
          </span>
        </div>

        <div className="stagiaire-filter-pills">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`stagiaire-filter-pill${range === option ? " active" : ""}`}
              onClick={() => setRange(option)}
            >
              {option} mois
            </button>
          ))}
        </div>
      </div>

      <div className="stagiaire-evolution-chart-shell" ref={chartShellRef}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
