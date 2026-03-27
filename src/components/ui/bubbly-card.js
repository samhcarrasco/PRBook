import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/themecontext';

const BubblyCard = ({ children, variant = 'surface', shadow = 'medium', style, innerStyle, ...props }) => {
  const { theme, isDark } = useAppTheme();
  const c = theme.custom.colors;
  const r = theme.custom.radii;
  const shadowStyle = theme.custom.shadows[shadow] || theme.custom.shadows.medium;
  const gradientColors = variant === 'glass'
    ? theme.custom.gradients.glass
    : theme.custom.gradients.cardSurface;

  const bgColor = variant === 'glass' ? c.surfaceGlass : c.cardBg;
  const borderRadius = r.lg;

  return (
    <View style={[{ borderRadius }, shadowStyle, style]} {...props}>
      <View style={[
        {
          borderRadius,
          overflow: 'hidden',
          backgroundColor: bgColor,
          borderWidth: isDark ? 1 : 0,
          borderColor: c.cardBorder,
        },
        innerStyle,
      ]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    </View>
  );
};

export default BubblyCard;
