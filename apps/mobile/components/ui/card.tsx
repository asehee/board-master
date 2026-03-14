import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { UI } from '@/src/theme/tokens';

type Props = ViewProps & {
  style?: StyleProp<ViewStyle>;
};

export function Card({ style, ...props }: Props) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI.colors.white,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
    borderColor: UI.colors.border,
    padding: UI.spacing.xl,
    ...UI.shadow.card,
  },
});
