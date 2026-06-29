import React, { useState, useMemo } from 'react';
import { Prospect, ProspectStatus, PROSPECT_STATUSES } from 'shared';
import { Search, Filter, Home, ArrowUpDown, MoreHorizontal } from 'lucide-react';

interface TableViewProps {
  prospects: Prospect[];
  onSelectProspect: (prospect: Prospect) => void;
}

const statusBadges: Record<ProspectStatus, { label: string; bg: string; text: string }> = {
  new: { label: 'New Lead', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
  contacted: { label: 'Contacted', bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400' },
  tour_scheduled: { label: 'Tour Scheduled', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
  toured: { label: 'Toured', bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400' },
  application: { label: 'Application', bg: 'bg-pink-500/10 border-pink-500/20', text: 'text-pink-400' },
  leased: { label: 'Leased', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  lost: { label: 'Lost', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' }
};

export const TableView: React.FC<TableViewProps> = ({ prospects, onSelectProspect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'status' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'name' | 'status' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...prospects];

    // Filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.assignedUnit?.number || '').includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [prospects, searchQuery, statusFilter, sortField, sortDirection]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search prospects by name, email, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="all">All Stages</option>
              {PROSPECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusBadges[status].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="flex-1 overflow-auto glass-panel border border-slate-800/80 rounded-2xl">
        <table className="w-full border-collapse text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 font-semibold text-slate-400">
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Name
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Pipeline Stage
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3.5 px-4">Assigned Unit</th>
              <th
                onClick={() => handleSort('createdAt')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  Created Date
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No prospects found matching the search criteria.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((prospect) => {
                const badge = statusBadges[prospect.status];
                return (
                  <tr
                    key={prospect.id}
                    onClick={() => onSelectProspect(prospect)}
                    className="hover:bg-slate-900/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4 font-medium text-slate-200 group-hover:text-brand-300 transition-colors">
                      {prospect.name}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span>{prospect.email}</span>
                        <span className="text-xs text-slate-500">{prospect.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {prospect.assignedUnit ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          <Home size={10} />
                          <span>Unit {prospect.assignedUnit.number}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(prospect.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
