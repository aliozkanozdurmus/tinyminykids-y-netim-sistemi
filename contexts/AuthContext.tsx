import React, { createContext, useState, useEffect, useCallback } from 'react';
import { AuthenticatedSession, UserRole, LogActionType } from '../types'; // Added LogActionType
import { apiService } from '../services/apiService';

// Re-export UserRole for convenience in other files
export { UserRole };

interface AuthContextType {
  session: AuthenticatedSession | null;
  login: (userIdOrAdminRole: string, password_plain: string) => Promise<boolean>; // userId or 'admin'
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const currentSession = await apiService.getCurrentSession();
      setSession(currentSession);
    } catch (error) {
      console.error("Failed to load session from API", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    apiService.initializeDefaultUsers()
      .then(() => apiService.seedInitialProductData())
      .then(() => loadSession())
      .catch(error => {
        console.error("Error during application initialization (users/seeding):", error);
        loadSession();
      });
  }, []);

  const login = async (userIdOrAdminRole: string, password_plain: string): Promise<boolean> => {
      setIsLoading(true);
      const loggedInSession = await apiService.loginUser(userIdOrAdminRole, password_plain);
      if (loggedInSession) {
        setSession(loggedInSession);
        apiService.setAuthToken(loggedInSession.token);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    };

  const logout = async () => {
      if (session) {
        apiService.addLogEntry(LogActionType.USER_LOGOUT, `${session.fullName} (${session.role}) çıkış yaptı.`, session.userId, session.userId, session.fullName, session.role);
      }
      setIsLoading(true);
      try {
        await apiService.logoutUser();
      } catch (error) {
        console.error("Error during logout", error);
      } finally {
        apiService.setAuthToken(null);
        setSession(null);
        setIsLoading(false);
      }
    };

  if (isLoading && !session) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
            <p className="ml-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Yükleniyor...</p>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};