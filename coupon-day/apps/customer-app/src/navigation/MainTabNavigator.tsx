import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { colors, typography } from '../constants/theme';

// Screens
import { HomeScreen } from '../screens/home';
import { MapScreen } from '../screens/map';
import { MyCouponsScreen } from '../screens/coupons';
import { CrossCouponScreen } from '../screens/crosscoupon';
import { MyPageScreen } from '../screens/mypage';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const getIcon = () => {
    switch (name) {
      case 'Home':
        return '🏠';
      case 'Map':
        return '🗺️';
      case 'MyCoupons':
        return '🎫';
      case 'CrossCoupon':
        return '🎁';
      case 'MyPage':
        return '👤';
      default:
        return '📱';
    }
  };

  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{getIcon()}</Text>
  );
};

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
              case 'Map':
                return '지도';
              case 'MyCoupons':
                return '내 쿠폰';
              case 'CrossCoupon':
                return '오늘의 선택';
              case 'MyPage':
                return 'MY';
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
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="MyCoupons" component={MyCouponsScreen} />
      <Tab.Screen name="CrossCoupon" component={CrossCouponScreen} />
      <Tab.Screen name="MyPage" component={MyPageScreen} />
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
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 10,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: '600',
  },
});
