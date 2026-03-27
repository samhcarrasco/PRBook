import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { PaperProvider, BottomNavigation } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutProvider } from './src/context/workoutcontext';
import { ThemeProvider, useAppTheme } from './src/context/themecontext';
import { initDatabase } from './src/db/db';
import WorkoutScreen from './src/screens/workout-screen';
import HistoryScreen from './src/screens/history-screen';

function AppContent() {
  const { theme, isDark } = useAppTheme();
  const c = theme.custom.colors;
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'workout', title: 'Workout', focusedIcon: 'dumbbell', unfocusedIcon: 'dumbbell' },
    { key: 'history', title: 'History', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line-variant' },
  ]);

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

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'workout':
        return <WorkoutScreen isActive={index === 0} />;
      case 'history':
        return <HistoryScreen isActive={index === 1} />;
      default:
        return null;
    }
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: c.background }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={c.background}
        />
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          barStyle={{ backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border }}
          activeColor={c.primary}
          inactiveColor={c.textTertiary}
          safeAreaInsets={{ bottom: 8 }}
          theme={theme}
        />
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
