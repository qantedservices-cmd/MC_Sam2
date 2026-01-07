import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { importBulkDepenses, importBulkDevis, importBulkTransferts } from '../services/api';
import {
  parseExcelFile,
  parseAllFormsRows,
  getImportStats,
  separateByType,
  type ParsedEntry,
  type ImportStats
} from '../utils/excelImport';
import { ENTRY_TYPE_LABELS } from '../types';
import { formatMontant } from '../utils/format';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle,
  Loader2, ArrowLeft, Play, X
} from 'lucide-react';

type ImportStep = 'upload' | 'preview' | 'importing' | 'done';

export default function ImportData() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState<ImportStep>('upload');
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [importResult, setImportResult] = useState<{ depenses: number; devis: number; transferts: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'depense' | 'devis' | 'transfert' | 'errors'>('all');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    try {
      const data = await parseExcelFile(file);
      const parsed = parseAllFormsRows(data);
      setEntries(parsed);
      setStats(getImportStats(parsed));
      setStep('preview');
    } catch {
      showError('Erreur lors de la lecture du fichier Excel');
    }
  }, [showError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        processFile(file);
      } else {
        showError('Veuillez selectionner un fichier Excel (.xlsx ou .xls)');
      }
    }
  }, [processFile, showError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    setStep('importing');

    try {
      const { depenses, devis, transferts } = separateByType(entries);

      const [importedDepenses, importedDevis, importedTransferts] = await Promise.all([
        importBulkDepenses(depenses),
        importBulkDevis(devis),
        importBulkTransferts(transferts)
      ]);

      setImportResult({
        depenses: importedDepenses.length,
        devis: importedDevis.length,
        transferts: importedTransferts.length
      });

      setStep('done');
      showSuccess('Import termine avec succes!');
    } catch {
      showError('Erreur lors de l\'import');
      setStep('preview');
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (filterType === 'all') return true;
    if (filterType === 'errors') return entry.errors.length > 0;
    return entry.type === filterType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'depense': return 'bg-blue-100 text-blue-700';
      case 'devis': return 'bg-purple-100 text-purple-700';
      case 'transfert': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour au tableau de bord
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Import de donnees</h1>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">
              Glissez votre fichier Excel ici
            </h2>
            <p className="text-gray-500 mb-4">
              ou cliquez pour selectionner un fichier
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Choisir un fichier
            </label>
            <p className="text-sm text-gray-400 mt-4">
              Formats acceptes: .xlsx, .xls (export Google Forms)
            </p>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && stats && (
          <div>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total lignes</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Depenses</p>
                <p className="text-2xl font-bold text-blue-700">{stats.depenses}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Devis</p>
                <p className="text-2xl font-bold text-purple-700">{stats.devis}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Transferts</p>
                <p className="text-2xl font-bold text-green-700">{stats.transferts}</p>
              </div>
              <div className={`rounded-lg p-4 ${stats.errors > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <p className={`text-sm ${stats.errors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Erreurs</p>
                <p className={`text-2xl font-bold ${stats.errors > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{stats.errors}</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['all', 'depense', 'devis', 'transfert', 'errors'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'Tout' :
                   type === 'errors' ? `Erreurs (${stats.errors})` :
                   ENTRY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Montant</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredEntries.slice(0, 100).map((entry, idx) => (
                      <tr key={idx} className={entry.errors.length > 0 ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 text-gray-500">{entry.rowIndex}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(entry.type)}`}>
                            {ENTRY_TYPE_LABELS[entry.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {'date' in entry.data ? entry.data.date : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                          {'description' in entry.data ? entry.data.description :
                           'fournisseur' in entry.data ? entry.data.fournisseur :
                           'source' in entry.data ? `${entry.data.source} → ${entry.data.destination}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">
                          {formatMontant(entry.data.montant)}
                        </td>
                        <td className="px-4 py-3">
                          {entry.errors.length > 0 ? (
                            <div className="flex items-center gap-1 text-red-600" title={entry.errors.join(', ')}>
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs">Erreur</span>
                            </div>
                          ) : entry.warnings.length > 0 ? (
                            <div className="flex items-center gap-1 text-yellow-600" title={entry.warnings.join(', ')}>
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs">Warning</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">OK</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredEntries.length > 100 && (
                <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 text-center">
                  Affichage des 100 premieres lignes sur {filteredEntries.length}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('upload');
                  setEntries([]);
                  setStats(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5 inline mr-2" />
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={stats.errors === stats.total}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                Importer {stats.total - stats.errors} entrees
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">Import en cours...</h2>
            <p className="text-gray-500">Veuillez patienter</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && importResult && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-4">Import termine!</h2>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-700">{importResult.depenses}</p>
                <p className="text-sm text-blue-600">Depenses</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-700">{importResult.devis}</p>
                <p className="text-sm text-purple-600">Devis</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-700">{importResult.transferts}</p>
                <p className="text-sm text-green-600">Transferts</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('upload');
                  setEntries([]);
                  setStats(null);
                  setImportResult(null);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Nouvel import
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voir le Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
