// src/navigation/AppNavigator.tsx
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Users,
  Settings,
} from 'lucide-react-native';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { LedgerScreen } from '../screens/main/LedgerScreen';
import { RecurringScreen } from '../screens/main/RecurringScreen';
import { MembersScreen } from '../screens/main/MembersScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Ledger"
        component={LedgerScreen}
        options={{
          tabBarLabel: 'Ledger',
          tabBarIcon: ({ color, size }) => <Receipt size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Recurring"
        component={RecurringScreen}
        options={{
          tabBarLabel: 'Recurring',
          tabBarIcon: ({ color, size }) => <Repeat size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{
          tabBarLabel: 'Members',
          tabBarIcon: ({ color, size }) => <Users size={size || 20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size || 20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
});
