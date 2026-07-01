export type UnitStatus = 'available' | 'held' | 'leased';

export const UNIT_STATUSES: UnitStatus[] = ['available', 'held', 'leased'];

export type ProspectStatus =
  | 'new'
  | 'contacted'
  | 'tour_scheduled'
  | 'toured'
  | 'application'
  | 'leased'
  | 'lost';

export const PROSPECT_STATUSES: ProspectStatus[] = [
  'new',
  'contacted',
  'tour_scheduled',
  'toured',
  'application',
  'leased',
  'lost'
];

export interface Unit {
  id: string;
  number: string;
  status: UnitStatus;
  rent: number;
  bedrooms: number;
  bathrooms: number;
}

export interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ProspectStatus;
  notes: string;
  assignedUnitId: string | null;
  assignedUnit?: Unit | null;
  tourDate: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  statusHistory?: StatusHistory[];
  tours?: Tour[];
}

export interface ActivityEvent {
  id: string;
  type: string;
  timestamp: Date;
  unit: string;
  prospect: string;
  summary: string[];
}

export type TourStatus = 'scheduled' | 'canceled' | 'completed' | 'no_show';
export const TOUR_STATUSES: TourStatus[] = ['scheduled', 'canceled', 'completed', 'no_show'];

export type TourOutcome = 'no_show' | 'completed_next_steps' | 'completed_follow_up' | 'completed_not_interested';
export const TOUR_OUTCOMES: TourOutcome[] = ['no_show', 'completed_next_steps', 'completed_follow_up', 'completed_not_interested'];

export interface Tour {
  id: string;
  prospectId: string;
  prospect?: Prospect;
  unitId: string | null;
  unit?: Unit | null;
  scheduledTime: string;
  status: TourStatus;
  outcome: TourOutcome | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  prospectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  status: ProspectStatus;
  prospectId: string;
  createdAt: string;
}
