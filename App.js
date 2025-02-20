import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { WorkoutProvider } from './src/context/workoutcontext';
import WeeklyCalendar from './src/components/calendar-strip';
import WorkoutCard from './src/components/workout-card';
import Journal from './src/components/journal';
import { initDatabase } from './src/db/db';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    setupDatabase();
  }, []);

  return (
    <WorkoutProvider>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Calendar goes at top with padding */}
        <View style={{ paddingTop: 50 }}>
          <WeeklyCalendar onDateSelect={setSelectedDate} />
        </View>
        
        {/* WorkoutCard stays as is - let it handle its own positioning */}
        <WorkoutCard date={selectedDate} />
        
        {/* Journal is absolutely positioned at bottom */}
        <Journal date={selectedDate} />
      </View>
    </TouchableWithoutFeedback>
    </WorkoutProvider>
  );
}