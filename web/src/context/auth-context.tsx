"use client";

import * as React from "react";
import { AuthState, LoginCredentials } from "@/types";
import api from "@/lib/api";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "accord_auth";
const TOKEN_KEY = "accord_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    token: null,
    workspace_id: null,
    user_id: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Load auth state from localStorage on mount
  React.useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({
          token,
          workspace_id: parsed.workspace_id,
          user_id: parsed.user_id,
          isAuthenticated: true,
        });
        api.setToken(token);
      } catch (e) {
        // Clear invalid data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { token } = await api.login(credentials);
    
    // Store token separately for easy access
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      workspace_id: credentials.workspace_id,
      user_id: credentials.user_id,
    }));
    
    setState({
      token,
      workspace_id: credentials.workspace_id,
      user_id: credentials.user_id,
      isAuthenticated: true,
    });
    
    api.setToken(token);
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    // Clear state
    setState({
      token: null,
      workspace_id: null,
      user_id: null,
      isAuthenticated: false,
    });
    
    // Clear API token
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
