import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { UI } from '@/src/theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function TopBar({ title, subtitle, leftSlot, rightSlot, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {leftSlot ? <View style={styles.sideSlot}>{leftSlot}</View> : null}
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot ? <View style={styles.sideSlot}>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: UI.spacing.md,
  },
  texts: {
    gap: UI.spacing.xs,
    flex: 1,
  },
  title: {
    color: UI.colors.primary,
    ...UI.typography.title,
  },
  subtitle: {
    color: UI.colors.muted,
    ...UI.typography.body,
  },
  sideSlot: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
