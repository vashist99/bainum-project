import { useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Users, Calendar, Award } from "lucide-react";

// Mini chart component for dashboard stats
export const MiniLineChart = ({ data = [], color = "primary", height = 40 }) => {
  const points = useMemo(() => {
    if (!data.length) return "";
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((max - value) / range) * 100;
      return `${x},${y}`;
    }).join(" ");
  }, [data]);

  if (!data.length) {
    return <div className={`w-full h-[${height}px] bg-base-200 rounded`} />;
  }

  return (
    <div className={`w-full h-[${height}px] relative`}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={`hsl(var(--${color}))`}
          strokeWidth="2"
          points={points}
          className="drop-shadow-sm"
        />
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={`hsl(var(--${color}))`} stopOpacity="0.3" />
            <stop offset="100%" stopColor={`hsl(var(--${color}))`} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill={`url(#gradient-${color})`}
          stroke="none"
          points={`${points} 100,100 0,100`}
        />
      </svg>
    </div>
  );
};

// Progress bar with gradient
export const ProgressBar = ({ value, max = 100, label, color = "primary", showPercent = true }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-base-content/70">{label}</span>
          {showPercent && (
            <span className={`text-sm font-semibold text-${color}`}>
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-base-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full bg-gradient-to-r from-${color} to-${color}/80 transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Metric card with trend indicator
export const MetricCard = ({ 
  title, 
  value, 
  previousValue = null, 
  icon: IconComponent, // eslint-disable-line no-unused-vars
  color = "primary",
  format = "number",
  suffix = ""
}) => {
  const trend = useMemo(() => {
    if (previousValue === null || previousValue === 0) return null;
    return ((value - previousValue) / previousValue) * 100;
  }, [value, previousValue]);

  const formatValue = (val) => {
    if (format === "percentage") return `${val}%`;
    if (format === "currency") return `$${val.toLocaleString()}`;
    return `${val.toLocaleString()}${suffix}`;
  };

  return (
    <div className="card bg-base-100 shadow-lg border border-base-200 hover:shadow-xl transition-all duration-200">
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`bg-${color}/10 p-3 rounded-lg`}>
            <IconComponent className={`w-6 h-6 text-${color}`} />
          </div>
          {trend !== null && (
            <div className={`flex items-center gap-1 ${trend >= 0 ? 'text-success' : 'text-error'}`}>
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-bold text-base-content mb-1">
            {formatValue(value)}
          </h3>
          <p className="text-sm text-base-content/60">{title}</p>
        </div>
      </div>
    </div>
  );
};

// Simple donut chart
export const DonutChart = ({ data = [], size = 120, strokeWidth = 8 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-center">
          <div className="text-2xl font-bold text-base-content/30">0</div>
          <div className="text-xs text-base-content/50">No data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-base-200"
        />
        {data.map((item, index) => {
          const strokeDasharray = (item.value / total) * circumference;
          const strokeDashoffset = currentOffset;
          currentOffset += strokeDasharray;
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color || `hsl(var(--primary))`}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDasharray} ${circumference}`}
              strokeDashoffset={-strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-base-content">{total}</div>
          <div className="text-xs text-base-content/60">Total</div>
        </div>
      </div>
    </div>
  );
};

// Activity feed component
export const ActivityFeed = ({ activities = [], maxItems = 5 }) => {
  const displayActivities = activities.slice(0, maxItems);
  
  return (
    <div className="space-y-4">
      {displayActivities.map((activity, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${activity.bgColor || 'bg-primary/10'} flex-shrink-0`}>
            <activity.icon className={`w-4 h-4 ${activity.iconColor || 'text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-base-content">{activity.title}</p>
            <p className="text-xs text-base-content/60">{activity.description}</p>
            <p className="text-xs text-base-content/40 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div className="text-center py-8 text-base-content/50">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
};

// Enhanced stats grid
export const StatsGrid = ({ stats = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-lg animate-pulse">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton w-12 h-12 rounded-lg"></div>
                <div className="skeleton w-16 h-4"></div>
              </div>
              <div className="skeleton w-20 h-8 mb-2"></div>
              <div className="skeleton w-32 h-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <MetricCard key={index} {...stat} />
      ))}
    </div>
  );
};

// Quick summary cards
export const SummaryCard = ({ title, items = [], color = "primary" }) => {
  return (
    <div className="card bg-base-100 shadow-lg border border-base-200">
      <div className="card-body p-6">
        <h3 className={`card-title text-lg mb-4 text-${color}`}>{title}</h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-base-content/70">{item.label}</span>
              <span className="text-sm font-semibold text-base-content">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Time-based chart (simplified version)
export const TimeChart = ({ data = [], title, color = "primary" }) => {
  const maxValue = Math.max(...data.map(d => d.value), 0);
  
  return (
    <div className="card bg-base-100 shadow-lg border border-base-200">
      <div className="card-body p-6">
        <h3 className="card-title text-lg mb-4">{title}</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {data.map((item, index) => {
            const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full bg-${color} rounded-t transition-all duration-500 min-h-[4px]`}
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${item.value}`}
                />
                <span className="text-xs text-base-content/60 mt-2 text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};