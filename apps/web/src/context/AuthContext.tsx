import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { PublicUser, UserRole, LoginRequest, RegisterRequest } from '../api/types';
import {
  login as apiLogin,
  registerStudent as apiRegister,
  getCurrentUser,
  setAuthToken,
  getAuthToken,
  onUnauthorized,
  mockAdapter,
} from '../api';

interface AuthContextType {
  user: PublicUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<PublicUser>;
  register: (data: RegisterRequest) => Promise<PublicUser>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync token with client
  const updateToken = useCallback((newToken: string | null) => {
    setAuthToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    updateToken(null);
    setUser(null);
    mockAdapter.setCurrentUser(null);
  }, [updateToken]);

  // Handle unauthorized event from API client
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      logout();
    });
    return unsubscribe;
  }, [logout]);

  // Initial authentication check if token was set or mock user is preconfigured
  useEffect(() => {
    async function initAuth() {
      const existingToken = getAuthToken();
      const mockUser = mockAdapter.getCurrentUser();
      if (!existingToken && !mockUser) {
        setIsLoading(false);
        return;
      }
      try {
        const envelope = await getCurrentUser();
        setUser(envelope.user);
        if (envelope.user && !existingToken) {
          updateToken(`mock-token-${envelope.user.id}`);
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, [logout, updateToken]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<PublicUser> => {
      setIsLoading(true);
      try {
        const response = await apiLogin(credentials);
        updateToken(response.token);
        setUser(response.user);
        mockAdapter.setCurrentUser(response.user);
        return response.user;
      } finally {
        setIsLoading(false);
      }
    },
    [updateToken]
  );

  const register = useCallback(
    async (data: RegisterRequest): Promise<PublicUser> => {
      setIsLoading(true);
      try {
        const response = await apiRegister(data);
        // FR-01 & D-07: Registration does not return JWT and does not log user in
        return response.user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const hasRole = useCallback(
    (...roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
