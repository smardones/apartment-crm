import React from 'react';
import { Prospect, ProspectStatus, PROSPECT_STATUSES } from 'shared';
import { Phone, Mail, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext.js';

const statusMetadata: Record<ProspectStatus, { label: string; color: string; bg: string; dot: string }> = {
  new: { label: 'New Lead', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' },
  contacted: { label: 'Contacted', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', dot: 'bg-cyan-400' },
  tour_scheduled: { label: 'Tour Scheduled', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  toured: { label: 'Toured', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-400' },
  application: { label: 'Application', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', dot: 'bg-pink-400' },
  leased: { label: 'Leased', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  lost: { label: 'Lost', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-400' }
};

export const KanbanBoard: React.FC = () => {
  const { filteredProspects: prospects, handleSelectProspect, handleQuickStatusChange } = useAppContext();

  // Group prospects by status
  const grouped = PROSPECT_STATUSES.reduce((acc, status) => {
    acc[status] = prospects.filter((p) => p.status === status);
    return acc;
  }, {} as Record<ProspectStatus, Prospect[]>);

  const shiftStatus = (e: React.MouseEvent, prospect: Prospect, direction: 'prev' | 'next') => {
    e.stopPropagation();
    const currentIndex = PROSPECT_STATUSES.indexOf(prospect.status);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < PROSPECT_STATUSES.length) {
      handleQuickStatusChange(prospect.id, PROSPECT_STATUSES[newIndex]);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full min-h-[500px]">
      {PROSPECT_STATUSES.map((status) => {
        const stageProspects = grouped[status] || [];
        const meta = statusMetadata[status];

        return (
          <div
            key={status}
            className="flex-shrink-0 w-80 flex flex-col glass-panel rounded-2xl p-4 border border-slate-800/60"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <h3 className="font-semibold text-sm tracking-wide uppercase text-slate-300">
                  {meta.label}
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {stageProspects.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0 pr-1">
              {stageProspects.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/80 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-600">No prospects here</p>
                </div>
              ) : (
                stageProspects.map((prospect) => {
                  const isHighIntent = ['tour_scheduled', 'toured', 'application'].includes(prospect.status);
                  
                  return (
                    <div
                      key={prospect.id}
                      onClick={() => handleSelectProspect(prospect)}
                      className={`glass-card hover:bg-slate-800/40 border border-slate-800/80 rounded-xl p-3.5 cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                        isHighIntent ? 'hover:border-brand-500/30' : 'hover:border-slate-700/50'
                      }`}
                    >
                      <div>
                        {/* Name & Highlight Glow */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-semibold text-slate-200 text-sm group-hover:text-brand-300 transition-colors">
                            {prospect.name}
                          </h4>
                          {prospect.status === 'leased' && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Contact details */}
                        <div className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-500" />
                            <span className="truncate">{prospect.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-500" />
                            <span>{prospect.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Assigned Unit & Status Transition Chevrons */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/50">
                        {prospect.assignedUnit ? (
                          <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                            <Home size={10} />
                            <span>Unit {prospect.assignedUnit.number}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium italic">
                            Unassigned
                          </span>
                        )}

                        {/* Quick controls */}
                        <div className="flex items-center gap-1">
                          <button
                            disabled={PROSPECT_STATUSES.indexOf(prospect.status) === 0}
                            onClick={(e) => shiftStatus(e, prospect, 'prev')}
                            className="p-1 rounded bg-slate-900/60 border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900/60 disabled:hover:text-slate-500 transition-all"
                            title="Move back"
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <button
                            disabled={PROSPECT_STATUSES.indexOf(prospect.status) === PROSPECT_STATUSES.length - 1}
                            onClick={(e) => shiftStatus(e, prospect, 'next')}
                            className="p-1 rounded bg-slate-900/60 border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900/60 disabled:hover:text-slate-500 transition-all"
                            title="Move forward"
                          >
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
