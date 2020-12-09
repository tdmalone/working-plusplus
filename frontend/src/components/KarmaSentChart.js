import React from "react";
import { PieChart, Pie, Tooltip, Cell } from 'recharts';

const KarmaSentChart = props => {

  const data01 = props.karma && props.karma.map(el => { return el });

  const COLORS = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active) {
      return (
        <div className="shadow p-3 mb-5 bg-white rounded">
          <strong>{`${payload[0].name}`}</strong><br />
          {`${payload[0].value} Points`}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="recharts">
      <PieChart width={170} height={170}>
        <Pie
          dataKey="value"
          isAnimationActive={false}
          data={data01}
          cx={80}
          cy={80}
          outerRadius={80}
          fill="#8884d8"
          labelLine={false}
          label={renderCustomizedLabel}
        >
          { data01.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />) }
        </Pie>
        <Tooltip allowEscapeViewBox={{ x:true, y:true }} content={<CustomTooltip />} />
      </PieChart>
      <div className="recharts-legend">
        { data01.map((el, index) => (
          <div key={index} className="recharts-legend-item">
            <div className="recharts-legend--circle" style={{background: COLORS[index % COLORS.length] }}></div><div style={{display: 'flex', color: COLORS[index % COLORS.length] }}>
              {el.name}
            </div>
          </div>
        )) }
      </div>
    </div>
  );
}
export default KarmaSentChart;
