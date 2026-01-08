import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, HardHat, Users, Upload, BarChart3, User, LogOut, ChevronDown, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../types';
import { PermissionGate } from './ProtectedRoute';

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); setMobileMenuOpen(false); };

  const navItems = [
    { to: '/', icon: BarChart3, label: 'Dashboard', permission: null },
    { to: '/acteurs', icon: Users, label: 'Acteurs', permission: null },
    { to: '/import', icon: Upload, label: 'Import', permission: 'canImportData' as const },
    { to: '/users', icon: Shield, label: 'Utilisateurs', permission: 'canManageUsers' as const },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="sm:hidden p-2 -ml-2 rounded-lg hover:bg-blue-700" aria-label="Menu">
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="flex items-center gap-2 hover:opacity-90">
                <HardHat className="w-7 h-7 sm:w-8 sm:h-8" />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">MonChantier</h1>
                  <p className="text-blue-200 text-xs hidden sm:block">Suivi de chantiers BTP</p>
                </div>
              </Link>
            </div>

            <nav className="hidden sm:flex items-center gap-1 md:gap-2">
              {navItems.map(item => {
                const isActive = location.pathname === item.to;
                const el = <Link key={item.to} to={item.to} className={`flex items-center gap-1 px-2 md:px-3 py-2 rounded-lg hover:bg-blue-700 ${isActive ? 'bg-blue-700' : ''}`}><item.icon className="w-5 h-5" /><span className="hidden md:inline text-sm">{item.label}</span></Link>;
                return item.permission ? <PermissionGate key={item.to} permission={item.permission}>{el}</PermissionGate> : el;
              })}
              <PermissionGate permission="canCreateChantier">
                <Link to="/chantiers/nouveau" className="flex items-center gap-1 px-2 md:px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                  <PlusCircle className="w-5 h-5" /><span className="hidden md:inline text-sm">Nouveau</span>
                </Link>
              </PermissionGate>
              <div className="relative ml-1 md:ml-2" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-blue-700">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"><User className="w-5 h-5" /></div>
                  <span className="hidden lg:block text-sm">{user?.prenom}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 text-gray-700">
                    <div className="px-4 py-3 border-b"><p className="font-medium text-gray-900">{user?.prenom} {user?.nom}</p><p className="text-sm text-gray-500 truncate">{user?.email}</p><span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{user?.role && USER_ROLES[user.role]}</span></div>
                    <div className="py-1"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-red-600"><LogOut className="w-4 h-4" /><span>Deconnexion</span></button></div>
                  </div>
                )}
              </div>
            </nav>
            <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-1 rounded-full bg-blue-500"><User className="w-6 h-6" /></button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-50 sm:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 sm:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><HardHat className="w-7 h-7" /><span className="font-bold text-lg">MonChantier</span></div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-blue-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-blue-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{user?.role && USER_ROLES[user.role]}</span>
            </div>
          </div>
        </div>
        <nav className="p-2">
          {navItems.map(item => {
            if (item.permission && !hasPermission(item.permission)) return null;
            const isActive = location.pathname === item.to;
            return <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}><item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span></Link>;
          })}
          {hasPermission('canCreateChantier') && <Link to="/chantiers/nouveau" className="flex items-center gap-3 px-4 py-3 mt-2 bg-blue-600 text-white rounded-lg"><PlusCircle className="w-5 h-5" /><span className="font-medium">Nouveau chantier</span></Link>}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"><LogOut className="w-5 h-5" /><span className="font-medium">Deconnexion</span></button>
        </div>
      </div>

      {menuOpen && <div className="sm:hidden fixed top-14 right-4 w-64 bg-white rounded-lg shadow-xl py-2 z-50 text-gray-700">
        <div className="px-4 py-3 border-b"><p className="font-medium text-gray-900">{user?.prenom} {user?.nom}</p><p className="text-sm text-gray-500 truncate">{user?.email}</p><span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{user?.role && USER_ROLES[user.role]}</span></div>
        <div className="py-1"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 text-red-600"><LogOut className="w-5 h-5" /><span>Deconnexion</span></button></div>
      </div>}

      <main className="container mx-auto px-4 py-4 sm:py-8"><Outlet /></main>
    </div>
  );
}
