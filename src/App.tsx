import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChantierForm from './pages/ChantierForm';
import ChantierDetail from './pages/ChantierDetail';
import DepenseForm from './pages/DepenseForm';
import ActeursIndex from './pages/ActeursIndex';
import ActeurForm from './pages/ActeurForm';
import ActeurDetail from './pages/ActeurDetail';
import ImportData from './pages/ImportData';
import DashboardEnrichi from './pages/DashboardEnrichi';
import DevisForm from './pages/DevisForm';
import TransfertForm from './pages/TransfertForm';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="chantiers/nouveau" element={<ChantierForm />} />
            <Route path="chantiers/:id" element={<ChantierDetail />} />
            <Route path="chantiers/:id/modifier" element={<ChantierForm />} />
            <Route path="chantiers/:id/depenses/nouveau" element={<DepenseForm />} />
            {/* Routes Acteurs */}
            <Route path="acteurs" element={<ActeursIndex />} />
            <Route path="acteurs/:type/nouveau" element={<ActeurForm />} />
            <Route path="acteurs/:type/:id" element={<ActeurDetail />} />
            <Route path="acteurs/:type/:id/modifier" element={<ActeurForm />} />
            {/* Import de donnees */}
            <Route path="import" element={<ImportData />} />
            {/* Dashboard enrichi */}
            <Route path="dashboard" element={<DashboardEnrichi />} />
            {/* Formulaires Devis et Transfert */}
            <Route path="devis/nouveau" element={<DevisForm />} />
            <Route path="transferts/nouveau" element={<TransfertForm />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
