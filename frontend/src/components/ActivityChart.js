import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';

const ActivityChart = props => {

  const data = props.feed && props.feed.map(el => { return el });
  console.log(data);

  return (
    <LineChart
      width={500}
      height={300}
      data={data}
      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="2 2" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="received" stroke="#519548" activeDot={{ stroke: '#519548', strokeWidth: 2, r: 4 }} isAnimationActive={false} name={'Received'} />
      <Line type="monotone" dataKey="sent" stroke="#26ADE4" activeDot={{ stroke: '#26ADE4', strokeWidth: 2, r: 4 }} isAnimationActive={false} name={'Sent'} />
    </LineChart>
  );
}

export default ActivityChart;