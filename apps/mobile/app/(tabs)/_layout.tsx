import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UI } from '@/src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: UI.colors.primary,
        tabBarInactiveTintColor: UI.colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: UI.colors.white,
          borderTopColor: UI.colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="slider.horizontal.3" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: '갤러리',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="photo.on.rectangle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
