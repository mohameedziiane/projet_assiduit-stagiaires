export default function SkeletonBlock({
  height = 18,
  width = "100%",
  className = "",
}) {
  return (
    <span
      className={`skeleton-block ${className}`.trim()}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
}
