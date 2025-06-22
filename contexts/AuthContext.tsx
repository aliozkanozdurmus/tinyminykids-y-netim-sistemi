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

  const loadSessionFromStorage = useCallback(() => {
    setIsLoading(true);
    const storedSession = localStorage.getItem('currentSession');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession) as AuthenticatedSession;
        if (parsedSession && parsedSession.userId && parsedSession.role && parsedSession.fullName) {
          setSession(parsedSession);
        } else {
          localStorage.removeItem('currentSession');
        }
      } catch (error) {
        console.error("Failed to parse session from storage", error);
        localStorage.removeItem('currentSession');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Seeding is now a backend responsibility.
    // apiService.initializeDefaultUsers()
    //   .then(() => {
    //     return apiService.seedInitialProductData(); // This is also backend responsibility
    //   })
    //   .then(() => {
    //     loadSessionFromStorage();
    //   })
    //   .catch(error => {
    //     console.error("Error during application initialization (users/seeding):", error);
    //     loadSessionFromStorage(); 
    //   });
    loadSessionFromStorage(); // Load session directly
  }, [loadSessionFromStorage]);

  const login = async (userIdOrAdminRole: string, password_plain: string): Promise<boolean> => {
    setIsLoading(true);
    const loggedInSession = await apiService.loginUser(userIdOrAdminRole, password_plain); // loginUser now handles its own logging
    if (loggedInSession) {
      setSession(loggedInSession);
      localStorage.setItem('currentSession', JSON.stringify(loggedInSession));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    if (session) {
      apiService.addLogEntry(LogActionType.USER_LOGOUT, `${session.fullName} (${session.role}) çıkış yaptı.`, session.userId, session.userId, session.fullName, session.role);
    }
    setSession(null);
    localStorage.removeItem('currentSession');
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