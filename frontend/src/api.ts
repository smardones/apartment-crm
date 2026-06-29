import {
  Unit,
  Prospect,
  CreateUnitInput,
  UpdateUnitInput,
  CreateProspectInput,
  UpdateProspectInput
} from 'shared';

const API_BASE = '/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      // ignore JSON parse failure on non-JSON error pages
    }
    throw new Error(errorMsg);
  }
  if (response.status === 240 || response.status === 204) {
    return;
  }
  return response.json();
}

export async function fetchUnits(): Promise<Unit[]> {
  const res = await fetch(`${API_BASE}/units`);
  return handleResponse(res);
}

export async function createUnit(data: CreateUnitInput): Promise<Unit> {
  const res = await fetch(`${API_BASE}/units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
  const res = await fetch(`${API_BASE}/units/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteUnit(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/units/${id}`, {
    method: 'DELETE'
  });
  await handleResponse(res);
}

export async function fetchProspects(): Promise<Prospect[]> {
  const res = await fetch(`${API_BASE}/prospects`);
  return handleResponse(res);
}

export async function fetchProspectById(id: string): Promise<Prospect> {
  const res = await fetch(`${API_BASE}/prospects/${id}`);
  return handleResponse(res);
}

export async function createProspect(data: CreateProspectInput): Promise<Prospect> {
  const res = await fetch(`${API_BASE}/prospects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateProspect(id: string, data: UpdateProspectInput): Promise<Prospect> {
  const res = await fetch(`${API_BASE}/prospects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteProspect(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/prospects/${id}`, {
    method: 'DELETE'
  });
  await handleResponse(res);
}
