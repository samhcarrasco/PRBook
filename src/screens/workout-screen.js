import React, { useState, useCallback } from 'react';
import { View, Keyboard, StyleSheet } from 'react-native';
import WeeklyCalendar from '../components/calendar-strip';
import WorkoutCard from '../components/workout-card';
import Journal from '../components/journal';
import GradientButton from '../components/ui/gradient-button';
import ConfettiView from '../components/ui/confetti-view';

const WorkoutScreen = ({ isActive = true }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConfetti, setShowConfetti] = useState(false);

  const handleConfettiEnd = useCallback(() => {
    setShowConfetti(false);
  }, []);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponder={() => {
        Keyboard.dismiss();
        return false;
      }}
      onMoveShouldSetResponder={() => false}
    >
      <WeeklyCalendar onDateSelect={setSelectedDate} />
      <WorkoutCard date={selectedDate} />
      <View style={{ flex: 1, paddingBottom: 16 }}>
        <Journal date={selectedDate} isActive={isActive} />
      </View>
      <View style={styles.confettiButtonContainer}>
        <GradientButton
          label="🎉 Confetti"
          onPress={() => setShowConfetti(true)}
          gradientColors={['#C77DFF', '#4ECDC4']}
          glowShadow="glow"
          disabled={showConfetti}
        />
      </View>
      <ConfettiView visible={showConfetti} onAnimationEnd={handleConfettiEnd} />
    </View>
  );
};

const styles = StyleSheet.create({
  confettiButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    alignItems: 'center',
  },
});

export default WorkoutScreen;
