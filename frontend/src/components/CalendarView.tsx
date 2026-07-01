import { useState, useEffect } from 'react';
import { Unit, Prospect, Tour } from 'shared';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Building,
  AlertTriangle,
  X,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { createTour, updateTour, recordTourOutcome } from '../api.js';

interface CalendarViewProps {
  tours: Tour[];
  prospects: Prospect[];
  units: Unit[];
  onRefresh: () => Promise<void>;
  preselectedProspect?: Prospect | null;
  onClearPreselectedProspect?: () => void;
}

const standardTimeSlots = (() => {
  const slots = [];
  for (let h = 8; h <= 20; h++) {
    const hh = String(h).padStart(2, '0');
    slots.push(`${hh}:00`);
    if (h < 20) {
      slots.push(`${hh}:30`);
    }
  }
  return slots;
})();

export function CalendarView({
  tours,
  prospects,
  units,
  onRefresh,
  preselectedProspect,
  onClearPreselectedProspect
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);

  // Form states for new/edit tour
  const [prospectId, setProspectId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outcome selection state
  const [selectedOutcome, setSelectedOutcome] = useState('');

  // Handle preselected prospect from prospect details view
  useEffect(() => {
    if (preselectedProspect) {
      setProspectId(preselectedProspect.id);
      if (preselectedProspect.assignedUnitId) {
        setUnitId(preselectedProspect.assignedUnitId);
      }
      const today = new Date().toISOString().split('T')[0];
      setScheduledDate(today);
      setIsModalOpen(true);
    }
  }, [preselectedProspect]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Create calendar grids
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  // Filter available units (available status, or currently assigned to editing tour)
  const availableUnits = units.filter(
    (u) => u.status === 'available' || (selectedTour && u.id === selectedTour.unitId)
  );

  // Active prospects (not lost or leased)
  const activeProspects = prospects.filter(
    (p) => p.status !== 'lost' && p.status !== 'leased'
  );

  const openScheduleModal = (date?: Date) => {
    setErrorMsg(null);
    setProspectId('');
    setUnitId('');
    if (date) {
      const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setScheduledDate(offsetDate.toISOString().split('T')[0]);
    } else {
      setScheduledDate(new Date().toISOString().split('T')[0]);
    }
    setScheduledTime('10:00');
    setSelectedTour(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tour: Tour) => {
    setErrorMsg(null);
    setSelectedTour(tour);
    setProspectId(tour.prospectId);
    setUnitId(tour.unitId || '');
    const tourDate = new Date(tour.scheduledTime);
    const offsetDate = new Date(tourDate.getTime() - tourDate.getTimezoneOffset() * 60000);
    setScheduledDate(offsetDate.toISOString().split('T')[0]);

    const hrs = String(tourDate.getHours()).padStart(2, '0');
    const mins = String(tourDate.getMinutes()).padStart(2, '0');
    setScheduledTime(`${hrs}:${mins}`);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTour(null);
    if (onClearPreselectedProspect) {
      onClearPreselectedProspect();
    }
  };

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectId || !scheduledDate || !scheduledTime) {
      setErrorMsg('Prospect, Date, and Time are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Combine date and time to ISO string
    const dateStr = `${scheduledDate}T${scheduledTime}:00`;
    const localDate = new Date(dateStr);
    if (isNaN(localDate.getTime())) {
      setErrorMsg('Invalid date/time format.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      prospectId,
      unitId: unitId || null,
      scheduledTime: localDate.toISOString(),
      status: 'scheduled' as const
    };

    try {
      if (selectedTour) {
        await updateTour(selectedTour.id, payload);
      } else {
        if (!unitId) {
          setErrorMsg('A unit is required to schedule a new tour.');
          setIsSubmitting(false);
          return;
        }
        await createTour({
          prospectId,
          unitId,
          scheduledTime: localDate.toISOString(),
          status: 'scheduled'
        });
      }
      await onRefresh();
      handleModalClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving the tour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTour = async () => {
    if (!selectedTour) return;
    if (confirm('Are you sure you want to cancel this tour?')) {
      try {
        await updateTour(selectedTour.id, { status: 'canceled' });
        await onRefresh();
        handleModalClose();
      } catch (err: any) {
        alert(err.message || 'Failed to cancel tour');
      }
    }
  };

  const openOutcomeModal = (tour: Tour) => {
    setSelectedTour(tour);
    setSelectedOutcome('completed_follow_up'); // Default
    setIsOutcomeModalOpen(true);
  };

  const handleSaveOutcome = async () => {
    if (!selectedTour || !selectedOutcome) return;
    try {
      await recordTourOutcome(selectedTour.id, selectedOutcome);
      await onRefresh();
      setIsOutcomeModalOpen(false);
      setSelectedTour(null);
    } catch (err: any) {
      alert(err.message || 'Failed to record outcome');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Tour Calendar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tours are scheduled as fixed 1-hour slots. Overlapping bookings for units or prospects are blocked.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-200 min-w-[100px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => openScheduleModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-all"
          >
            <Plus size={14} />
            Book Tour
          </button>
        </div>
      </div>

      {/* Grid Header Days */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 tracking-wider uppercase border-b border-slate-900 pb-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[500px]">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return (
              <div
                key={`empty-${idx}`}
                className="bg-slate-900/10 border border-transparent rounded-2xl min-h-[90px]"
              />
            );
          }

          const dateStr = date.toDateString();
          const dayTours = tours.filter((t) => {
            const tourDateObj = new Date(t.scheduledTime);
            return tourDateObj.toDateString() === dateStr && t.status !== 'canceled';
          });

          const isToday = new Date().toDateString() === dateStr;

          return (
            <div
              key={`day-${idx}`}
              className={`bg-slate-900/40 border rounded-2xl p-2 min-h-[95px] flex flex-col gap-1.5 group hover:bg-slate-900/70 hover:border-slate-800 transition-all ${isToday ? 'border-brand-500 bg-brand-500/5' : 'border-slate-900'
                }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isToday ? 'bg-brand-500 text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                >
                  {date.getDate()}
                </span>
                <button
                  onClick={() => openScheduleModal(date)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-850 text-slate-500 hover:text-slate-300 transition-all"
                  title="Schedule tour on this day"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Day Tours */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[120px] scrollbar-thin">
                {dayTours.map((tour) => {
                  const tourDate = new Date(tour.scheduledTime);
                  const isPast = tourDate < new Date();
                  const isCanceled = tour.status === 'canceled';
                  const isCompleted = tour.status === 'completed' || tour.status === 'no_show';
                  const isUnassigned = !tour.unitId;

                  let statusClass = 'bg-slate-800/80 text-slate-300 border-slate-750';
                  if (isCanceled) {
                    statusClass = 'bg-slate-950/60 text-slate-500 border-slate-900 line-through';
                  } else if (isUnassigned) {
                    statusClass = 'bg-rose-500/10 text-rose-300 border-rose-500/40';
                  } else if (isCompleted) {
                    statusClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
                  } else if (isPast) {
                    statusClass = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                  }

                  const timeStr = tourDate.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={tour.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(tour);
                      }}
                      className={`text-[10px] font-medium border px-1.5 py-1 rounded-lg cursor-pointer transition-all hover:scale-[1.02] flex flex-col gap-0.5 ${statusClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate">{timeStr}</span>
                        {isUnassigned && !isCanceled && (
                          <span className="text-[8px] px-1 bg-rose-500 text-white rounded font-extrabold animate-pulse">
                            UNIT REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="truncate font-semibold text-slate-100 flex items-center gap-0.5">
                        <User size={8} />
                        {tour.prospect?.name || 'Prospect'}
                      </div>
                      <div className="truncate flex items-center gap-0.5 opacity-80">
                        <Building size={8} />
                        {tour.unit?.number ? `Unit ${tour.unit.number}` : 'Unassigned'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking / Reschedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100">
                {selectedTour ? 'Manage Tour Details' : 'Book Prospect Tour'}
              </h3>
              <button
                onClick={handleModalClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTour} className="p-5 flex flex-col gap-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Prospect Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select Prospect
                </label>
                {selectedTour ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    <span>{selectedTour.prospect?.name} ({selectedTour.prospect?.email})</span>
                  </div>
                ) : (
                  <select
                    value={prospectId}
                    onChange={(e) => {
                      setProspectId(e.target.value);
                      const selected = prospects.find((p) => p.id === e.target.value);
                      if (selected?.assignedUnitId) {
                        setUnitId(selected.assignedUnitId);
                      }
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="">-- Choose a Prospect --</option>
                    {activeProspects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Status: {p.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Unit Selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Assign Apartment Unit
                  </label>
                  {!selectedTour && (
                    <span className="text-[10px] text-slate-500 font-medium">Available units only</span>
                  )}
                </div>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="">
                    {selectedTour && !selectedTour.unitId ? '-- Needs Reassignment --' : '-- Choose a Unit --'}
                  </option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.number} ({u.bedrooms} Bed / {u.bathrooms} Bath, Status: {u.status})
                    </option>
                  ))}
                </select>
                {selectedTour && !selectedTour.unitId && (
                  <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-1">
                    <AlertTriangle size={10} />
                    <span>This tour was unassigned because the original unit was held/leased.</span>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Time (Start)
                  </label>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    {(() => {
                      const slots = [...standardTimeSlots];
                      if (scheduledTime && !slots.includes(scheduledTime)) {
                        slots.push(scheduledTime);
                        slots.sort();
                      }
                      return slots.map((time) => {
                        const [hourStr, minStr] = time.split(':');
                        const hourNum = parseInt(hourStr);
                        const ampm = hourNum >= 12 ? 'PM' : 'AM';
                        const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
                        const displayTime = `${displayHour}:${minStr} ${ampm}`;
                        return (
                          <option key={time} value={time}>
                            {displayTime}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
              </div>

              {/* Display outcome if logged */}
              {selectedTour && selectedTour.outcome && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300">Outcome Logged: </span>
                    <span className="text-slate-300 font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 bg-emerald-950/60 rounded border border-emerald-500/30 ml-1">
                      {selectedTour.outcome.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || (selectedTour?.status === 'canceled')}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/40 text-white font-semibold text-xs shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-all"
                  >
                    {isSubmitting ? 'Saving...' : selectedTour ? 'Reschedule / Update' : 'Schedule Tour'}
                  </button>

                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {selectedTour && selectedTour.status === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        openOutcomeModal(selectedTour);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/40 text-emerald-400 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 size={12} />
                      Log Tour Outcome
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelTour}
                      className="px-3 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-600/30 text-rose-400 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} />
                      Cancel Tour
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outcome Logging Modal */}
      {isOutcomeModalOpen && selectedTour && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100">Log Tour Outcome</h3>
              <button
                onClick={() => {
                  setIsOutcomeModalOpen(false);
                  setSelectedTour(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-slate-400 font-medium">
                Log the outcome for <strong className="text-slate-200">{selectedTour.prospect?.name}</strong>'s tour of <strong className="text-slate-200">{selectedTour.unit ? `Unit ${selectedTour.unit.number}` : 'unassigned unit'}</strong>. This will automatically update their pipeline status and trigger automation tasks.
              </p>

              <div className="flex flex-col gap-2">
                {[
                  { value: 'completed_follow_up', label: 'Completed - Follow Up', desc: 'Move prospect to "Toured" status' },
                  { value: 'completed_next_steps', label: 'Completed - Next Steps', desc: 'Move prospect to "Application" status & hold unit' },
                  { value: 'completed_not_interested', label: 'Completed - Not Interested', desc: 'Move prospect to "Lost" status' },
                  { value: 'no_show', label: 'No Show', desc: 'Move prospect to "Lost" status' }
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedOutcome === opt.value
                      ? 'bg-brand-500/10 border-brand-500/50 shadow-sm'
                      : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                      }`}
                  >
                    <input
                      type="radio"
                      name="tourOutcome"
                      value={opt.value}
                      checked={selectedOutcome === opt.value}
                      onChange={() => setSelectedOutcome(opt.value)}
                      className="mt-1 accent-brand-500"
                    />
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${selectedOutcome === opt.value ? 'text-brand-400' : 'text-slate-200'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {opt.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={handleSaveOutcome}
                  className="flex-1 flex justify-center items-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/10 active:scale-[0.98] transition-all"
                >
                  Save Outcome
                </button>
                <button
                  onClick={() => {
                    setIsOutcomeModalOpen(false);
                    setSelectedTour(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
