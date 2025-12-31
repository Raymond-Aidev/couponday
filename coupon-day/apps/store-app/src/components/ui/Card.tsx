import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const getCardStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.base, styles[padding]];

    switch (variant) {
      case 'outlined':
        base.push(styles.outlined);
        break;
      case 'elevated':
        base.push(styles.elevated);
        break;
      default:
        base.push(styles.default);
    }

    return base;
  };

  return <View style={[...getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
  },
  none: {
    padding: 0,
  },
  sm: {
    padding: spacing.sm,
  },
  md: {
    padding: spacing.md,
  },
  lg: {
    padding: spacing.lg,
  },
  default: {
    backgroundColor: colors.white,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  elevated: {
    ...shadows.md,
  },
});
