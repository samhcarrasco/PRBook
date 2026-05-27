import React, { useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { useAppTheme } from '../context/themecontext';

const fartSound = require('../../assets/fart.wav');

const FartButton = () => {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;
  const [isPlaying, setIsPlaying] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const playFart = async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.0, duration: 150, useNativeDriver: true }),
    ]).start();

    try {
      const { sound } = await Audio.Sound.createAsync(fartSound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          setIsPlaying(false);
        }
      });
      await sound.playAsync();
    } catch (error) {
      console.warn('Fart sound failed:', error);
      setIsPlaying(false);
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: c.primary }]}
        onPress={playFart}
        activeOpacity={0.7}
        disabled={isPlaying}
      >
        <Text style={styles.emoji}>💨</Text>
        <Text style={[styles.label, { color: '#fff' }]}>Fart</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emoji: {
    fontSize: 22,
    marginRight: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FartButton;
