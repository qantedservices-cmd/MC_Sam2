import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { formatMontant } from '../../utils/format';

interface ChartData {
  name: string;
  value: number;
  categorieId: string;
  [key: string]: string | number;
}

interface ChartDepensesParLotProps {
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
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export default function ChartDepensesParLot({
  data,
  height = 300
}: ChartDepensesParLotProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const cx = Number(props.cx) || 0;
    const cy = Number(props.cy) || 0;
    const midAngle = Number(props.midAngle) || 0;
    const innerRadius = Number(props.innerRadius) || 0;
    const outerRadius = Number(props.outerRadius) || 0;
    const percent = Number(props.percent) || 0;
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Repartition par Lot
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={40}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [
              formatMontant(Number(value)),
              `${((Number(value) / total) * 100).toFixed(1)}%`
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => (
              <span className="text-sm text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
