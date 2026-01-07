import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, ExternalLink } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="overflow-x-auto">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} sur{' '}
            {sortedData.length}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Premier
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Precedent
            </button>
            <span className="px-3 py-1 text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Dernier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render photo links
export function renderPhotoLinks(urls?: string[]) {
  if (!urls || urls.length === 0) return '-';
  return (
    <div className="flex gap-1">
      {urls.slice(0, 3).map((url, i) => (
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
      {urls.length > 3 && (
        <span className="text-gray-400 text-xs">+{urls.length - 3}</span>
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
