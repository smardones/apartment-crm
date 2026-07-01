import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Unit, CreateUnitInput, UNIT_STATUSES, CreateUnitSchema } from 'shared';
import { Home, BedDouble, Bath, DollarSign, Plus, Trash2, Users } from 'lucide-react';

interface UnitManagerProps {
  units: Unit[];
  onCreateUnit: (data: CreateUnitInput) => Promise<void>;
  onDeleteUnit: (id: string) => Promise<void>;
}

const statusBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
  available: { label: 'Available', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  held: { label: 'Held / Reserved', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  leased: { label: 'Leased', bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20' }
};

export const UnitManager: React.FC<UnitManagerProps> = ({
  units,
  onCreateUnit,
  onDeleteUnit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateUnitInput>({
    resolver: zodResolver(CreateUnitSchema) as any,
    defaultValues: {
      number: '',
      rent: 1200,
      bedrooms: 1,
      bathrooms: 1,
      status: 'available'
    }
  });

  const onSubmit = async (data: CreateUnitInput) => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await onCreateUnit(data);
      reset();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Add Unit Sidebar Panel */}
      <div className="lg:col-span-1 glass-panel border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 self-start">
        <div>
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">
            Create Apartment Unit
          </h3>
          <p className="text-xs text-slate-500 mt-1">Add a new residence to the complex directory.</p>
        </div>

        {errorMessage && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {/* Unit Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Unit Number</label>
            <div className="relative">
              <Home size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. 101, 204B"
                {...register('number')}
                className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border ${errors.number ? 'border-rose-500' : 'border-slate-800'} text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all text-sm`}
              />
            </div>
            {errors.number && <span className="text-xs text-rose-500 font-medium">{errors.number.message}</span>}
          </div>

          {/* Monthly Rent */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Monthly Rent ($)</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                min={1}
                {...register('rent', { valueAsNumber: true })}
                className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border ${errors.rent ? 'border-rose-500' : 'border-slate-800'} text-slate-200 focus:outline-none focus:border-brand-500 transition-all text-sm`}
              />
            </div>
            {errors.rent && <span className="text-xs text-rose-500 font-medium">{errors.rent.message}</span>}
          </div>

          {/* Bedrooms / Bathrooms */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Bedrooms</label>
              <div className="relative">
                <BedDouble size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  min={0}
                  {...register('bedrooms', { valueAsNumber: true })}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border ${errors.bedrooms ? 'border-rose-500' : 'border-slate-800'} text-slate-200 focus:outline-none focus:border-brand-500 transition-all text-sm`}
                  title="0 for Studio"
                />
              </div>
              {errors.bedrooms && <span className="text-xs text-rose-500 font-medium">{errors.bedrooms.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Bathrooms</label>
              <div className="relative">
                <Bath size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  {...register('bathrooms', { valueAsNumber: true })}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border ${errors.bathrooms ? 'border-rose-500' : 'border-slate-800'} text-slate-200 focus:outline-none focus:border-brand-500 transition-all text-sm`}
                />
              </div>
              {errors.bathrooms && <span className="text-xs text-rose-500 font-medium">{errors.bathrooms.message}</span>}
            </div>
          </div>

          {/* Initial Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Availability Status</label>
            <select
              {...register('status')}
              className={`w-full px-3 py-2 rounded-xl bg-slate-950 border ${errors.status ? 'border-rose-500' : 'border-slate-800'} text-slate-300 focus:outline-none focus:border-brand-500 transition-all text-sm cursor-pointer`}
            >
              {UNIT_STATUSES.map((statusVal) => (
                <option key={statusVal} value={statusVal}>
                  {statusVal.toUpperCase()}
                </option>
              ))}
            </select>
            {errors.status && <span className="text-xs text-rose-500 font-medium">{errors.status.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold shadow-lg shadow-brand-500/15 transition-all text-xs mt-2"
          >
            <Plus size={14} />
            Add Apartment Unit
          </button>
        </form>
      </div>

      {/* Grid of Unit Cards */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
        {units.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-2xl">
            <Home size={32} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No units in database. Create one using the sidebar form.</p>
          </div>
        ) : (
          units.map((unit) => {
            const badge = statusBadges[unit.status] || { label: unit.status, bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-800' };
            const unitProspects = (unit as any).prospects || [];

            return (
              <div
                key={unit.id}
                className="glass-panel border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700/50 transition-colors"
              >
                <div>
                  {/* Top: Header & Number */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-100">Unit {unit.number}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} Bed`} / {unit.bathrooms} Bath
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Rent Info */}
                  <div className="flex items-baseline text-slate-300 gap-0.5 mb-4 bg-slate-950/30 rounded-xl px-3 py-2 border border-slate-850">
                    <span className="text-xs text-slate-500 font-medium">$</span>
                    <span className="text-lg font-semibold tracking-tight text-brand-300">
                      {unit.rent.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">/ month</span>
                  </div>

                  {/* Associated Prospects */}
                  <div className="flex flex-col gap-1.5 mb-4">
                    <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                      <Users size={10} />
                      Connected Leads ({unitProspects.length})
                    </span>
                    {unitProspects.length === 0 ? (
                      <span className="text-xs text-slate-600 italic pl-1">No active leads</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {unitProspects.map((p: any) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs py-1 px-2 bg-slate-900/60 border border-slate-850 rounded-lg"
                          >
                            <span className="text-slate-300 font-medium truncate max-w-[120px]">{p.name}</span>
                            <span className="text-[9px] font-semibold text-slate-500 px-1 rounded bg-slate-950 uppercase border border-slate-900">
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 flex justify-end">
                  <button
                    onClick={() => onDeleteUnit(unit.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Unit"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
