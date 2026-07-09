import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

export default function BrainMuscleIcon({ size = 24, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" fill="none">
        <Path d="M11 5.2c-.9-.9-2.4-.9-3.3 0-.5.5-.7 1.2-.6 1.9-.9.2-1.6 1-1.6 2 0 .5.2 1 .5 1.4-.6.4-1 1.1-1 1.8 0 .9.5 1.6 1.3 1.9-.2.4-.3.9-.3 1.4 0 1.4 1.1 2.5 2.5 2.5.7 0 1.3-.3 1.8-.7.3.5.9.8 1.5.8h.2V5.7c-.2-.2-.6-.5-1-.5z" />
        <Path d="M17.5 15.6c.8-.3 1.3-1 1.3-1.9 0-.7-.4-1.4-1-1.8.3-.4.5-.9.5-1.4 0-1-.7-1.8-1.6-2 .1-.7-.1-1.4-.6-1.9-.9-.9-2.4-.9-3.3 0-.4 0-.8.3-1 .5v11.4h.2c.6 0 1.2-.3 1.5-.8.5.4 1.1.7 1.8.7 1.4 0 2.5-1.1 2.5-2.5 0-.5-.1-1-.3-1.4z" />
        <Path d="M9 10.5c.7 0 1.3-.4 1.6-1M15 10.5c-.7 0-1.3-.4-1.6-1M9.5 14c.6 0 1.2-.3 1.5-.8M14.5 14c-.6 0-1.2-.3-1.5-.8" />
      </G>
      <G stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" fill="none">
        <Path d="M4 18.5c1.2-.6 2.2-.6 3 0 .5.4.8.9 1 1.5" />
        <Path d="M4 18.5c.4-.4 1-.6 1.6-.4.6.2 1 .7 1 1.3 0 .3-.1.6-.3.8" />
        <Path d="M20 18.5c-1.2-.6-2.2-.6-3 0-.5.4-.8.9-1 1.5" />
        <Path d="M20 18.5c-.4-.4-1-.6-1.6-.4-.6.2-1 .7-1 1.3 0 .3.1.6.3.8" />
      </G>
    </Svg>
  );
}
