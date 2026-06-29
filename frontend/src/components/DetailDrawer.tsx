import React, { useState, useEffect } from 'react';
import { Prospect, ProspectStatus, Unit } from 'shared';
import { X, User, Phone, Mail, Home, Trash2, Save, FileText, CheckCircle2 } from 'lucide-react';

interface DetailDrawerProps {
  prospect: Prospect | null;
  units: Unit[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updatedData: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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
  onDelete
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ProspectStatus>('new');
  const [notes, setNotes] = useState('');
  const [assignedUnitId, setAssignedUnitId] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync form states with prospect prop
  useEffect(() => {
    if (prospect) {
      setName(prospect.name);
      setEmail(prospect.email);
      setPhone(prospect.phone);
      setStatus(prospect.status);
      setNotes(prospect.notes || '');
      setAssignedUnitId(prospect.assignedUnitId || '');
      setShowDeleteConfirm(false);
    }
  }, [prospect]);

  if (!isOpen || !prospect) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate(prospect.id, {
        name,
        email,
        phone,
        status,
        notes,
        assignedUnitId: assignedUnitId || null
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

  const activeIndex = statusSteps.findIndex((step) => step.value === status);

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
              <p className="text-xs text-slate-500">ID: {prospect.id.slice(-8).toUpperCase()}</p>
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
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-y-auto p-6 gap-6 min-h-0">
          {/* Stepper Pipeline Progress */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Pipeline Stage Progress
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
                    onClick={() => setStatus(step.value)}
                    className="relative flex flex-col items-center gap-1.5 z-10 group"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${stepColor}`}
                    >
                      {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-semibold tracking-tight transition-colors ${
                        isActive ? 'text-slate-200' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm"
                />
              </div>
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
                value={assignedUnitId}
                onChange={(e) => setAssignedUnitId(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record inquiry details, tour reactions, screening progress or follow-up timelines..."
              className="w-full flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm resize-none"
            />
          </div>
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
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white rounded-xl shadow-lg shadow-brand-500/15 transition-all active:scale-[0.98]"
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
