import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatMontant } from '../../utils/format';

interface ChartData {
  name: string;
  value: number;
  chantierId: string;
}

interface ChartDepensesParChantierProps {
  data: ChartData[];
  height?: number;
  selectedIds?: string[];
  onSelect?: (chantierId: string, ctrlKey: boolean) => void;
}

const COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
];

const SELECTED_OPACITY = 1;
const UNSELECTED_OPACITY = 0.3;

export default function ChartDepensesParChantier({
  data,
  height = 300,
  selectedIds = [],
  onSelect
}: ChartDepensesParChantierProps) {
  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const hasSelection = selectedIds.length > 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any, _index: number, e: React.MouseEvent) => {
    if (onSelect && data?.chantierId) {
      onSelect(data.chantierId, e.ctrlKey || e.metaKey);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Depenses par Chantier
        {onSelect && <span className="text-xs font-normal text-gray-400 ml-2">(Clic pour filtrer, CTRL+clic pour multi-selection)</span>}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            width={75}
          />
          <Tooltip
            formatter={(value) => [formatMontant(Number(value)), 'Montant']}
            labelStyle={{ fontWeight: 'bold' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            onClick={handleBarClick}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            {sortedData.map((entry, index) => {
              const isSelected = selectedIds.includes(entry.chantierId);
              const opacity = hasSelection ? (isSelected ? SELECTED_OPACITY : UNSELECTED_OPACITY) : SELECTED_OPACITY;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={opacity}
                  stroke={isSelected ? '#000' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
