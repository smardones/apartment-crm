import { Task } from 'shared';
import { CheckCircle2, Circle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface GlobalSidebarProps {
  tasks: Task[];
  onUpdateTask: (id: string, isCompleted: boolean) => void;
  onSelectProspect: (prospectId: string) => void;
}

export function GlobalSidebar({ tasks, onUpdateTask, onSelectProspect }: GlobalSidebarProps) {
  // Sort tasks: Urgent tasks first, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const aUrgent = a.title === 'Urgent: Reassign Unit for Tour';
    const bUrgent = b.title === 'Urgent: Reassign Unit for Tour';
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Filter for open tasks
  const openTasks = sortedTasks.filter((t) => !t.isCompleted);

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-brand-400" />
          Open Tasks
        </h3>
        <span className="text-xs font-semibold bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
          {openTasks.length} open
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {openTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm font-medium">No open tasks</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          openTasks.map((task) => {
            const isUrgent = task.title === 'Urgent: Reassign Unit for Tour';
            const isOverdue = new Date(task.dueDate) < new Date() && !task.isCompleted;
            return (
              <div
                key={task.id}
                className={`group relative rounded-xl p-3 border transition-all shadow-sm ${
                  isUrgent
                    ? 'bg-rose-500/10 border-rose-500/40 hover:border-rose-500/80 shadow-rose-950/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onUpdateTask(task.id, true)}
                    className={`mt-0.5 transition-colors ${
                      isUrgent ? 'text-rose-400 hover:text-rose-300' : 'text-slate-500 hover:text-brand-400'
                    }`}
                  >
                    <Circle size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight flex items-center gap-1.5 ${isUrgent ? 'text-rose-200' : 'text-slate-200'}`}>
                      {isUrgent && <span className="inline-block text-rose-500 animate-pulse">⚠️</span>}
                      {task.title}
                    </p>
                    {task.description && (
                      <p className={`text-xs mt-1 line-clamp-2 ${isUrgent ? 'text-rose-300/70' : 'text-slate-500'}`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
                        <Clock size={12} />
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </div>
                      {/* Navigate to prospect */}
                      {(task as any).prospect && (
                        <button
                          onClick={() => onSelectProspect(task.prospectId)}
                          className="text-xs text-brand-400 hover:text-brand-300 font-semibold truncate ml-2"
                        >
                          {(task as any).prospect.name}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
