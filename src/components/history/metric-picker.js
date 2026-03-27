import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { useAppTheme } from '../../context/themecontext';

const METRICS = [
  { key: 'total_reps', label: 'Total Reps' },
  { key: 'max_weight', label: 'Max Weight' },
  { key: 'total_tonnage', label: 'Total Tonnage' },
  { key: 'num_sets', label: 'Sets' },
  { key: 'max_set_volume', label: 'Best Set Volume' },
  { key: 'avg_weight', label: 'Avg Weight' },
  { key: 'avg_rest', label: 'Avg Rest' },
];

const MetricPicker = ({ selectedMetric, onSelect }) => {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {METRICS.map((metric) => {
        const isSelected = selectedMetric === metric.key;
        return (
          <Chip
            key={metric.key}
            selected={isSelected}
            onPress={() => onSelect(metric.key)}
            mode={isSelected ? 'flat' : 'outlined'}
            style={[
              styles.chip,
              isSelected
                ? { backgroundColor: c.primary }
                : { borderColor: c.borderLight },
            ]}
            textStyle={[
              styles.chipText,
              { color: isSelected ? '#FFFFFF' : c.textSecondary },
            ]}
            showSelectedOverlay={false}
          >
            {metric.label}
          </Chip>
        );
      })}
    </ScrollView>
  );
};

export { METRICS };

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    height: 36,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default MetricPicker;
