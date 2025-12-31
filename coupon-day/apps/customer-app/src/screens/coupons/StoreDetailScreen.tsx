import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { CouponCard } from '../../components/ui';
import { storeService } from '../../services/store.service';
import { couponService } from '../../services/coupon.service';
import { useAppSelector } from '../../store';
import { RootStackParamList, Coupon } from '../../types';

type StoreDetailRouteProp = RouteProp<RootStackParamList, 'StoreDetail'>;

export const StoreDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<StoreDetailRouteProp>();
  const queryClient = useQueryClient();
  const { storeId } = route.params;
  const { currentLocation } = useAppSelector((state) => state.location);

  const { data: store, isLoading } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => storeService.getStore(storeId, currentLocation || undefined),
  });

  const { data: coupons } = useQuery({
    queryKey: ['store-coupons', storeId],
    queryFn: async () => {
      if (!currentLocation) return [];
      const allCoupons = await couponService.getNearbyCoupons(currentLocation);
      return allCoupons.filter((c) => c.store.id === storeId);
    },
    enabled: !!currentLocation,
  });

  const favoriteMutation = useMutation({
    mutationFn: () => storeService.toggleFavorite(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', storeId] });
    },
  });

  const handleCall = () => {
    if (store?.phone) {
      Linking.openURL(`tel:${store.phone}`);
    }
  };

  const handleDirections = () => {
    if (store?.latitude && store?.longitude) {
      const url = `https://maps.google.com/?daddr=${store.latitude},${store.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleFavorite = () => {
    favoriteMutation.mutate();
  };

  const formatDistance = () => {
    if (!store?.distance) return null;
    if (store.distance < 1000) {
      return `${Math.round(store.distance)}m`;
    }
    return `${(store.distance / 1000).toFixed(1)}km`;
  };

  const getOperatingStatus = () => {
    if (!store?.operatingHours) return { isOpen: null, text: '영업시간 정보 없음' };

    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const today = dayNames[now.getDay()];
    const todayHours = store.operatingHours[today];

    if (!todayHours) return { isOpen: false, text: '오늘 휴무' };

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;

    return {
      isOpen,
      text: isOpen
        ? `영업중 · ${todayHours.close}까지`
        : `영업 전 · ${todayHours.open} 오픈`,
    };
  };

  const handleCouponPress = (coupon: Coupon) => {
    navigation.navigate('CouponDetail' as never, { couponId: coupon.id } as never);
  };

  if (isLoading || !store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const operatingStatus = getOperatingStatus();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFavorite}>
          <Text style={styles.favoriteButton}>
            {store.isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Store Info */}
        <View style={styles.storeHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{store.category.name}</Text>
          </View>
          <Text style={styles.storeName}>{store.name}</Text>
          {store.description && (
            <Text style={styles.storeDescription}>{store.description}</Text>
          )}
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfo}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>📍</Text>
            <Text style={styles.quickInfoText}>
              {formatDistance() || store.address}
            </Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Text
              style={[
                styles.quickInfoIcon,
                { opacity: operatingStatus.isOpen ? 1 : 0.5 },
              ]}
            >
              🕐
            </Text>
            <Text
              style={[
                styles.quickInfoText,
                operatingStatus.isOpen ? styles.openText : styles.closedText,
              ]}
            >
              {operatingStatus.text}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCall}
            disabled={!store.phone}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>전화</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>길찾기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
            <Text style={styles.actionIcon}>{store.isFavorite ? '❤️' : '🤍'}</Text>
            <Text style={styles.actionText}>즐겨찾기</Text>
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주소</Text>
          <Text style={styles.addressText}>{store.address}</Text>
        </View>

        {/* Coupons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>사용 가능한 쿠폰</Text>
          {coupons && coupons.length > 0 ? (
            coupons.map((coupon) => (
              <View key={coupon.id} style={styles.couponItem}>
                <CouponCard
                  coupon={coupon}
                  onPress={() => handleCouponPress(coupon)}
                  compact
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyCoupons}>
              <Text style={styles.emptyCouponsText}>
                현재 사용 가능한 쿠폰이 없습니다
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    ...typography.body1,
    color: colors.primary,
  },
  favoriteButton: {
    fontSize: 24,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  storeHeader: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  storeName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  storeDescription: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  quickInfo: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickInfoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  quickInfoText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  openText: {
    color: colors.success,
    fontWeight: '500',
  },
  closedText: {
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  addressText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  couponItem: {
    marginBottom: spacing.sm,
  },
  emptyCoupons: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyCouponsText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
});
