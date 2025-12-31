import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Card } from '../../components/ui';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { dashboardService } from '../../services/dashboard.service';
import { CouponRecommendation } from '../../types';

export const HomeScreen: React.FC = () => {
  const { store } = useAppSelector((state) => state.auth);

  const {
    data: dashboard,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboard,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: CouponRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
    }
  };

  const getPriorityLabel = (priority: CouponRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요!</Text>
            <Text style={styles.storeName}>{store?.name || '사장님'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>오늘 매출</Text>
            <Text style={styles.statValue}>
              {isLoading ? '-' : formatCurrency(dashboard?.todaySales || 0)}
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>오늘 사용</Text>
            <Text style={styles.statValue}>
              {isLoading ? '-' : `${dashboard?.todayRedemptions || 0}건`}
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <Text style={styles.statLabel}>활성 쿠폰</Text>
            <Text style={styles.statValue}>
              {isLoading ? '-' : `${dashboard?.activeCoupons || 0}개`}
            </Text>
          </Card>
        </View>

        {/* AI Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI 추천</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>전체 보기</Text>
            </TouchableOpacity>
          </View>

          {dashboard?.recommendations && dashboard.recommendations.length > 0 ? (
            dashboard.recommendations.map((rec, index) => (
              <Card key={rec.id || index} variant="elevated" style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(rec.priority) },
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {getPriorityLabel(rec.priority)}
                    </Text>
                  </View>
                  <Text style={styles.recommendationTitle}>{rec.templateName}</Text>
                </View>
                <Text style={styles.recommendationReason}>{rec.reason}</Text>
                <Text style={styles.recommendationImpact}>{rec.expectedImpact}</Text>
                <TouchableOpacity style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>적용하기</Text>
                </TouchableOpacity>
              </Card>
            ))
          ) : (
            <Card variant="outlined" style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isLoading ? '로딩 중...' : '새로운 추천이 없습니다'}
              </Text>
            </Card>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 활동</Text>
          </View>

          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
            <Card variant="outlined" style={styles.activityCard}>
              {dashboard.recentActivity.map((activity, index) => (
                <View
                  key={activity.id || index}
                  style={[
                    styles.activityItem,
                    index < dashboard.recentActivity.length - 1 && styles.activityItemBorder,
                  ]}
                >
                  <View style={styles.activityIcon}>
                    <Text>
                      {activity.type === 'redemption'
                        ? '✅'
                        : activity.type === 'save'
                        ? '💾'
                        : '⏰'}
                    </Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityMessage}>{activity.message}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          ) : (
            <Card variant="outlined" style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isLoading ? '로딩 중...' : '최근 활동이 없습니다'}
              </Text>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 실행</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={styles.quickActionLabel}>쿠폰 만들기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>🤝</Text>
              <Text style={styles.quickActionLabel}>파트너 찾기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionLabel}>성과 분석</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionIcon}>🎫</Text>
              <Text style={styles.quickActionLabel}>토큰 발급</Text>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  storeName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notificationIcon: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  seeAll: {
    ...typography.body2,
    color: colors.primary,
  },
  recommendationCard: {
    marginBottom: spacing.sm,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  priorityText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  recommendationTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recommendationReason: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recommendationImpact: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  applyButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  activityCard: {
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
