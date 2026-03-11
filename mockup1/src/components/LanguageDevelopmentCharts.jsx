import { useMemo } from "react";
import ReactSpeedometer from "react-d3-speedometer";
import { TrendingUp, Microscope, MessageCircle, BookOpen, Brain } from "lucide-react";

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_CONFIG = {
  science: { label: 'Science', dotMatrixTitle: 'Talk to support science skills', color: 'text-blue-600', icon: Microscope, bgClass: 'bg-blue-100 dark:bg-blue-950/20', intensityColors: ['bg-blue-100 dark:bg-blue-950/20', 'bg-blue-300 dark:bg-blue-800/50', 'bg-blue-500 dark:bg-blue-600', 'bg-blue-600 dark:bg-blue-500', 'bg-blue-700 dark:bg-blue-400'] },
  social: { label: 'Social', dotMatrixTitle: 'Talk to support social emotional skills', color: 'text-green-600', icon: MessageCircle, bgClass: 'bg-green-100 dark:bg-green-950/20', intensityColors: ['bg-green-100 dark:bg-green-950/20', 'bg-green-300 dark:bg-green-800/50', 'bg-green-500 dark:bg-green-600', 'bg-green-600 dark:bg-green-500', 'bg-green-700 dark:bg-green-400'] },
  literature: { label: 'Literature', dotMatrixTitle: 'Talk to support literacy skills', color: 'text-purple-600', icon: BookOpen, bgClass: 'bg-purple-100 dark:bg-purple-950/20', intensityColors: ['bg-purple-100 dark:bg-purple-950/20', 'bg-purple-300 dark:bg-purple-800/50', 'bg-purple-500 dark:bg-purple-600', 'bg-purple-600 dark:bg-purple-500', 'bg-purple-700 dark:bg-purple-400'] },
  language: { label: 'Language', dotMatrixTitle: 'Talk to support language development', color: 'text-orange-600', icon: Brain, bgClass: 'bg-orange-100 dark:bg-orange-950/20', intensityColors: ['bg-orange-100 dark:bg-orange-950/20', 'bg-orange-300 dark:bg-orange-800/50', 'bg-orange-500 dark:bg-orange-600', 'bg-orange-600 dark:bg-orange-500', 'bg-orange-700 dark:bg-orange-400'] }
};

const getColorValue = (colorClass) => {
  if (colorClass.includes('blue')) return '#2563eb';
  if (colorClass.includes('green')) return '#16a34a';
  if (colorClass.includes('purple')) return '#7c3aed';
  if (colorClass.includes('orange')) return '#ea580c';
  return '#6366f1';
};

const SemicircularDial = ({ value, max = 200, color, label, description, icon: Icon, cohortThresholds }) => {
  const displayValue = value != null && !isNaN(value) ? value : 0;
  const displayText = value != null && !isNaN(value) ? `${Math.round(displayValue * 10) / 10} WPM` : 'N/A';

  const { stops, colors } = (() => {
    const avgMin = cohortThresholds?.avgMin;
    let avgMax = cohortThresholds?.avgMax;
    if (avgMin != null && avgMax != null && !isNaN(avgMin) && !isNaN(avgMax) && avgMin >= 0) {
      if (avgMin >= avgMax) {
        avgMax = avgMin + Math.max(10, Math.ceil(max * 0.2));
      }
      const yEnd = Math.round(avgMin * 10) / 10;
      const rStart = Math.min(max, Math.round(avgMax * 10) / 10);
      if (yEnd < rStart && rStart <= max) {
        return {
          stops: [0, yEnd, rStart, max],
          colors: ['#f59e0b', '#22c55e', '#ef4444']
        };
      }
    }
    const segments = 8;
    const defaultStops = [];
    for (let i = 0; i <= segments; i++) {
      defaultStops.push(Math.round((max / segments) * i));
    }
    return {
      stops: defaultStops,
      colors: ['#f59e0b', '#f59e0b', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#ef4444', '#ef4444']
    };
  })();

  try {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {Icon && <Icon className={`w-5 h-5 ${color}`} />}
            <h3 className={`font-bold text-lg ${color.replace('600', '800')} dark:${color.replace('600', '200')}`}>
              {label}
            </h3>
          </div>
          <p className={`text-sm ${color.replace('600', '700')} dark:${color.replace('600', '300')}`}>
            {description}
          </p>
        </div>
        <div className="flex flex-col items-center" style={{ width: '100%', minHeight: '240px', overflow: 'visible' }}>
          <ReactSpeedometer
            maxValue={max}
            minValue={0}
            value={Math.round(Math.max(0, Math.min(displayValue, max)) * 10) / 10}
            needleColor={getColorValue(color)}
            customSegmentStops={stops}
            segmentColors={colors}
            segmentValueFormatter={(v) => String(Math.round(v))}
            ringWidth={30}
            needleTransitionDuration={1000}
            needleTransition="easeElastic"
            textColor="#ffffff"
            valueTextFontSize="16px"
            labelFontSize="12px"
            currentValueText={displayText}
            width={280}
            height={200}
            paddingHorizontal={15}
            paddingVertical={30}
          />
        </div>
      </div>
    );
  } catch {
    return (
      <div className="flex flex-col items-center p-4">
        <div className="text-center mb-4">
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
          <h3 className="font-bold text-lg">{label}</h3>
        </div>
        <div className="text-3xl font-bold mt-4" style={{ color: getColorValue(color) }}>
          {displayText}
        </div>
      </div>
    );
  }
};

