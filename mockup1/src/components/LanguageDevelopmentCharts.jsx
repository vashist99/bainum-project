import { useMemo } from "react";
import ReactSpeedometer from "react-d3-speedometer";
import { Microscope, MessageCircle, BookOpen, Brain } from "lucide-react";

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_CONFIG = [
  { key: 'science', label: 'Talk to support science skills', desc: 'Scientific vocabulary & concepts', color: 'blue', Icon: Microscope },
  { key: 'social', label: 'Talk to support social emotional skills', desc: 'Communication & interaction', color: 'green', Icon: MessageCircle },
  { key: 'literature', label: 'Talk to support literature skills', desc: 'Storytelling & narrative skills', color: 'purple', Icon: BookOpen },
  { key: 'language', label: 'Talk to support language development skills', desc: 'Overall language growth', color: 'orange', Icon: Brain },
];

const getColorValue = (colorClass) => {
  if (colorClass.includes('blue')) return '#2563eb';
  if (colorClass.includes('green')) return '#16a34a';
  if (colorClass.includes('purple')) return '#9333ea';
  if (colorClass.includes('orange')) return '#ea580c';
  if (colorClass.includes('indigo')) return '#4f46e5';
  return '#6366f1';
};

const SemicircularDial = ({ value, max = 200, color, label, description, icon: Icon }) => {
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
            value={Math.round(Math.max(0, Math.min(value, max)))}
            needleColor={getColorValue(color)}
            customSegmentStops={(() => {
              const segments = 8;
              const stops = [];
              for (let i = 0; i <= segments; i++) {
                stops.push(Math.round((max / segments) * i));
              }
              return stops;
            })()}
            segmentColors={[
              '#f59e0b', '#f59e0b', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#ef4444', '#ef4444'
            ]}
            segmentValueFormatter={(v) => String(Math.round(v))}
            ringWidth={30}
            needleTransitionDuration={1000}
            needleTransition="easeElastic"
            textColor="#ffffff"
            valueTextFontSize="16px"
            labelFontSize="12px"
            currentValueText={`${Math.round(value)} words`}
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
          {Math.round(value)} words
        </div>
      </div>
    );
  }
};

const COLOR_CLASSES = {
  blue: {
    colors: ['bg-blue-100 dark:bg-blue-950/20', 'bg-blue-300 dark:bg-blue-800/50', 'bg-blue-500 dark:bg-blue-600', 'bg-blue-600 dark:bg-blue-500', 'bg-blue-700 dark:bg-blue-400'],
    icon: 'text-blue-600',
    title: 'text-blue-800 dark:text-blue-200',
    desc: 'text-blue-700 dark:text-blue-300',
    ring: 'hover:ring-blue-500',
  },
  green: {
    colors: ['bg-green-100 dark:bg-green-950/20', 'bg-green-300 dark:bg-green-800/50', 'bg-green-500 dark:bg-green-600', 'bg-green-600 dark:bg-green-500', 'bg-green-700 dark:bg-green-400'],
    icon: 'text-green-600',
    title: 'text-green-800 dark:text-green-200',
    desc: 'text-green-700 dark:text-green-300',
    ring: 'hover:ring-green-500',
  },
  purple: {
    colors: ['bg-purple-100 dark:bg-purple-950/20', 'bg-purple-300 dark:bg-purple-800/50', 'bg-purple-500 dark:bg-purple-600', 'bg-purple-600 dark:bg-purple-500', 'bg-purple-700 dark:bg-purple-400'],
    icon: 'text-purple-600',
    title: 'text-purple-800 dark:text-purple-200',
    desc: 'text-purple-700 dark:text-purple-300',
    ring: 'hover:ring-purple-500',
  },
  orange: {
    colors: ['bg-orange-100 dark:bg-orange-950/20', 'bg-orange-300 dark:bg-orange-800/50', 'bg-orange-500 dark:bg-orange-600', 'bg-orange-600 dark:bg-orange-500', 'bg-orange-700 dark:bg-orange-400'],
    icon: 'text-orange-600',
    title: 'text-orange-800 dark:text-orange-200',
    desc: 'text-orange-700 dark:text-orange-300',
    ring: 'hover:ring-orange-500',
  },
};

