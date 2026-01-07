import { useState, useEffect } from 'react';
import { Settings, RefreshCw, Save, Loader2 } from 'lucide-react';
import { getConfig, updateConfig } from '../services/api';
import type { AppConfig } from '../types';

interface ExchangeRateSettingsProps {
  onUpdate?: (config: AppConfig) => void;
}

export default function ExchangeRateSettings({ onUpdate }: ExchangeRateSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [rates, setRates] = useState({ EUR: 3.35, USD: 3.10 });

  useEffect(() => {
    if (isOpen && !config) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getConfig();
      setConfig(data);
      setRates({
        EUR: data.tauxChange.EUR,
        USD: data.tauxChange.USD
      });
    } catch (error) {
      console.error('Erreur chargement config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const updatedConfig: AppConfig = {
        ...config,
        tauxChange: {
          EUR: rates.EUR,
          USD: rates.USD,
          DNT: 1
        },
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      await updateConfig(updatedConfig);
      setConfig(updatedConfig);
      onUpdate?.(updatedConfig);
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur sauvegarde config:', error);
    } finally {
      setSaving(false);
    }
  };

  const fetchLiveRates = async () => {
    // Simulation - en production, appeler une API de taux de change
    // Ex: https://api.exchangerate-api.com/v4/latest/TND
    setRates({
      EUR: 3.35 + (Math.random() * 0.1 - 0.05),
      USD: 3.10 + (Math.random() * 0.1 - 0.05)
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="Taux de change"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Taux de Change</h3>
              <button
                onClick={fetchLiveRates}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                title="Actualiser les taux"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      1 EUR = ? DNT
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rates.EUR}
                      onChange={e => setRates({ ...rates, EUR: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      1 USD = ? DNT
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rates.USD}
                      onChange={e => setRates({ ...rates, USD: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {config?.lastUpdated && (
                  <p className="text-xs text-gray-400 mt-3">
                    Derniere maj: {new Date(config.lastUpdated).toLocaleDateString('fr-FR')}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-3 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Sauver
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
