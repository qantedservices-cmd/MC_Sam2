import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import type { TransfertBudget, Depense } from '../../types';

interface ChartBilanActeursProps {
  transferts: TransfertBudget[];
  depenses: Depense[];
  formatMontant: (amount: number) => string;
  getAmountInDNT: (montant: number, chantierId: string) => number;
  height?: number;
}

interface ActeurBilan {
  nom: string;
  transfertsDonnes: number;
  transfertsRecus: number;
  depensesPaye: number;
  solde: number;
}

export default function ChartBilanActeurs({
  transferts,
  depenses,
  formatMontant,
  getAmountInDNT,
  height = 300
}: ChartBilanActeursProps) {
  const bilanData = useMemo(() => {
    const acteurs: Record<string, ActeurBilan> = {};

    // Helper pour initialiser un acteur
    const getOrCreateActeur = (nom: string): ActeurBilan => {
      if (!acteurs[nom]) {
        acteurs[nom] = {
          nom,
          transfertsDonnes: 0,
          transfertsRecus: 0,
          depensesPaye: 0,
          solde: 0
        };
      }
      return acteurs[nom];
    };

    // Traiter les transferts
    transferts.forEach(t => {
      const montant = t.montantConverti || t.montant;

      // Source = celui qui donne
      if (t.source) {
        const acteur = getOrCreateActeur(t.source);
        acteur.transfertsDonnes += montant;
      }

      // Destination = celui qui recoit
      if (t.destination) {
        const acteur = getOrCreateActeur(t.destination);
        acteur.transfertsRecus += montant;
      }
    });

    // Traiter les depenses (payeur)
    depenses.forEach(d => {
      if (d.payeur) {
        const acteur = getOrCreateActeur(d.payeur);
        acteur.depensesPaye += getAmountInDNT(d.montant, d.chantierId);
      }
    });

    // Calculer le solde pour chaque acteur
    // Solde = Recus - Donnes - Depenses payees
    Object.values(acteurs).forEach(a => {
      a.solde = a.transfertsRecus - a.transfertsDonnes - a.depensesPaye;
    });

    // Trier par solde absolu decroissant
    return Object.values(acteurs)
      .filter(a => a.transfertsDonnes > 0 || a.transfertsRecus > 0 || a.depensesPaye > 0)
      .sort((a, b) => Math.abs(b.solde) - Math.abs(a.solde));
  }, [transferts, depenses, getAmountInDNT]);

  // Tooltip personnalise
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ActeurBilan;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{data.nom}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              Recus: {formatMontant(data.transfertsRecus)}
            </p>
            <p className="text-red-600">
              Donnes: {formatMontant(data.transfertsDonnes)}
            </p>
            <p className="text-orange-600">
              Depenses: {formatMontant(data.depensesPaye)}
            </p>
            <hr className="my-1" />
            <p className={`font-semibold ${data.solde >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Solde: {formatMontant(data.solde)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (bilanData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bilan par Acteur</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          Aucune donnee de transfert ou depense avec payeur
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Bilan par Acteur</h3>
      <p className="text-sm text-gray-500 mb-4">
        Solde = Transferts recus - Transferts donnes - Depenses payees
      </p>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={bilanData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
          <YAxis
            type="category"
            dataKey="nom"
            tick={{ fontSize: 12 }}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine x={0} stroke="#666" />
          <Bar
            dataKey="solde"
            name="Solde"
            radius={[0, 4, 4, 0]}
          >
            {bilanData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.solde >= 0 ? '#10B981' : '#EF4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Tableau recapitulatif */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">Acteur</th>
              <th className="text-right py-2 px-2 text-green-600">Recus</th>
              <th className="text-right py-2 px-2 text-red-600">Donnes</th>
              <th className="text-right py-2 px-2 text-orange-600">Depenses</th>
              <th className="text-right py-2 px-2 font-semibold">Solde</th>
            </tr>
          </thead>
          <tbody>
            {bilanData.map((acteur, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="py-2 px-2 font-medium">{acteur.nom}</td>
                <td className="text-right py-2 px-2 text-green-600">
                  {formatMontant(acteur.transfertsRecus)}
                </td>
                <td className="text-right py-2 px-2 text-red-600">
                  {formatMontant(acteur.transfertsDonnes)}
                </td>
                <td className="text-right py-2 px-2 text-orange-600">
                  {formatMontant(acteur.depensesPaye)}
                </td>
                <td className={`text-right py-2 px-2 font-semibold ${acteur.solde >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatMontant(acteur.solde)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
