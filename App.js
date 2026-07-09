import React, { useEffect, useState } from 'react';
import { StatusBar, AppState } from 'react-native';
import { PaperProvider, BottomNavigation, Icon } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutProvider } from './src/context/workoutcontext';
import { ThemeProvider, useAppTheme } from './src/context/themecontext';
import { initDatabase } from './src/db/db';
import WorkoutScreen from './src/screens/workout-screen';
import HistoryScreen from './src/screens/history-screen';
import AIScreen from './src/screens/ai-screen';
import BrainMuscleIcon from './src/components/ui/brain-muscle-icon';

function AppContent() {
  const { theme, isDark } = useAppTheme();
  const c = theme.custom.colors;
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'workout', title: 'Workout', focusedIcon: 'dumbbell',   unfocusedIcon: 'dumbbell' },
    { key: 'history', title: 'History', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line' },
    { key: 'ai',      title: 'AI',      focusedIcon: 'brain',      unfocusedIcon: 'brain' },
  ]);

  const renderIcon = ({ route, focused, color }) => {
    if (route.key === 'ai') {
      return <BrainMuscleIcon size={24} color={color} />;
    }
    const name = focused ? route.focusedIcon : route.unfocusedIcon;
    return <Icon source={name} size={24} color={color} />;
  };

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

  // Leave AI tab when app is fully backgrounded; AIScreen handles its own re-lock.
  // 'inactive' is excluded — the system passcode/Face ID sheet triggers it mid-unlock.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        setIndex(prev => {
          if (routes[prev]?.key === 'ai') return 0;
          return prev;
        });
      }
    });
    return () => sub.remove();
  }, [routes]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'workout':
        return <WorkoutScreen isActive={index === 0} />;
      case 'history':
        return <HistoryScreen isActive={index === 1} />;
      case 'ai':
        return <AIScreen isActive={index === 2} />;
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
          renderIcon={renderIcon}
          barStyle={{ backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border }}
          activeColor={c.primary}
          inactiveColor={c.textTertiary}
          safeAreaInsets={{ bottom: insets.bottom }}
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
