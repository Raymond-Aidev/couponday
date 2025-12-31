import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    style,
    textStyle,
}) => {
    const getButtonStyle = (): ViewStyle[] => {
        const base: ViewStyle[] = [styles.base, styles[size]];

        switch (variant) {
            case 'primary':
                base.push(styles.primary);
                break;
            case 'secondary':
                base.push(styles.secondary);
                break;
            case 'outline':
                base.push(styles.outline);
                break;
            case 'ghost':
                base.push(styles.ghost);
                break;
        }

        if (disabled || loading) {
            base.push(styles.disabled);
        }

        if (fullWidth) {
            base.push(styles.fullWidth);
        }

        return base;
    };

    const getTextStyle = (): TextStyle[] => {
        const base: TextStyle[] = [styles.text, styles[`${size}Text`]];

        switch (variant) {
            case 'primary':
                base.push(styles.primaryText);
                break;
            case 'secondary':
                base.push(styles.secondaryText);
                break;
            case 'outline':
                base.push(styles.outlineText);
                break;
            case 'ghost':
                base.push(styles.ghostText);
                break;
        }

        if (disabled) {
            base.push(styles.disabledText);
        }

        return base;
    };

    return (
        <TouchableOpacity
            style={[...getButtonStyle(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? colors.white : colors.primary}
                    size="small"
                />
            ) : (
                <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
    },
    sm: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        minHeight: 36,
    },
    md: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        minHeight: 44,
    },
    lg: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        minHeight: 52,
    },
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
    text: {
        ...typography.button,
    },
    smText: {
        fontSize: 14,
    },
    mdText: {
        fontSize: 16,
    },
    lgText: {
        fontSize: 18,
    },
    primaryText: {
        color: colors.white,
    },
    secondaryText: {
        color: colors.white,
    },
    outlineText: {
        color: colors.primary,
    },
    ghostText: {
        color: colors.primary,
    },
    disabledText: {
        color: colors.gray400,
    },
});
