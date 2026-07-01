import { Prospect } from 'shared';

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;
  unitFilter: string;
}

/**
 * Filters prospects based on search query, status (pipeline stage), and assigned unit number.
 */
export function filterProspects(prospects: Prospect[], options: FilterOptions): Prospect[] {
  const { searchQuery, statusFilter, unitFilter } = options;

  return prospects.filter((p) => {
    // 1. Status (Pipeline Stage) Filter
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }

    // 2. Unit Filter
    if (unitFilter === 'unassigned') {
      if (p.assignedUnitId !== null && p.assignedUnitId !== undefined) {
        return false;
      }
    } else if (unitFilter !== 'all') {
      if (!p.assignedUnit || p.assignedUnit.number !== unitFilter) {
        return false;
      }
    }

    // 3. Text Search Query (searches name, email, phone, and assigned unit number)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = p.name.toLowerCase().includes(q);
      const emailMatch = p.email.toLowerCase().includes(q);
      const phoneMatch = p.phone.includes(q);
      const unitMatch = p.assignedUnit
        ? p.assignedUnit.number.toLowerCase().includes(q)
        : false;

      if (!nameMatch && !emailMatch && !phoneMatch && !unitMatch) {
        return false;
      }
    }

    return true;
  });
}
