import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { CouponCard } from '../../components/ui';
import { couponService } from '../../services/coupon.service';
import { useAppDispatch, useAppSelector } from '../../store';
import { requestLocationPermission, getCurrentLocation } from '../../store/slices/locationSlice';
import { Coupon, RootStackParamList, Category } from '../../types';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: Category[] = [
  { id: 'all', name: '전체', icon: '🎫' },
  { id: 'cat_food', name: '음식점', icon: '🍽️' },
  { id: 'cat_cafe', name: '카페', icon: '☕' },
  { id: 'cat_beauty', name: '뷰티', icon: '💅' },
  { id: 'cat_health', name: '건강', icon: '💪' },
  { id: 'cat_retail', name: '소매', icon: '🛍️' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const dispatch = useAppDispatch();
  const { currentLocation, permissionGranted, isLoading: locationLoading } = useAppSelector(
    (state) => state.location
  );

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const initLocation = async () => {
      await dispatch(requestLocationPermission());
      await dispatch(getCurrentLocation());
    };
    initLocation();
  }, [dispatch]);

  const {
    data: coupons,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['nearby-coupons', currentLocation, selectedCategory],
    queryFn: () =>
      couponService.getNearbyCoupons(currentLocation!, {
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        sortBy: 'distance',
      }),
    enabled: !!currentLocation,
  });

  const handleCouponPress = (coupon: Coupon) => {
    navigation.navigate('CouponDetail', { couponId: coupon.id });
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text
        style={[
          styles.categoryName,
          selectedCategory === item.id && styles.categoryNameSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderCouponItem = ({ item }: { item: Coupon }) => (
    <View style={styles.couponItem}>
      <CouponCard coupon={item} onPress={() => handleCouponPress(item)} />
    </View>
  );

  const renderLocationStatus = () => {
    if (locationLoading) {
      return (
        <View style={styles.locationStatus}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.locationText}>위치를 찾고 있어요...</Text>
        </View>
      );
    }

    if (!permissionGranted) {
      return (
        <TouchableOpacity
          style={styles.locationWarning}
          onPress={() => dispatch(requestLocationPermission())}
        >
          <Text style={styles.locationWarningIcon}>📍</Text>
          <Text style={styles.locationWarningText}>
            위치 권한을 허용하면 주변 쿠폰을 볼 수 있어요
          </Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요! 👋</Text>
          <Text style={styles.title}>주변 쿠폰을 찾아보세요</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="가게 또는 쿠폰 검색"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Location Status */}
      {renderLocationStatus()}

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        style={styles.categoryContainer}
      />

      {/* Coupons List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>쿠폰을 불러오고 있어요...</Text>
        </View>
      ) : (
        <FlatList
          data={coupons}
          renderItem={renderCouponItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.couponList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎫</Text>
              <Text style={styles.emptyTitle}>주변에 쿠폰이 없어요</Text>
              <Text style={styles.emptyDescription}>
                다른 카테고리를 선택하거나{'\n'}지도에서 더 넓은 범위를 확인해보세요
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  greeting: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
    color: colors.textPrimary,
    padding: 0,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  locationText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  locationWarningIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  locationWarningText: {
    ...typography.body2,
    color: colors.warning,
    flex: 1,
  },
  categoryContainer: {
    maxHeight: 80,
  },
  categoryList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    minWidth: 70,
    ...shadows.sm,
  },
  categoryItemSelected: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryNameSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  couponList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  couponItem: {
    marginBottom: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
