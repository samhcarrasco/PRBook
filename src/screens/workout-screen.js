import React, { useState, useCallback } from 'react';
import { View, Keyboard, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import WeeklyCalendar from '../components/calendar-strip';
import WorkoutCard from '../components/workout-card';
import Journal from '../components/journal';
import { useAppTheme } from '../context/themecontext';

const fartSound = require('../../assets/fart.wav');

const WorkoutScreen = ({ isActive = true }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const playFart = useCallback(async () => {
    try {
      // Configure AVAudioSession for playback (iOS)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(fartSound, { shouldPlay: true });
      // Unload sound from memory after it finishes playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.warn('Fart sound playback failed:', err);
    }
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

      {/* Fart Button */}
      <TouchableOpacity
        onPress={playFart}
        style={[styles.fartButton, { backgroundColor: c.primary }]}
        activeOpacity={0.75}
      >
        <Text style={styles.fartButtonText}>💨 Fart</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, paddingBottom: 16 }}>
        <Journal date={selectedDate} isActive={isActive} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fartButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fartButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default WorkoutScreen;
