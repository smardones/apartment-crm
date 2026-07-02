import express from 'express';
import cors from 'cors';
import { prisma } from './db.js';
import { CreateProspectSchema, UpdateProspectSchema, CreateUnitSchema, UpdateUnitSchema, UpdateTaskSchema, CreateTourSchema, UpdateTourSchema } from 'shared';
import { AutomationService } from './automationService.js';
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
// Logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// --- AGENTS ROUTES ---
app.get('/api/agents', async (req, res) => {
    try {
        const agents = await prisma.agent.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(agents);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve agents', details: error.message });
    }
});
// --- UNITS ROUTES ---
// Get all units
app.get('/api/units', async (req, res) => {
    try {
        const units = await prisma.unit.findMany({
            include: {
                prospects: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            },
            orderBy: {
                number: 'asc'
            }
        });
        res.json(units);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve units', details: error.message });
    }
});
// Create a unit
app.post('/api/units', async (req, res) => {
    try {
        const parsed = CreateUnitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
            return;
        }
        const { number, status, rent, bedrooms, bathrooms } = parsed.data;
        // Check if unit number already exists
        const existing = await prisma.unit.findUnique({ where: { number } });
        if (existing) {
            res.status(400).json({ error: `Unit number ${number} already exists` });
            return;
        }
        const unit = await prisma.unit.create({
            data: { number, status, rent, bedrooms, bathrooms }
        });
        res.status(201).json(unit);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create unit', details: error.message });
    }
});
// Update a unit
app.put('/api/units/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const parsed = UpdateUnitSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
            return;
        }
        const oldUnit = await prisma.unit.findUnique({ where: { id } });
        const unit = await prisma.unit.update({
            where: { id },
            data: parsed.data
        });
        // Check if unit is no longer available and create task to reassign another unit to any upcoming tours
        if (parsed.data.status && (parsed.data.status === 'held' || parsed.data.status === 'leased') && oldUnit?.status === 'available') {
            const upcomingTours = await prisma.tour.findMany({
                where: {
                    unitId: id,
                    status: 'scheduled',
                    scheduledTime: { gt: new Date() }
                }
            });
            console.log(`Found ${upcomingTours.length} upcoming tours for unit ${id}`);
            for (const tour of upcomingTours) {
                await prisma.tour.update({
                    where: { id: tour.id },
                    data: { unitId: null }
                });
                await prisma.task.create({
                    data: {
                        prospectId: tour.prospectId,
                        title: 'Urgent: Reassign Unit for Tour',
                        description: `The unit formerly assigned to this tour has been held or leased. Please manually assign a new unit.`,
                        dueDate: tour.scheduledTime,
                        isCompleted: false
                    }
                });
            }
        }
        res.json(unit);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update unit', details: error.message });
    }
});
// Delete a unit
app.delete('/api/units/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.unit.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete unit', details: error.message });
    }
});
// --- PROSPECTS ROUTES ---
// Get all prospects
app.get('/api/prospects', async (req, res) => {
    try {
        const prospects = await prisma.prospect.findMany({
            include: {
                assignedUnit: true,
                agent: true,
                tasks: { orderBy: { dueDate: 'asc' } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
                tours: { include: { unit: true }, orderBy: { scheduledTime: 'asc' } }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        res.json(prospects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve prospects', details: error.message });
    }
});
// Get single prospect
app.get('/api/prospects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const prospect = await prisma.prospect.findUnique({
            where: { id },
            include: {
                assignedUnit: true,
                agent: true,
                tasks: { orderBy: { dueDate: 'asc' } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
                tours: { include: { unit: true }, orderBy: { scheduledTime: 'asc' } }
            }
        });
        if (!prospect) {
            res.status(404).json({ error: 'Prospect not found' });
            return;
        }
        res.json(prospect);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve prospect', details: error.message });
    }
});
// Create a prospect
app.post('/api/prospects', async (req, res) => {
    try {
        const parsed = CreateProspectSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
            return;
        }
        const { name, email, phone, status, notes, assignedUnitId, agentId } = parsed.data;
        // Check if unit exists if assignedUnitId is provided
        if (assignedUnitId) {
            const unit = await prisma.unit.findUnique({ where: { id: assignedUnitId } });
            if (!unit) {
                res.status(400).json({ error: 'Assigned unit does not exist' });
                return;
            }
        }
        const prospect = await prisma.prospect.create({
            data: {
                name,
                email,
                phone,
                status,
                notes,
                assignedUnitId: assignedUnitId || null,
                agentId: agentId || null
            },
            include: {
                assignedUnit: true,
                agent: true
            }
        });
        // Side effect: if unit is assigned, and status is application/leased, optionally update unit status.
        // For MVP, we'll let the user manage unit status, but let's auto-update unit status to "held" or "leased"
        // depending on prospect status as a nice touch!
        if (assignedUnitId) {
            let unitStatusUpdate = null;
            if (status === 'leased') {
                unitStatusUpdate = 'leased';
            }
            else if (status === 'application' || status === 'tour_scheduled' || status === 'toured') {
                unitStatusUpdate = 'held';
            }
            if (unitStatusUpdate) {
                await prisma.unit.update({
                    where: { id: assignedUnitId },
                    data: { status: unitStatusUpdate }
                });
            }
        }
        res.status(201).json(prospect);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create prospect', details: error.message });
    }
});
// Update a prospect
app.put('/api/prospects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const parsed = UpdateProspectSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
            return;
        }
        // Fetch existing prospect to see if unit assignment is changing
        const existing = await prisma.prospect.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Prospect not found' });
            return;
        }
        const dataToUpdate = { ...parsed.data };
        // Explicitly handle assignedUnitId mapping
        if (dataToUpdate.assignedUnitId === undefined) {
            // keep existing
        }
        else {
            dataToUpdate.assignedUnitId = dataToUpdate.assignedUnitId || null;
        }
        const prospect = await prisma.prospect.update({
            where: { id },
            data: dataToUpdate,
            include: {
                assignedUnit: true,
                agent: true
            }
        });
        // Auto update unit statuses based on assignments
        const unitId = prospect.assignedUnitId;
        const status = prospect.status;
        // If unit assignment changed, we should revert the old unit status if it has no other active prospects
        if (existing.assignedUnitId && existing.assignedUnitId !== unitId) {
            const activeProspectsOnOldUnit = await prisma.prospect.count({
                where: {
                    assignedUnitId: existing.assignedUnitId,
                    status: { in: ['tour_scheduled', 'toured', 'application', 'leased'] },
                    id: { not: id }
                }
            });
            if (activeProspectsOnOldUnit === 0) {
                await prisma.unit.update({
                    where: { id: existing.assignedUnitId },
                    data: { status: 'available' }
                });
            }
        }
        // Update new unit status
        if (unitId) {
            let unitStatusUpdate = null;
            if (status === 'leased') {
                unitStatusUpdate = 'leased';
            }
            else if (status === 'lost') {
                unitStatusUpdate = 'available';
                // Unassign unit automatically since they are lost
                await prisma.prospect.update({
                    where: { id },
                    data: { assignedUnitId: null }
                });
                prospect.assignedUnitId = null;
                prospect.assignedUnit = null;
            }
            else {
                unitStatusUpdate = 'held';
            }
            if (unitStatusUpdate && status !== 'lost') {
                await prisma.unit.update({
                    where: { id: unitId },
                    data: { status: unitStatusUpdate }
                });
            }
        }
        // Handle task automation if status changed
        if (existing.status !== prospect.status) {
            await AutomationService.handleStatusChange(prospect.id, existing.status, prospect.status, prospect);
        }
        // Re-fetch the prospect to include any newly created tasks or history records
        const updatedProspect = await prisma.prospect.findUnique({
            where: { id },
            include: {
                assignedUnit: true,
                agent: true,
                tasks: { orderBy: { dueDate: 'asc' } },
                statusHistory: { orderBy: { createdAt: 'desc' } },
                tours: { include: { unit: true }, orderBy: { scheduledTime: 'asc' } }
            }
        });
        res.json(updatedProspect);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update prospect', details: error.message });
    }
});
// Delete a prospect
app.delete('/api/prospects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await prisma.prospect.findUnique({ where: { id } });
        await prisma.prospect.delete({ where: { id } });
        // Revert unit status if it has no other active prospects
        if (existing && existing.assignedUnitId) {
            const activeProspectsOnUnit = await prisma.prospect.count({
                where: {
                    assignedUnitId: existing.assignedUnitId,
                    status: { in: ['tour_scheduled', 'toured', 'application', 'leased'] }
                }
            });
            if (activeProspectsOnUnit === 0) {
                await prisma.unit.update({
                    where: { id: existing.assignedUnitId },
                    data: { status: 'available' }
                });
            }
        }
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete prospect', details: error.message });
    }
});
// --- TASKS ROUTES ---
// Get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                prospect: {
                    select: { name: true }
                },
                agent: true
            },
            orderBy: {
                dueDate: 'asc'
            }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve tasks', details: error.message });
    }
});
// Update a task
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const parsed = UpdateTaskSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
            return;
        }
        const dataToUpdate = { ...parsed.data };
        // Automatically set completedAt if marked completed
        if (dataToUpdate.isCompleted && !dataToUpdate.completedAt) {
            dataToUpdate.completedAt = new Date();
        }
        else if (dataToUpdate.isCompleted === false) {
            dataToUpdate.completedAt = null;
        }
        const task = await prisma.task.update({
            where: { id },
            data: dataToUpdate,
            include: {
                agent: true
            }
        });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task', details: error.message });
    }
});
// --- TOURS ROUTES ---
// Get all tours
app.get('/api/tours', async (req, res) => {
    try {
        const tours = await prisma.tour.findMany({
            include: {
                prospect: true,
                unit: true
            },
            orderBy: {
                scheduledTime: 'asc'
            }
        });
        res.json(tours);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve tours', details: error.message });
    }
});
// Create a tour
app.post('/api/tours', async (req, res) => {
    try {
        const parsed = CreateTourSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
            return;
        }
        const { prospectId, unitId, scheduledTime } = parsed.data;
        // Check if unit exists and is available
        const unit = await prisma.unit.findUnique({ where: { id: unitId } });
        if (!unit) {
            res.status(400).json({ error: 'Unit not found' });
            return;
        }
        if (unit.status !== 'available') {
            res.status(400).json({ error: `Unit ${unit.number} is currently ${unit.status} and cannot be toured` });
            return;
        }
        const tourStart = new Date(scheduledTime);
        const tourEnd = new Date(tourStart.getTime() + 60 * 60 * 1000); // 1 hour later
        // Overlap validation for unit
        const unitOverlap = await prisma.tour.findFirst({
            where: {
                unitId,
                status: 'scheduled',
                scheduledTime: {
                    gt: new Date(tourStart.getTime() - 60 * 60 * 1000),
                    lt: new Date(tourStart.getTime() + 60 * 60 * 1000)
                }
            }
        });
        if (unitOverlap) {
            res.status(400).json({ error: 'This unit is already booked for a tour during this timeslot' });
            return;
        }
        // Overlap validation for prospect
        const prospectOverlap = await prisma.tour.findFirst({
            where: {
                prospectId,
                status: 'scheduled',
                scheduledTime: {
                    gt: new Date(tourStart.getTime() - 60 * 60 * 1000),
                    lt: new Date(tourStart.getTime() + 60 * 60 * 1000)
                }
            }
        });
        if (prospectOverlap) {
            res.status(400).json({ error: 'This prospect is already scheduled for a tour during this timeslot' });
            return;
        }
        const tour = await prisma.tour.create({
            data: {
                prospectId,
                unitId,
                scheduledTime: tourStart,
                status: 'scheduled'
            },
            include: {
                prospect: true,
                unit: true
            }
        });
        // Update prospect tourDate and unit assignment
        await prisma.prospect.update({
            where: { id: prospectId },
            data: { assignedUnitId: unitId, tourDate: tourStart }
        });
        // Auto-update prospect status to tour_scheduled if not already, and trigger automation
        const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
        if (prospect && prospect.status !== 'tour_scheduled') {
            const updatedProspect = await prisma.prospect.update({
                where: { id: prospectId },
                data: { status: 'tour_scheduled' }
            });
            await AutomationService.handleStatusChange(prospectId, prospect.status, 'tour_scheduled', { ...updatedProspect, tourDate: tourStart });
        }
        res.status(201).json(tour);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create tour', details: error.message });
    }
});
// Update/Reschedule/Cancel a tour
app.put('/api/tours/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const parsed = UpdateTourSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
            return;
        }
        const existingTour = await prisma.tour.findUnique({ where: { id } });
        if (!existingTour) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }
        const { prospectId, unitId, scheduledTime, status } = parsed.data;
        // Handle cancelation quickly
        if (status === 'canceled' && existingTour.status !== 'canceled') {
            const updated = await prisma.tour.update({
                where: { id },
                data: { status: 'canceled' },
                include: { prospect: true, unit: true }
            });
            // Clear prospect's tourDate and unit assignment
            await prisma.prospect.update({
                where: { id: existingTour.prospectId },
                data: { tourDate: null, assignedUnitId: null }
            });
            res.json(updated);
            return;
        }
        const targetProspectId = prospectId || existingTour.prospectId;
        const targetUnitId = unitId !== undefined ? unitId : existingTour.unitId;
        const targetTime = scheduledTime ? new Date(scheduledTime) : new Date(existingTour.scheduledTime);
        if (targetUnitId) {
            const unit = await prisma.unit.findUnique({ where: { id: targetUnitId } });
            if (!unit) {
                res.status(400).json({ error: 'Unit not found' });
                return;
            }
            if (unit.status !== 'available' && targetUnitId !== existingTour.unitId) {
                res.status(400).json({ error: `Unit ${unit.number} is currently ${unit.status} and cannot be toured` });
                return;
            }
            // Unit overlap validation
            const unitOverlap = await prisma.tour.findFirst({
                where: {
                    id: { not: id },
                    unitId: targetUnitId,
                    status: 'scheduled',
                    scheduledTime: {
                        gt: new Date(targetTime.getTime() - 60 * 60 * 1000),
                        lt: new Date(targetTime.getTime() + 60 * 60 * 1000)
                    }
                }
            });
            if (unitOverlap) {
                res.status(400).json({ error: 'This unit is already booked for a tour during this timeslot' });
                return;
            }
        }
        // Prospect overlap validation
        const prospectOverlap = await prisma.tour.findFirst({
            where: {
                id: { not: id },
                prospectId: targetProspectId,
                status: 'scheduled',
                scheduledTime: {
                    gt: new Date(targetTime.getTime() - 60 * 60 * 1000),
                    lt: new Date(targetTime.getTime() + 60 * 60 * 1000)
                }
            }
        });
        if (prospectOverlap) {
            res.status(400).json({ error: 'This prospect is already scheduled for a tour during this timeslot' });
            return;
        }
        const updated = await prisma.tour.update({
            where: { id },
            data: {
                prospectId: targetProspectId,
                unitId: targetUnitId,
                scheduledTime: targetTime,
                status: status || existingTour.status
            },
            include: {
                prospect: true,
                unit: true
            }
        });
        // Update prospect assigned unit and tour date in database
        const prospectUpdateData = {};
        if (unitId !== undefined && unitId !== existingTour.unitId) {
            prospectUpdateData.assignedUnitId = unitId;
        }
        if (scheduledTime) {
            prospectUpdateData.tourDate = targetTime;
        }
        if (Object.keys(prospectUpdateData).length > 0) {
            await prisma.prospect.update({
                where: { id: targetProspectId },
                data: prospectUpdateData
            });
        }
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update tour', details: error.message });
    }
});
// Record tour outcome
app.post('/api/tours/:id/outcome', async (req, res) => {
    const { id } = req.params;
    const { outcome } = req.body;
    if (!outcome) {
        res.status(400).json({ error: 'Outcome is required' });
        return;
    }
    try {
        const updatedTour = await AutomationService.handleTourOutcome(id, outcome);
        res.json(updatedTour);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to record outcome', details: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
