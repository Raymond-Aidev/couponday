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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Card } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { RootStackParamList } from '../../types';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingsItem {
  id: string;
  icon: string;
  label: string;
  onPress?: () => void;
  value?: string;
  showArrow?: boolean;
  danger?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const dispatch = useAppDispatch();
  const { user, store } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const sections: SettingsSection[] = [
    {
      title: '가게 정보',
      items: [
        {
          id: 'store-info',
          icon: '🏪',
          label: '가게 정보 수정',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '가게 정보 수정 기능을 준비하고 있습니다'),
        },
        {
          id: 'menu',
          icon: '📋',
          label: '메뉴 관리',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '메뉴 관리 기능을 준비하고 있습니다'),
        },
        {
          id: 'hours',
          icon: '⏰',
          label: '영업시간 설정',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '영업시간 설정 기능을 준비하고 있습니다'),
        },
      ],
    },
    {
      title: '정산',
      items: [
        {
          id: 'settlement',
          icon: '💰',
          label: '정산 내역',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '정산 내역 기능을 준비하고 있습니다'),
        },
        {
          id: 'bank',
          icon: '🏦',
          label: '계좌 정보',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '계좌 정보 기능을 준비하고 있습니다'),
        },
      ],
    },
    {
      title: '알림',
      items: [
        {
          id: 'push',
          icon: '🔔',
          label: '푸시 알림',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '푸시 알림 설정 기능을 준비하고 있습니다'),
        },
      ],
    },
    {
      title: '지원',
      items: [
        {
          id: 'faq',
          icon: '❓',
          label: '자주 묻는 질문',
          showArrow: true,
          onPress: () => Alert.alert('준비중', 'FAQ 기능을 준비하고 있습니다'),
        },
        {
          id: 'contact',
          icon: '💬',
          label: '고객센터',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '고객센터 기능을 준비하고 있습니다'),
        },
        {
          id: 'terms',
          icon: '📄',
          label: '이용약관',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '이용약관 페이지를 준비하고 있습니다'),
        },
        {
          id: 'privacy',
          icon: '🔒',
          label: '개인정보처리방침',
          showArrow: true,
          onPress: () => Alert.alert('준비중', '개인정보처리방침 페이지를 준비하고 있습니다'),
        },
      ],
    },
    {
      title: '계정',
      items: [
        {
          id: 'logout',
          icon: '🚪',
          label: '로그아웃',
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  const renderItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingsItem}
      onPress={item.onPress}
      disabled={!item.onPress}
    >
      <View style={styles.settingsItemLeft}>
        <Text style={styles.settingsIcon}>{item.icon}</Text>
        <Text
          style={[
            styles.settingsLabel,
            item.danger && styles.settingsLabelDanger,
          ]}
        >
          {item.label}
        </Text>
      </View>
      <View style={styles.settingsItemRight}>
        {item.value && <Text style={styles.settingsValue}>{item.value}</Text>}
        {item.showArrow && <Text style={styles.settingsArrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {store?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{store?.name || '가게명'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.profileEditButton}>
            <Text style={styles.profileEditText}>편집</Text>
          </TouchableOpacity>
        </Card>

        {/* Settings Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card variant="outlined" style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  {renderItem(item)}
                  {index < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* App Version */}
        <Text style={styles.version}>쿠폰데이 사장님 v1.0.0</Text>
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
    marginBottom: spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    ...typography.h2,
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileEditButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  profileEditText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    padding: 0,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingsLabel: {
    ...typography.body1,
    color: colors.textPrimary,
  },
  settingsLabelDanger: {
    color: colors.error,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsValue: {
    ...typography.body2,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  settingsArrow: {
    ...typography.h3,
    color: colors.gray400,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginLeft: spacing.xl + spacing.md,
  },
  version: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
