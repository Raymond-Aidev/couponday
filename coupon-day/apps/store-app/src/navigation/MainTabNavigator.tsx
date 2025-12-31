import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList, CouponStackParamList, PartnershipStackParamList } from '../types';
import { colors, typography } from '../constants/theme';

// Screens
import { HomeScreen } from '../screens/home';
import { CouponListScreen, CouponDetailScreen, CouponCreateScreen } from '../screens/coupons';
import { PartnershipListScreen, PartnerRecommendationsScreen } from '../screens/partnership';
import { SettingsScreen } from '../screens/settings';

const Tab = createBottomTabNavigator<MainTabParamList>();
const CouponStack = createNativeStackNavigator<CouponStackParamList>();
const PartnershipStack = createNativeStackNavigator<PartnershipStackParamList>();

// Coupon Stack Navigator
const CouponStackNavigator: React.FC = () => {
  return (
    <CouponStack.Navigator screenOptions={{ headerShown: false }}>
      <CouponStack.Screen name="CouponList" component={CouponListScreen} />
      <CouponStack.Screen name="CouponDetail" component={CouponDetailScreen} />
      <CouponStack.Screen name="CouponCreate" component={CouponCreateScreen} />
    </CouponStack.Navigator>
  );
};

// Partnership Stack Navigator
const PartnershipStackNavigator: React.FC = () => {
  return (
    <PartnershipStack.Navigator screenOptions={{ headerShown: false }}>
      <PartnershipStack.Screen name="PartnershipList" component={PartnershipListScreen} />
      <PartnershipStack.Screen
        name="PartnershipRecommendations"
        component={PartnerRecommendationsScreen}
      />
    </PartnershipStack.Navigator>
  );
};

// Tab Icons
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return '🏠';
      case 'Coupons':
        return '🎫';
      case 'Partnership':
        return '🤝';
      case 'Settings':
        return '⚙️';
      default:
        return '📱';
    }
  };

  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{getIcon()}</Text>
  );
};

// Main Tab Navigator
export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: ({ focused }) => {
          const getLabel = () => {
            switch (route.name) {
              case 'Home':
                return '홈';
              case 'Coupons':
                return '쿠폰';
              case 'Partnership':
                return '파트너';
              case 'Settings':
                return '설정';
              default:
                return route.name;
            }
          };

          return (
            <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
              {getLabel()}
            </Text>
          );
        },
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Coupons" component={CouponStackNavigator} />
      <Tab.Screen name="Partnership" component={PartnershipStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: '600',
  },
});
