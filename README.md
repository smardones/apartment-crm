# Apartment CRM

A modern, full-stack Customer Relationship Management (CRM) application tailored specifically for apartment leasing and property management. 

This application provides property managers and leasing agents with a unified dashboard to track prospective tenants, manage apartment units, schedule tours, and monitor leasing progress from initial contact to a signed lease.

## Major Features

- **Prospect Pipeline Management**: Track leads through customizable stages (`New Lead`, `Contacted`, `Tour Scheduled`, `Toured`, `Application`, `Leased`, `Lost`).
- **Multiple Views**:
  - **Kanban Board**: A drag-and-drop visual board for moving prospects through the leasing pipeline.
  - **Table View**: A detailed, filterable, and sortable list of prospects and their current statuses.
  - **Calendar View**: Visual scheduling for upcoming prospect tours and tasks.
- **Unit Management**: Manage apartment inventory, track unit details (rent, bedrooms, bathrooms), and monitor availability statuses (`available`, `held`, `leased`).
- **Tour Scheduling**: Schedule, cancel, and track the outcomes of prospect tours.
- **Task Tracking**: Assign and monitor tasks associated with prospects (e.g., follow-ups, document collection).
- **Agent Assignment**: Assign specific agents to prospects and track agent performance.

## Tech Stack & Important Packages

This project is structured as an npm workspaces monorepo with three main packages: `frontend`, `backend`, and `shared`.

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Forms & Validation**: `react-hook-form` & `zod`
- **Icons**: `lucide-react`
- **Routing/State**: React Hooks (custom implementation)

### Backend
- **Server**: Express.js (Node.js)
- **Database**: SQLite (Development)
- **ORM**: Prisma (`@prisma/client`)
- **Validation**: `zod`

### Shared
- Shared TypeScript interfaces, Zod schemas, and constants used by both frontend and backend.

## Development Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Setup

1. **Install Dependencies**
   Run the following command from the root of the repository to install dependencies for all workspaces:
   ```bash
   npm install
   ```

2. **Database Setup**
   Initialize the SQLite database and seed it with initial development data:
   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed
   ```

3. **Run the Application**
   Start both the frontend and backend development servers concurrently:
   ```bash
   npm run dev
   ```
   
   - The **frontend** will typically run on `http://localhost:5173`
   - The **backend** will typically run on `http://localhost:3000`

### Additional Scripts

- `npm run build`: Builds the `shared`, `backend`, and `frontend` packages for production.
- `npm run build:frontend`: Builds only the frontend.
- `npm run build:backend`: Builds only the backend.

## Roadmap & Next Steps
- [ ] Add Authentication and Authorization
- [ ] Integrate email / SMS notifications for tours
- [ ] Implement advanced analytics dashboard
