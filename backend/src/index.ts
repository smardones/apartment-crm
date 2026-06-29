import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './db.js';
import {
  CreateProspectSchema,
  UpdateProspectSchema,
  CreateUnitSchema,
  UpdateUnitSchema
} from 'shared';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- UNITS ROUTES ---

// Get all units
app.get('/api/units', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve units', details: error.message });
  }
});

// Create a unit
app.post('/api/units', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create unit', details: error.message });
  }
});

// Update a unit
app.put('/api/units/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const parsed = UpdateUnitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: parsed.data
    });
    res.json(unit);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update unit', details: error.message });
  }
});

// Delete a unit
app.delete('/api/units/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.unit.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete unit', details: error.message });
  }
});


// --- PROSPECTS ROUTES ---

// Get all prospects
app.get('/api/prospects', async (req: Request, res: Response) => {
  try {
    const prospects = await prisma.prospect.findMany({
      include: {
        assignedUnit: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    res.json(prospects);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve prospects', details: error.message });
  }
});

// Get single prospect
app.get('/api/prospects/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: { assignedUnit: true }
    });
    if (!prospect) {
      res.status(404).json({ error: 'Prospect not found' });
      return;
    }
    res.json(prospect);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve prospect', details: error.message });
  }
});

// Create a prospect
app.post('/api/prospects', async (req: Request, res: Response) => {
  try {
    const parsed = CreateProspectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { name, email, phone, status, notes, assignedUnitId } = parsed.data;

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
        assignedUnitId: assignedUnitId || null
      },
      include: {
        assignedUnit: true
      }
    });

    // Side effect: if unit is assigned, and status is application/leased, optionally update unit status.
    // For MVP, we'll let the user manage unit status, but let's auto-update unit status to "held" or "leased"
    // depending on prospect status as a nice touch!
    if (assignedUnitId) {
      let unitStatusUpdate: string | null = null;
      if (status === 'leased') {
        unitStatusUpdate = 'leased';
      } else if (status === 'application' || status === 'tour_scheduled' || status === 'toured') {
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create prospect', details: error.message });
  }
});

// Update a prospect
app.put('/api/prospects/:id', async (req: Request, res: Response) => {
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
    } else {
      dataToUpdate.assignedUnitId = dataToUpdate.assignedUnitId || null;
    }

    const prospect = await prisma.prospect.update({
      where: { id },
      data: dataToUpdate as any,
      include: {
        assignedUnit: true
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
      let unitStatusUpdate: string | null = null;
      if (status === 'leased') {
        unitStatusUpdate = 'leased';
      } else if (status === 'lost') {
        unitStatusUpdate = 'available';
        // Unassign unit automatically since they are lost
        await prisma.prospect.update({
          where: { id },
          data: { assignedUnitId: null }
        });
        prospect.assignedUnitId = null;
        prospect.assignedUnit = null;
      } else {
        unitStatusUpdate = 'held';
      }

      if (unitStatusUpdate && status !== 'lost') {
        await prisma.unit.update({
          where: { id: unitId },
          data: { status: unitStatusUpdate }
        });
      }
    }

    res.json(prospect);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update prospect', details: error.message });
  }
});

// Delete a prospect
app.delete('/api/prospects/:id', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete prospect', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
