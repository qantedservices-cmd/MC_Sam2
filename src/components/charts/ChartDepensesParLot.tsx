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
  selectedIds?: string[];
  onSelect?: (categorieId: string, ctrlKey: boolean) => void;
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

const SELECTED_OPACITY = 1;
const UNSELECTED_OPACITY = 0.3;

export default function ChartDepensesParLot({
  data,
  height = 300,
  selectedIds = [],
  onSelect
}: ChartDepensesParLotProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const hasSelection = selectedIds.length > 0;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePieClick = (data: any, _index: number, e: React.MouseEvent) => {
    if (onSelect && data?.categorieId) {
      onSelect(data.categorieId, e.ctrlKey || e.metaKey);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Repartition par Lot
        {onSelect && <span className="text-xs font-normal text-gray-400 ml-2">(Clic pour filtrer)</span>}
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
            onClick={handlePieClick}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => {
              const isSelected = selectedIds.includes(entry.categorieId);
              const opacity = hasSelection ? (isSelected ? SELECTED_OPACITY : UNSELECTED_OPACITY) : SELECTED_OPACITY;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={opacity}
                  stroke={isSelected ? '#000' : 'white'}
                  strokeWidth={isSelected ? 3 : 2}
                />
              );
            })}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ChartData;
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
                    <p className="text-lg font-bold text-blue-600">{formatMontant(item.value)}</p>
                    <p className="text-sm text-gray-500">{((item.value / total) * 100).toFixed(1)}% du total</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            onClick={(e) => {
              const payload = e?.payload as ChartData | undefined;
              if (onSelect && payload?.categorieId) {
                onSelect(payload.categorieId, false);
              }
            }}
            formatter={(value, entry) => {
              const item = entry.payload as ChartData;
              const isSelected = selectedIds.includes(item?.categorieId);
              return (
                <span
                  className={`text-sm cursor-pointer hover:underline ${
                    hasSelection
                      ? isSelected
                        ? 'text-gray-800 font-semibold'
                        : 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  {value}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
