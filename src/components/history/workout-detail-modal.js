import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/themecontext';
import { PR_TYPE_CONFIG } from '../../theme/theme';
import { computeMetric, formatMetricValue } from './history-metrics';
import moment from 'moment';

const WorkoutDetailModal = ({ visible, onDismiss, data }) => {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  if (!data) return null;

  const { date, workouts } = data;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: c.surface }]}
      >
        <Text style={[styles.dateHeader, { color: c.textPrimary }]}>
          {moment(date).format('MMMM D, YYYY')}
        </Text>
        <Text style={[styles.subtitle, { color: c.textTertiary }]}>
          Workout snapshot for the selected graphed date
        </Text>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {workouts.map((workout) => {
            const totalSets = computeMetric(workout.sets, 'num_sets');
            const totalReps = computeMetric(workout.sets, 'total_reps');
            const maxWeight = computeMetric(workout.sets, 'max_weight');
            const totalTonnage = computeMetric(workout.sets, 'total_tonnage');

            return (
              <Surface
                key={`${workout.daily_workout_id}-${workout.exerciseId}`}
                style={[styles.workoutCard, { backgroundColor: c.surfaceVariant }]}
                elevation={0}
              >
                <View style={styles.headerRow}>
                  <Text style={[styles.exerciseName, { color: c.textPrimary }]}>
                    {workout.exerciseName}
                  </Text>
                  {workout.prTypes.length > 0 && (
                    <View style={styles.starRow}>
                      {workout.prTypes.map((prType) => (
                        <MaterialCommunityIcons
                          key={`${workout.daily_workout_id}-${prType}`}
                          name="star"
                          size={16}
                          color={PR_TYPE_CONFIG[prType]?.color || '#FBBF24'}
                        />
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.summaryRow}>
                  <View style={[styles.summaryPill, { backgroundColor: c.background }]}>
                    <Text style={[styles.summaryText, { color: c.textSecondary }]}>{totalSets} sets</Text>
                  </View>
                  <View style={[styles.summaryPill, { backgroundColor: c.background }]}>
                    <Text style={[styles.summaryText, { color: c.textSecondary }]}>
                      {formatMetricValue(totalReps, 'total_reps', { includeUnit: true })}
                    </Text>
                  </View>
                  <View style={[styles.summaryPill, { backgroundColor: c.background }]}>
                    <Text style={[styles.summaryText, { color: c.textSecondary }]}>
                      {formatMetricValue(maxWeight, 'max_weight', { includeUnit: true })} max
                    </Text>
                  </View>
                  <View style={[styles.summaryPill, { backgroundColor: c.background }]}>
                    <Text style={[styles.summaryText, { color: c.textSecondary }]}>
                      {formatMetricValue(totalTonnage, 'total_tonnage', { compact: true, includeUnit: true })}
                    </Text>
                  </View>
                </View>

                {workout.prTypes.length > 0 ? (
                  <Text style={[styles.prCaption, { color: c.textTertiary }]}>
                    PR stars earned on this workout
                  </Text>
                ) : (
                  <Text style={[styles.prCaption, { color: c.textTertiary }]}>
                    No PR stars on this workout
                  </Text>
                )}
              </Surface>
            );
          })}
        </ScrollView>

        <Button mode="text" onPress={onDismiss} style={styles.closeButton}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 24,
    borderRadius: 18,
    padding: 20,
    maxHeight: '65%',
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  scrollArea: {
    maxHeight: 420,
  },
  workoutCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  summaryPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prCaption: {
    fontSize: 12,
    marginTop: 10,
  },
  closeButton: {
    marginTop: 8,
  },
});

export default WorkoutDetailModal;
