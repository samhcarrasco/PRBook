import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const colors = {
  dark: {
    background: '#0D0D0D',
    surface: '#1A1A2E',
    surfaceVariant: '#16213E',
    primary: '#4F46E5',
    primaryContainer: '#3730A3',
    secondary: '#6366F1',
    success: '#10B981',
    successContainer: '#064E3B',
    destructive: '#EF4444',
    destructiveContainer: '#7F1D1D',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    inputBg: '#16213E',
    border: '#1E293B',
    borderLight: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
    cardBg: '#1E1E36',
  },
  light: {
    background: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceVariant: '#F8FAFC',
    primary: '#4F46E5',
    primaryContainer: '#E0E7FF',
    secondary: '#6366F1',
    success: '#10B981',
    successContainer: '#D1FAE5',
    destructive: '#EF4444',
    destructiveContainer: '#FEE2E2',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    inputBg: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#CBD5E1',
    overlay: 'rgba(0, 0, 0, 0.5)',
    cardBg: '#FFFFFF',
  },
};

const PR_TYPE_CONFIG = {
  max_weight:            { color: '#FBBF24', label: 'Max Weight' },
  max_reps_at_weight:    { color: '#FB923C', label: 'Max Reps' },
  max_sets_at_weight:    { color: '#F87171', label: 'Max Sets' },
  best_single_rest:      { color: '#34D399', label: 'Lowest Rest Time' },
  best_avg_rest:         { color: '#2DD4BF', label: 'Lowest Avg Rest' },
  max_volume_single_set: { color: '#A78BFA', label: 'Max Volume - Single Set (weight x reps)' },
  max_total_tonnage:     { color: '#60A5FA', label: 'Max Total Tonnage (total for all sets)' },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

const typography = {
  headlineLarge: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headlineMedium: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  titleLarge: { fontSize: 18, fontWeight: '600' },
  titleMedium: { fontSize: 16, fontWeight: '500' },
  bodyLarge: { fontSize: 16, fontWeight: '400' },
  bodyMedium: { fontSize: 14, fontWeight: '400' },
  labelLarge: { fontSize: 14, fontWeight: '600' },
  labelMedium: { fontSize: 13, fontWeight: '500' },
  labelSmall: { fontSize: 12, fontWeight: '500' },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.dark.primary,
    primaryContainer: colors.dark.primaryContainer,
    secondary: colors.dark.secondary,
    background: colors.dark.background,
    surface: colors.dark.surface,
    surfaceVariant: colors.dark.surfaceVariant,
    onSurface: colors.dark.textPrimary,
    onSurfaceVariant: colors.dark.textSecondary,
    outline: colors.dark.border,
    outlineVariant: colors.dark.borderLight,
    error: colors.dark.destructive,
    errorContainer: colors.dark.destructiveContainer,
    elevation: {
      level0: 'transparent',
      level1: colors.dark.surface,
      level2: colors.dark.cardBg,
      level3: colors.dark.surfaceVariant,
      level4: colors.dark.surfaceVariant,
      level5: colors.dark.surfaceVariant,
    },
  },
  custom: {
    colors: colors.dark,
    spacing,
    radii,
    typography,
    PR_TYPE_CONFIG,
  },
};

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.light.primary,
    primaryContainer: colors.light.primaryContainer,
    secondary: colors.light.secondary,
    background: colors.light.background,
    surface: colors.light.surface,
    surfaceVariant: colors.light.surfaceVariant,
    onSurface: colors.light.textPrimary,
    onSurfaceVariant: colors.light.textSecondary,
    outline: colors.light.border,
    outlineVariant: colors.light.borderLight,
    error: colors.light.destructive,
    errorContainer: colors.light.destructiveContainer,
    elevation: {
      level0: 'transparent',
      level1: colors.light.surface,
      level2: colors.light.cardBg,
      level3: colors.light.surfaceVariant,
      level4: colors.light.surfaceVariant,
      level5: colors.light.surfaceVariant,
    },
  },
  custom: {
    colors: colors.light,
    spacing,
    radii,
    typography,
    PR_TYPE_CONFIG,
  },
};

export { darkTheme, lightTheme, spacing, radii, typography, PR_TYPE_CONFIG, colors };
