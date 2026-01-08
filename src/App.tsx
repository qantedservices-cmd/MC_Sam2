import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChantierForm from './pages/ChantierForm';
import ChantierDetail from './pages/ChantierDetail';
import DepenseForm from './pages/DepenseForm';
import ActeursIndex from './pages/ActeursIndex';
import ActeurForm from './pages/ActeurForm';
import ActeurDetail from './pages/ActeurDetail';
import ImportData from './pages/ImportData';
import DevisForm from './pages/DevisForm';
import TransfertForm from './pages/TransfertForm';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UsersManagement from './pages/UsersManagement';
import { ShieldOff } from 'lucide-react';

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
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="chantiers/nouveau" element={<ChantierForm />} />
              <Route path="chantiers/:id" element={<ChantierDetail />} />
              <Route path="chantiers/:id/modifier" element={<ChantierForm />} />
              <Route path="chantiers/:id/depenses/nouveau" element={<DepenseForm />} />
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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
