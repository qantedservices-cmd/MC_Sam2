import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { formatMontant } from '../../utils/format';

interface ChartData {
  date: string;
  depenses: number;
  cumul: number;
}

interface ChartEvolutionTempsProps {
  data: ChartData[];
  budget?: number;
  height?: number;
}

export default function ChartEvolutionTemps({
  data,
  budget,
  height = 300
}: ChartEvolutionTempsProps) {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.depenses, d.cumul)),
    budget || 0
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Evolution des Depenses
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCumul" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            domain={[0, maxValue * 1.1]}
          />
          <Tooltip
            formatter={(value, name) => [
              formatMontant(Number(value)),
              name === 'depenses' ? 'Depenses du mois' : 'Cumul'
            ]}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Area
            type="monotone"
            dataKey="depenses"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDepenses)"
          />
          <Area
            type="monotone"
            dataKey="cumul"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCumul)"
          />
          {budget && (
            <Area
              type="monotone"
              dataKey={() => budget}
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="none"
              name="Budget"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600">Depenses mensuelles</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Cumul</span>
        </div>
        {budget && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }} />
            <span className="text-gray-600">Budget</span>
          </div>
        )}
      </div>
    </div>
  );
}
