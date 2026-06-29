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
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  timestamp: Date;
  unit: string;
  prospect: string;
  summary: string[];
}

export interface Tour {
  id: string;
  prospect: string;
  unit: string;
  scheduledTime: Date;
  outcome?: string | null;
}

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  assignee: string;
  prospect: string;
  state: "open" | "done"
}
