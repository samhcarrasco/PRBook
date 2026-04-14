import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Surface,
  Button,
  IconButton,
  Chip,
  Modal,
  Portal,
  ActivityIndicator,
  DataTable,
  TouchableRipple,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { openDB, workoutTypeOperations, prOperations } from '../db/db';
import { useWorkout } from '../context/workoutcontext';
import { useAppTheme } from '../context/themecontext';
import { PR_TYPE_CONFIG } from '../theme/theme';
import RestTimer from './rest-timer';

const Journal = ({ date, isActive = true }) => {
  const [db, setDb] = useState(null);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [sets, setSets] = useState([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const {
    workoutListVersion,
    workoutHistoryVersion,
    refreshWorkoutHistory,
  } = useWorkout();
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [originalSets, setOriginalSets] = useState([]);
  const [showLegend, setShowLegend] = useState(false);
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  useEffect(() => {
    if (!isActive) {
      Keyboard.dismiss();
      setShowPicker(false);
    }
  }, [isActive]);

  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB();
        setDb(database);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing database:', error);
        setLoading(false);
      }
    };
    initDB();
  }, []);

  useEffect(() => {
    if (db) {
      loadWorkoutTypes();
    }
  }, [db, workoutListVersion]);

  useEffect(() => {
    if (db && date) {
      loadSavedWorkouts();
    }
  }, [db, date, workoutHistoryVersion]);

  const formatRestTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const loadWorkoutTypes = async () => {
    if (!db) return;
    try {
      const types = await workoutTypeOperations.getWorkoutTypes(db);
      setWorkoutTypes(types);
    } catch (error) {
      console.error('Error loading workout types:', error);
    }
  };

  const loadSavedWorkouts = async () => {
    if (!db || !date) return;
    try {
      setLoading(true);
      const formattedDate = formatDate(date);

      const workouts = await db.getAllAsync(`
        SELECT dw.id as daily_workout_id, wt.name as workout_name, wt.id as workout_type_id
        FROM daily_workouts dw
        JOIN workout_types wt ON dw.workout_type_id = wt.id
        WHERE dw.date = ?
      `, [formattedDate]);

      const workoutsWithSets = await Promise.all(workouts.map(async (workout) => {
        const sets = await db.getAllAsync(`
          SELECT id, set_number, weight, reps, rest_time
          FROM workout_sets
          WHERE daily_workout_id = ?
          ORDER BY set_number
        `, [workout.daily_workout_id]);

        const prTypes = await prOperations.getPRTypesForWorkout(db, workout.daily_workout_id);

        return { ...workout, sets, prTypes };
      }));

      setSavedWorkouts(workoutsWithSets);

      if (workoutsWithSets.length === 0) {
        setSelectedWorkout('');
        setSets([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
      }
    } catch (error) {
      console.error('Error loading saved workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    if (typeof dateObj === 'string') return dateObj;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addSet = () => {
    const newId = sets.length > 0 ? Math.max(...sets.map(set => set.id)) + 1 : 1;
    setSets([...sets, { id: newId, weight: '', reps: '', rest_time: 0 }]);
  };

  const removeSet = async (id) => {
    if (sets.length === 1) {
      Alert.alert('Error', 'At least one set is required');
      return;
    }

    if (editingWorkoutId) {
      const setToDelete = originalSets.find(set => set.id === id);
      if (setToDelete) {
        try {
          await db.runAsync('DELETE FROM workout_sets WHERE id = ?', [setToDelete.id]);
        } catch (error) {
          console.error('Error deleting set:', error);
        }
      }
    }

    setSets(sets.filter(set => set.id !== id));
  };

  const updateSetValue = (id, field, value) => {
    setSets(sets.map(set =>
      set.id === id ? { ...set, [field]: value } : set
    ));
  };

  const updateRestTime = (id, time) => {
    setSets(sets.map(set =>
      set.id === id ? { ...set, rest_time: time } : set
    ));
  };

  const editWorkout = (workout) => {
    setSelectedWorkout(workout.workout_name);
    setSets(workout.sets.map(set => ({
      id: set.id,
      weight: set.weight ? set.weight.toString() : '',
      reps: set.reps ? set.reps.toString() : '',
      rest_time: set.rest_time || 0
    })));
    setOriginalSets(workout.sets);
    setEditingWorkoutId(workout.daily_workout_id);
    setShowPicker(false);
  };

  const formatPRMessage = (pr) => {
    const label = PR_TYPE_CONFIG[pr.prType]?.label || pr.prType;
    const atWeight = pr.secondaryValue ? ` at ${pr.secondaryValue} lbs` : '';
    const isRest = pr.prType.includes('rest');
    const formatVal = (v) => {
      if (isRest) {
        const mins = Math.floor(v / 60);
        const secs = Math.round(v % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      }
      return Math.round(v * 100) / 100;
    };
    const prev = pr.previousValue != null ? ` (previous: ${formatVal(pr.previousValue)}${atWeight})` : ' (first record!)';
    return `${label}${atWeight}: ${formatVal(pr.newValue)}${prev}`;
  };

  const saveWorkout = async () => {
    Keyboard.dismiss();

    if (!db || !date || !selectedWorkout || sets.length === 0) {
      Alert.alert('Error', 'Please select an exercise and add at least one set');
      return;
    }

    const invalidSets = sets.filter(set => !set.weight || !set.reps);
    if (invalidSets.length > 0) {
      Alert.alert('Error', 'Please enter weight and reps for all sets');
      return;
    }

    try {
      setSaving(true);
      const formattedDate = formatDate(date);
      const workoutType = workoutTypes.find(wt => wt.name === selectedWorkout);
      if (!workoutType) throw new Error('Selected workout type not found');

      let savedWorkoutId;

      if (editingWorkoutId) {
        await db.runAsync('DELETE FROM workout_sets WHERE daily_workout_id = ?', [editingWorkoutId]);
        for (let i = 0; i < sets.length; i++) {
          const set = sets[i];
          await db.runAsync(
            'INSERT INTO workout_sets (daily_workout_id, set_number, weight, reps, rest_time) VALUES (?, ?, ?, ?, ?)',
            [editingWorkoutId, i + 1, set.weight, set.reps, set.rest_time]
          );
        }
        savedWorkoutId = editingWorkoutId;
      } else {
        const dailyWorkoutResult = await db.runAsync(
          'INSERT INTO daily_workouts (date, workout_type_id) VALUES (?, ?)',
          [formattedDate, workoutType.id]
        );
        savedWorkoutId = dailyWorkoutResult.lastInsertRowId;
        for (let i = 0; i < sets.length; i++) {
          const set = sets[i];
          await db.runAsync(
            'INSERT INTO workout_sets (daily_workout_id, set_number, weight, reps, rest_time) VALUES (?, ?, ?, ?, ?)',
            [savedWorkoutId, i + 1, set.weight, set.reps, set.rest_time]
          );
        }
      }

      const brokenPRs = await prOperations.checkAndUpdatePRs(
        db, workoutType.id, savedWorkoutId, formattedDate, sets
      );

      setSelectedWorkout('');
      setSets([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
      setEditingWorkoutId(null);
      await loadSavedWorkouts();
      refreshWorkoutHistory();

      if (brokenPRs.length > 0) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const prMessages = brokenPRs.map(pr => `★ ${formatPRMessage(pr)}`).join('\n\n');
        Alert.alert('New Personal Record! ⭐', prMessages);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Success', `Workout ${editingWorkoutId ? 'updated' : 'saved'} successfully`);
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', `Failed to ${editingWorkoutId ? 'update' : 'save'} workout`);
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkout = async (dailyWorkoutId) => {
    if (!db) return;

    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await prOperations.restorePRsOnDelete(db, dailyWorkoutId);
              await db.runAsync('DELETE FROM workout_sets WHERE daily_workout_id = ?', [dailyWorkoutId]);
              await db.runAsync('DELETE FROM daily_workouts WHERE id = ?', [dailyWorkoutId]);
              await loadSavedWorkouts();
              refreshWorkoutHistory();
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const renderSetRow = (set, index) => (
    <View
      key={set.id}
      style={[styles.setRow, { borderLeftColor: c.primary }]}
    >
      <View style={styles.setHeader}>
        <Text style={[styles.setNumber, { color: c.primary }]}>Set {index + 1}</Text>
        <IconButton
          icon="close-circle"
          size={20}
          iconColor={c.destructive}
          onPress={() => removeSet(set.id)}
          disabled={saving}
          style={styles.removeSetButton}
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: c.textTertiary }]}>Weight</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, color: c.textPrimary, borderColor: c.border }]}
            placeholder="0"
            placeholderTextColor={c.textTertiary}
            value={set.weight}
            onChangeText={(value) => updateSetValue(set.id, 'weight', value)}
            keyboardType="numeric"
            editable={!saving}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, { color: c.textTertiary }]}>Reps</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, color: c.textPrimary, borderColor: c.border }]}
            placeholder="0"
            placeholderTextColor={c.textTertiary}
            value={set.reps}
            onChangeText={(value) => updateSetValue(set.id, 'reps', value)}
            keyboardType="numeric"
            editable={!saving}
          />
        </View>
      </View>

      <View style={styles.restTimerContainer}>
        <Text style={[styles.restTimerLabel, { color: c.textSecondary }]}>Rest</Text>
        <RestTimer
          initialTime={set.rest_time || 0}
          onTimerUpdate={(time) => {
            if (time !== set.rest_time) {
              updateRestTime(set.id, time);
            }
          }}
        />
      </View>
    </View>
  );

  const renderSavedWorkoutCard = (workout, index) => (
    <View
      key={workout.daily_workout_id}
    >
      <Surface style={[styles.savedWorkoutCard, { backgroundColor: c.surfaceVariant }]} elevation={1}>
        <View style={styles.savedWorkoutHeader}>
          <View style={styles.workoutNameRow}>
            <Text style={[styles.savedWorkoutName, { color: c.textPrimary }]} numberOfLines={1}>
              {workout.workout_name}
            </Text>
            {workout.prTypes && workout.prTypes.length > 0 && (
              <View style={styles.prStarsContainer}>
                {workout.prTypes.map((prType) => (
                  <MaterialCommunityIcons
                    key={prType}
                    name="star"
                    size={16}
                    color={PR_TYPE_CONFIG[prType]?.color || '#FBBF24'}
                    style={styles.prStar}
                  />
                ))}
              </View>
            )}
          </View>
          <View style={styles.headerButtons}>
            <IconButton
              icon="pencil-outline"
              size={18}
              iconColor={c.primary}
              onPress={() => editWorkout(workout)}
              style={styles.cardActionButton}
            />
            <IconButton
              icon="delete-outline"
              size={18}
              iconColor={c.destructive}
              onPress={() => deleteWorkout(workout.daily_workout_id)}
              style={styles.cardActionButton}
            />
          </View>
        </View>

        <DataTable style={[styles.dataTable, { borderColor: c.border }]}>
          <DataTable.Header style={[styles.dataTableHeader, { backgroundColor: c.background }]}>
            <DataTable.Title textStyle={[styles.tableHeaderText, { color: c.textSecondary }]}>Set</DataTable.Title>
            <DataTable.Title numeric textStyle={[styles.tableHeaderText, { color: c.textSecondary }]}>Weight</DataTable.Title>
            <DataTable.Title numeric textStyle={[styles.tableHeaderText, { color: c.textSecondary }]}>Reps</DataTable.Title>
            <DataTable.Title numeric textStyle={[styles.tableHeaderText, { color: c.textSecondary }]}>Rest</DataTable.Title>
          </DataTable.Header>
          {workout.sets.map((set) => (
            <DataTable.Row key={set.id} style={[styles.dataTableRow, { borderBottomColor: c.border }]}>
              <DataTable.Cell textStyle={[styles.tableCellText, { color: c.textPrimary }]}>{set.set_number}</DataTable.Cell>
              <DataTable.Cell numeric textStyle={[styles.tableCellText, { color: c.textPrimary }]}>{set.weight}</DataTable.Cell>
              <DataTable.Cell numeric textStyle={[styles.tableCellText, { color: c.textPrimary }]}>{set.reps}</DataTable.Cell>
              <DataTable.Cell numeric textStyle={[styles.tableCellText, { color: c.textTertiary }]}>
                {formatRestTime(set.rest_time || 0)}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Surface>
    </View>
  );

  const renderJournalContent = () => {
    return (
      <>
        <View style={styles.addWorkoutContainer}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Add New Workout</Text>

          {!selectedWorkout ? (
            <TouchableRipple
              style={[styles.workoutSelectorButton, { backgroundColor: c.surfaceVariant, borderColor: c.border }]}
              onPress={() => setShowPicker(true)}
              disabled={saving}
              borderless
              rippleColor={c.primary + '20'}
            >
              <View style={styles.selectorContent}>
                <MaterialCommunityIcons name="dumbbell" size={20} color={c.textTertiary} />
                <Text style={[styles.workoutSelectorText, { color: c.textTertiary }]}>Select an exercise...</Text>
              </View>
            </TouchableRipple>
          ) : (
            <Surface style={[styles.selectedWorkoutContainer, { backgroundColor: c.successContainer }]} elevation={0}>
              <View style={styles.selectedWorkoutRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={c.success} />
                <Text style={[styles.selectedWorkoutText, { color: c.textPrimary }]} numberOfLines={1}>{selectedWorkout}</Text>
              </View>
              <Button
                mode="contained-tonal"
                compact
                onPress={() => {
                  setSelectedWorkout('');
                  setSets([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
                }}
                disabled={saving}
                labelStyle={styles.changeButtonLabel}
              >
                Back to selection
              </Button>
            </Surface>
          )}

          {selectedWorkout ? (
            <>
              {sets.map((set, index) => renderSetRow(set, index))}

              <Button
                mode="outlined"
                onPress={addSet}
                disabled={saving}
                icon="plus"
                style={[styles.addSetButton, { borderColor: c.primary }]}
                labelStyle={{ color: c.primary }}
              >
                Add Set
              </Button>

              <Button
                mode="contained"
                onPress={saveWorkout}
                disabled={saving}
                loading={saving}
                icon={editingWorkoutId ? 'content-save-edit' : 'content-save'}
                style={[styles.saveButton, { backgroundColor: c.success }]}
                labelStyle={styles.saveButtonLabel}
              >
                {saving ? 'Saving...' : editingWorkoutId ? 'Update Workout' : 'Save Workout'}
              </Button>

              {editingWorkoutId && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSelectedWorkout('');
                    setSets([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
                    setEditingWorkoutId(null);
                  }}
                  disabled={saving}
                  style={styles.cancelButton}
                  textColor={c.textSecondary}
                >
                  Cancel Edit
                </Button>
              )}
            </>
          ) : null}
        </View>

        {savedWorkouts.length > 0 && (
          <View style={styles.savedWorkoutsContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Today's Workouts</Text>
              <Chip
                icon={() => <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />}
                onPress={() => setShowLegend(!showLegend)}
                compact
                style={[styles.legendChip, { backgroundColor: c.surfaceVariant }]}
                textStyle={[styles.legendChipText, { color: c.textSecondary }]}
              >
                PR Guide
              </Chip>
            </View>

            {showLegend && (
              <Surface style={[styles.legendContainer, { backgroundColor: c.surfaceVariant }]} elevation={0}>
                {Object.entries(PR_TYPE_CONFIG).map(([key, config]) => (
                  <View key={key} style={styles.legendRow}>
                    <MaterialCommunityIcons name="star" size={14} color={config.color} />
                    <Text style={[styles.legendLabel, { color: c.textSecondary }]}>{config.label}</Text>
                  </View>
                ))}
              </Surface>
            )}

            {savedWorkouts.map((workout, index) => renderSavedWorkoutCard(workout, index))}
          </View>
        )}

        {!loading && savedWorkouts.length === 0 && !selectedWorkout && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="weight-lifter" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: c.textSecondary }]}>No workouts yet</Text>
            <Text style={[styles.emptyStateSubtitle, { color: c.textTertiary }]}>
              Select an exercise above to start logging
            </Text>
          </View>
        )}
      </>
    );
  };

  if (loading && savedWorkouts.length === 0) {
    return (
      <Surface style={[styles.journalContainer, { backgroundColor: c.surface }]} elevation={2}>
        <ActivityIndicator animating size="large" color={c.primary} style={{ marginTop: 40 }} />
      </Surface>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={isActive}
    >
      <Surface style={[styles.journalContainer, { backgroundColor: c.surface }]} elevation={2}>
        <Text style={[styles.headerText, { color: c.textPrimary }]}>Workout Journal</Text>

        <ScrollView
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={true}
        >
          {renderJournalContent()}
        </ScrollView>
      </Surface>

      <Portal>
        <Modal
          visible={showPicker}
          onDismiss={() => setShowPicker(false)}
          contentContainerStyle={[styles.pickerModal, { backgroundColor: c.surface }]}
        >
          <Text style={[styles.pickerTitle, { color: c.textPrimary }]}>Choose Excercise</Text>
          <FlatList
            data={workoutTypes}
            keyExtractor={(item) => item.id.toString()}
            style={workoutTypes.length > 5 ? styles.pickerList : undefined}
            scrollEnabled={workoutTypes.length > 5}
            renderItem={({ item }) => (
              <TouchableRipple
                onPress={() => {
                  setSelectedWorkout(item.name);
                  setShowPicker(false);
                }}
                rippleColor={c.primary + '20'}
              >
                <View style={[styles.pickerItem, { borderBottomColor: c.border }]}>
                  <MaterialCommunityIcons name="dumbbell" size={20} color={c.primary} />
                  <Text style={[styles.pickerItemText, { color: c.textPrimary }]}>{item.name}</Text>
                </View>
              </TouchableRipple>
            )}
            ListEmptyComponent={
              <View style={styles.pickerEmpty}>
                <Text style={[styles.pickerEmptyText, { color: c.textTertiary }]}>
                  No workout types added yet. Use the input above to add some!
                </Text>
              </View>
            }
          />
          <Button
            mode="text"
            onPress={() => setShowPicker(false)}
            style={styles.pickerCloseButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  journalContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    paddingBottom: 0,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 24,
  },
  addWorkoutContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  workoutSelectorButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workoutSelectorText: {
    fontSize: 16,
  },
  selectedWorkoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectedWorkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedWorkoutText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  changeButtonLabel: {
    fontSize: 12,
  },
  setRow: {
    marginBottom: 16,
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeSetButton: {
    margin: 0,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  restTimerContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  restTimerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addSetButton: {
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: 8,
    borderRadius: 10,
  },
  savedWorkoutsContainer: {
    marginTop: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendChip: {
    height: 32,
  },
  legendChipText: {
    fontSize: 12,
  },
  legendContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  legendLabel: {
    fontSize: 13,
  },
  savedWorkoutCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  savedWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  savedWorkoutName: {
    fontSize: 16,
    fontWeight: '700',
  },
  prStarsContainer: {
    flexDirection: 'row',
  },
  prStar: {
    marginRight: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  cardActionButton: {
    margin: 0,
  },
  dataTable: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  dataTableHeader: {
    borderRadius: 8,
    minHeight: 36,
  },
  dataTableRow: {
    minHeight: 36,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  pickerModal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 245,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  pickerEmptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pickerCloseButton: {
    marginTop: 12,
  },
});

export default Journal;
