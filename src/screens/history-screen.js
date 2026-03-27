import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Surface, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/themecontext';
import { openDB, historyOperations, prOperations } from '../db/db';
import { useWorkout } from '../context/workoutcontext';
import ExercisePicker from '../components/history/exercise-picker';
import MetricChart from '../components/history/metric-chart';
import WorkoutDetailModal from '../components/history/workout-detail-modal';
import { HISTORY_METRICS } from '../components/history/history-metrics';

const HistoryScreen = () => {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;
  const { workoutHistoryVersion } = useWorkout();

  const [selectedExercises, setSelectedExercises] = useState([]);
  const [exerciseHistories, setExerciseHistories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const loadHistory = useCallback(async () => {
    if (selectedExercises.length === 0) {
      setExerciseHistories([]);
      return;
    }

    try {
      setLoading(true);
      const db = await openDB();

      const histories = await Promise.all(
        selectedExercises.map(async (exercise) => {
          const rawData = await historyOperations.getExerciseHistory(db, exercise.id);
          const grouped = {};

          for (const row of rawData) {
            if (!grouped[row.daily_workout_id]) {
              grouped[row.daily_workout_id] = {
                daily_workout_id: row.daily_workout_id,
                date: row.date,
                sets: [],
              };
            }

            grouped[row.daily_workout_id].sets.push({
              set_number: row.set_number,
              weight: row.weight,
              reps: row.reps,
              rest_time: row.rest_time,
            });
          }

          const sessions = Object.values(grouped).sort((left, right) => {
            if (left.date !== right.date) {
              return left.date.localeCompare(right.date);
            }

            return left.daily_workout_id - right.daily_workout_id;
          });

          const sessionsWithPRs = await Promise.all(
            sessions.map(async (session) => ({
              ...session,
              prTypes: await prOperations.getPRTypesForWorkout(db, session.daily_workout_id),
            }))
          );

          return {
            exercise,
            sessions: sessionsWithPRs,
          };
        })
      );

      const historiesWithData = histories.filter((history) => history.sessions.length > 0);
      setExerciseHistories(historiesWithData);

      if (historiesWithData.length !== selectedExercises.length) {
        setSelectedExercises((currentSelection) =>
          currentSelection.filter((exercise) =>
            historiesWithData.some((history) => history.exercise.id === exercise.id)
          )
        );
      }
    } catch (error) {
      console.error('Error loading exercise history:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedExercises]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, workoutHistoryVersion]);

  const selectedCountLabel = useMemo(() => {
    if (selectedExercises.length === 0) {
      return 'No exercises selected';
    }

    if (selectedExercises.length === 1) {
      return selectedExercises[0].name;
    }

    return `${selectedExercises.length} exercises selected`;
  }, [selectedExercises]);

  const handleDatePress = (date) => {
    const workoutsForDate = exerciseHistories.flatMap((history) =>
      history.sessions
        .filter((session) => session.date === date)
        .map((session) => ({
          ...session,
          exerciseId: history.exercise.id,
          exerciseName: history.exercise.name,
        }))
    );

    if (workoutsForDate.length === 0) return;

    setDetailData({
      date,
      workouts: workoutsForDate,
    });
    setDetailModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Surface style={[styles.content, { backgroundColor: c.surface }]} elevation={2}>
        <Text style={[styles.headerText, { color: c.textPrimary }]}>Workout History</Text>

        <ScrollView
          style={styles.scrollable}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ExercisePicker
            selectedExercises={selectedExercises}
            onChange={setSelectedExercises}
            historyVersion={workoutHistoryVersion}
          />

          {selectedExercises.length > 0 && (
            <Text style={[styles.selectionHint, { color: c.textTertiary }]}>
              Comparing {selectedCountLabel}
            </Text>
          )}

          {loading && (
            <ActivityIndicator animating size="large" color={c.primary} style={styles.loader} />
          )}

          {!loading && exerciseHistories.length > 0 && HISTORY_METRICS.map((metric) => (
            <Surface key={metric.key} style={[styles.chartCard, { backgroundColor: c.surfaceVariant }]} elevation={0}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                  <Text style={[styles.cardTitle, { color: c.textPrimary }]}>{metric.label}</Text>
                  <Text style={[styles.cardSubtitle, { color: c.textTertiary }]}>
                    Each line updates whenever one of the selected workouts changes.
                  </Text>
                </View>
                <View style={[styles.unitBadge, { backgroundColor: c.background, borderColor: c.border }]}>
                  <Text style={[styles.unitBadgeText, { color: c.textSecondary }]}>Unit: {metric.unitLabel}</Text>
                </View>
              </View>

              <MetricChart
                histories={exerciseHistories}
                metric={metric}
                onDatePress={handleDatePress}
              />
            </Surface>
          ))}

          {!loading && selectedExercises.length > 0 && exerciseHistories.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-line" size={48} color={c.textTertiary} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No history yet</Text>
              <Text style={[styles.emptySubtitle, { color: c.textTertiary }]}>
                Log some workouts for these exercises and the graphs will appear here.
              </Text>
            </View>
          )}

          {!selectedExercises.length && !loading && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-multiple" size={48} color={c.textTertiary} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>Track Every Metric</Text>
              <Text style={[styles.emptySubtitle, { color: c.textTertiary }]}>
                Select one or more exercises above to compare all of your graphs at once.
              </Text>
            </View>
          )}
        </ScrollView>
      </Surface>

      <WorkoutDetailModal
        visible={detailModalVisible}
        onDismiss={() => setDetailModalVisible(false)}
        data={detailData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    paddingBottom: 0,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  scrollable: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  selectionHint: {
    fontSize: 13,
    marginBottom: 12,
    paddingLeft: 2,
  },
  chartCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
    gap: 10,
  },
  cardTitleBlock: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  unitBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HistoryScreen;
