import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/themecontext';
import PressableScale from './pressable-scale';

const GradientButton = ({
  label,
  onPress,
  gradientColors,
  glowShadow = 'glow',
  icon,
  disabled,
  loading,
  style,
  labelStyle,
}) => {
  const { theme } = useAppTheme();
  const r = theme.custom.radii;
  const shadowStyle = disabled ? {} : (theme.custom.shadows[glowShadow] || theme.custom.shadows.glow);
  const defaultColors = theme.custom.gradients.primaryButton;

  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={style}>
      <View style={[{ borderRadius: r.md, overflow: 'hidden' }, disabled ? {} : shadowStyle]}>
        <LinearGradient
          colors={disabled ? ['#6B7280', '#4B5563'] : (gradientColors || defaultColors)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: r.md }]}
        >
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                {icon}
                <Text style={[styles.label, labelStyle]}>{label}</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default GradientButton;
