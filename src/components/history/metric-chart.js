import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAppTheme } from '../../context/themecontext';
import {
  computeMetric,
  formatMetricValue,
  roundMetricValue,
} from './history-metrics';

const CHART_HEIGHT = 230;
const Y_AXIS_LABEL_WIDTH = 44;
const Y_AXIS_THICKNESS = 1;
const CHART_WIDTH_BUFFER = 6;
const LABELS_EXTRA_HEIGHT = 12;
const COMPACT_X_AXIS_LABEL_HEIGHT = 20;
const ROTATED_X_AXIS_LABEL_HEIGHT = 42;

const MAX_DATA_POINTS = 50;
const MAX_VISIBLE_LABELS = 8;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildSeriesPalette = (colors) => [
  colors.primary,
  colors.success,
  colors.secondary,
  '#F97316',
  '#06B6D4',
  '#E11D48',
];

const formatChartDate = (date) => {
  const dateParts = date.split('-');
  return `${parseInt(dateParts[1], 10)}/${parseInt(dateParts[2], 10)}`;
};

const formatPeriodLabel = (periodKey, level) => {
  if (level === 'month') {
    const [year, month] = periodKey.split('-');
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} '${year.slice(2)}`;
  }
  // week: show the start date of the week
  const parts = periodKey.split('-');
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
};

const getAggregationLevel = (dateCount) => {
  if (dateCount <= MAX_DATA_POINTS) return 'none';
  if (dateCount <= 180) return 'week';
  return 'month';
};

const getMonthKey = (dateStr) => dateStr.slice(0, 7);

