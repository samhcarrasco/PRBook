import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import { Audio } from 'expo-av';
import GradientButton from './ui/gradient-button';

const YAY_SOUND = require('../../assets/sounds/yay.wav');

const YayButton = ({ style }) => {
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playYay = async () => {
    try {
      // Unload previous sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(YAY_SOUND);
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.warn('Could not play yay sound:', error);
    }
  };

  return (
    <GradientButton
      label="🎉 Yay!"
      onPress={playYay}
      gradientColors={['#F59E0B', '#EF4444', '#EC4899']}
      glowShadow="glow"
      icon={null}
      style={style}
    />
  );
};

export default YayButton;
