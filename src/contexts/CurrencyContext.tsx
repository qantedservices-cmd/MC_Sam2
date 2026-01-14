import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getConfig, updateConfig } from '../services/api';
import type { DeviseType, AppConfig } from '../types';

interface CurrencyContextType {
  displayCurrency: DeviseType;
  setDisplayCurrency: (currency: DeviseType) => void;
  config: AppConfig | null;
  rates: { EUR: number; USD: number; DNT: number };
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<DeviseType>('DNT');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const rates = config?.tauxChange || { EUR: 3.35, USD: 3.10, DNT: 1 };

  useEffect(() => {
    getConfig()
      .then(data => {
        setConfig(data);
        setDisplayCurrencyState(data.deviseAffichage || 'DNT');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setDisplayCurrency = useCallback(async (currency: DeviseType) => {
    setDisplayCurrencyState(currency);
    if (config) {
      try {
        const updatedConfig = { ...config, deviseAffichage: currency };
        await updateConfig(updatedConfig);
        setConfig(updatedConfig);
      } catch (error) {
        console.error('Erreur sauvegarde devise:', error);
      }
    }
  }, [config]);

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, config, rates, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
