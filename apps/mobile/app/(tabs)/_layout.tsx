import { Tabs } from 'expo-router';
import React from 'react';

import { AppFooterNav } from '@/components/navigation/app-footer-nav';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <AppFooterNav {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '설정',
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: '갤러리',
        }}
      />
    </Tabs>
  );
}
