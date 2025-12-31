import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  onPress?: () => void;
  badge?: number;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MyPageScreen: React.FC = () => {
  const handleNotImplemented = (feature: string) => {
    Alert.alert('준비중', `${feature} 기능을 준비하고 있습니다`);
  };

  const sections: MenuSection[] = [
    {
      title: '쿠폰 관리',
      items: [
        {
          id: 'saved',
          icon: '🎫',
          label: '저장한 쿠폰',
          onPress: () => handleNotImplemented('저장한 쿠폰'),
        },
        {
          id: 'history',
          icon: '📋',
          label: '사용 내역',
          onPress: () => handleNotImplemented('사용 내역'),
        },
      ],
    },
    {
      title: '즐겨찾기',
      items: [
        {
          id: 'favorites',
          icon: '❤️',
          label: '즐겨찾기 가게',
          onPress: () => handleNotImplemented('즐겨찾기'),
        },
      ],
    },
    {
      title: '설정',
      items: [
        {
          id: 'notifications',
          icon: '🔔',
          label: '알림 설정',
          onPress: () => handleNotImplemented('알림 설정'),
        },
        {
          id: 'location',
          icon: '📍',
          label: '위치 설정',
          onPress: () => handleNotImplemented('위치 설정'),
        },
      ],
    },
    {
      title: '고객 지원',
      items: [
        {
          id: 'faq',
          icon: '❓',
          label: '자주 묻는 질문',
          onPress: () => handleNotImplemented('FAQ'),
        },
        {
          id: 'contact',
          icon: '💬',
          label: '문의하기',
          onPress: () => handleNotImplemented('문의하기'),
        },
        {
          id: 'terms',
          icon: '📄',
          label: '이용약관',
          onPress: () => handleNotImplemented('이용약관'),
        },
        {
          id: 'privacy',
          icon: '🔒',
          label: '개인정보처리방침',
          onPress: () => handleNotImplemented('개인정보처리방침'),
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{item.icon}</Text>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <Text style={styles.menuArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>마이페이지</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>게스트 사용자</Text>
            <Text style={styles.profileSubtext}>로그인하면 더 많은 기능을 사용할 수 있어요</Text>
          </View>
        </View>

        {/* Login Prompt */}
        <TouchableOpacity
          style={styles.loginPrompt}
          onPress={() => handleNotImplemented('로그인')}
        >
          <View style={styles.loginPromptContent}>
            <Text style={styles.loginPromptIcon}>✨</Text>
            <View>
              <Text style={styles.loginPromptTitle}>로그인하고 혜택 받기</Text>
              <Text style={styles.loginPromptText}>쿠폰 저장, 알림 등 더 많은 기능!</Text>
            </View>
          </View>
          <Text style={styles.loginPromptArrow}>→</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>저장 쿠폰</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>사용 완료</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0원</Text>
            <Text style={styles.statLabel}>절약 금액</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) =>
                renderMenuItem(item, index === section.items.length - 1)
              )}
            </View>
          </View>
        ))}

        {/* App Version */}
        <Text style={styles.version}>쿠폰데이 v1.0.0</Text>
      </ScrollView>
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
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  profileSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight + '30',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  loginPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginPromptIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  loginPromptTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
  },
  loginPromptText: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  loginPromptArrow: {
    ...typography.h4,
    color: colors.primary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    ...typography.body1,
    color: colors.textPrimary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  menuArrow: {
    ...typography.h3,
    color: colors.gray400,
  },
  version: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