const DotMatrixWPM = ({ monthlyWPM, config }) => {
  const Icon = config?.icon ?? TrendingUp;
  const title = config?.dotMatrixTitle ?? config?.label ?? 'WPM';
  const colorClass = config?.color ?? 'text-blue-600';
  const intensityColors = config?.intensityColors ?? ['bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700'];
  return (
    <div className="border-b border-base-300 pb-6 last:border-b-0">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${colorClass}`} />
        <div>
          <h3 className={`font-bold text-lg ${colorClass.replace('600', '800')} dark:${colorClass.replace('600', '200')}`}>{title}</h3>
          <p className={`text-sm ${colorClass.replace('600', '700')} dark:${colorClass.replace('600', '300')}`}>Average WPM by month</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 justify-center">
          {MONTH_NAMES.map((month) => (
            <div key={month} className="text-xs text-base-content/60 text-center w-16">{month}</div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          {MONTH_NAMES.map((month, monthIndex) => {
            const wpm = monthlyWPM?.[monthIndex] ?? null;
            const intensity = wpm == null ? 0 : wpm < 15 ? 0 : wpm < 30 ? 1 : wpm < 50 ? 2 : wpm < 75 ? 3 : 4;
            const displayVal = wpm != null ? (Math.round(wpm * 10) / 10) : '—';
            return (
              <div
                key={month}
                className={`w-16 h-16 rounded-lg ${intensityColors[intensity]} hover:ring-2 hover:ring-offset-1 transition-all cursor-pointer flex flex-col items-center justify-center`}
                title={`${month}: ${displayVal} WPM`}
              >
                <span className="text-xs font-semibold text-base-content/70">{displayVal}</span>
                <span className="text-[10px] text-base-content/50">WPM</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-base-content/60">
          <span>Lower</span>
          <div className="flex gap-1">
            {intensityColors.map((c, i) => (
              <div key={i} className={`w-4 h-4 rounded-lg ${c}`} />
            ))}
          </div>
          <span>Higher</span>
        </div>
      </div>
    </div>
  );
};

const CATEGORIES = ['science', 'social', 'literature', 'language'];

export function LanguageDevelopmentCharts({ assessments = [], viewMode = 'dotmatrix', title = 'Language Development Analysis', showWordScores = false, cohortThresholdsByCategory = null }) {
  const monthlyWPMByCategory = useMemo(() => {
    const result = {};
    CATEGORIES.forEach((cat) => {
      const monthlySums = {};
      const monthlyCounts = {};
      for (let i = 0; i < 12; i++) {
        monthlySums[i] = 0;
        monthlyCounts[i] = 0;
      }
      if (Array.isArray(assessments)) {
        assessments.forEach((assessment) => {
          const cwpm = assessment?.categoryWPM?.[cat];
          if (cwpm != null && !isNaN(cwpm) && assessment?.date) {
            const date = new Date(assessment.date);
            if (!isNaN(date.getTime())) {
              const monthIndex = date.getMonth();
              monthlySums[monthIndex] += cwpm;
              monthlyCounts[monthIndex] += 1;
            }
          }
        });
      }
      result[cat] = {};
      for (let i = 0; i < 12; i++) {
        result[cat][i] = monthlyCounts[i] > 0 ? monthlySums[i] / monthlyCounts[i] : null;
      }
    });
    return result;
  }, [assessments]);

  const averageWPMByCategory = useMemo(() => {
    const result = {};
    CATEGORIES.forEach((cat) => {
      const validWPM = (Array.isArray(assessments) ? assessments : [])
        .map((a) => a?.categoryWPM?.[cat])
        .filter((w) => w != null && !isNaN(w));
      result[cat] = validWPM.length > 0 ? validWPM.reduce((s, w) => s + w, 0) / validWPM.length : null;
    });
    return result;
  }, [assessments]);

  const averageWPM = useMemo(() => {
    const validWPM = (Array.isArray(assessments) ? assessments : [])
      .map((a) => a?.wordsPerMinute)
      .filter((w) => w != null && !isNaN(w));
    if (validWPM.length === 0) return null;
    return validWPM.reduce((s, w) => s + w, 0) / validWPM.length;
  }, [assessments]);

  const speedometerMaxByCategory = useMemo(() => {
    const result = {};
    CATEGORIES.forEach((cat) => {
      const maxMonthly = Math.max(...Object.values(monthlyWPMByCategory[cat] || {}).filter((v) => v != null), 0);
      const val = averageWPMByCategory[cat] ?? maxMonthly;
      const cohortMax = cohortThresholdsByCategory?.[cat]?.avgMax;
      const baseMax = Math.max(75, Math.ceil((val || 0) / 25) * 25);
      result[cat] = cohortMax != null ? Math.max(baseMax, Math.ceil(cohortMax / 25) * 25) : baseMax;
    });
    return result;
  }, [averageWPMByCategory, monthlyWPMByCategory, cohortThresholdsByCategory]);

  const hasAnyCategoryWPM = useMemo(() => {
    return CATEGORIES.some((cat) => averageWPMByCategory[cat] != null);
  }, [averageWPMByCategory]);

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">{title}</h2>
        <div className="divider" />

        {viewMode === 'semicircular' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            {CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config?.icon ?? TrendingUp;
              return (
                <SemicircularDial
                  key={cat}
                  value={averageWPMByCategory[cat] ?? averageWPM}
                  max={speedometerMaxByCategory[cat] ?? 150}
                  color={config?.color ?? 'text-blue-600'}
                  label={`${config?.label} WPM`}
                  description={hasAnyCategoryWPM ? `Per-category: ${config?.label} keywords` : 'Fallback to overall WPM'}
                  icon={Icon}
                  cohortThresholds={cohortThresholdsByCategory?.[cat] ?? null}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORIES.map((cat) => (
              <DotMatrixWPM
                key={cat}
                monthlyWPM={monthlyWPMByCategory[cat]}
                config={CATEGORY_CONFIG[cat]}
              />
            ))}
          </div>
        )}

        {showWordScores && (averageWPM != null || hasAnyCategoryWPM) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Average Words Per Minute by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const val = averageWPMByCategory[cat];
                return (
                  <div key={cat} className={`card ${config.bgClass} border border-base-300`}>
                    <div className="card-body p-3">
                      <h4 className="font-semibold text-sm">{config.label}</h4>
                      <div className={`text-xl font-bold ${config.color}`}>
                        {val != null ? `${Math.round(val * 10) / 10} WPM` : '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {averageWPM != null && (
              <p className="text-sm text-base-content/60 mt-3">
                Overall: {Math.round(averageWPM * 10) / 10} WPM across {assessments.filter((a) => a?.wordsPerMinute != null).length} recording(s)
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Language Development Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h4 className="font-semibold text-sm mb-2">Strengths</h4>
                <ul className="text-sm space-y-1">
                  {averageWPM != null && averageWPM >= 120 && <li>• Strong language output (120+ WPM)</li>}
                  {averageWPM != null && averageWPM >= 90 && averageWPM < 120 && <li>• Solid conversational pace</li>}
                  {averageWPM != null && averageWPM < 90 && <li>• Steady progress in language use</li>}
                  {hasAnyCategoryWPM && <li>• Category WPM shows vocabulary use per skill area</li>}
                  {(averageWPM == null || isNaN(averageWPM)) && !hasAnyCategoryWPM && <li>• Upload recordings with duration data to see WPM insights</li>}
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h4 className="font-semibold text-sm mb-2">Areas for Growth</h4>
                <ul className="text-sm space-y-1">
                  {averageWPM != null && averageWPM < 60 && <li>• Encourage more verbal participation</li>}
                  {averageWPM != null && averageWPM >= 60 && <li>• Continue building vocabulary and fluency</li>}
                  {hasAnyCategoryWPM && <li>• Use category breakdown to target specific skill areas</li>}
                  {(averageWPM == null || isNaN(averageWPM)) && !hasAnyCategoryWPM && <li>• Record and upload more sessions for WPM tracking</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
