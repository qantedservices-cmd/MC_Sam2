import { useState, useEffect } from 'react';
import { Filter, Check, RotateCcw, GripVertical, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import type { Chantier } from '../types';

interface ChantierFilterPanelProps {
  chantiers: Chantier[];
  onApply: (selectedIds: string[], orderedIds: string[]) => void;
  storageKey?: string;
}

interface ChantierSelection {
  selectedIds: string[];
  orderedIds: string[];
}

const STORAGE_KEY_PREFIX = 'monchantier_filter_';

export default function ChantierFilterPanel({
  chantiers,
  onApply,
  storageKey = 'default'
}: ChantierFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<ChantierSelection>({
    selectedIds: [],
    orderedIds: []
  });

  // Charger la sélection sauvegardée
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${storageKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChantierSelection;
        // Filtrer les IDs qui n'existent plus
        const validSelectedIds = parsed.selectedIds.filter(id =>
          chantiers.some(c => c.id === id)
        );
        const validOrderedIds = parsed.orderedIds.filter(id =>
          chantiers.some(c => c.id === id)
        );
        // Ajouter les nouveaux chantiers non présents dans l'ordre
        const newChantierIds = chantiers
          .map(c => c.id)
          .filter(id => !validOrderedIds.includes(id));

        setSelection({
          selectedIds: validSelectedIds.length > 0 ? validSelectedIds : chantiers.map(c => c.id),
          orderedIds: [...validOrderedIds, ...newChantierIds]
        });
      } catch {
        initializeDefault();
      }
    } else {
      initializeDefault();
    }
  }, [chantiers, storageKey]);

  const initializeDefault = () => {
    const allIds = chantiers.map(c => c.id);
    setSelection({
      selectedIds: allIds,
      orderedIds: allIds
    });
  };

  // Appliquer automatiquement au chargement
  useEffect(() => {
    if (selection.orderedIds.length > 0) {
      onApply(selection.selectedIds, selection.orderedIds);
    }
  }, [selection, onApply]);

  const toggleChantier = (id: string) => {
    setSelection(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds.filter(i => i !== id)
        : [...prev.selectedIds, id]
    }));
  };

  const selectAll = () => {
    setSelection(prev => ({
      ...prev,
      selectedIds: [...prev.orderedIds]
    }));
  };

  const selectNone = () => {
    setSelection(prev => ({
      ...prev,
      selectedIds: []
    }));
  };

  const moveUp = (id: string) => {
    setSelection(prev => {
      const idx = prev.orderedIds.indexOf(id);
      if (idx <= 0) return prev;
      const newOrder = [...prev.orderedIds];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      return { ...prev, orderedIds: newOrder };
    });
  };

  const moveDown = (id: string) => {
    setSelection(prev => {
      const idx = prev.orderedIds.indexOf(id);
      if (idx < 0 || idx >= prev.orderedIds.length - 1) return prev;
      const newOrder = [...prev.orderedIds];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      return { ...prev, orderedIds: newOrder };
    });
  };

  const handleApply = () => {
    // Sauvegarder dans localStorage
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${storageKey}`,
      JSON.stringify(selection)
    );
    onApply(selection.selectedIds, selection.orderedIds);
    setIsOpen(false);
  };

  const handleReset = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${storageKey}`);
    initializeDefault();
    onApply(chantiers.map(c => c.id), chantiers.map(c => c.id));
  };

  const getChantierById = (id: string) => chantiers.find(c => c.id === id);

  const selectedCount = selection.selectedIds.length;
  const totalCount = chantiers.length;

  return (
    <div className="relative">
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isOpen || selectedCount < totalCount
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedCount < totalCount ? `${selectedCount}/${totalCount}` : 'Filtrer'}
        </span>
      </button>

      {/* Panel de filtrage */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <h3 className="font-medium text-gray-800">Filtrer et réorganiser</h3>
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez et ordonnez les chantiers à afficher
              </p>
            </div>

            {/* Actions rapides */}
            <div className="flex gap-2 p-2 border-b bg-gray-50">
              <button
                onClick={selectAll}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                <Eye className="w-3 h-3" />
                Tout voir
              </button>
              <button
                onClick={selectNone}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                <EyeOff className="w-3 h-3" />
                Aucun
              </button>
            </div>

            {/* Liste des chantiers */}
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {selection.orderedIds
                .map(id => ({ id, chantier: getChantierById(id) }))
                .filter((item): item is { id: string; chantier: Chantier } => !!item.chantier)
                .map(({ id, chantier }, index) => {
                const isSelected = selection.selectedIds.includes(id);

                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isSelected ? 'bg-amber-50' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    {/* Grip pour drag (visuel seulement) */}
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleChantier(id)}
                      className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-gray-300 hover:border-amber-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>

                    {/* Nom du chantier */}
                    <span className={`flex-1 text-sm truncate ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>
                      {chantier.nom}
                    </span>

                    {/* Boutons monter/descendre */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveUp(id)}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveDown(id)}
                        disabled={index === selection.orderedIds.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2 p-3 border-t bg-gray-50">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
              <button
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600"
              >
                <Check className="w-4 h-4" />
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
