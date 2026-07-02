import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Unit, Prospect, ProspectStatus, CreateProspectInput, CreateUnitInput, Tour, Task, Agent } from 'shared';
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
  fetchAgents,
  createTour,
  updateTour,
  recordTourOutcome
} from '../api.js';
import { filterProspects } from '../services/filterService.js';

interface AppContextType {
  activeTab: 'prospects' | 'units' | 'tours';
  setActiveTab: (tab: 'prospects' | 'units' | 'tours') => void;
  viewMode: 'kanban' | 'table';
  setViewMode: (mode: 'kanban' | 'table') => void;

  prospects: Prospect[];
  units: Unit[];
  tasks: Task[];
  tours: Tour[];
  agents: Agent[];
  selectedProspect: Prospect | null;
  setSelectedProspect: (prospect: Prospect | null) => void;
  preselectedTourProspect: Prospect | null;
  setPreselectedTourProspect: (prospect: Prospect | null) => void;

  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;

  isLoading: boolean;
  error: string | null;
  toast: { message: string; type: 'success' | 'error' } | null;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  unitFilter: string;
  setUnitFilter: (unit: string) => void;

  // Derived / Memoized Values
  filteredProspects: Prospect[];
  totalLeads: number;
  applicationCount: number;
  leasedCount: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;

  // Actions
  loadData: () => Promise<void>;
  reloadTasks: () => Promise<void>;
  handleCreateProspect: (data: CreateProspectInput) => Promise<void>;
  handleUpdateProspect: (id: string, data: any) => Promise<void>;
  handleDeleteProspect: (id: string) => Promise<void>;
  handleQuickStatusChange: (id: string, newStatus: ProspectStatus) => Promise<void>;
  handleUpdateTask: (id: string, isCompleted: boolean, agentId?: string | null) => Promise<void>;
  handleCreateUnit: (data: CreateUnitInput) => Promise<void>;
  handleDeleteUnit: (id: string) => Promise<void>;
  handleSelectProspect: (prospect: Prospect) => void;
  showToast: (message: string, type: 'success' | 'error') => void;

  // Tours actions
  handleCreateTour: (data: any) => Promise<void>;
  handleUpdateTour: (id: string, data: any) => Promise<void>;
  handleRecordTourOutcome: (id: string, outcome: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

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
      throw err;
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
      throw err;
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
      throw err;
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
      // If a prospect is currently selected, refresh its details so the task checkbox state is updated inside the drawer
      if (selectedProspect) {
        const fetchedProspects = await fetchProspects();
        setProspects(fetchedProspects);
        const updatedProspect = fetchedProspects.find(p => p.id === selectedProspect.id);
        if (updatedProspect) {
          setSelectedProspect(updatedProspect);
        }
      }
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
      throw err;
    }
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      await deleteUnit(id);
      setUnits(prev => prev.filter(u => u.id !== id));
      showToast('Unit deleted', 'success');
      await reloadTasks();
      // Reload prospects in case unit unassignment modified them
      const fetchedProspects = await fetchProspects();
      setProspects(fetchedProspects);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete unit', 'error');
      throw err;
    }
  };

  const handleSelectProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsDrawerOpen(true);
  };

  // Tours API Actions
  const handleCreateTour = async (data: any) => {
    try {
      await createTour(data);
      showToast('Tour scheduled successfully', 'success');
      await loadData(); // Reloads all data since tours might update prospect status and unit assignments
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule tour', 'error');
      throw err;
    }
  };

  const handleUpdateTour = async (id: string, data: any) => {
    try {
      await updateTour(id, data);
      showToast('Tour updated successfully', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update tour', 'error');
      throw err;
    }
  };

  const handleRecordTourOutcome = async (id: string, outcome: string) => {
    try {
      await recordTourOutcome(id, outcome);
      showToast('Tour outcome logged', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record outcome', 'error');
      throw err;
    }
  };

  // Compute metrics
  const totalLeads = prospects.length;
  const applicationCount = prospects.filter((p) => p.status === 'application').length;
  const leasedCount = prospects.filter((p) => p.status === 'leased').length;

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === 'leased').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        prospects,
        units,
        tasks,
        tours,
        agents,
        selectedProspect,
        setSelectedProspect,
        preselectedTourProspect,
        setPreselectedTourProspect,
        isDrawerOpen,
        setIsDrawerOpen,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isLoading,
        error,
        toast,
        setToast,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        unitFilter,
        setUnitFilter,
        filteredProspects,
        totalLeads,
        applicationCount,
        leasedCount,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        loadData,
        reloadTasks,
        handleCreateProspect,
        handleUpdateProspect,
        handleDeleteProspect,
        handleQuickStatusChange,
        handleUpdateTask,
        handleCreateUnit,
        handleDeleteUnit,
        handleSelectProspect,
        showToast,
        handleCreateTour,
        handleUpdateTour,
        handleRecordTourOutcome
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
