import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton, Surface } from 'react-native-paper';
import { useAppTheme } from '../context/themecontext';

const RestTimer = ({ onTimerUpdate, initialTime = 0 }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(initialTime * 1000);
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
    setElapsedMs(initialTime * 1000);
    previousTimeRef.current = initialTime;
  }, [initialTime]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedMs;
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const newMs = now - startTimeRef.current;
        setElapsedMs(newMs);
        const newSeconds = Math.floor(newMs / 1000);
        if (newSeconds !== previousTimeRef.current) {
          handleTimerUpdate(newSeconds);
        }
      }, 10);
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
    setElapsedMs(0);
    handleTimerUpdate(0);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <Surface style={[styles.container, { backgroundColor: c.surfaceVariant }]} elevation={0}>
      <Text style={[
        styles.timerText,
        { color: isRunning ? c.success : c.textPrimary }
      ]}>
        {formatTime(elapsedMs)}
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
    width: 76,
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
