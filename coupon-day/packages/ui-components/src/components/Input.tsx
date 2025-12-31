import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helper?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    containerStyle,
    isPassword = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const getInputContainerStyle = (): ViewStyle[] => {
        const base: ViewStyle[] = [styles.inputContainer];

        if (isFocused) {
            base.push(styles.focused);
        }

        if (error) {
            base.push(styles.error);
        }

        return base;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={getInputContainerStyle()}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[
                        styles.input,
                        leftIcon ? styles.inputWithLeftIcon : null,
                        rightIcon || isPassword ? styles.inputWithRightIcon : null,
                    ]}
                    placeholderTextColor={colors.gray400}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Text style={styles.showPassword}>
                            {showPassword ? '숨기기' : '보기'}
                        </Text>
                    </TouchableOpacity>
                )}

                {rightIcon && !isPassword && (
                    <View style={styles.rightIcon}>{rightIcon}</View>
                )}
            </View>

            {(error || helper) && (
                <Text style={[styles.helperText, error ? styles.errorText : null]}>
                    {error || helper}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.body2,
        fontWeight: '500',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: borderRadius.md,
        minHeight: 48,
    },
    focused: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    error: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        ...typography.body1,
        color: colors.textPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    inputWithLeftIcon: {
        paddingLeft: spacing.xs,
    },
    inputWithRightIcon: {
        paddingRight: spacing.xs,
    },
    leftIcon: {
        paddingLeft: spacing.md,
    },
    rightIcon: {
        paddingRight: spacing.md,
    },
    showPassword: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    helperText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    errorText: {
        color: colors.error,
    },
});
