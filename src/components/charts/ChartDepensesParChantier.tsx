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

export default function ChartDepensesParChantier({
  data,
  height = 300
}: ChartDepensesParChantierProps) {
  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Depenses par Chantier
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
          >
            {sortedData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
