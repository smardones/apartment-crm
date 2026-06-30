import { Task } from 'shared';
import { CheckCircle2, Circle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface GlobalSidebarProps {
  tasks: Task[];
  onUpdateTask: (id: string, isCompleted: boolean) => void;
  onSelectProspect: (prospectId: string) => void;
}

export function GlobalSidebar({ tasks, onUpdateTask, onSelectProspect }: GlobalSidebarProps) {
  // Sort tasks by due date
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

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
            const isOverdue = new Date(task.dueDate) < new Date() && !task.isCompleted;
            return (
              <div
                key={task.id}
                className="group relative bg-slate-950 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onUpdateTask(task.id, true)}
                    className="mt-0.5 text-slate-500 hover:text-brand-400 transition-colors"
                  >
                    <Circle size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 leading-tight">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
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