const getWeekKey = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const MetricChart = ({ histories, metric, onDatePress, timelineBounds }) => {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;
  const [chartFrameWidth, setChartFrameWidth] = useState(0);

  const chartConfig = useMemo(() => {
    if (!histories || histories.length === 0 || !timelineBounds) {
      return { allDates: [], dataSet: [], hasVisibleData: false };
    }

    const palette = buildSeriesPalette(c);

    // Collect all unique dates with actual data
    const dataDates = new Set(
      histories.flatMap((history) => history.sessions.map((session) => session.date))
    );
    const orderedDates = Array.from(
      new Set([
        timelineBounds.startDate,
        ...dataDates,
        timelineBounds.endDate,
      ])
    ).sort((a, b) => a.localeCompare(b));

    const hasVisibleData = histories.some((history) => history.sessions.length > 0);
    const aggregationLevel = getAggregationLevel(orderedDates.length);

    if (aggregationLevel === 'none') {
      // No aggregation needed — original behavior with smart label thinning
      const labelIndexes = [];
      orderedDates.forEach((date, index) => {
        if (dataDates.has(date)) labelIndexes.push(index);
      });

      // Thin labels to MAX_VISIBLE_LABELS
      let visibleLabelIndexes;
      if (labelIndexes.length <= MAX_VISIBLE_LABELS) {
        visibleLabelIndexes = new Set(labelIndexes.length > 0 ? labelIndexes : [0]);
      } else {
        const step = (labelIndexes.length - 1) / (MAX_VISIBLE_LABELS - 1);
        const thinned = [];
        for (let i = 0; i < MAX_VISIBLE_LABELS; i++) {
          thinned.push(labelIndexes[Math.round(i * step)]);
        }
        visibleLabelIndexes = new Set(thinned);
      }

      const dataSet = histories.map((history, hIndex) => {
        const legendColor = palette[hIndex % palette.length];
        const hasSeriesData = history.sessions.length > 0;
        const sessionMap = new Map(
          history.sessions.map((session) => [session.date, session])
        );

        const data = orderedDates.map((date) => {
          const session = sessionMap.get(date);
          if (!session) {
            return {
              value: hasSeriesData ? undefined : 0,
              label: formatChartDate(date),
              date,
              exerciseName: history.exercise.name,
              seriesColor: legendColor,
              isMissing: true,
              hideDataPoint: true,
            };
          }
          return {
            value: roundMetricValue(computeMetric(session.sets, metric.key)),
            label: formatChartDate(date),
            date,
            exerciseName: history.exercise.name,
            seriesColor: legendColor,
            isMissing: false,
          };
        });

        return {
          data,
          color: hasSeriesData ? legendColor : 'transparent',
          legendColor,
          thickness: 3,
          curved: false,
          dataPointsRadius: hasSeriesData ? 4 : 0,
          dataPointsColor: hasSeriesData ? legendColor : 'transparent',
        };
      });

      return {
        allDates: orderedDates,
        dataSet,
        hasVisibleData,
        visibleLabelIndexes,
        aggregated: false,
      };
    }

    // --- Aggregation path (week or month) ---
    const getPeriodKey = aggregationLevel === 'month' ? getMonthKey : getWeekKey;

    // Build ordered period keys from the date range
    const periodMap = new Map();
    for (const date of orderedDates) {
      const key = getPeriodKey(date);
      if (!periodMap.has(key)) {
        periodMap.set(key, { key, dates: [] });
      }
      periodMap.get(key).dates.push(date);
    }
    const periods = Array.from(periodMap.values());

    // Thin labels
    let visibleLabelIndexes;
    if (periods.length <= MAX_VISIBLE_LABELS) {
      visibleLabelIndexes = new Set(periods.map((_, i) => i));
    } else {
      const step = (periods.length - 1) / (MAX_VISIBLE_LABELS - 1);
      const thinned = [];
      for (let i = 0; i < MAX_VISIBLE_LABELS; i++) {
        thinned.push(Math.round(i * step));
      }
      visibleLabelIndexes = new Set(thinned);
    }

    const dataSet = histories.map((history, hIndex) => {
      const legendColor = palette[hIndex % palette.length];
      const hasSeriesData = history.sessions.length > 0;

      // Pre-index sessions by period
      const sessionsByPeriod = new Map();
      for (const session of history.sessions) {
        const key = getPeriodKey(session.date);
        if (!sessionsByPeriod.has(key)) {
          sessionsByPeriod.set(key, []);
        }
        sessionsByPeriod.get(key).push(session);
      }

      const data = periods.map((period) => {
        const sessions = sessionsByPeriod.get(period.key) || [];
        const label = formatPeriodLabel(period.key, aggregationLevel);

        if (sessions.length === 0) {
          return {
            value: hasSeriesData ? undefined : 0,
            label,
            date: period.dates[0],
            periodKey: period.key,
            exerciseName: history.exercise.name,
            seriesColor: legendColor,
            isMissing: true,
            hideDataPoint: true,
          };
        }

        // Average the metric across sessions in this period
        const values = sessions.map((s) => computeMetric(s.sets, metric.key));
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

        return {
          value: roundMetricValue(avg),
          label,
          date: sessions[sessions.length - 1].date,
          periodKey: period.key,
          exerciseName: history.exercise.name,
          seriesColor: legendColor,
          isMissing: false,
          sessionCount: sessions.length,
        };
      });

      return {
        data,
        color: hasSeriesData ? legendColor : 'transparent',
        legendColor,
        thickness: 2.5,
        curved: true,
        dataPointsRadius: hasSeriesData ? 3 : 0,
        dataPointsColor: hasSeriesData ? legendColor : 'transparent',
      };
    });

    return {
      allDates: periods.map((p) => p.key),
      dataSet,
      hasVisibleData,
      visibleLabelIndexes,
      aggregated: true,
      aggregationLevel,
    };
  }, [c, histories, metric.key, timelineBounds]);

  if (chartConfig.allDates.length === 0) {
    return null;
  }

  const pointCount = chartConfig.allDates.length;
  const handleChartLayout = useCallback((event) => {
    const nextWidth = Math.max(0, Math.floor(event.nativeEvent.layout.width));
    setChartFrameWidth((currentWidth) => (
      Math.abs(currentWidth - nextWidth) > 1 ? nextWidth : currentWidth
    ));
  }, []);

  const chartFit = useMemo(() => {
    const availablePlotWidth = chartFrameWidth - Y_AXIS_LABEL_WIDTH - Y_AXIS_THICKNESS - CHART_WIDTH_BUFFER;
    if (availablePlotWidth <= 0) {
      return null;
    }

    const safePointCount = Math.max(pointCount, 1);
    const edgeGutter = safePointCount > 1
      ? Math.max(12, Math.min(availablePlotWidth / (safePointCount * 2.5), 18))
      : availablePlotWidth / 2;
    const visibleLabelCount = chartConfig.visibleLabelIndexes.size;
    const shouldRotateLabels = visibleLabelCount > 6;

    return {
      plotWidth: availablePlotWidth,
      edgeGutter,
      shouldRotateLabels,
    };
  }, [chartConfig.visibleLabelIndexes.size, chartFrameWidth, pointCount]);

  const dataSetWithLabels = chartConfig.dataSet.map((series) => ({
    ...series,
    data: series.data.map((point, index) => ({
      ...point,
      label: '',
      labelComponent: chartConfig.visibleLabelIndexes.has(index)
        ? () => {
          return (
            <View style={[
              styles.axisLabelWrap,
              chartFit?.shouldRotateLabels && styles.axisLabelWrapRotated,
            ]}>
              <Text
                style={[
                  styles.axisLabelText,
                  { color: c.textTertiary },
                  chartFit?.shouldRotateLabels && styles.axisLabelTextRotated,
                ]}
                numberOfLines={1}
              >
                {point.label}
              </Text>
            </View>
          );
        }
        : undefined,
    })),
  }));

  const aggregationHint = chartConfig.aggregated
    ? `Showing ${chartConfig.aggregationLevel === 'month' ? 'monthly' : 'weekly'} averages.`
    : null;

  return (
    <View>
      <View style={styles.legend}>
        {histories.map((history, index) => {
          const color = chartConfig.dataSet[index]?.legendColor;

          return (
            <View key={history.exercise.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendText, { color: c.textSecondary }]} numberOfLines={1}>
                {history.exercise.name}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.chartFrame} onLayout={handleChartLayout}>
        {chartFit ? (
          <LineChart
            dataSet={dataSetWithLabels}
            parentWidth={chartFrameWidth}
            width={chartFit.plotWidth}
            height={CHART_HEIGHT}
            adjustToWidth
            disableScroll
            scrollToEnd={false}
            scrollAnimation={false}
            bounces={false}
            initialSpacing={chartFit.edgeGutter}
            endSpacing={chartFit.edgeGutter}
            curved={chartConfig.aggregated}
            hideDataPoints={false}
            interpolateMissingValues={false}
            extrapolateMissingValues={false}
            yAxisThickness={Y_AXIS_THICKNESS}
            yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
            yAxisColor={c.border}
            xAxisColor={c.border}
            yAxisTextStyle={{ color: c.textTertiary, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: c.textTertiary, fontSize: 10 }}
            xAxisLabelsHeight={chartFit.shouldRotateLabels ? ROTATED_X_AXIS_LABEL_HEIGHT : COMPACT_X_AXIS_LABEL_HEIGHT}
            labelsExtraHeight={LABELS_EXTRA_HEIGHT}
            rotateLabel={chartFit.shouldRotateLabels}
            noOfSections={5}
            rulesColor={c.border + '50'}
            rulesType="dashed"
            maxValue={chartConfig.hasVisibleData ? undefined : 1}
            backgroundColor="transparent"
            isAnimated
            animationDuration={500}
            pointerConfig={{
              pointerStripColor: c.textTertiary,
              pointerStripWidth: 1,
              pointerColor: c.primary,
              radius: 6,
              pointerLabelWidth: 180,
              pointerLabelHeight: 64,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items) => {
                const visibleItems = items.filter((item) => !item.isMissing);
                const labelDate = visibleItems[0]?.date || items[0]?.date;

                return (
                  <View style={[styles.tooltip, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <Text style={[styles.tooltipDate, { color: c.textSecondary }]}>
                      {labelDate ? formatChartDate(labelDate) : ''}
                      {chartConfig.aggregated && visibleItems[0]?.sessionCount
                        ? ` (${visibleItems[0].sessionCount} sessions avg)`
                        : ''}
                    </Text>
                    {visibleItems.slice(0, 3).map((item) => (
                      <Text key={`${item.exerciseName}-${item.date}`} style={[styles.tooltipValue, { color: c.textPrimary }]}>
                        {item.exerciseName}: {formatMetricValue(item.value, metric.key, { includeUnit: true })}
                      </Text>
                    ))}
                    {visibleItems.length === 0 && (
                      <Text style={[styles.tooltipValue, { color: c.textPrimary }]}>No workout in this period</Text>
                    )}
                  </View>
                );
              },
              pointerEvents: 'auto',
              onComplete: (items, index) => {
                const visibleItems = items.filter((item) => !item.isMissing);
                if (visibleItems.length === 0) return;

                const selectedDate = visibleItems[0]?.date;
                if (selectedDate && onDatePress) {
                  onDatePress(selectedDate);
                }
              },
            }}
          />
        ) : null}
      </View>

      <Text style={[styles.tapHint, { color: c.textTertiary }]}>
        {aggregationHint
          ? `${aggregationHint} Tap a point to see details.`
          : 'Tap a chart point to see the workout and PR stars for that date.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '48%',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  tooltip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  tooltipDate: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartFrame: {
    width: '100%',
    minHeight: CHART_HEIGHT,
  },
  axisLabelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  axisLabelWrapRotated: {
    width: 58,
  },
  axisLabelText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  axisLabelTextRotated: {
    fontSize: 9,
  },
  tapHint: {
    fontSize: 12,
    marginTop: 10,
    paddingLeft: 4,
  },
});

export default MetricChart;
