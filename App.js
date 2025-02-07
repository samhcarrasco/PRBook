// App.js
import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import WeeklyCalendar from './src/components/calendar-strip';
import WorkoutCard from './src/components/workout-card';
import { initDatabase } from './src/db/db';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    setupDatabase();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 50 }}>
        <WeeklyCalendar onDateSelect={setSelectedDate} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <WorkoutCard date={selectedDate} />
      </KeyboardAvoidingView>
    </View>
  );
}