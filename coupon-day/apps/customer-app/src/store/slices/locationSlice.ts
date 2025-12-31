import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as ExpoLocation from 'expo-location';
import { Location } from '../../types';

interface LocationState {
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

const initialState: LocationState = {
  currentLocation: null,
  isLoading: false,
  error: null,
  permissionGranted: false,
};

export const requestLocationPermission = createAsyncThunk(
  'location/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return rejectWithValue('위치 권한이 필요합니다');
      }
      return true;
    } catch (error) {
      return rejectWithValue('위치 권한 요청에 실패했습니다');
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      return rejectWithValue('현재 위치를 가져올 수 없습니다');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Request permission
    builder.addCase(requestLocationPermission.fulfilled, (state) => {
      state.permissionGranted = true;
      state.error = null;
    });
    builder.addCase(requestLocationPermission.rejected, (state, action) => {
      state.permissionGranted = false;
      state.error = action.payload as string;
    });

    // Get current location
    builder.addCase(getCurrentLocation.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getCurrentLocation.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentLocation = action.payload;
    });
    builder.addCase(getCurrentLocation.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setLocation, clearError } = locationSlice.actions;
export default locationSlice.reducer;
