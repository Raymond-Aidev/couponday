import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { StoreUser, Store } from '../../types';
import { authService, LoginInput, RegisterInput } from '../../services/auth.service';
import { getAccessToken } from '../../services/api';

interface AuthState {
  user: StoreUser | null;
  store: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  store: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        return null;
      }

      const data = await authService.getMe();
      return data;
    } catch (error) {
      return rejectWithValue('Session expired');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (input: LoginInput, { rejectWithValue }) => {
    try {
      const data = await authService.login(input);
      return { user: data.user, store: data.store };
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다';
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (input: RegisterInput, { rejectWithValue }) => {
    try {
      const data = await authService.register(input);
      return { user: data.user, store: data.store };
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateStore: (state, action: PayloadAction<Partial<Store>>) => {
      if (state.store) {
        state.store = { ...state.store, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Initialize
    builder.addCase(initializeAuth.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isInitialized = true;
      if (action.payload) {
        state.user = action.payload.user;
        state.store = action.payload.store;
        state.isAuthenticated = true;
      }
    });
    builder.addCase(initializeAuth.rejected, (state) => {
      state.isLoading = false;
      state.isInitialized = true;
      state.isAuthenticated = false;
    });

    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.store = action.payload.store;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.store = action.payload.store;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.store = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { clearError, updateStore } = authSlice.actions;
export default authSlice.reducer;
