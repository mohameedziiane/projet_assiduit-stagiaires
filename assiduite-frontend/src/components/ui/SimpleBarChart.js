function formatLabel(value, maxLength = 18) {
  const text = String(value || "Non renseigne").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}...`;
}

export default function SimpleBarChart({
  title,
  subtitle,
  data,
  emptyMessage = "Aucune donnee a afficher.",
  ariaLabel,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <section className="content-card chart-panel">
        <div className="chart-panel-header">
          <div>
            <h3 className="section-title">{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>

        <div className="empty-state chart-empty-state">
          <strong>Aucune statistique disponible</strong>
          <p>{emptyMessage}</p>
        </div>
      </section>
    );
  }

  const chartWidth = 640;
  const chartHeight = 280;
  const topPadding = 20;
  const rightPadding = 20;
  const bottomPadding = 72;
  const leftPadding = 46;
  const innerWidth = chartWidth - leftPadding - rightPadding;
  const innerHeight = chartHeight - topPadding - bottomPadding;
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  const barGap = 16;
  const barWidth = Math.max(
    28,
    Math.min(72, (innerWidth - barGap * (data.length - 1)) / data.length)
  );
  const totalBarsWidth = data.length * barWidth + (data.length - 1) * barGap;
  const startX = leftPadding + Math.max(0, (innerWidth - totalBarsWidth) / 2);
  const tickValues = Array.from({ length: 5 }, (_, index) =>
    Math.round((maxValue * (4 - index)) / 4)
  );

  return (
    <section className="content-card chart-panel">
      <div className="chart-panel-header">
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>

      <div className="simple-bar-chart-wrap">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="simple-bar-chart"
          preserveAspectRatio="none"
          role="img"
          aria-label={ariaLabel || title}
        >
          {tickValues.map((tick) => {
            const y =
              topPadding + innerHeight - (tick / maxValue) * innerHeight;

            return (
              <g key={tick}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={chartWidth - rightPadding}
                  y2={y}
                  className="simple-bar-chart-grid"
                />
                <text
                  x={leftPadding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="simple-bar-chart-tick"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {data.map((item, index) => {
            const value = Number(item.value) || 0;
            const height = (value / maxValue) * innerHeight;
            const x = startX + index * (barWidth + barGap);
            const y = topPadding + innerHeight - height;
            const label = formatLabel(item.label);

            return (
              <g key={`${item.label}-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(height, 4)}
                  rx="10"
                  className="simple-bar-chart-bar"
                />
                <text
                  x={x + barWidth / 2}
                  y={Math.max(y - 8, 14)}
                  textAnchor="middle"
                  className="simple-bar-chart-value"
                >
                  {value}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 18}
                  textAnchor="middle"
                  className="simple-bar-chart-label"
                >
                  {label}
                  <title>{item.label}</title>
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
