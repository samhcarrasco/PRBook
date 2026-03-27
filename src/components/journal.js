import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Animated,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { openDB, workoutTypeOperations, prOperations } from '../db/db';
import { useWorkout } from '../context/workoutcontext';
import RestTimer from './rest-timer';

const { width, height } = Dimensions.get('window');

const PR_TYPE_CONFIG = {
  max_weight:            { color: '#FFD700', label: 'Max Weight' },
  max_reps_at_weight:    { color: '#FF6B35', label: 'Max Reps' },
  max_sets_at_weight:    { color: '#E74C3C', label: 'Max Sets' },
  best_single_rest:      { color: '#2ECC71', label: 'Lowest Rest Time' },
  best_avg_rest:         { color: '#1ABC9C', label: 'Lowest Avg Rest' },
  max_volume_single_set: { color: '#9B59B6', label: 'Max Volume - Single Set (weight x reps)' },
  max_total_tonnage:     { color: '#3498DB', label: 'Max Total Tonnage (total for all sets )' },
};

const Journal = ({ date }) => {
  const [db, setDb] = useState(null);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [sets, setSets] = useState([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const { workoutListVersion } = useWorkout();
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [originalSets, setOriginalSets] = useState([]);
  const [isJournalInputFocused, setIsJournalInputFocused] = useState(false);
  const isJournalInputFocusedRef = useRef(false);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const keyboardWillShow = (event) => {
      setTimeout(() => {
        if (isJournalInputFocusedRef.current) {
          Animated.timing(keyboardHeight, {
            duration: Platform.OS === 'ios' ? event.duration : 250,
            toValue: event.endCoordinates.height,
            useNativeDriver: false,
          }).start();
        }
      }, 50);
    };

    const keyboardWillHide = (event) => {
      Animated.timing(keyboardHeight, {
        duration: Platform.OS === 'ios' ? event.duration : 250,
        toValue: 0,
        useNativeDriver: false,
      }).start();
      setIsJournalInputFocused(false);
      isJournalInputFocusedRef.current = false;
    };

    const showListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', keyboardWillShow)
      : Keyboard.addListener('keyboardDidShow', keyboardWillShow);
      
    const hideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', keyboardWillHide)
      : Keyboard.addListener('keyboardDidHide', keyboardWillHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [keyboardHeight, isJournalInputFocused]);

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
      if (date) {
        loadSavedWorkouts();
      }
    }
  }, [db, date, workoutListVersion]);

  // Helper function to format rest time (seconds) to MM:SS
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

        return {
          ...workout,
          sets: sets,
          prTypes: prTypes
        };
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
    
    return dateObj.toISOString().split('T')[0];
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
          await db.runAsync(
            'DELETE FROM workout_sets WHERE id = ?',
            [setToDelete.id]
          );
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

  // Add new function to update rest time
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
    if (!db || !date || !selectedWorkout || sets.length === 0) {
      Alert.alert('Error', 'Please select a workout and add at least one set');
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
        await db.runAsync(
          'DELETE FROM workout_sets WHERE daily_workout_id = ?',
          [editingWorkoutId]
        );

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

      if (brokenPRs.length > 0) {
        const prMessages = brokenPRs.map(pr => `★ ${formatPRMessage(pr)}`).join('\n\n');
        Alert.alert('New Personal Record! ⭐', prMessages);
      } else {
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

              await db.runAsync(
                'DELETE FROM workout_sets WHERE daily_workout_id = ?',
                [dailyWorkoutId]
              );

              await db.runAsync(
                'DELETE FROM daily_workouts WHERE id = ?',
                [dailyWorkoutId]
              );
              
              await loadSavedWorkouts();
              
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
  const renderJournalContent = () => {
    return (
      <>
        <View style={styles.addWorkoutContainer}>
          <Text style={styles.sectionTitle}>Add New Workout</Text>
          
          {!selectedWorkout ? (
            <TouchableOpacity 
              style={styles.workoutSelectorButton}
              onPress={() => setShowPicker(true)}
              disabled={saving}
            >
              <Text style={styles.workoutSelectorText}>Select a workout...</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedWorkoutContainer}>
              <Text style={styles.selectedWorkoutText}>{selectedWorkout}</Text>
              <TouchableOpacity
                style={styles.clearWorkoutButton}
                onPress={() => {
                  setSelectedWorkout('');
                  setSets([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
                }}
                disabled={saving}
              >
                <Text style={styles.clearWorkoutButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {selectedWorkout ? (
            <>
              {sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNumber}>Set {index + 1}</Text>
                  
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.input}
                      placeholder="Weight"
                      value={set.weight}
                      onChangeText={(value) => updateSetValue(set.id, 'weight', value)}
                      onFocus={() => {
                        setIsJournalInputFocused(true);
                        isJournalInputFocusedRef.current = true;
                      }}
                      keyboardType="numeric"
                      editable={!saving}
                    />
                    
                    <TextInput
                      style={styles.input}
                      placeholder="Reps"
                      value={set.reps}
                      onChangeText={(value) => updateSetValue(set.id, 'reps', value)}
                      onFocus={() => {
                        setIsJournalInputFocused(true);
                        isJournalInputFocusedRef.current = true;
                      }}
                      keyboardType="numeric"
                      editable={!saving}
                    />
                    
                    <TouchableOpacity
                      style={[styles.setButton, styles.removeButton]}
                      onPress={() => removeSet(set.id)}
                      disabled={saving}
                    >
                      <Text style={styles.setButtonText}>-</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Rest Timer */}
                  <View style={styles.restTimerContainer}>
                    <Text style={styles.restTimerLabel}>Rest:</Text>
                    <RestTimer 
                      initialTime={set.rest_time || 0}
                      onTimerUpdate={(time) => {
                        // Only update if the time has changed
                        if (time !== set.rest_time) {
                          updateRestTime(set.id, time);
                        }
                      }} 
                    />
                  </View>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={addSet}
                disabled={saving}
              >
                <Text style={styles.addSetButtonText}>+ Add Set</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.savingButton]}
                onPress={saveWorkout}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : editingWorkoutId ? 'Update Workout' : 'Save Workout'}
                </Text>
              </TouchableOpacity>
              {editingWorkoutId && (
                <TouchableOpacity
                  style={[styles.saveButton, styles.cancelButton]}
                  onPress={() => {
                    setSelectedWorkout('');
                    setSets([{ id: 1, weight: '', reps: '', rest_time: 0 }]);
                    setEditingWorkoutId(null);
                  }}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </View>
        
        {savedWorkouts.length > 0 && (
          <View style={styles.savedWorkoutsContainer}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Today's Workouts</Text>
              <TouchableOpacity onPress={() => setShowLegend(!showLegend)} style={styles.legendToggle}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.legendToggleText}>?</Text>
              </TouchableOpacity>
            </View>
            {showLegend && (
              <View style={styles.legendContainer}>
                {Object.entries(PR_TYPE_CONFIG).map(([key, config]) => (
                  <View key={key} style={styles.legendRow}>
                    <MaterialCommunityIcons name="star" size={14} color={config.color} />
                    <Text style={styles.legendLabel}>{config.label}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {savedWorkouts.map((workout) => (
              <View key={workout.daily_workout_id} style={styles.savedWorkoutCard}>
                <View style={styles.savedWorkoutHeader}>
                  <Text style={styles.savedWorkoutName} numberOfLines={1}>{workout.workout_name}</Text>

                  <View style={styles.headerButtons}>
                    <TouchableOpacity
                      onPress={() => editWorkout(workout)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deleteWorkout(workout.daily_workout_id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {workout.prTypes && workout.prTypes.length > 0 && (
                  <View style={styles.prStarsContainer}>
                    {workout.prTypes.map((prType) => (
                      <MaterialCommunityIcons
                        key={prType}
                        name="star"
                        size={16}
                        color={PR_TYPE_CONFIG[prType]?.color || '#FFD700'}
                        style={styles.prStar}
                      />
                    ))}
                  </View>
                )}
                
                <View style={styles.setsTable}>
                  <View style={styles.setsTableHeader}>
                    <Text style={[styles.setsTableCell, styles.setNumberCell]}>Set</Text>
                    <Text style={[styles.setsTableCell, styles.weightCell]}>Weight</Text>
                    <Text style={[styles.setsTableCell, styles.repsCell]}>Reps</Text>
                    <Text style={[styles.setsTableCell, styles.restTimeCell]}>Rest</Text>
                  </View>
                  
                  {workout.sets.map((set) => (
                    <View key={set.id} style={styles.setsTableRow}>
                      <Text style={[styles.setsTableCell, styles.setNumberCell]}>{set.set_number}</Text>
                      <Text style={[styles.setsTableCell, styles.weightCell]}>{set.weight}</Text>
                      <Text style={[styles.setsTableCell, styles.repsCell]}>{set.reps}</Text>
                      <Text style={[styles.setsTableCell, styles.restTimeCell]}>
                        {formatRestTime(set.rest_time || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.journalContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{
            translateY: keyboardHeight.interpolate({
              inputRange: [0, height],
              outputRange: [0, -height],
            })
          }]
        }
      ]}
    >
      <View style={styles.journalContainer}>
        <Text style={styles.headerText}>Workout Journal</Text>
        
        <FlatList
          data={[{ key: 'journal_content' }]}
          renderItem={() => renderJournalContent()}
          keyExtractor={item => item.key}
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        />
      </View>
      
      {showPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Choose Workout</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedWorkout}
              onValueChange={(itemValue) => {
                if (itemValue) {
                  setSelectedWorkout(itemValue);
                  setShowPicker(false);
                }
              }}
              style={styles.picker}
              enabled={!saving}
            >
              <Picker.Item label="Select a workout..." value="" />
              {workoutTypes.map((workout) => (
                <Picker.Item 
                  key={workout.id} 
                  label={workout.name} 
                  value={workout.name}
                />
              ))}
            </Picker>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  journalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: height * 0.4,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollableContent: {
    flexGrow: 0,
    height: height * 0.35,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  addWorkoutContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
  },
  workoutSelectorButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  workoutSelectorText: {
    color: '#777',
    fontSize: 16,
  },
  selectedWorkoutContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f7f0',
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedWorkoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  clearWorkoutButton: {
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  clearWorkoutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  setRow: {
    marginBottom: 12,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#34495e',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: 'white',
  },
  setButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
  },
  setButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addSetButton: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addSetButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  savingButton: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  savedWorkoutsContainer: {
    marginTop: 20,
  },
  savedWorkoutCard: {
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  savedWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  setsTable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  setsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ecf0f1',
    paddingVertical: 8,
  },
  setsTableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  setsTableCell: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  setNumberCell: {
    flex: 1,
  },
  weightCell: {
    flex: 2,
  },
  repsCell: {
    flex: 2,
  },
  restTimeCell: {
    flex: 2, 
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  pickerContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  picker: {
    height: 200,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    marginTop: 8,
  },
  // New styles for rest timer
  restTimerContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  restTimerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginRight: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  legendToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginLeft: 2,
  },
  legendContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 13,
    color: '#34495e',
    marginLeft: 8,
  },
  prStarsContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  prStar: {
    marginRight: 3,
  },
});

export default Journal;