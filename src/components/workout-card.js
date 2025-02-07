import React, { useState, useEffect } from 'react';
import GhostTextInput from './ghost-text';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet 
} from 'react-native';
import { openDB, workoutTypeOperations } from '../db/db';

const WorkoutCard = ({ date }) => {
  const [db, setDb] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      const database = await openDB();
      setDb(database);
    };
    initDB();
  }, []);

  const handleInputFocus = async () => {
    if (!db) return;
    try {
      const allWorkouts = await workoutTypeOperations.getWorkoutTypes(db);
      setSuggestions(allWorkouts);
      setShowSuggestions(true);
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
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching workouts:', error);
      setSuggestions([]);
    }
  };

  const saveWorkoutType = async () => {
    if (!workoutName.trim() || !db) return;

    try {
      await workoutTypeOperations.addWorkoutType(db, workoutName.trim());
      setWorkoutName('');
      setShowSuggestions(false);
    } catch (error) {
      if (error.message.includes('already exists')) {
        alert('This workout already exists!');
      } else {
        console.error('Error saving workout:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={saveWorkoutType}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => {
                  setWorkoutName(item.name);
                  setShowSuggestions(false);
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
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
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
  },
  suggestionsContainer: {
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default WorkoutCard;