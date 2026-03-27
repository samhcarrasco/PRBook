import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import GhostTextInput from './ghost-text';
import { openDB, workoutTypeOperations } from '../db/db';
import { useWorkout } from '../context/workoutcontext';
import { useAppTheme } from '../context/themecontext';

const WorkoutCard = ({ date }) => {
  const [db, setDb] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const { refreshWorkoutList } = useWorkout();
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  useEffect(() => {
    const initDB = async () => {
      const database = await openDB();
      setDb(database);
    };
    initDB();
  }, []);

  useEffect(() => {
    if (db) {
      handleInputFocus();
    }
  }, [db]);

  const handleInputFocus = async () => {
    if (!db) return;
    try {
      const allWorkouts = await workoutTypeOperations.getWorkoutTypes(db);
      setSuggestions(allWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const handleWorkoutNameChange = async (text) => {
    setWorkoutName(text);
    if (!db) return;

    try {
      if (text.trim().length > 0) {
        const results = await workoutTypeOperations.searchWorkoutTypes(db, text);
        setSuggestions(Array.isArray(results) ? results : []);
      } else {
        const allWorkouts = await workoutTypeOperations.getWorkoutTypes(db);
        setSuggestions(allWorkouts);
      }
    } catch (error) {
      console.error('Error searching workouts:', error);
      setSuggestions([]);
    }
  };

  const saveWorkoutType = async () => {
    if (!workoutName.trim() || !db) return;

    try {
      await workoutTypeOperations.addWorkoutType(db, workoutName.trim());
      const allWorkouts = await workoutTypeOperations.getWorkoutTypes(db);
      setSuggestions(allWorkouts);
      refreshWorkoutList();
      setWorkoutName('');
    } catch (error) {
      if (error.message.includes('already exists')) {
        alert('This workout already exists!');
      } else {
        console.error('Error saving workout:', error);
      }
    }
  };

  const deleteWorkoutType = async () => {
    if (!workoutName.trim() || !db) return;

    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workoutName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutTypeOperations.deleteWorkoutType(db, workoutName.trim());
              const allWorkouts = await workoutTypeOperations.getWorkoutTypes(db);
              setSuggestions(allWorkouts);
              refreshWorkoutList();
              setWorkoutName('');
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Could not delete the workout');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={[styles.inputButtonWrapper, { backgroundColor: c.surface }]} elevation={2}>
        <View style={styles.inputContainer}>
          <GhostTextInput
            style={styles.input}
            value={workoutName}
            onChangeText={handleWorkoutNameChange}
            onFocus={handleInputFocus}
            suggestions={suggestions}
            placeholder="Enter workout name"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.buttonsContainer}>
          <IconButton
            icon="plus"
            mode="contained"
            size={22}
            iconColor="#FFFFFF"
            containerColor={c.primary}
            onPress={saveWorkoutType}
            style={styles.actionButton}
          />
          <IconButton
            icon="minus"
            mode="contained"
            size={22}
            iconColor="#FFFFFF"
            containerColor={c.destructive}
            onPress={deleteWorkoutType}
            style={styles.actionButton}
          />
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  inputButtonWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    margin: 0,
  },
});

export default WorkoutCard;
