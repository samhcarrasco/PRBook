import React, { useState } from 'react';
import { View, Keyboard } from 'react-native';
import WeeklyCalendar from '../components/calendar-strip';
import WorkoutCard from '../components/workout-card';
import Journal from '../components/journal';
import FartButton from '../components/fart-button';

const WorkoutScreen = ({ isActive = true }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

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
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <FartButton />
      </View>
      <WorkoutCard date={selectedDate} />
      <View style={{ flex: 1, paddingBottom: 16 }}>
        <Journal date={selectedDate} isActive={isActive} />
      </View>
    </View>
  );
};

export default WorkoutScreen;
