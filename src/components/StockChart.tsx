import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { StockHistory } from '../types';

interface StockChartProps {
  data: StockHistory[];
  companyName: string;
}

export const StockChart = ({ data, companyName }: StockChartProps) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: 'white' }}>
        {companyName} 주가 추이 (최근 30일)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="date"
            stroke="#aaa"
            tick={{ fill: '#aaa' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            stroke="#aaa"
            tick={{ fill: '#aaa' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 10, 30, 0.95)',
              border: '1px solid #4a90e2',
              borderRadius: '8px',
              color: 'white',
            }}
            labelFormatter={(value) => `날짜: ${value}`}
            formatter={(value: number) => [value.toLocaleString() + '원', '']}
          />
          <Legend wrapperStyle={{ color: '#aaa' }} />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#4a90e2"
            strokeWidth={2}
            dot={false}
            name="종가"
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="high"
            stroke="#00ff00"
            strokeWidth={1}
            dot={false}
            name="고가"
            strokeDasharray="5 5"
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="low"
            stroke="#ff0000"
            strokeWidth={1}
            dot={false}
            name="저가"
            strokeDasharray="5 5"
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
