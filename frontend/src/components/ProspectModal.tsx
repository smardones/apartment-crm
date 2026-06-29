import React, { useState } from 'react';
import { CreateProspectInput, ProspectStatus, PROSPECT_STATUSES, Unit } from 'shared';
import { X, User, Phone, Mail, Home, FileText, PlusCircle } from 'lucide-react';

interface ProspectModalProps {
  units: Unit[];
  isOpen: boolean;
  onClose: () => void;
  onCreateProspect: (data: CreateProspectInput) => Promise<void>;
}

export const ProspectModal: React.FC<ProspectModalProps> = ({
  units,
  isOpen,
  onClose,
  onCreateProspect
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ProspectStatus>('new');
  const [notes, setNotes] = useState('');
  const [assignedUnitId, setAssignedUnitId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await onCreateProspect({
        name,
        email,
        phone,
        status,
        notes,
        assignedUnitId: assignedUnitId || null
      });
      // Clear form & close
      setName('');
      setEmail('');
      setPhone('');
      setStatus('new');
      setNotes('');
      setAssignedUnitId('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create prospect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUnits = units.filter((u) => u.status === 'available');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <PlusCircle size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-200">Add New Prospect</h2>
              <p className="text-xs text-slate-500">Record a new lead details into the sales pipeline.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {errorMessage && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="john.doe@example.com"
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
                  placeholder="555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Initial Status & Unit Assignment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pipeline Stage */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Pipeline Stage</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProspectStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-500 transition-all text-sm cursor-pointer"
              >
                {PROSPECT_STATUSES.map((statusVal) => (
                  <option key={statusVal} value={statusVal}>
                    {statusVal.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Assign Apartment Unit</label>
              <div className="relative">
                <Home size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={assignedUnitId}
                  onChange={(e) => setAssignedUnitId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-500 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">None (Keep Unassigned)</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.number} (${u.rent.toLocaleString()}/mo)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <FileText size={12} className="text-slate-500" />
              Notes
            </label>
            <textarea
              placeholder="Add details about the lead's references, preferences, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white rounded-xl shadow-lg shadow-brand-500/15 transition-all active:scale-[0.98]"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
