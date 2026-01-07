import { useEffect, useState } from 'react';
import type { CategorieTree } from '../types';
import { getCategoriesTree } from '../services/api';
import { ChevronDown } from 'lucide-react';

interface HierarchicalCategorySelectProps {
  value: string;
  onChange: (categorieId: string) => void;
  required?: boolean;
}

export default function HierarchicalCategorySelect({
  value,
  onChange,
  required = false
}: HierarchicalCategorySelectProps) {
  const [categories, setCategories] = useState<CategorieTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState<string>('');

  useEffect(() => {
    getCategoriesTree()
      .then(data => {
        setCategories(data);
        // If value is set, find its parent
        if (value) {
          for (const parent of data) {
            if (parent.id === value) {
              setSelectedParent(value);
              break;
            }
            const child = parent.children.find(c => c.id === value);
            if (child) {
              setSelectedParent(parent.id);
              break;
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [value]);

  // Get children of selected parent
  const selectedCategory = categories.find(c => c.id === selectedParent);
  const children = selectedCategory?.children || [];
  const hasChildren = children.length > 0;

  const handleParentChange = (parentId: string) => {
    setSelectedParent(parentId);
    const parent = categories.find(c => c.id === parentId);
    // If this category has children, don't select it yet
    // If it has no children, select it directly
    if (parent && parent.children.length === 0) {
      onChange(parentId);
    } else {
      onChange(''); // Reset selection if parent has children
    }
  };

  const handleChildChange = (childId: string) => {
    onChange(childId);
  };

  // Get display label for current value
  const getDisplayLabel = (): string => {
    if (!value) return '';
    for (const parent of categories) {
      if (parent.id === value) return parent.nom;
      const child = parent.children.find(c => c.id === value);
      if (child) return `${parent.nom} > ${child.nom}`;
    }
    return value;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Parent category select */}
      <div className="relative">
        <select
          value={selectedParent}
          onChange={(e) => handleParentChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          required={required && !value}
        >
          <option value="">-- Sélectionner une catégorie --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nom}
              {cat.children.length > 0 ? ' ...' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Child category select (only shown if parent has children) */}
      {hasChildren && (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => handleChildChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            required={required}
          >
            <option value="">-- Préciser le type --</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.nom}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Display current selection */}
      {value && (
        <p className="text-sm text-gray-500">
          Sélection: <span className="font-medium text-gray-700">{getDisplayLabel()}</span>
        </p>
      )}
    </div>
  );
}
