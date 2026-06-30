export type UnitStatus = 'available' | 'held' | 'leased';
export declare const UNIT_STATUSES: UnitStatus[];
export type ProspectStatus = 'new' | 'contacted' | 'tour_scheduled' | 'toured' | 'application' | 'leased' | 'lost';
export declare const PROSPECT_STATUSES: ProspectStatus[];
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
