import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

import { UI } from '@/src/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outlineOnDark';

type Props = Omit<TouchableOpacityProps, 'style'> & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function Button({
  label,
  loading = false,
  disabled,
  variant = 'primary',
  style,
  labelStyle,
  ...props
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      {...props}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outlineOnDark' && styles.outlineOnDark,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? UI.colors.white
              : variant === 'outlineOnDark'
                ? UI.colors.white
                : UI.colors.primary
          }
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.primaryLabel,
            variant === 'secondary' && styles.secondaryLabel,
            variant === 'outlineOnDark' && styles.outlineOnDarkLabel,
            labelStyle,
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: UI.sizes.buttonHeight,
    borderRadius: UI.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: UI.colors.primary,
  },
  secondary: {
    backgroundColor: UI.colors.white,
    borderWidth: 1,
    borderColor: UI.colors.primary,
  },
  outlineOnDark: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: UI.colors.white,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryLabel: {
    color: UI.colors.white,
  },
  secondaryLabel: {
    color: UI.colors.primary,
  },
  outlineOnDarkLabel: {
    color: UI.colors.whiteMuted,
  },
});