const DotMatrixRow = ({ category, monthlyData, color }) => {
  const classes = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
  const colors = classes.colors;

  return (
    <div className="border-b border-base-300 pb-6 last:border-b-0">
      <div className="flex items-center gap-3 mb-4">
        {category.Icon && <category.Icon className={`w-6 h-6 ${classes.icon}`} />}
        <div>
          <h3 className={`font-bold text-lg ${classes.title}`}>{category.label}</h3>
          <p className={`text-sm ${classes.desc}`}>{category.desc}</p>
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
            const monthData = monthlyData?.[monthIndex] || {};
            const wordCount = monthData[category.key] || 0;
            const intensity = wordCount < 80 ? 0 : wordCount < 110 ? 1 : wordCount < 140 ? 2 : wordCount < 170 ? 3 : 4;
            return (
              <div
                key={month}
                className={`w-16 h-16 rounded-lg ${colors[intensity]} hover:ring-2 ${classes.ring} transition-all cursor-pointer flex flex-col items-center justify-center`}
                title={`${month}: ${wordCount} words`}
              >
                <span className="text-xs font-semibold text-base-content/70">{wordCount}</span>
                <span className="text-[10px] text-base-content/50">words</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-base-content/60">
          <span>Fewer words</span>
          <div className="flex gap-1">
            {colors.map((c, i) => (
              <div key={i} className={`w-4 h-4 rounded-lg ${c}`} />
            ))}
          </div>
          <span>More words</span>
        </div>
      </div>
    </div>
  );
};

export function LanguageDevelopmentCharts({ assessments = [], viewMode = 'dotmatrix', title = 'Language Development Analysis', showWordScores = false }) {
  const monthlyKeywordData = useMemo(() => {
    const monthlyData = {};
    MONTH_NAMES.forEach((month, index) => {
      monthlyData[index] = { month, science: 0, social: 0, literature: 0, language: 0 };
    });
    if (Array.isArray(assessments)) {
      assessments.forEach((assessment) => {
        if (assessment?.date && assessment?.keywordCounts) {
          const date = new Date(assessment.date);
          if (!isNaN(date.getTime())) {
            const monthIndex = date.getMonth();
            if (monthlyData[monthIndex]) {
              monthlyData[monthIndex].science += assessment.keywordCounts.science || 0;
              monthlyData[monthIndex].social += assessment.keywordCounts.social || 0;
              monthlyData[monthIndex].literature += assessment.keywordCounts.literature || 0;
              monthlyData[monthIndex].language += assessment.keywordCounts.language || 0;
            }
          }
        }
      });
    }
    return monthlyData;
  }, [assessments]);

  const totalKeywordCounts = useMemo(() => {
    const totals = { scienceTalk: 0, socialTalk: 0, literatureTalk: 0, languageDevelopment: 0 };
    if (Array.isArray(assessments)) {
      assessments.forEach((assessment) => {
        if (assessment?.keywordCounts) {
          totals.scienceTalk += assessment.keywordCounts.science || 0;
          totals.socialTalk += assessment.keywordCounts.social || 0;
          totals.literatureTalk += assessment.keywordCounts.literature || 0;
          totals.languageDevelopment += assessment.keywordCounts.language || 0;
        }
      });
    }
    return totals;
  }, [assessments]);

  const speedometerMax = useMemo(() => {
    const maxValue = Math.max(
      totalKeywordCounts.scienceTalk,
      totalKeywordCounts.socialTalk,
      totalKeywordCounts.literatureTalk,
      totalKeywordCounts.languageDevelopment
    );
    return Math.max(200, Math.ceil(maxValue / 50) * 50);
  }, [totalKeywordCounts]);

  const latestAssessment = useMemo(() => {
    if (!assessments?.length) return null;
    return assessments[0];
  }, [assessments]);

  const languageData = useMemo(() => {
    if (latestAssessment) {
      return {
        scienceTalk: latestAssessment.scienceTalk || 0,
        socialTalk: latestAssessment.socialTalk || 0,
        literatureTalk: latestAssessment.literatureTalk || 0,
        languageDevelopment: latestAssessment.languageDevelopment || 0,
      };
    }
    return null;
  }, [latestAssessment]);

  const countByCategory = {
    science: totalKeywordCounts.scienceTalk,
    social: totalKeywordCounts.socialTalk,
    literature: totalKeywordCounts.literatureTalk,
    language: totalKeywordCounts.languageDevelopment,
  };

  const monthlyDataForDotMatrix = useMemo(() => {
    const result = {};
    for (let i = 0; i < 12; i++) {
      result[i] = {
        science: monthlyKeywordData[i]?.science ?? 0,
        social: monthlyKeywordData[i]?.social ?? 0,
        literature: monthlyKeywordData[i]?.literature ?? 0,
        language: monthlyKeywordData[i]?.language ?? 0,
      };
    }
    return result;
  }, [monthlyKeywordData]);

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">{title}</h2>
        <div className="divider" />

        {viewMode === 'semicircular' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            {CATEGORY_CONFIG.map((cat) => (
              <SemicircularDial
                key={cat.key}
                value={countByCategory[cat.key] ?? 0}
                max={speedometerMax}
                color={COLOR_CLASSES[cat.color]?.icon || 'text-blue-600'}
                label={cat.label}
                description={cat.desc}
                icon={cat.Icon}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORY_CONFIG.map((cat) => (
              <DotMatrixRow
                key={cat.key}
                category={cat}
                monthlyData={monthlyDataForDotMatrix}
                color={cat.color}
              />
            ))}
          </div>
        )}

        {showWordScores && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Word Assessment Scores</h3>
            <div className="space-y-4">
              {CATEGORY_CONFIG.map((cat) => {
                const count = countByCategory[cat.key] ?? 0;
                const pct = speedometerMax > 0 ? (count / speedometerMax) * 100 : 0;
                const barColors = { blue: 'bg-blue-600', green: 'bg-green-600', purple: 'bg-purple-600', orange: 'bg-orange-600' };
                const barColor = barColors[cat.color] || 'bg-blue-600';
                return (
                  <div key={cat.key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        {cat.Icon && <cat.Icon className={`w-4 h-4 ${COLOR_CLASSES[cat.color]?.icon || 'text-blue-600'}`} />}
                        {cat.label}
                      </span>
                      <span className="text-sm text-base-content/60">{count}/{speedometerMax} words</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-300 rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Language Development Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h4 className="font-semibold text-sm mb-2">Strengths</h4>
                <ul className="text-sm space-y-1">
                  {languageData?.scienceTalk > 80 && <li>• Strong scientific vocabulary</li>}
                  {languageData?.socialTalk > 80 && <li>• Excellent social communication</li>}
                  {languageData?.literatureTalk > 80 && <li>• Advanced storytelling skills</li>}
                  {languageData?.languageDevelopment > 80 && <li>• Rapid language development</li>}
                  {(!languageData || Object.values(languageData).every(v => v <= 80)) &&
                    <li>• Consistent progress across all areas</li>
                  }
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h4 className="font-semibold text-sm mb-2">Areas for Growth</h4>
                <ul className="text-sm space-y-1">
                  {languageData?.scienceTalk < 70 && <li>• Science vocabulary development</li>}
                  {languageData?.socialTalk < 70 && <li>• Social interaction skills</li>}
                  {languageData?.literatureTalk < 70 && <li>• Narrative and storytelling</li>}
                  {languageData?.languageDevelopment < 70 && <li>• Overall language skills</li>}
                  {(!languageData || Object.values(languageData).every(v => v >= 70)) &&
                    <li>• Continue current development trajectory</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

