import { prisma } from './db.js';
export const automationRules = [
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
export const TOUR_OUTCOME_TO_PROSPECT_STATUS = {
    no_show: 'lost',
    completed_next_steps: 'application',
    completed_follow_up: 'toured',
    completed_not_interested: 'lost'
};
export class AutomationService {
    static async handleStatusChange(prospectId, oldStatus, newStatus, prospectData) {
        if (oldStatus === newStatus)
            return;
        // Log the status history
        await prisma.statusHistory.create({
            data: {
                prospectId,
                status: newStatus
            }
        });
        const rule = automationRules.find((r) => r.triggerStatus === newStatus);
        if (!rule)
            return;
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
                            dueDate,
                            agentId: prospectData.agentId || null
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
    static async handleTourOutcome(tourId, outcome) {
        let finalStatus = 'completed';
        if (outcome === 'no_show') {
            finalStatus = 'no_show';
        }
        const updatedTour = await prisma.tour.update({
            where: { id: tourId },
            data: {
                status: finalStatus,
                outcome
            },
            include: {
                prospect: true,
                unit: true
            }
        });
        const newProspectStatus = TOUR_OUTCOME_TO_PROSPECT_STATUS[outcome] || null;
        if (newProspectStatus && updatedTour.prospect.status !== newProspectStatus) {
            const oldStatus = updatedTour.prospect.status;
            const updatedProspect = await prisma.prospect.update({
                where: { id: updatedTour.prospectId },
                data: { status: newProspectStatus }
            });
            await this.handleStatusChange(updatedTour.prospectId, oldStatus, newProspectStatus, updatedProspect);
        }
        return updatedTour;
    }
}
