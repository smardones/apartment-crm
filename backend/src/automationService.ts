import { prisma } from './db.js';
import { ProspectStatus } from 'shared';
import { Prospect } from '@prisma/client';

export type AutomationAction =
  | { type: 'CREATE_TASK'; titleTemplate: string; dueOffsetDays?: number; dueFromField?: keyof Prospect }
  | { type: 'CLOSE_ALL_TASKS' }
  | { type: 'MARK_UNIT_LEASED' }
  | { type: 'MARK_UNIT_HELD' };

export type AutomationRule = {
  triggerStatus: ProspectStatus;
  actions: AutomationAction[];
};

export const automationRules: AutomationRule[] = [
  {
    triggerStatus: 'contacted',
    actions: [
      { type: 'CREATE_TASK', titleTemplate: 'Send tour availability to {name}', dueOffsetDays: 2 }
    ]
  },
  {
    triggerStatus: 'tour_scheduled',
    actions: [
      { type: 'CREATE_TASK', titleTemplate: 'Confirm tour 24h prior', dueFromField: 'tourDate', dueOffsetDays: -1 }
    ]
  },
  {
    triggerStatus: 'toured',
    actions: [
      { type: 'CREATE_TASK', titleTemplate: 'Send application link', dueOffsetDays: 1 }
    ]
  },
  {
    triggerStatus: 'application',
    actions: [
      { type: 'CREATE_TASK', titleTemplate: 'Review application', dueOffsetDays: 3 },
      { type: 'MARK_UNIT_HELD' }
    ]
  },
  {
    triggerStatus: 'leased',
    actions: [
      { type: 'MARK_UNIT_LEASED' },
      { type: 'CLOSE_ALL_TASKS' }
    ]
  },
  {
    triggerStatus: 'lost',
    actions: [
      { type: 'CLOSE_ALL_TASKS' }
    ]
  }
];

export class AutomationService {
  static async handleStatusChange(prospectId: string, oldStatus: string, newStatus: ProspectStatus, prospectData: Prospect) {
    if (oldStatus === newStatus) return;

    // Log the status history
    await prisma.statusHistory.create({
      data: {
        prospectId,
        status: newStatus
      }
    });

    const rule = automationRules.find((r) => r.triggerStatus === newStatus);
    if (!rule) return;

    for (const action of rule.actions) {
      switch (action.type) {
        case 'CREATE_TASK': {
          let dueDate = new Date();
          if (action.dueFromField && prospectData[action.dueFromField]) {
            const dateVal = prospectData[action.dueFromField];
            if (dateVal instanceof Date) {
              dueDate = new Date(dateVal);
            }
          }
          if (action.dueOffsetDays) {
            dueDate.setDate(dueDate.getDate() + action.dueOffsetDays);
          }

          const title = action.titleTemplate.replace('{name}', prospectData.name);
          await prisma.task.create({
            data: {
              prospectId,
              title,
              dueDate
            }
          });
          break;
        }
        case 'CLOSE_ALL_TASKS': {
          await prisma.task.updateMany({
            where: { prospectId, isCompleted: false },
            data: { isCompleted: true, completedAt: new Date() }
          });
          break;
        }
        case 'MARK_UNIT_LEASED': {
          if (prospectData.assignedUnitId) {
            await prisma.unit.update({
              where: { id: prospectData.assignedUnitId },
              data: { status: 'leased' }
            });
          }
          break;
        }
        case 'MARK_UNIT_HELD': {
          if (prospectData.assignedUnitId) {
            await prisma.unit.update({
              where: { id: prospectData.assignedUnitId },
              data: { status: 'held' }
            });
          }
          break;
        }
      }
    }
  }
}
