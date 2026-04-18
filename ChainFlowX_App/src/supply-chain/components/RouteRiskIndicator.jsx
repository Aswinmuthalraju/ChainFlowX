export default function RouteRiskIndicator({ risk }) {
  const score = Number.isFinite(risk) ? risk : 0;

  const getStatusLabel = (value) => {
    if (value >= 61) return 'CRITICAL';
    if (value >= 31) return 'WARNING';
    return 'NORMAL';
  };

  const getStatusColor = (value) => {
    if (value >= 61) return '#ef4444';
    if (value >= 31) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="route-risk-indicator" style={{ color: getStatusColor(score) }}>
      <span className="route-risk-indicator__number">{Math.round(score)}</span>
      <span className="route-risk-indicator__status">{getStatusLabel(score)}</span>
    </div>
  );
}
