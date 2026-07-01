import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Prospect, ProspectStatus, StatusHistory, Unit, Tour, UpdateProspectInput, UpdateProspectSchema } from 'shared';
import { X, User, Phone, Mail, Home, Trash2, Save, FileText, CheckCircle2, Plus, Clock, Building } from 'lucide-react';

interface DetailDrawerProps {
  prospect: Prospect | null;
  units: Unit[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updatedData: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateTask: (id: string, isCompleted: boolean) => Promise<void>;
  onScheduleTour?: (prospect: Prospect) => void;
}

const statusSteps: { value: ProspectStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'tour_scheduled', label: 'Tour' },
  { value: 'toured', label: 'Toured' },
  { value: 'application', label: 'App' },
  { value: 'leased', label: 'Leased' },
  { value: 'lost', label: 'Lost' }
];

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  prospect,
  units,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onUpdateTask,
  onScheduleTour
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'history' | 'tours'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UpdateProspectInput>({
    resolver: zodResolver(UpdateProspectSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'new',
      notes: '',
      assignedUnitId: ''
    }
  });

  const currentStatus = watch('status');

  // Sync form states with prospect prop
  useEffect(() => {
    if (prospect) {
      reset({
        name: prospect.name,
        email: prospect.email,
        phone: prospect.phone,
        status: prospect.status,
        notes: prospect.notes || '',
        assignedUnitId: prospect.assignedUnitId || ''
      });
      setShowDeleteConfirm(false);
    }
  }, [prospect, reset]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('info');
    }
  }, [isOpen]);

  if (!isOpen || !prospect) return null;

  const handleSave = async (data: UpdateProspectInput) => {
    setIsSaving(true);
    try {
      await onUpdate(prospect.id, {
        ...data,
        assignedUnitId: data.assignedUnitId || null
      });
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update prospect');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(prospect.id);
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to delete prospect');
      setIsDeleting(false);
    }
  };

  // Filter units so user can choose available, held units, or the currently assigned unit
  const eligibleUnits = units.filter(
    (u) => u.status === 'available' || u.status === 'held' || u.id === prospect.assignedUnitId
  );

  const activeIndex = statusSteps.findIndex((step) => step.value === currentStatus);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 z-50 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-200">Prospect Profile</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(handleSave)} noValidate className="flex-1 flex flex-col overflow-y-auto p-6 gap-6 min-h-0">
          {/* Stepper Pipeline Progress */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Prospect Status
            </h3>

            <div className="relative flex items-center justify-between">
              {/* Stepper track background */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />
              {/* Stepper track filled */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-500 z-0 transition-all duration-300"
                style={{
                  width: `${(Math.max(0, activeIndex) / (statusSteps.length - 1)) * 100}%`
                }}
              />

              {statusSteps.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;
                const isLost = step.value === 'lost';

                let stepColor = 'bg-slate-800 text-slate-500 border-slate-800';
                if (isActive) {
                  stepColor = isLost
                    ? 'bg-rose-500 text-white border-rose-400 ring-4 ring-rose-500/25'
                    : 'bg-brand-500 text-white border-brand-400 ring-4 ring-brand-500/25';
                } else if (isCompleted) {
                  stepColor = 'bg-brand-500/20 text-brand-400 border-brand-500/40';
                }

                return (
                  <button
                    key={step.value}
                    type="button"
                    onClick={() => setValue('status', step.value, { shouldValidate: true })}
                    className="relative flex flex-col items-center gap-1.5 z-10 group"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${stepColor}`}
                    >
                      {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-semibold tracking-tight transition-colors ${isActive ? 'text-slate-200' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                        }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.status && <span className="text-xs text-rose-500 font-medium block mt-2 text-center">{errors.status.message}</span>}
          </div>

          <div className="flex items-center gap-4 border-b border-slate-800 pb-2 mb-2">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'tasks' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Tasks
              {prospect.tasks && prospect.tasks.filter(t => !t.isCompleted).length > 0 && (
                <span className="bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{prospect.tasks.filter(t => !t.isCompleted).length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tours')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'tours' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Tours
              {prospect.tours && prospect.tours.filter(t => t.status === 'scheduled').length > 0 && (
                <span className="bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{prospect.tours.filter(t => t.status === 'scheduled').length}</span>
              )}
            </button>
          </div>

          {activeTab === 'info' && (
            <>
              {/* Contact Fields Section */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Prospect Details
                </h3>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border ${errors.name ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm`}
                    />
                  </div>
                  {errors.name && <span className="text-xs text-rose-500 font-medium">{errors.name.message}</span>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border ${errors.email ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm`}
                    />
                  </div>
                  {errors.email && <span className="text-xs text-rose-500 font-medium">{errors.email.message}</span>}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Phone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      {...register('phone')}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border ${errors.phone ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm`}
                    />
                  </div>
                  {errors.phone && <span className="text-xs text-rose-500 font-medium">{errors.phone.message}</span>}
                </div>
              </div>

              {/* Unit Assignment */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-medium">Assigned Apartment Unit</label>
                  {prospect.assignedUnit && (
                    <span className="text-[10px] text-slate-500">
                      Rent: ${prospect.assignedUnit.rent}/mo
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Home size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    {...register('assignedUnitId')}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-500 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Unassigned / No Unit Chosen</option>
                    {eligibleUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unit {u.number} ({u.bedrooms} Bed / {u.bathrooms} Bath) — {u.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5 flex-1 min-h-[120px]">
                <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-500" />
                  Leasing Notes
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Record inquiry details, tour reactions, screening progress or follow-up timelines..."
                  className="w-full flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm resize-none"
                />
              </div>
            </>)}

          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
              {!prospect.tasks || prospect.tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No tasks for this prospect.</div>
              ) : (
                prospect.tasks.map((task: any) => (
                  <div key={task.id} className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${task.isCompleted ? 'bg-slate-950/50 border-slate-800/50 opacity-50' : 'bg-slate-950 border-slate-800'}`}>
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={(e) => onUpdateTask(task.id, e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                      <div className="text-xs font-medium text-slate-500 mt-2">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
              <div className="relative border-l border-slate-800 ml-3 pl-4 space-y-6">
                {!prospect.statusHistory || prospect.statusHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm -ml-7">No history recorded.</div>
                ) : (
                  prospect.statusHistory.map((hist: StatusHistory, i: number) => (
                    <div key={hist.id + i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-slate-900" />
                      <p className="text-sm font-semibold text-slate-200">
                        Status changed to <span className="uppercase text-brand-400">{hist.status}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(hist.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'tours' && (
            <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Scheduled Tours
                </h3>
                <button
                  type="button"
                  onClick={() => onScheduleTour && onScheduleTour(prospect)}
                  className="px-3 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 text-brand-400 font-semibold text-[11px] transition-all flex items-center gap-1"
                >
                  <Plus size={10} />
                  Book Tour
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {!prospect.tours || prospect.tours.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No tours scheduled for this prospect.</div>
                ) : (
                  prospect.tours.map((tour: Tour) => {
                    const tourDate = new Date(tour.scheduledTime);
                    const isCanceled = tour.status === 'canceled';
                    const isCompleted = tour.status === 'completed' || tour.status === 'no_show';

                    let badgeColor = 'bg-slate-950 text-slate-400 border-slate-800';
                    if (isCanceled) {
                      badgeColor = 'bg-rose-950/20 text-rose-400 border-rose-500/20 line-through';
                    } else if (isCompleted) {
                      badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20';
                    } else if (tourDate < new Date()) {
                      badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-500/20';
                    } else {
                      badgeColor = 'bg-brand-500/10 text-brand-400 border-brand-500/20';
                    }

                    return (
                      <div key={tour.id} className="p-3.5 rounded-xl border flex flex-col gap-2 bg-slate-950 border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${badgeColor}`}>
                            {tour.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                            <Clock size={12} />
                            {tourDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                          <Building size={14} className="text-slate-500" />
                          <span>Unit: {tour.unit ? `Unit ${tour.unit.number}` : <span className="text-rose-400 font-bold">Unassigned (Required)</span>}</span>
                        </div>

                        {tour.outcome && (
                          <div className="mt-1 text-[11px] text-slate-400 font-medium p-2 bg-slate-900 border border-slate-850 rounded-lg flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span>Outcome: <strong className="text-slate-200 capitalize">{tour.outcome.replace(/_/g, ' ')}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between gap-4">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl w-full justify-between">
              <span className="text-xs text-rose-400 font-semibold pl-2">Delete prospect profile?</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-2.5 py-1 text-xs bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg transition-colors font-semibold"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/10 font-semibold"
              >
                <Trash2 size={14} />
                Delete Prospect
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                {/* We trigger a remote form submit for the form using its handleSubmit wrapper via react-hook-form */}
                <button
                  type="button"
                  onClick={handleSubmit(handleSave)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white rounded-xl shadow-lg shadow-brand-500/15 transition-all active:scale-[0.98]"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
