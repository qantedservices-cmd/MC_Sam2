import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, HardHat, Users, Upload, BarChart3, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../types';
import { PermissionGate } from './ProtectedRoute';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-90">
              <HardHat className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">MonChantier</h1>
                <p className="text-blue-200 text-xs hidden sm:block">Suivi de chantiers BTP</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2" aria-label="Navigation principale">
              <Link
                to="/"
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Accueil"
              >
                <Home className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline">Accueil</span>
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Dashboard analytique"
              >
                <BarChart3 className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                to="/acteurs"
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Gestion des acteurs"
              >
                <Users className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline">Acteurs</span>
              </Link>

              <PermissionGate permission="canImportData">
                <Link
                  to="/import"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Import de donnees"
                >
                  <Upload className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Import</span>
                </Link>
              </PermissionGate>

              <PermissionGate permission="canManageUsers">
                <Link
                  to="/users"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Gestion des utilisateurs"
                >
                  <Shield className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Users</span>
                </Link>
              </PermissionGate>

              <PermissionGate permission="canCreateChantier">
                <Link
                  to="/chantiers/nouveau"
                  className="flex items-center gap-1 px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  aria-label="Creer un nouveau chantier"
                >
                  <PlusCircle className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Nouveau</span>
                </Link>
              </PermissionGate>

              <div className="relative ml-2" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="hidden md:block text-sm">{user?.prenom}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 text-gray-700">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {user?.role && USER_ROLES[user.role]}
                      </span>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Deconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" role="main" aria-label="Contenu principal">
        <Outlet />
      </main>
    </div>
  );
}
