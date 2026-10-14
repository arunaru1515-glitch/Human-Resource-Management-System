import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass = 'kpi-blue' }) => {
  return (
    <div className="kpi-card">
      <div className="kpi-meta">
        <p>{title}</p>
        <div className="kpi-value">{value}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
      {Icon && (
        <div className={`kpi-icon ${colorClass}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
