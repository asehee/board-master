import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { UI } from '@/src/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({ label, helperText, containerStyle, inputStyle, ...props }: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        style={[styles.input, inputStyle]}
        placeholderTextColor={props.placeholderTextColor ?? UI.colors.muted}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: UI.spacing.sm,
  },
  label: {
    color: UI.colors.primary,
    ...UI.typography.section,
  },
  input: {
    height: UI.sizes.inputHeight,
    borderWidth: 1,
    borderColor: UI.colors.borderStrong,
    borderRadius: UI.radius.md,
    paddingHorizontal: UI.spacing.lg,
    backgroundColor: UI.colors.white,
    color: UI.colors.primary,
    ...UI.typography.body,
  },
  helper: {
    color: UI.colors.muted,
    ...UI.typography.caption,
  },
});
