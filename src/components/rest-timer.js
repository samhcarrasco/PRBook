import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton, Surface } from 'react-native-paper';
import { useAppTheme } from '../context/themecontext';

const RestTimer = ({ onTimerUpdate, initialTime = 0 }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const timerRef = useRef(null);
  const previousTimeRef = useRef(initialTime);
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

  const handleTimerUpdate = useCallback((time) => {
    if (onTimerUpdate && previousTimeRef.current !== time) {
      previousTimeRef.current = time;
      onTimerUpdate(time);
    }
  }, [onTimerUpdate]);

  useEffect(() => {
    setElapsedTime(initialTime);
    previousTimeRef.current = initialTime;
  }, [initialTime]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prevTime => {
          const newTime = prevTime + 1;
          handleTimerUpdate(newTime);
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, handleTimerUpdate]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    handleTimerUpdate(0);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Surface style={[styles.container, { backgroundColor: c.surfaceVariant }]} elevation={0}>
      <Text style={[
        styles.timerText,
        { color: isRunning ? c.success : c.textPrimary }
      ]}>
        {formatTime(elapsedTime)}
      </Text>
      <View style={styles.buttonContainer}>
        {!isRunning ? (
          <IconButton
            icon="play"
            mode="contained"
            size={18}
            iconColor="#FFFFFF"
            containerColor={c.success}
            onPress={startTimer}
            style={styles.timerButton}
          />
        ) : (
          <IconButton
            icon="stop"
            mode="contained"
            size={18}
            iconColor="#FFFFFF"
            containerColor={c.destructive}
            onPress={stopTimer}
            style={styles.timerButton}
          />
        )}
        <IconButton
          icon="restart"
          mode="contained"
          size={18}
          iconColor="#FFFFFF"
          containerColor={c.primary}
          onPress={resetTimer}
          style={styles.timerButton}
        />
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginRight: 4,
    width: 52,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerButton: {
    margin: 0,
  },
});

export default RestTimer;
