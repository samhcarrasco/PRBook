import React, { useRef, useCallback } from 'react';
import { Text } from 'react-native';
import { Audio } from 'expo-av';
import GradientButton from './ui/gradient-button';

const explosionSound = require('../../assets/sounds/explosion.wav');

const ExplosionButton = ({ style }) => {
  const soundRef = useRef(null);

  const playExplosion = useCallback(async () => {
    try {
      // Unload previous sound if it exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(explosionSound);
      soundRef.current = sound;
      await sound.playAsync();

      // Clean up when playback finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('Failed to play explosion sound:', error);
    }
  }, []);

  return (
    <GradientButton
      label="💥 Explosion"
      onPress={playExplosion}
      gradientColors={['#FF4500', '#FF6347', '#DC143C']}
      glowShadow="glow"
      icon={<Text style={{ fontSize: 20 }}>🔊</Text>}
      style={style}
    />
  );
};

export default ExplosionButton;
