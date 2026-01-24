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
  formatAmount: (montant: number, fromDevise?: DeviseType) => string;
}

const CURRENCY_MAP: Record<DeviseType, string> = {
  DNT: 'TND',
  EUR: 'EUR',
  USD: 'USD'
};

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

  // Convertit et formate un montant depuis fromDevise vers displayCurrency
  const formatAmount = useCallback((montant: number, fromDevise: DeviseType = 'DNT'): string => {
    let convertedAmount = montant;

    if (fromDevise !== displayCurrency) {
      // Convertir d'abord en DNT (monnaie de base)
      const amountInDNT = montant * rates[fromDevise];
      // Puis convertir vers la devise d'affichage
      convertedAmount = amountInDNT / rates[displayCurrency];
    }

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: CURRENCY_MAP[displayCurrency]
    }).format(convertedAmount);
  }, [displayCurrency, rates]);

  return (
    <CurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency, config, rates, loading, formatAmount }}>
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
