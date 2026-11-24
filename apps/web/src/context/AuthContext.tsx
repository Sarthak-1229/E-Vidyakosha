import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { PublicUser, UserRole, LoginRequest, RegisterRequest } from '../api/types';
import {
  login as apiLogin, registerStudent as apiRegister, getCurrentUser, setAuthToken, getAuthToken, onUnauthorized,
} from '../api';

interface AuthContextType {
  user: PublicUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (credentials: LoginRequest) => Promise<PublicUser>;
  register: (data: RegisterRequest) => Promise<PublicUser>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState(getAuthToken);
  const [checkingSession, setCheckingSession] = useState(Boolean(token));
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setSessionExpired(false);
    setCheckingSession(false);
  }, []);

  useEffect(() => onUnauthorized(() => {
    logout();
    setSessionExpired(true);
  }), [logout]);

  useEffect(() => {
    const currentToken = getAuthToken();
    if (!currentToken) return;
    let active = true;
    getCurrentUser().then(
      ({ user }) => { if (active && currentToken === getAuthToken()) setUser(user); },
      () => { if (active && currentToken === getAuthToken()) logout(); },
    ).finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, [logout]);

  async function login(credentials: LoginRequest) {
    const session = await apiLogin(credentials);
    setAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
    setSessionExpired(false);
    return session.user;
  }

  async function register(data: RegisterRequest) {
    return (await apiRegister(data)).user;
  }

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: Boolean(user && token), isLoading: checkingSession, sessionExpired,
      login, register, logout, hasRole: (...roles) => user !== null && roles.includes(user.role),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
