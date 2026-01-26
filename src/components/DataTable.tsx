import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMontant } from '../utils/format';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
  onExport?: () => void;
}

export default function DataTable<T extends object>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  exportable = true,
  onExport
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key as keyof T];
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn as keyof T];
      const bVal = b[sortColumn as keyof T];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    // Default CSV export
    const headers = columns.map(col => col.header).join(',');
    const rows = sortedData.map(row =>
      columns.map(col => {
        const value = row[col.key as keyof T];
        // Escape quotes and wrap in quotes
        return `"${String(value ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.csv';
    link.click();
  };

  const renderMobileCard = (row: T, idx: number) => {
    const dateCol = columns.find(c => c.key === 'date');
    const typeCol = columns.find(c => c.key === 'type');
    const montantCol = columns.find(c => c.key === 'montant');
    const descCol = columns.find(c => c.key === 'description');
    const otherCols = columns.filter(c =>
      !['date', 'type', 'montant', 'description'].includes(String(c.key))
    );

    return (
      <div key={idx} className="bg-white border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {typeCol && typeCol.render && typeCol.render(row)}
            {dateCol && (
              <span className="text-sm text-gray-500">
                {dateCol.render ? dateCol.render(row) : String(row[dateCol.key as keyof T] ?? '')}
              </span>
            )}
          </div>
          {montantCol && (
            <div className="text-right font-semibold text-gray-800">
              {montantCol.render ? montantCol.render(row) : String(row[montantCol.key as keyof T] ?? '')}
            </div>
          )}
        </div>
        {descCol && (
          <div className="text-sm text-gray-700">
            {descCol.render ? descCol.render(row) : String(row[descCol.key as keyof T] ?? '-')}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {otherCols.map(col => (
            <div key={String(col.key)}>
              <span className="font-medium">{col.header}:</span>{' '}
              {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '-')}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {searchable && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{sortedData.length} resultats</span>
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => handleSort(String(col.key))}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      {col.header}
                      <span className="flex flex-col">
                        <ChevronUp
                          className={`w-3 h-3 ${
                            sortColumn === col.key && sortDirection === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                        <ChevronDown
                          className={`w-3 h-3 -mt-1 ${
                            sortColumn === col.key && sortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-300'
                          }`}
                        />
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Aucune donnee trouvee
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-sm text-gray-700 ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      {/* Mobile Card View */}
      <div className="md:hidden">
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune donnee trouvee</div>
        ) : (
          <div className="p-3 space-y-3">
            {paginatedData.map((row, idx) => renderMobileCard(row, idx))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 sm:px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            Affichage {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} sur{' '}
            {sortedData.length}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline">Precedent</span>
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline">Suivant</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render photo links
export function renderPhotoLinks(urls?: string[] | string) {
  // Handle both array and CSV string formats
  let urlArray: string[] = [];
  if (Array.isArray(urls)) {
    urlArray = urls;
  } else if (typeof urls === 'string' && urls.trim()) {
    urlArray = urls.split(',').map(u => u.trim()).filter(Boolean);
  }

  if (urlArray.length === 0) return '-';
  return (
    <div className="flex gap-1">
      {urlArray.slice(0, 3).map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      ))}
      {urlArray.length > 3 && (
        <span className="text-gray-400 text-xs">+{urlArray.length - 3}</span>
      )}
    </div>
  );
}

// Helper to render montant
export function renderMontant(value: number) {
  return <span className="font-medium">{formatMontant(value)}</span>;
}

// Helper to render type badge
export function renderTypeBadge(type: string) {
  const colors: Record<string, string> = {
    depense: 'bg-blue-100 text-blue-700',
    devis: 'bg-purple-100 text-purple-700',
    transfert: 'bg-green-100 text-green-700'
  };
  const labels: Record<string, string> = {
    depense: 'Depense',
    devis: 'Devis',
    transfert: 'Transfert'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
      {labels[type] || type}
    </span>
  );
}
