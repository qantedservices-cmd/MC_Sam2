import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ShieldOff, Loader2 } from 'lucide-react';

// Lazy load des pages pour le code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChantierForm = lazy(() => import('./pages/ChantierForm'));
const ChantierDetail = lazy(() => import('./pages/ChantierDetail'));
const DepenseForm = lazy(() => import('./pages/DepenseForm'));
const ActeursIndex = lazy(() => import('./pages/ActeursIndex'));
const ActeurForm = lazy(() => import('./pages/ActeurForm'));
const ActeurDetail = lazy(() => import('./pages/ActeurDetail'));
const ImportData = lazy(() => import('./pages/ImportData'));
const DevisForm = lazy(() => import('./pages/DevisForm'));
const TransfertForm = lazy(() => import('./pages/TransfertForm'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UsersManagement = lazy(() => import('./pages/UsersManagement'));
const PersonnelIndex = lazy(() => import('./pages/PersonnelIndex'));
const PointagePage = lazy(() => import('./pages/PointagePage'));
const PaiementsPage = lazy(() => import('./pages/PaiementsPage'));
const MaterielIndex = lazy(() => import('./pages/MaterielIndex'));
const UtilisationMaterielPage = lazy(() => import('./pages/UtilisationMaterielPage'));
const TachesPage = lazy(() => import('./pages/TachesPage'));
const ProductionPage = lazy(() => import('./pages/ProductionPage'));
const LotsPage = lazy(() => import('./pages/LotsPage'));
const FacturationPage = lazy(() => import('./pages/FacturationPage'));
const PVAvancementPage = lazy(() => import('./pages/PVAvancementPage'));
const PaiementsClientPage = lazy(() => import('./pages/PaiementsClientPage'));
const EtatsAvancementPage = lazy(() => import('./pages/EtatsAvancementPage'));
const ChantiersIndex = lazy(() => import('./pages/ChantiersIndex'));

// Composant de chargement
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        <ShieldOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acces non autorise</h1>
        <p className="text-gray-600 mb-6">Vous n'avez pas les permissions necessaires pour acceder a cette page.</p>
        <a href="/" className="text-blue-600 hover:underline">Retour a l'accueil</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <CurrencyProvider>
                    <Layout />
                  </CurrencyProvider>
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="chantiers" element={<ChantiersIndex />} />
                <Route path="chantiers/nouveau" element={<ChantierForm />} />
                <Route path="chantiers/:id" element={<ChantierDetail />} />
                <Route path="chantiers/:id/modifier" element={<ChantierForm />} />
                <Route path="chantiers/:id/depenses/nouveau" element={<DepenseForm />} />
                <Route path="chantiers/:id/taches" element={
                  <ProtectedRoute requiredPermission="canSaisieProduction">
                    <TachesPage />
                  </ProtectedRoute>
                } />
                <Route path="chantiers/:id/production" element={
                  <ProtectedRoute requiredPermission="canSaisieProduction">
                    <ProductionPage />
                  </ProtectedRoute>
                } />
                <Route path="chantiers/:id/lots" element={
                  <ProtectedRoute requiredPermission="canCreateDepense">
                    <LotsPage />
                  </ProtectedRoute>
                } />
                <Route path="chantiers/:id/facturation" element={
                  <ProtectedRoute requiredPermission="canViewFacturation">
                    <FacturationPage />
                  </ProtectedRoute>
                } />
                <Route path="chantiers/:id/pv-avancement" element={
                  <ProtectedRoute requiredPermission="canSaisieProduction">
                    <PVAvancementPage />
                  </ProtectedRoute>
                } />
                <Route path="chantiers/:id/paiements" element={
                  <ProtectedRoute requiredPermission="canViewFacturation">
                    <PaiementsClientPage />
                  </ProtectedRoute>
                } />
                <Route path="chantiers/:id/etats-avancement" element={
                  <ProtectedRoute requiredPermission="canSaisieProduction">
                    <EtatsAvancementPage />
                  </ProtectedRoute>
                } />
                <Route path="acteurs" element={<ActeursIndex />} />
                <Route path="acteurs/:type/nouveau" element={<ActeurForm />} />
                <Route path="acteurs/:type/:id" element={<ActeurDetail />} />
                <Route path="acteurs/:type/:id/modifier" element={<ActeurForm />} />
                <Route path="import" element={
                  <ProtectedRoute requiredPermission="canImportData">
                    <ImportData />
                  </ProtectedRoute>
                } />
                <Route path="dashboard" element={<Navigate to="/" replace />} />
                <Route path="devis/nouveau" element={<DevisForm />} />
                <Route path="transferts/nouveau" element={<TransfertForm />} />
                <Route path="users" element={
                  <ProtectedRoute requiredPermission="canManageUsers">
                    <UsersManagement />
                  </ProtectedRoute>
                } />
                <Route path="personnel" element={
                  <ProtectedRoute requiredPermission="canSaisiePointage">
                    <PersonnelIndex />
                  </ProtectedRoute>
                } />
                <Route path="personnel/pointage" element={
                  <ProtectedRoute requiredPermission="canSaisiePointage">
                    <PointagePage />
                  </ProtectedRoute>
                } />
                <Route path="personnel/paiements" element={
                  <ProtectedRoute requiredPermission="canViewCoutsInternes">
                    <PaiementsPage />
                  </ProtectedRoute>
                } />
                <Route path="materiel" element={
                  <ProtectedRoute requiredPermission="canSaisiePointage">
                    <MaterielIndex />
                  </ProtectedRoute>
                } />
                <Route path="materiel/utilisation" element={
                  <ProtectedRoute requiredPermission="canSaisiePointage">
                    <UtilisationMaterielPage />
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
