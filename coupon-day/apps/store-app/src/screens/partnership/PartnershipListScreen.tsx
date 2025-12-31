import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Card } from '../../components/ui';
import { partnershipService } from '../../services/partnership.service';
import { Partnership, PartnershipStackParamList, PartnershipStatus } from '../../types';
import { useAppSelector } from '../../hooks/useAppDispatch';

type PartnershipListNavigationProp = NativeStackNavigationProp<
  PartnershipStackParamList,
  'PartnershipList'
>;

export const PartnershipListScreen: React.FC = () => {
  const navigation = useNavigation<PartnershipListNavigationProp>();
  const { store } = useAppSelector((state) => state.auth);

  const {
    data: partnerships,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['partnerships'],
    queryFn: partnershipService.getPartnerships,
  });

  const { data: requests } = useQuery({
    queryKey: ['partnership-requests'],
    queryFn: partnershipService.getRequests,
  });

  const pendingRequests = requests?.filter((r) => r.status === 'PENDING') || [];

  const getStatusColor = (status: PartnershipStatus) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'SUSPENDED':
        return colors.error;
      default:
        return colors.gray500;
    }
  };

  const getStatusLabel = (status: PartnershipStatus) => {
    switch (status) {
      case 'ACTIVE':
        return '활성';
      case 'PENDING':
        return '대기중';
      case 'SUSPENDED':
        return '일시정지';
      case 'TERMINATED':
        return '종료';
      default:
        return status;
    }
  };

  const getPartnerStore = (partnership: Partnership) => {
    if (partnership.distributorStore.id === store?.id) {
      return partnership.providerStore;
    }
    return partnership.distributorStore;
  };

  const getMyRole = (partnership: Partnership) => {
    if (partnership.distributorStore.id === store?.id) {
      return 'distributor';
    }
    return 'provider';
  };

  const renderPartnershipItem = ({ item }: { item: Partnership }) => {
    const partnerStore = getPartnerStore(item);
    const myRole = getMyRole(item);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('PartnershipDetail', { partnershipId: item.id })}
      >
        <Card variant="elevated" style={styles.partnerCard}>
          <View style={styles.partnerHeader}>
            <View
              style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
            >
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
            <Text style={styles.roleText}>
              {myRole === 'distributor' ? '배포자' : '제공자'}
            </Text>
          </View>

          <View style={styles.partnerInfo}>
            <View style={styles.storeIcon}>
              <Text style={styles.storeIconText}>🏪</Text>
            </View>
            <View style={styles.storeDetails}>
              <Text style={styles.storeName}>{partnerStore.name}</Text>
              <Text style={styles.storeCategory}>{partnerStore.category.name}</Text>
            </View>
          </View>

          <View style={styles.partnerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>수수료</Text>
              <Text style={styles.statValue}>
                {item.commissionPerRedemption.toLocaleString()}원/건
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🤝</Text>
      <Text style={styles.emptyTitle}>파트너십이 없습니다</Text>
      <Text style={styles.emptyDescription}>
        AI 추천을 통해 최적의 파트너를 찾아보세요
      </Text>
      <TouchableOpacity
        style={styles.findButton}
        onPress={() => navigation.navigate('PartnershipRecommendations')}
      >
        <Text style={styles.findButtonText}>파트너 찾기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>파트너십</Text>
        <TouchableOpacity
          style={styles.findPartnerButton}
          onPress={() => navigation.navigate('PartnershipRecommendations')}
        >
          <Text style={styles.findPartnerButtonText}>+ 파트너 찾기</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => navigation.navigate('PartnershipRequests')}
        >
          <View style={styles.requestsBannerContent}>
            <Text style={styles.requestsBannerIcon}>📬</Text>
            <Text style={styles.requestsBannerText}>
              {pendingRequests.length}개의 파트너십 요청이 있습니다
            </Text>
          </View>
          <Text style={styles.requestsBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={partnerships}
        renderItem={renderPartnershipItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  findPartnerButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  findPartnerButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningLight,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  requestsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestsBannerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  requestsBannerText: {
    ...typography.body2,
    color: colors.warning,
    fontWeight: '600',
  },
  requestsBannerArrow: {
    ...typography.body1,
    color: colors.warning,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  partnerCard: {
    marginBottom: spacing.sm,
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  roleText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  storeIconText: {
    fontSize: 24,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  storeCategory: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  partnerStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  statValue: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  findButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  findButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
});
