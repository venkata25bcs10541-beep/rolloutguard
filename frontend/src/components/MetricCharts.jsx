import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

export function ErrorRateChart({ baselineError = 1.2, candidateError = 1.0, threshold = 5.0, warning = 2.5 }) {
  const data = [
    { name: 'Baseline Stable', errorRate: baselineError, fill: '#64748b' },
    {
      name: 'Candidate Release',
      errorRate: candidateError,
      fill: candidateError > threshold ? '#f43f5e' : candidateError > warning ? '#f59e0b' : '#10b981'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Error Rate Comparison</h4>
          <p className="text-xs text-slate-500 mt-0.5">Threshold: ≤ {threshold}% critical ceiling</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
            candidateError > threshold
              ? 'bg-rose-100 text-rose-800'
              : candidateError > warning
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          Candidate: {candidateError.toFixed(2)}%
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit="%" domain={[0, Math.max(10, Math.ceil(candidateError * 1.2))]} />
            <Tooltip
              formatter={(val) => [`${val.toFixed(2)}%`, 'Error Rate']}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Max: ${threshold}%`, fill: '#ef4444', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={warning} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: `Warn: ${warning}%`, fill: '#f59e0b', fontSize: 10, position: 'right' }} />
            <Bar dataKey="errorRate" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LatencyChart({ baselineP95 = 220, candidateP95 = 240, baselineAvg = 110, candidateAvg = 120, threshold = 1000 }) {
  const data = [
    {
      name: 'Average Latency',
      baseline: baselineAvg,
      candidate: candidateAvg
    },
    {
      name: 'p95 Latency',
      baseline: baselineP95,
      candidate: candidateP95
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latency Breakdown</h4>
          <p className="text-xs text-slate-500 mt-0.5">p95 Threshold: ≤ {threshold} ms</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
            candidateP95 > threshold ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          Candidate p95: {Math.round(candidateP95)} ms
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit="ms" domain={[0, Math.max(500, Math.ceil(candidateP95 * 1.15))]} />
            <Tooltip
              formatter={(val) => [`${Math.round(val)} ms`]}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Limit: ${threshold}ms`, fill: '#ef4444', fontSize: 10, position: 'right' }} />
            <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="candidate"
              name="Candidate"
              fill={candidateP95 > threshold ? '#f43f5e' : '#10b981'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TrendHistoryChart({ trends = [] }) {
  if (!trends || trends.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
        No metric history yet. Run releases or simulations to generate trend data.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Historical Deployment Trends</h4>
          <p className="text-xs text-slate-500 mt-0.5">Candidate error rate (%) across recent release evaluation snapshots</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#475569' }} />
            <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
            <Tooltip
              formatter={(val, name) => [`${Number(val).toFixed(2)}%`, name]}
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical (5%)', fill: '#ef4444', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="candidateErrorRate"
              name="Candidate Error Rate"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="baselineErrorRate"
              name="Baseline Error Rate"
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
