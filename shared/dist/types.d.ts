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
    createdAt: string;
    updatedAt: string;
}
