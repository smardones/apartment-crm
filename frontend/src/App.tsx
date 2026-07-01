import { useState, useEffect, useMemo } from 'react';
import { Unit, Prospect, ProspectStatus, CreateProspectInput, CreateUnitInput, Tour, Task, PROSPECT_STATUSES, Agent } from 'shared';
import {
  fetchUnits,
  createUnit,
  deleteUnit,
  fetchProspects,
  createProspect,
  updateProspect,
  deleteProspect,
  fetchTasks,
  updateTask,
  fetchTours,
  fetchAgents
} from './api.js';
import { CalendarView } from './components/CalendarView.js';
import { KanbanBoard } from './components/KanbanBoard.js';
import { TableView } from './components/TableView.js';
import { DetailDrawer } from './components/DetailDrawer.js';
import { UnitManager } from './components/UnitManager.js';
import { ProspectModal } from './components/ProspectModal.js';
import {
  Home,
  Users,
  Grid,
  List,
  Plus,
  TrendingUp,
  FileCheck,
  Building,
  Activity,
  Loader2,
  RefreshCw,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { GlobalSidebar } from './components/GlobalSidebar.js';
import { filterProspects } from './services/filterService.js';
import { Toast } from './components/Toast.js';


const statusLabels: Record<ProspectStatus, string> = {
  new: 'New Lead',
  contacted: 'Contacted',
  tour_scheduled: 'Tour Scheduled',
  toured: 'Toured',
  application: 'Application',
  leased: 'Leased',
  lost: 'Lost'
};


function App() {
  const [activeTab, setActiveTab] = useState<'prospects' | 'units' | 'tours'>('prospects');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [preselectedTourProspect, setPreselectedTourProspect] = useState<Prospect | null>(null);

  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  const filteredProspects = useMemo(() => {
    return filterProspects(prospects, { searchQuery, statusFilter, unitFilter });
  }, [prospects, searchQuery, statusFilter, unitFilter]);


  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProspects, fetchedUnits, fetchedTasks, fetchedTours, fetchedAgents] = await Promise.all([
        fetchProspects(),
        fetchUnits(),
        fetchTasks(),
        fetchTours(),
        fetchAgents()
      ]);
      setProspects(fetchedProspects);
      setUnits(fetchedUnits);
      setTasks(fetchedTasks);
      setTours(fetchedTours);
      setAgents(fetchedAgents);
    } catch (err: any) {
      setError(err.message || 'Failed to load database records');
    } finally {
      setIsLoading(false);
    }
  };

  const reloadTasks = async () => {
    try {
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks);
    } catch (err: any) {
      console.error('Failed to reload tasks:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProspect = async (data: CreateProspectInput) => {
    try {
      const newProspect = await createProspect(data);
      setProspects(prev => [...prev, newProspect]);
      showToast('Prospect created successfully', 'success');
      await reloadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to create prospect', 'error');
    }
  };

  const handleUpdateProspect = async (id: string, data: any) => {
    try {
      const updated = await updateProspect(id, data);
      setProspects(prev => prev.map(p => p.id === id ? updated : p));

      // Update selected prospect in case the drawer is still open
      if (selectedProspect && selectedProspect.id === id) {
        setSelectedProspect(updated);
      }
      showToast('Prospect updated successfully', 'success');
      await reloadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to update prospect', 'error');
    }
  };

  const handleDeleteProspect = async (id: string) => {
    try {
      await deleteProspect(id);
      setProspects(prev => prev.filter(p => p.id !== id));
      if (selectedProspect && selectedProspect.id === id) {
        setSelectedProspect(null);
        setIsDrawerOpen(false);
      }
      showToast('Prospect deleted', 'success');
      await reloadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete prospect', 'error');
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: ProspectStatus) => {
    try {
      const updated = await updateProspect(id, { status: newStatus });
      setProspects(prev => prev.map(p => p.id === id ? updated : p));
      await reloadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleUpdateTask = async (id: string, isCompleted: boolean, agentId?: string | null) => {
    try {
      const updated = await updateTask(id, { isCompleted, agentId });
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      await reloadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleCreateUnit = async (data: CreateUnitInput) => {
    try {
      const newUnit = await createUnit(data);
      setUnits(prev => [...prev, newUnit]);
      showToast('Unit created successfully', 'success');
      await reloadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to create apartment unit', 'error');
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (confirm('Are you sure you want to delete this unit? This will unassign any connected prospects.')) {
      try {
        await deleteUnit(id);
        setUnits(prev => prev.filter(u => u.id !== id));
        showToast('Unit deleted', 'success');
        await reloadTasks();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete unit', 'error');
      }
    }
  };

  const handleSelectProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsDrawerOpen(true);
  };

  // Compute metrics
  const totalLeads = prospects.length;
  const applicationCount = prospects.filter((p) => p.status === 'application').length;
  const leasedCount = prospects.filter((p) => p.status === 'leased').length;

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === 'leased').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Top Premium Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-900/35 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20 active-glow">
              <Building size={18} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-slate-100 uppercase">
                Loki Living
              </span>
              <span className="text-[10px] block font-semibold text-brand-400 uppercase tracking-widest leading-none">
                Leasing CRM
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setActiveTab('prospects')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'prospects'
                  ? 'bg-slate-900 text-brand-400 border border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Users size={14} />
              Prospect Pipeline
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'units'
                  ? 'bg-slate-900 text-brand-400 border border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Home size={14} />
              Units Directory
            </button>
            <button
              onClick={() => setActiveTab('tours')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === 'tours'
                  ? 'bg-slate-900 text-brand-400 border border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Calendar size={14} />
              Tour Calendar
            </button>
          </nav>

          {/* Refresh Button */}
          {/* <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Sync Database"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button> */}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Global Sidebar for Tasks */}
        <GlobalSidebar tasks={tasks} onUpdateTask={handleUpdateTask} onSelectProspect={(id) => {
          const p = prospects.find(p => p.id === id);
          if (p) handleSelectProspect(p);
        }} />

        {/* Main content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 overflow-y-auto">
          {/* KPI Dashboard Metrics Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Total Leads
                </span>
                <span className="text-xl font-bold text-slate-100">{totalLeads}</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <FileCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Applications
                </span>
                <span className="text-xl font-bold text-slate-100">{applicationCount}</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Leases Signed
                </span>
                <span className="text-xl font-bold text-slate-100">{leasedCount}</span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Building size={20} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Occupancy Rate
                </span>
                <span className="text-xl font-bold text-slate-100">{occupancyRate}%</span>
              </div>
            </div>
          </section>

          {/* Dynamic Panels */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24">
              <Loader2 className="animate-spin text-brand-500 mb-3" size={32} />
              <p className="text-sm text-slate-400 font-medium">Fetching apartment files...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl py-12">
              <Activity className="text-rose-500 mb-3" size={32} />
              <h3 className="font-bold text-slate-200">Database connection failed</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
              >
                Attempt Reconnect
              </button>
            </div>
          ) : activeTab === 'prospects' ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* Prospects Dashboard Header Toolbar */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Prospect Directory</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track and move prospective tenants through the leasing steps.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Switcher (Kanban vs Table) */}
                  <div className="flex items-center bg-slate-950 border border-slate-850 rounded-xl p-0.5">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-slate-900 text-brand-400' : 'text-slate-500'
                        }`}
                      title="Pipeline Board"
                    >
                      <Grid size={14} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-slate-900 text-brand-400' : 'text-slate-500'
                        }`}
                      title="Spreadsheet List"
                    >
                      <List size={14} />
                    </button>
                  </div>

                  {/* Add Prospect Action */}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-lg shadow-brand-500/10 active:scale-[0.98] transition-all"
                  >
                    <Plus size={14} />
                    Add Prospect
                  </button>
                </div>
              </div>

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
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className="pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-500 transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option value="all">All Units</option>
                      <option value="unassigned">Unassigned</option>
                      {units
                        .map((u) => u.number)
                        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                        .map((num) => (
                          <option key={num} value={num}>
                            Unit {num}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Render Kanban or Table */}
              <div className="flex-1 min-h-0">
                {viewMode === 'kanban' ? (
                  <KanbanBoard
                    prospects={filteredProspects}
                    onSelectProspect={handleSelectProspect}
                    onUpdateStatus={handleQuickStatusChange}
                  />
                ) : (
                  <TableView prospects={filteredProspects} onSelectProspect={handleSelectProspect} />
                )}
              </div>
            </div>
          ) : activeTab === 'units' ? (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Property Unit Directory</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage residential physical assets, availability status, and lease relationships.
                </p>
              </div>

              {/* Render Unit Manager */}
              <UnitManager
                units={units}
                onCreateUnit={handleCreateUnit}
                onDeleteUnit={handleDeleteUnit}
              />
            </div>
          ) : (
            <CalendarView
              tours={tours}
              prospects={prospects}
              units={units}
              onRefresh={loadData}
              preselectedProspect={preselectedTourProspect}
              onClearPreselectedProspect={() => setPreselectedTourProspect(null)}
            />
          )}
        </main>

        {/* sliding drawer panel for details */}
        <DetailDrawer
          prospect={selectedProspect}
          units={units}
          agents={agents}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedProspect(null);
          }}
          onUpdate={handleUpdateProspect}
          onDelete={handleDeleteProspect}
          onUpdateTask={handleUpdateTask}
          onScheduleTour={(prospect) => {
            setPreselectedTourProspect(prospect);
            setActiveTab('tours');
            setIsDrawerOpen(false);
          }}
        />

        {/* modal window for creating prospect */}
        <ProspectModal
          units={units}
          agents={agents}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProspect={handleCreateProspect}
        />

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
