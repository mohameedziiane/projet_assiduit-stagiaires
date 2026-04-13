import React from "react";

function AttendanceChart({
  data,
  title = "Evolution des absences",
  subtitle = "Comparaison mensuelle de votre assiduite",
  badgeLabel,
}) {
  const width = 760;
  const height = 260;
  const padding = 30;
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  const points = data
    .map((item, index) => {
      const x =
        padding +
        (index * (width - padding * 2)) / Math.max(data.length - 1, 1);

      const y =
        height -
        padding -
        (item.value * (height - padding * 2)) / maxValue;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {badgeLabel ? (
          <span className="group-average-badge">{badgeLabel}</span>
        ) : null}
      </div>

      <div className="line-chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="line-chart-svg"
          preserveAspectRatio="none"
        >
          {[0, 1, 2, 3, 4].map((line) => {
            const y =
              height - padding - (line * (height - padding * 2)) / 4;

            return (
              <line
                key={line}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="chart-grid-line"
              />
            );
          })}

          <polyline points={points} className="chart-line" />

          {data.map((item, index) => {
            const x =
              padding +
              (index * (width - padding * 2)) / Math.max(data.length - 1, 1);

            const y =
              height -
              padding -
              (item.value * (height - padding * 2)) / maxValue;

            return (
              <g key={item.month}>
                <circle cx={x} cy={y} r="5" className="chart-point" />
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="chart-label"
                >
                  {item.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default AttendanceChart;
