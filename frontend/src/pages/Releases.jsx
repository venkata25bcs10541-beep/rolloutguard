import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Plus,
  Filter,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import HealthBadge from '../components/HealthBadge';
import CreateReleaseModal from '../components/CreateReleaseModal';
import { getReleases, createRelease } from '../services/releaseApi';
import { formatDate, formatRelativeTime } from '../utils/formatters';

export default function Releases() {
  const [releases, setReleases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReleases = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await getReleases(params);
      setReleases(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch releases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReleases(1);
  };

  const handleCreateRelease = async (payload) => {
    await createRelease(payload);
    await fetchReleases(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Release Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history, lifecycle states, and traffic allocations across candidate versions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchReleases(pagination.page)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Release</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search app or version..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Running">Running</option>
            <option value="Healthy">Healthy</option>
            <option value="Degraded">Degraded</option>
            <option value="Rolled Back">Rolled Back</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Release Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            Loading releases...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 bg-rose-50">{error}</div>
        ) : releases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No releases match your query. Create a new release or clear search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Application</th>
                  <th className="py-3 px-5">Candidate Version</th>
                  <th className="py-3 px-5">Previous Stable</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Rollout %</th>
                  <th className="py-3 px-5">Scenario</th>
                  <th className="py-3 px-5">Decision</th>
                  <th className="py-3 px-5">Created</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {releases.map((rel) => (
                  <tr key={rel._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      <Link to={`/releases/${rel._id}`} className="hover:underline">
                        {rel.appName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-medium text-slate-900">
                      {rel.candidateVersion}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">
                      {rel.previousStableVersion}
                    </td>
                    <td className="py-3.5 px-5">
                      <HealthBadge status={rel.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-800">{rel.rolloutPercentage}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              rel.status === 'Degraded' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${rel.rolloutPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 capitalize text-slate-600">
                      {rel.scenario?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-700">
                      {rel.finalDecision}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                      {formatRelativeTime(rel.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/releases/${rel._id}`}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700 font-medium"
                      >
                        Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-medium text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-medium text-slate-900">{pagination.totalPages}</span> ({pagination.total} releases total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchReleases(pagination.page - 1)}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchReleases(pagination.page + 1)}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreateRelease}
      />
    </div>
  );
}
