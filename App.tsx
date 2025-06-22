
import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthContext, UserRole } from './contexts/AuthContext';
import { ThemeContext }  from './contexts/ThemeContext';

import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import CashierPage from './pages/CashierPage';
import KitchenPage from './pages/KitchenPage';
import WaiterPage from './pages/WaiterPage';
import NotFoundPage from './pages/NotFoundPage';
import UserSelectionPage from './pages/UserSelectionPage'; // Import UserSelectionPage
import Navbar from './components/common/Navbar';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, redirectPath = '/login' }) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return <Navigate to="/login" replace />;
  }
  const { session, isLoading } = authContext;

  if (isLoading) { 
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
        </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowedRoles.includes(session.role)) {
    let userHomePage = '/login'; 
    switch (session.role) {
        case UserRole.ADMIN: userHomePage = '/admin'; break;
        case UserRole.CASHIER: userHomePage = '/cashier'; break;
        case UserRole.KITCHEN: userHomePage = '/kitchen'; break;
        case UserRole.WAITER: userHomePage = '/waiter'; break;
        case UserRole.BARISTA: userHomePage = '/cashier'; break; 
    }
    return <Navigate to={userHomePage} replace />;
  }

  return <Outlet />;
};

const AppLayout: React.FC = () => {
  const authContext = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);
  const location = useLocation(); 

  if (!authContext || !themeContext) return null; 

  const { session } = authContext;
  const { theme } = themeContext;

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  let animationKey = location.pathname.split('/')[1] || 'root';
  if (location.pathname === '/admin' && location.hash) {
    animationKey = location.pathname + location.hash; 
  }
  if (location.pathname.startsWith('/select-user/')) {
    animationKey = location.pathname; // Ensure UserSelectionPage animates distinctly
  }


  return (
    <div className="min-h-screen flex flex-col">
      {session && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={animationKey} 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-grow container mx-auto p-4 md:p-6" // Consistent padding
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<NavigateToRoleDefaultOrLogin />} />
          <Route path="/select-user/:role" element={<UserSelectionPage />} /> {/* ADDED THIS ROUTE */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/admin" element={<AdminPage />} /> 
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.CASHIER, UserRole.BARISTA]} />}>
            <Route path="/cashier" element={<CashierPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.KITCHEN]} />}>
            <Route path="/kitchen" element={<KitchenPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.WAITER]} />}>
            <Route path="/waiter" element={<WaiterPage />} />
          </Route>
          <Route path="*" element={<NavigateToRoleDefaultOrLogin />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} /> 
      </Routes>
    </HashRouter>
  );
};

const NavigateToRoleDefaultOrLogin: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext || authContext.isLoading) {
      return ( 
          <div className="flex items-center justify-center min-h-screen">
              <div className="w-10 h-10 border-2 border-dashed rounded-full animate-spin border-primary-DEFAULT"></div>
          </div>
      );
  }
  const { session } = authContext;

  if (!session) return <Navigate to="/login" replace />;

  switch (session.role) {
    case UserRole.ADMIN: return <Navigate to="/admin" replace />;
    case UserRole.CASHIER: return <Navigate to="/cashier" replace />;
    case UserRole.KITCHEN: return <Navigate to="/kitchen" replace />;
    case UserRole.WAITER: return <Navigate to="/waiter" replace />;
    case UserRole.BARISTA: return <Navigate to="/cashier" replace />; 
    default: return <Navigate to="/login" replace />;
  }
};

export default App;
