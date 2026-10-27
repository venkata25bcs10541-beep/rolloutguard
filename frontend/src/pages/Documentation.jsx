import React from 'react';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  RotateCcw,
  Sliders,
  FlaskConical,
  Database,
  CheckCircle2,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { SCENARIO_DESCRIPTIONS } from '../utils/statusStyles';

export default function Documentation() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">RolloutGuard Platform Documentation</h1>
        </div>
        <p className="text-xs text-slate-500">
          Architecture guide, canary evaluation algorithms, deployment simulation scenarios, and REST API specification.
        </p>
      </div>

      {/* 1. Core Idea & Problem Statement */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          1. Problem Statement & Motivation
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Modern continuous delivery pipelines often deploy new code versions directly to all users or broad percentages. When a subtle regression occurs—such as a database query causing a spike in 5xx errors or connection timeouts—hundreds or thousands of users are negatively affected before engineers can manually identify and roll back the release.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">RolloutGuard</strong> solves this by introducing automated deployment safety gates:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-800 block mb-1">Bounded Staged Rollouts</span>
            <span className="text-slate-500">Traffic scales progressively: 5% → 25% → 50% → 100%.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-800 block mb-1">Automated Health Evaluator</span>
            <span className="text-slate-500">Compares candidate metrics against the stable baseline in real time.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-800 block mb-1">Zero-Guesswork Rollback</span>
            <span className="text-slate-500">Halts traffic immediately upon rule breach with concrete evidence.</span>
          </div>
        </div>
      </section>

      {/* 2. Metric Arithmetic */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          2. Metric Calculations & Statistical Rules
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          All evaluations are performed on the backend using strict arithmetic over windowed request samples:
        </p>
        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2">
          <div><span className="text-emerald-400">Error Rate (%)</span> = (Failed Requests ÷ Total Requests) × 100</div>
          <div><span className="text-blue-400">p95 Latency</span> = 95th Percentile response time of all sampled requests</div>
          <div><span className="text-amber-400">Health Probe</span> = Synthetic HTTP GET to /healthz (PASSING = 200, FAILING = 503)</div>
        </div>
      </section>

      {/* 3. The 6 Deployment Scenarios */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-600" />
          3. Built-in Simulation Lab Scenarios
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The built-in simulation engine generates coherent, reproducible metrics across 6 distinct profiles:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Object.entries(SCENARIO_DESCRIPTIONS).map(([key, item]) => (
            <div key={key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {key}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Progressive Rollout Pipeline */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          4. Progressive Rollout Sequence & State Machine
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          A release transitions through bounded phases:
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs">
          <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center">Draft (0%)</span>
          <ArrowRight className="w-4 h-4 text-slate-400 self-center hidden sm:block" />
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-center">Stage 1 (5%)</span>
          <ArrowRight className="w-4 h-4 text-slate-400 self-center hidden sm:block" />
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-center">Stage 2 (25%)</span>
          <ArrowRight className="w-4 h-4 text-slate-400 self-center hidden sm:block" />
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-center">Stage 3 (50%)</span>
          <ArrowRight className="w-4 h-4 text-slate-400 self-center hidden sm:block" />
          <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-center font-bold">Completed (100%)</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          If a breach occurs at any point, the status flips to <code className="text-rose-700 font-mono font-semibold">Degraded</code>, the stage percentage is frozen, and rollback is recommended.
        </p>
      </section>

      {/* 5. REST API Specification */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-600" />
          5. Backend REST API Endpoints
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3 font-sans">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="py-2 px-3 text-emerald-600 font-bold">GET</td><td className="py-2 px-3">/api/health</td><td className="py-2 px-3 font-sans">System & MongoDB connection health</td></tr>
              <tr><td className="py-2 px-3 text-emerald-600 font-bold">GET</td><td className="py-2 px-3">/api/dashboard</td><td className="py-2 px-3 font-sans">Aggregated stats, trends, active release</td></tr>
              <tr><td className="py-2 px-3 text-emerald-600 font-bold">GET</td><td className="py-2 px-3">/api/releases</td><td className="py-2 px-3 font-sans">Paginated releases with search & filters</td></tr>
              <tr><td className="py-2 px-3 text-blue-600 font-bold">POST</td><td className="py-2 px-3">/api/releases</td><td className="py-2 px-3 font-sans">Create a new release record</td></tr>
              <tr><td className="py-2 px-3 text-emerald-600 font-bold">GET</td><td className="py-2 px-3">/api/releases/:id</td><td className="py-2 px-3 font-sans">Inspect release details & latest snapshot</td></tr>
              <tr><td className="py-2 px-3 text-blue-600 font-bold">POST</td><td className="py-2 px-3">/api/releases/:id/start</td><td className="py-2 px-3 font-sans">Start or advance progressive rollout stage</td></tr>
              <tr><td className="py-2 px-3 text-blue-600 font-bold">POST</td><td className="py-2 px-3">/api/releases/:id/pause</td><td className="py-2 px-3 font-sans">Pause active rollout</td></tr>
              <tr><td className="py-2 px-3 text-blue-600 font-bold">POST</td><td className="py-2 px-3">/api/releases/:id/resume</td><td className="py-2 px-3 font-sans">Resume paused rollout</td></tr>
              <tr><td className="py-2 px-3 text-rose-600 font-bold">POST</td><td className="py-2 px-3">/api/releases/:id/rollback</td><td className="py-2 px-3 font-sans">Execute simulated rollback & generate recovery</td></tr>
              <tr><td className="py-2 px-3 text-emerald-600 font-bold">GET</td><td className="py-2 px-3">/api/releases/:id/events</td><td className="py-2 px-3 font-sans">Audit timeline events for a release</td></tr>
              <tr><td className="py-2 px-3 text-emerald-600 font-bold">GET</td><td className="py-2 px-3">/api/settings</td><td className="py-2 px-3 font-sans">Fetch active health thresholds</td></tr>
              <tr><td className="py-2 px-3 text-amber-600 font-bold">PUT</td><td className="py-2 px-3">/api/settings/thresholds</td><td className="py-2 px-3 font-sans">Update health threshold configuration</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Transparency & Limitations */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 text-xs text-amber-900 space-y-2">
        <h3 className="font-semibold text-sm text-amber-950 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Transparency & Simulation Scope Notice
        </h3>
        <p className="leading-relaxed">
          RolloutGuard operates using a realistic built-in simulation engine. While the backend calculations, thresholds, Mongoose models, and state machines are genuine and production-grade, all traffic counts, latency numbers, and rollback operations are simulated within the platform.
        </p>
        <p className="leading-relaxed">
          It does not alter actual live cloud infrastructure (such as AWS ECS, Kubernetes Ingress, or Cloudflare DNS) unless an external provider integration is configured.
        </p>
      </section>
    </div>
  );
}
