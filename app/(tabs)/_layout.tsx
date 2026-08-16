import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors, fonts } from '../../src/theme';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontFamily: fonts.bodyMedium,
        fontSize: 11,
        letterSpacing: 0.6,
        color: focused ? colors.gold : colors.mist,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.ink,
          borderTopColor: colors.fairway,
          height: 64,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.mist,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: ({ focused }) => <TabLabel label="HOME" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Swing',
          tabBarLabel: ({ focused }) => <TabLabel label="SWING" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarLabel: ({ focused }) => <TabLabel label="HABITS" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Scorecard',
          tabBarLabel: ({ focused }) => <TabLabel label="CARD" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
