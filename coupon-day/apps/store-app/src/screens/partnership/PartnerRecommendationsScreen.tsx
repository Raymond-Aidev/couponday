import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Card, Button } from '../../components/ui';
import { partnershipService } from '../../services/partnership.service';
import { PartnerRecommendation } from '../../types';

export const PartnerRecommendationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const {
    data: recommendations,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['partnership-recommendations'],
    queryFn: partnershipService.getRecommendations,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (storeId: string) => partnershipService.sendRequest(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnership-requests'] });
      Alert.alert('성공', '파트너십 요청을 보냈습니다');
    },
    onError: (error) => {
      Alert.alert('오류', error instanceof Error ? error.message : '요청 전송에 실패했습니다');
    },
  });

  const handleSendRequest = (storeId: string, storeName: string) => {
    Alert.alert(
      '파트너십 요청',
      `${storeName}에 파트너십 요청을 보내시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '요청 보내기',
          onPress: () => sendRequestMutation.mutate(storeId),
        },
      ]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.gray500;
  };

  const renderRecommendationItem = ({ item }: { item: PartnerRecommendation }) => (
    <Card variant="elevated" style={styles.recommendCard}>
      {/* Match Score */}
      <View style={styles.scoreContainer}>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.matchScore) }]}>
          <Text style={styles.scoreText}>{item.matchScore}점</Text>
        </View>
        <Text style={styles.scoreLabel}>매칭 점수</Text>
      </View>

      {/* Store Info */}
      <View style={styles.storeInfo}>
        <View style={styles.storeIcon}>
          <Text style={styles.storeIconText}>🏪</Text>
        </View>
        <View style={styles.storeDetails}>
          <Text style={styles.storeName}>{item.store.name}</Text>
          <Text style={styles.storeCategory}>{item.store.category.name}</Text>
          <Text style={styles.storeAddress}>{item.store.address}</Text>
        </View>
      </View>

      {/* Score Breakdown */}
      <View style={styles.scoreBreakdown}>
        <Text style={styles.breakdownTitle}>점수 분석</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>카테고리 전환</Text>
            <View style={styles.scoreBar}>
              <View
                style={[styles.scoreBarFill, { width: `${item.categoryConversionScore * 2.5}%` }]}
              />
            </View>
            <Text style={styles.scoreItemValue}>{item.categoryConversionScore}/40</Text>
          </View>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>거리</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${item.distanceScore * 5}%` }]} />
            </View>
            <Text style={styles.scoreItemValue}>{item.distanceScore}/20</Text>
          </View>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>가격대</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${item.priceScore * 5}%` }]} />
            </View>
            <Text style={styles.scoreItemValue}>{item.priceScore}/20</Text>
          </View>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>피크 시간</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${item.peakTimeScore * 5}%` }]} />
            </View>
            <Text style={styles.scoreItemValue}>{item.peakTimeScore}/20</Text>
          </View>
        </View>
      </View>

      {/* Expected Impact */}
      <View style={styles.impactContainer}>
        <Text style={styles.impactLabel}>예상 월간 사용</Text>
        <Text style={styles.impactValue}>
          약 {item.estimatedMonthlyRedemptions}건
        </Text>
      </View>

      {/* Action Button */}
      <Button
        title="파트너십 요청"
        onPress={() => handleSendRequest(item.store.id, item.store.name)}
        loading={sendRequestMutation.isPending}
        fullWidth
      />
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>추천 파트너가 없습니다</Text>
      <Text style={styles.emptyDescription}>
        더 많은 데이터가 쌓이면 AI가 최적의 파트너를 추천해드릴게요
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI 파트너 추천</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          AI가 카테고리 전환율, 거리, 가격대, 피크 시간을 분석하여 최적의 파트너를 추천합니다
        </Text>
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderRecommendationItem}
        keyExtractor={(item) => item.store.id}
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    ...typography.body1,
    color: colors.primary,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.body2,
    color: colors.info,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  recommendCard: {
    marginBottom: spacing.md,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  scoreText: {
    ...typography.h3,
    color: colors.white,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.md,
  },
  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  storeIconText: {
    fontSize: 28,
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
    color: colors.primary,
    marginTop: 2,
  },
  storeAddress: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreBreakdown: {
    marginBottom: spacing.md,
  },
  breakdownTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  scoreRow: {
    marginBottom: spacing.xs,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreItemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 80,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    marginHorizontal: spacing.sm,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  scoreItemValue: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  impactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  impactLabel: {
    ...typography.body2,
    color: colors.success,
  },
  impactValue: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.success,
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
    paddingHorizontal: spacing.lg,
  },
});
