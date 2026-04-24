import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { RadarScore, RADAR_AXES } from '../types';

interface Props {
  score: RadarScore;
  color: string;
  size?: number;
}

export function FounderRadar({ score, color, size = 180 }: Props) {
  const data = RADAR_AXES.map(ax => ({
    axis: ax.label,
    value: Math.round(score[ax.key] * 10) / 10,
    fullMark: 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.18}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
