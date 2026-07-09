import React from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';

export default function BrainMuscleIcon({ size = 24, color = '#000' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <Icon source="brain" size={size * 0.8} color={color} />
      <Icon source="arm-flex" size={size * 0.75} color={color} />
    </View>
  );
}
