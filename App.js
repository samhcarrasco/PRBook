import React, { useEffect } from 'react';
import { View, Keyboard, StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutProvider } from './src/context/workoutcontext';
import { ThemeProvider, useAppTheme } from './src/context/themecontext';
import WeeklyCalendar from './src/components/calendar-strip';
import WorkoutCard from './src/components/workout-card';
import Journal from './src/components/journal';
import { initDatabase } from './src/db/db';
import { useState } from 'react';

function AppContent() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { theme, isDark } = useAppTheme();

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
    <PaperProvider theme={theme}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.custom.colors.background }}
        onStartShouldSetResponder={() => {
          Keyboard.dismiss();
          return false;
        }}
        onMoveShouldSetResponder={() => false}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.custom.colors.background}
        />
        <WeeklyCalendar onDateSelect={setSelectedDate} />
        <WorkoutCard date={selectedDate} />
        <View style={{ flex: 1 }}>
          <Journal date={selectedDate} />
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WorkoutProvider>
          <AppContent />
        </WorkoutProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
