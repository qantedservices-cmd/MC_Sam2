import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, UserCheck, UserX, Clock, Save,
  Loader2, ChevronLeft, ChevronRight, Users, BarChart2, ChevronDown, ChevronUp
} from 'lucide-react';
import { getEmployesByChantier, getChantiers, getPointages, createPointage, updatePointage } from '../services/api';
import type { Employe, Chantier, Pointage, TypePointage } from '../types';
import { TYPES_POINTAGE } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { canAccessChantier } from '../utils/permissions';

export default function PointagePage() {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [selectedChantier, setSelectedChantier] = useState<string>('');
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showStats, setShowStats] = useState(false);

  // Pointages du jour en cours d'edition
  const [dailyPointages, setDailyPointages] = useState<Record<string, { type: TypePointage; heuresSupp: number; notes: string }>>({});

  const loadChantiers = useCallback(async () => {
    try {
      const data = await getChantiers();
      // Filter chantiers based on user permissions
      const accessibleData = user && !hasPermission('canViewAllChantiers')
        ? data.filter(c => canAccessChantier(user.role, user.chantierIds, c.id))
        : data;
      setChantiers(accessibleData);
      if (accessibleData.length > 0 && !selectedChantier) {
        setSelectedChantier(accessibleData[0].id);
      }
    } catch {
      showError('Erreur lors du chargement des chantiers');
    }
  }, [showError, selectedChantier, user, hasPermission]);

  const loadEmployesAndPointages = useCallback(async () => {
    if (!selectedChantier) return;

    try {
      setLoading(true);
      const [employesData, pointagesData] = await Promise.all([
        getEmployesByChantier(selectedChantier),
        getPointages()
      ]);

      // Filtrer employes actifs
      const activeEmployes = employesData.filter(e => e.statut === 'actif');
      setEmployes(activeEmployes);

      // Filtrer pointages du chantier
      const chantierPointages = pointagesData.filter(p => p.chantierId === selectedChantier);
      setPointages(chantierPointages);

      // Initialiser les pointages du jour
      const dayPointages: Record<string, { type: TypePointage; heuresSupp: number; notes: string }> = {};
      activeEmployes.forEach(emp => {
        const existing = chantierPointages.find(p => p.employeId === emp.id && p.date === selectedDate);
        dayPointages[emp.id] = existing
          ? { type: existing.type, heuresSupp: existing.heuresSupp || 0, notes: existing.notes || '' }
          : { type: 'present', heuresSupp: 0, notes: '' };
      });
      setDailyPointages(dayPointages);
    } catch {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [selectedChantier, selectedDate, showError]);

  useEffect(() => {
    loadChantiers();
  }, [loadChantiers]);

  useEffect(() => {
    loadEmployesAndPointages();
  }, [loadEmployesAndPointages]);

  // Calculer les statistiques mensuelles
  const monthlyStats = useMemo(() => {
    const currentMonth = selectedDate.substring(0, 7);
    const monthPointages = pointages.filter(p => p.date.startsWith(currentMonth));

    const stats = employes.map(emp => {
      const empPointages = monthPointages.filter(p => p.employeId === emp.id);
      let joursPresent = 0;
      let demiJournees = 0;
      let absences = 0;
      let conges = 0;
      let maladies = 0;
      let heuresSupp = 0;

      empPointages.forEach(p => {
        switch (p.type) {
          case 'present': joursPresent++; break;
          case 'demi_journee': demiJournees++; break;
          case 'absent': absences++; break;
          case 'conge': conges++; break;
          case 'maladie': maladies++; break;
        }
        heuresSupp += p.heuresSupp || 0;
      });

      const totalJours = joursPresent + (demiJournees * 0.5);

      return {
        employeId: emp.id,
        nom: `${emp.prenom} ${emp.nom}`,
        poste: emp.poste,
        joursPresent,
        demiJournees,
        totalJours,
        absences,
        conges,
        maladies,
        heuresSupp
      };
    });

    return stats;
  }, [pointages, employes, selectedDate]);

  const handleTypeChange = (employeId: string, type: TypePointage) => {
    setDailyPointages(prev => ({
      ...prev,
      [employeId]: { ...prev[employeId], type }
    }));
  };

  const handleHeuresChange = (employeId: string, heures: number) => {
    setDailyPointages(prev => ({
      ...prev,
      [employeId]: { ...prev[employeId], heuresSupp: heures }
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);

    try {
      const promises = Object.entries(dailyPointages).map(async ([employeId, data]) => {
        const existing = pointages.find(p => p.employeId === employeId && p.date === selectedDate);

        const pointageData = {
          employeId,
          chantierId: selectedChantier,
          date: selectedDate,
          type: data.type,
          heuresSupp: data.heuresSupp || undefined,
          notes: data.notes || undefined,
          createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
          createdBy: user?.id
        };

        if (existing) {
          return updatePointage(existing.id, pointageData);
        } else {
          return createPointage(pointageData);
        }
      });

      await Promise.all(promises);
      showSuccess('Pointages enregistres');
      loadEmployesAndPointages();
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getTypeColor = (type: TypePointage) => {
    switch (type) {
      case 'present': return 'bg-green-100 text-green-700 border-green-300';
      case 'absent': return 'bg-red-100 text-red-700 border-red-300';
      case 'demi_journee': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'conge': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'maladie': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const countByType = (type: TypePointage) => {
    return Object.values(dailyPointages).filter(p => p.type === type).length;
  };

  if (loading && chantiers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/personnel"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pointage</h1>
            <p className="text-gray-500 capitalize">{formatDate(selectedDate)}</p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving || employes.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span className="hidden sm:inline">Enregistrer</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Chantier */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chantier</label>
            <select
              value={selectedChantier}
              onChange={e => setSelectedChantier(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {chantiers.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          {/* Navigation date */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
      </div>

      {/* Resume */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
            <UserCheck className="w-5 h-5" />
            <span className="text-xl font-bold">{countByType('present')}</span>
          </div>
          <p className="text-xs text-gray-500">Presents</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
            <UserX className="w-5 h-5" />
            <span className="text-xl font-bold">{countByType('absent')}</span>
          </div>
          <p className="text-xs text-gray-500">Absents</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-xl font-bold">{countByType('demi_journee')}</span>
          </div>
          <p className="text-xs text-gray-500">Demi-journee</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xl font-bold">{countByType('conge')}</span>
          </div>
          <p className="text-xs text-gray-500">Conges</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-600 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xl font-bold">{countByType('maladie')}</span>
          </div>
          <p className="text-xs text-gray-500">Maladies</p>
        </div>
      </div>

      {/* Statistiques mensuelles */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-800">
              Statistiques du mois ({formatMonth(selectedDate)})
            </span>
          </div>
          {showStats ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showStats && (
          <div className="border-t overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Employe</th>
                  <th className="px-4 py-2 text-center font-medium text-green-600">Presents</th>
                  <th className="px-4 py-2 text-center font-medium text-yellow-600">1/2 J.</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Total J.</th>
                  <th className="px-4 py-2 text-center font-medium text-red-600">Absents</th>
                  <th className="px-4 py-2 text-center font-medium text-blue-600">Conges</th>
                  <th className="px-4 py-2 text-center font-medium text-purple-600">Maladies</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">H. Supp</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyStats.map(stat => (
                  <tr key={stat.employeId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <p className="font-medium">{stat.nom}</p>
                      <p className="text-xs text-gray-500">{stat.poste}</p>
                    </td>
                    <td className="px-4 py-2 text-center text-green-600 font-medium">{stat.joursPresent}</td>
                    <td className="px-4 py-2 text-center text-yellow-600">{stat.demiJournees}</td>
                    <td className="px-4 py-2 text-center font-bold">{stat.totalJours}</td>
                    <td className="px-4 py-2 text-center text-red-600">{stat.absences}</td>
                    <td className="px-4 py-2 text-center text-blue-600">{stat.conges}</td>
                    <td className="px-4 py-2 text-center text-purple-600">{stat.maladies}</td>
                    <td className="px-4 py-2 text-center">{stat.heuresSupp}h</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-center text-green-600">
                    {monthlyStats.reduce((s, e) => s + e.joursPresent, 0)}
                  </td>
                  <td className="px-4 py-2 text-center text-yellow-600">
                    {monthlyStats.reduce((s, e) => s + e.demiJournees, 0)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {monthlyStats.reduce((s, e) => s + e.totalJours, 0)}
                  </td>
                  <td className="px-4 py-2 text-center text-red-600">
                    {monthlyStats.reduce((s, e) => s + e.absences, 0)}
                  </td>
                  <td className="px-4 py-2 text-center text-blue-600">
                    {monthlyStats.reduce((s, e) => s + e.conges, 0)}
                  </td>
                  <td className="px-4 py-2 text-center text-purple-600">
                    {monthlyStats.reduce((s, e) => s + e.maladies, 0)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {monthlyStats.reduce((s, e) => s + e.heuresSupp, 0)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Liste employes */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : employes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun employe actif sur ce chantier</p>
          <Link to="/personnel" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Gerer le personnel
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employe</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">H. Supp</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employes.map(employe => (
                  <tr key={employe.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{employe.prenom} {employe.nom}</p>
                        <p className="text-sm text-gray-500">{employe.poste}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(TYPES_POINTAGE).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => handleTypeChange(employe.id, key as TypePointage)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              dailyPointages[employe.id]?.type === key
                                ? getTypeColor(key as TypePointage)
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        value={dailyPointages[employe.id]?.heuresSupp || 0}
                        onChange={e => handleHeuresChange(employe.id, Number(e.target.value))}
                        className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
