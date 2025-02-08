import React, { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import GhostTextInput from './ghost-text';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet,
  Alert 
} from 'react-native';
import { openDB, workoutTypeOperations } from '../db/db';

const { width } = Dimensions.get('window');

const WorkoutCard = ({ date }) => {
  const [db, setDb] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const initDB = async () => {
      const database = await openDB();
      console.log('Database set in state:', database);
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
      console.log('All Workouts:', allWorkouts);
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
      console.log('Refreshed Workouts:', allWorkouts);
      setSuggestions(allWorkouts);
      
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutTypeOperations.deleteWorkoutType(db, workoutName.trim());
              
              const allWorkouts = await workoutTypeOperations.getWorkoutTypes(db);
              console.log('Refreshed Workouts:', allWorkouts);
              setSuggestions(allWorkouts);
              
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
      <View style={styles.inputButtonWrapper}>
        <View style={styles.inputContainer}>
          <GhostTextInput
            style={styles.input}
            value={workoutName}
            onChangeText={handleWorkoutNameChange}
            onFocus={handleInputFocus}
            suggestions={suggestions}
            placeholder="Enter workout name"
            placeholderTextColor="#888"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={saveWorkoutType}
          >
            <View style={styles.buttonContent}>
              <View style={styles.plusHorizontal}/>
              <View style={styles.plusVertical}/>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={deleteWorkoutType}
          >
            <View style={styles.buttonContent}>
              <View style={styles.minusHorizontal}/>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  top: -420,
  },
  inputButtonWrapper: {
    width: width - 32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  buttonContent: {
    position: 'relative',
    width: 20,
    height: 20,
  },
  plusHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: 'white',
    top: 9,
    left: 0,
  },
  plusVertical: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'white',
    top: 0,
    left: 9,
  },
  minusHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: 'white',
    top: 9,
    left: 0,
  }
});

export default WorkoutCard;