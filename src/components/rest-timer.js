import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RestTimer = ({ onTimerUpdate, initialTime = 0 }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(initialTime);
  const timerRef = useRef(null);
  const previousTimeRef = useRef(initialTime);
  
  // Use useCallback to prevent function recreation on every render
  const handleTimerUpdate = useCallback((time) => {
    if (onTimerUpdate && previousTimeRef.current !== time) {
      previousTimeRef.current = time;
      onTimerUpdate(time);
    }
  }, [onTimerUpdate]);

  // Reset timer when initialTime changes
  useEffect(() => {
    setElapsedTime(initialTime);
    previousTimeRef.current = initialTime;
  }, [initialTime]);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle timer ticking
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

  const startTimer = () => {
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    handleTimerUpdate(0);
  };

  // Format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
      <View style={styles.buttonContainer}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={startTimer}>
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
            <Text style={styles.buttonText}>◼</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
          <Text style={styles.buttonText}>↺</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#f5f6fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    color: '#2c3e50',
    width: 48,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  startButton: {
    backgroundColor: '#2ecc71',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  resetButton: {
    backgroundColor: '#3498db',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RestTimer;