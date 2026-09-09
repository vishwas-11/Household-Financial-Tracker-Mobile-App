// src/navigation/AppNavigator.tsx
import React from 'react';
import { StyleSheet, Platform, View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, BookOpen, Repeat, Users, Settings } from 'lucide-react-native';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { LedgerScreen } from '../screens/main/LedgerScreen';
import { RecurringScreen } from '../screens/main/RecurringScreen';
import { MembersScreen } from '../screens/main/MembersScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

interface TabConfig {
  name: string;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const TAB_CONFIGS: TabConfig[] = [
  { name: 'Dashboard', label: 'Overview', Icon: LayoutDashboard },
  { name: 'Ledger', label: 'Ledger', Icon: BookOpen },
  { name: 'Recurring', label: 'Recurring', Icon: Repeat },
  { name: 'Members', label: 'Members', Icon: Users },
  { name: 'Settings', label: 'Settings', Icon: Settings },
];

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  // Ensure comfortable bottom clearance on all devices (notch, gestures, hardware/virtual nav bar)
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 10);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomInset }]}>
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIGS.find((t) => t.name === route.name);
          if (!config) return null;

          const { options } = descriptors[route.key];
          const Icon = config.Icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabButton,
                pressed && styles.tabButtonPressed,
              ]}
            >
              {/* Top active indicator line */}
              <View style={styles.indicatorContainer}>
                {isFocused && <View style={styles.activeIndicator} />}
              </View>

              {/* Icon */}
              <View style={styles.iconWrapper}>
                <Icon
                  size={21}
                  color={isFocused ? Colors.brand : Colors.textMuted}
                  strokeWidth={isFocused ? 2.3 : 1.8}
                />
              </View>

              {/* Label - guaranteed single line, calibrated font */}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Ledger" component={LedgerScreen} />
      <Tab.Screen name="Recurring" component={RecurringScreen} />
      <Tab.Screen name="Members" component={MembersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingHorizontal: 2,
  },
  tabButtonPressed: {
    opacity: 0.7,
  },
  indicatorContainer: {
    height: 3,
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeIndicator: {
    width: 28,
    height: 3,
    backgroundColor: Colors.brand,
    borderRadius: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
