import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAppTheme } from '../../context/themecontext';
import {
  computeMetric,
  formatMetricValue,
  roundMetricValue,
} from './history-metrics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const MetricChart = ({ histories, metric, onDatePress }) => {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const chartConfig = useMemo(() => {
    if (!histories || histories.length === 0) {
      return { allDates: [], dataSet: [] };
    }

    const palette = buildSeriesPalette(c);
    const orderedDates = Array.from(
      new Set(
        histories.flatMap((history) => history.sessions.map((session) => session.date))
      )
    ).sort((left, right) => left.localeCompare(right));

    const dataSet = histories.map((history, index) => {
      const color = palette[index % palette.length];
      const sessionMap = new Map(
        history.sessions.map((session) => [session.date, session])
      );

      const data = orderedDates.map((date) => {
        const session = sessionMap.get(date);

        if (!session) {
          return {
            value: undefined,
            label: formatChartDate(date),
            date,
            exerciseName: history.exercise.name,
            seriesColor: color,
            isMissing: true,
          };
        }

        return {
          value: roundMetricValue(computeMetric(session.sets, metric.key)),
          label: formatChartDate(date),
          date,
          exerciseName: history.exercise.name,
          seriesColor: color,
          isMissing: false,
        };
      });

      return {
        data,
        color,
        thickness: 3,
        curved: true,
        dataPointsRadius: 4,
        dataPointsColor: color,
      };
    });

    return {
      allDates: orderedDates,
      dataSet,
    };
  }, [c, histories, metric.key]);

  if (chartConfig.allDates.length === 0) {
    return null;
  }

  const chartWidth = SCREEN_WIDTH - 94;
  const pointCount = chartConfig.allDates.length;
  const spacing = pointCount > 1
    ? Math.max(42, Math.min(chartWidth / Math.max(pointCount - 1, 1), 80))
    : chartWidth;
  const isScrollable = pointCount > 8;

  const maxLabelCount = Math.floor(chartWidth / 56);
  const labelInterval = pointCount > maxLabelCount
    ? Math.ceil(pointCount / maxLabelCount)
    : 1;

  const dataSetWithLabels = chartConfig.dataSet.map((series) => ({
    ...series,
    data: series.data.map((point, index) => ({
      ...point,
      label: index % labelInterval === 0 || index === pointCount - 1
        ? point.label
        : '',
    })),
  }));

  return (
    <View>
      <View style={styles.legend}>
        {histories.map((history, index) => {
          const color = chartConfig.dataSet[index]?.color;

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

      <LineChart
        dataSet={dataSetWithLabels}
        width={isScrollable ? undefined : chartWidth}
        height={230}
        spacing={spacing}
        initialSpacing={20}
        endSpacing={20}
        curved
        hideDataPoints={false}
        interpolateMissingValues={false}
        extrapolateMissingValues={false}
        yAxisColor={c.border}
        xAxisColor={c.border}
        yAxisTextStyle={{ color: c.textTertiary, fontSize: 11 }}
        xAxisLabelTextStyle={{ color: c.textTertiary, fontSize: 10 }}
        noOfSections={5}
        rulesColor={c.border + '50'}
        rulesType="dashed"
        backgroundColor="transparent"
        scrollToEnd={isScrollable}
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
                </Text>
                {visibleItems.slice(0, 3).map((item) => (
                  <Text key={`${item.exerciseName}-${item.date}`} style={[styles.tooltipValue, { color: c.textPrimary }]}>
                    {item.exerciseName}: {formatMetricValue(item.value, metric.key, { includeUnit: true })}
                  </Text>
                ))}
                {visibleItems.length === 0 && (
                  <Text style={[styles.tooltipValue, { color: c.textPrimary }]}>No workout on this date</Text>
                )}
              </View>
            );
          },
          pointerEvents: 'auto',
          onComplete: (items, index) => {
            const visibleItems = items.filter((item) => !item.isMissing);
            if (visibleItems.length === 0) return;

            const selectedDate = chartConfig.allDates[index];
            if (selectedDate && onDatePress) {
              onDatePress(selectedDate);
            }
          },
        }}
      />

      <Text style={[styles.tapHint, { color: c.textTertiary }]}>
        Tap a chart point to see the workout and PR stars for that date.
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
  tapHint: {
    fontSize: 12,
    marginTop: 10,
    paddingLeft: 4,
  },
});

export default MetricChart;
