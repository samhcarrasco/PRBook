const HISTORY_METRICS = [
  { key: 'total_reps', label: 'Total Reps', unitLabel: 'reps', unitShort: 'reps' },
  { key: 'max_weight', label: 'Max Weight', unitLabel: 'lbs', unitShort: 'lbs' },
  { key: 'total_tonnage', label: 'Total Tonnage', unitLabel: 'lbs', unitShort: 'lbs' },
  { key: 'num_sets', label: 'Number of Sets', unitLabel: 'sets', unitShort: 'sets' },
  { key: 'max_set_volume', label: 'Best Set Volume', unitLabel: 'lb-reps', unitShort: 'lb-reps' },
  { key: 'avg_weight', label: 'Average Weight', unitLabel: 'lbs', unitShort: 'lbs' },
  { key: 'avg_rest', label: 'Average Rest', unitLabel: 'mm:ss', unitShort: '' },
];

const roundMetricValue = (value) => Math.round((value || 0) * 100) / 100;

const toNumericSets = (sets) => sets.map((set) => ({
  weight: parseFloat(set.weight) || 0,
  reps: parseInt(set.reps, 10) || 0,
  rest_time: set.rest_time || 0,
}));

const formatDuration = (seconds) => {
  const totalSeconds = Math.max(0, Math.round(seconds || 0));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getMetricConfig = (metricKey) =>
  HISTORY_METRICS.find((metric) => metric.key === metricKey) || HISTORY_METRICS[0];

const computeMetric = (sets, metricKey) => {
  const numericSets = toNumericSets(sets);

  switch (metricKey) {
    case 'total_reps':
      return numericSets.reduce((sum, set) => sum + set.reps, 0);
    case 'max_weight':
      return numericSets.reduce((max, set) => Math.max(max, set.weight), 0);
    case 'total_tonnage':
      return numericSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
    case 'num_sets':
      return numericSets.length;
    case 'max_set_volume':
      return numericSets.reduce((max, set) => Math.max(max, set.weight * set.reps), 0);
    case 'avg_weight': {
      const weightedSets = numericSets.filter((set) => set.weight > 0);
      if (weightedSets.length === 0) return 0;
      return weightedSets.reduce((sum, set) => sum + set.weight, 0) / weightedSets.length;
    }
    case 'avg_rest': {
      const restTimes = numericSets.map((set) => set.rest_time).filter((time) => time > 0);
      if (restTimes.length === 0) return 0;
      return restTimes.reduce((sum, time) => sum + time, 0) / restTimes.length;
    }
    default:
      return 0;
  }
};

const formatMetricValue = (value, metricKey, options = {}) => {
  const { compact = false, includeUnit = false } = options;
  const metric = getMetricConfig(metricKey);
  const roundedValue = roundMetricValue(value);

  if (metricKey === 'avg_rest') {
    const duration = formatDuration(roundedValue);
    return includeUnit ? `${duration} ${metric.unitLabel}` : duration;
  }

  let formattedValue;
  if (compact && Math.abs(roundedValue) >= 1000) {
    formattedValue = `${(roundedValue / 1000).toFixed(Math.abs(roundedValue) >= 10000 ? 0 : 1)}k`;
  } else if (Number.isInteger(roundedValue)) {
    formattedValue = roundedValue.toString();
  } else {
    formattedValue = roundedValue.toFixed(1);
  }

  if (includeUnit && metric.unitShort) {
    return `${formattedValue} ${metric.unitShort}`;
  }

  return formattedValue;
};

export {
  HISTORY_METRICS,
  computeMetric,
  formatDuration,
  formatMetricValue,
  getMetricConfig,
  roundMetricValue,
};
