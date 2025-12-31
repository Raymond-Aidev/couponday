import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Region } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { couponService } from '../../services/coupon.service';
import { useAppSelector } from '../../store';
import { MapMarker, RootStackParamList, Store } from '../../types';

type MapNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapNavigationProp>();
  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useAppSelector((state) => state.location);

  const [region, setRegion] = useState<Region | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  useEffect(() => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [currentLocation]);

  const { data: markers, isLoading } = useQuery({
    queryKey: ['map-coupons', currentLocation],
    queryFn: () => couponService.getMapCoupons(currentLocation!, 5000),
    enabled: !!currentLocation,
  });

  const handleMarkerPress = (marker: MapMarker) => {
    setSelectedMarker(marker);
    mapRef.current?.animateToRegion({
      latitude: marker.latitude,
      longitude: marker.longitude,
      latitudeDelta: LATITUDE_DELTA / 2,
      longitudeDelta: LONGITUDE_DELTA / 2,
    });
  };

  const handleStorePress = (store: Store) => {
    navigation.navigate('StoreDetail', { storeId: store.id });
  };

  const handleMyLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>지도를 불러오고 있어요...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {markers?.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            onPress={() => handleMarkerPress(marker)}
          >
            <View
              style={[
                styles.markerContainer,
                selectedMarker?.id === marker.id && styles.markerContainerSelected,
              ]}
            >
              <Text style={styles.markerCount}>{marker.couponCount}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
        <Text style={styles.myLocationIcon}>📍</Text>
      </TouchableOpacity>

      {/* Selected Store Preview */}
      {selectedMarker && (
        <SafeAreaView style={styles.previewContainer} edges={['bottom']}>
          <TouchableOpacity
            style={styles.previewCard}
            onPress={() => handleStorePress(selectedMarker.store)}
            activeOpacity={0.9}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>
                  {selectedMarker.store.category.name}
                </Text>
              </View>
              <Text style={styles.previewCouponCount}>
                {selectedMarker.couponCount}개 쿠폰
              </Text>
            </View>

            <Text style={styles.previewStoreName}>{selectedMarker.store.name}</Text>
            <Text style={styles.previewAddress} numberOfLines={1}>
              {selectedMarker.store.address}
            </Text>

            <View style={styles.previewFooter}>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => handleStorePress(selectedMarker.store)}
              >
                <Text style={styles.previewButtonText}>쿠폰 보기</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  markerContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.md,
  },
  markerContainerSelected: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 1.2 }],
  },
  markerCount: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
  },
  myLocationButton: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  myLocationIcon: {
    fontSize: 20,
  },
  previewContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  previewBadge: {
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  previewBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  previewCouponCount: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  previewStoreName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  previewAddress: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  previewButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  previewButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
