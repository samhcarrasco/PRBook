import React from 'react';
import { Pressable } from 'react-native';

const PressableScale = ({ children, onPress, onLongPress, style, disabled, scaleTo, ...props }) => {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && { opacity: 0.85 },
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export default PressableScale;
