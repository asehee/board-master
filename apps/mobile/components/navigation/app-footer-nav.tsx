import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type TabConfig = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Dashboard', icon: 'dashboard' },
  explore: { label: 'Settings', icon: 'settings' },
  gallery: { label: 'Gallery', icon: 'grid-view' },
};

const PAL = {
  surface: '#1c1b1b',
  border: 'rgba(90,65,54,0.2)',
  activeBg: '#ff6b00',
  activeFg: '#131313',
  inactiveFg: '#e5e2e1',
};

export function AppFooterNav({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const router = useRouter();
  const routesByName = new Map(state.routes.map((route) => [route.name, route]));
  const orderedTabNames: ('index' | 'gallery' | 'explore')[] = ['index', 'gallery', 'explore'];
  const renderTab = (tabName: 'index' | 'gallery' | 'explore') => {
    const route = routesByName.get(tabName);
    if (!route) return null;

    const config = TAB_CONFIG[route.name] ?? { label: route.name, icon: 'circle' };
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === routeIndex;
    const { options } = descriptors[route.key];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarButtonTestID}
        onPress={onPress}
        style={[styles.item, focused && styles.itemActive]}>
        <MaterialIcons
          name={config.icon}
          size={22}
          color={focused ? PAL.activeFg : PAL.inactiveFg}
        />
        <Text style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}>
          {config.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(8, insets.bottom), height: 76 + insets.bottom }]}>
      <View style={styles.row}>
        {renderTab(orderedTabNames[0])}
        {renderTab(orderedTabNames[2])}
        {renderTab(orderedTabNames[1])}
        <Pressable style={styles.item} onPress={() => router.push('/camera')}>
          <MaterialIcons name="photo-camera" size={22} color={PAL.inactiveFg} />
          <Text style={[styles.label, styles.labelInactive]}>Camera</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PAL.surface,
    borderTopWidth: 1,
    borderTopColor: PAL.border,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 4,
  },
  item: {
    minWidth: 74,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  itemActive: {
    backgroundColor: PAL.activeBg,
  },
  label: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: { color: PAL.activeFg },
  labelInactive: { color: PAL.inactiveFg, opacity: 0.64 },
});
