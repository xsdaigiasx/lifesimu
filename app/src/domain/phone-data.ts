import type { PhoneState } from './types';

const KEY = 'life-simulator-phone-v1';
const initial = (): PhoneState => ({ version: 1, notes: '', appointments: [], alarms: [], readReport: -1, lastSaved: null });
const isoDate = (value: unknown): boolean => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
function valid(value: unknown): value is PhoneState {
  if (!value || typeof value !== 'object') return false;
  const state = value as PhoneState;
  return state.version === 1 && typeof state.notes === 'string' && state.notes.length <= 4000
    && Number.isSafeInteger(state.readReport) && state.readReport >= -1
    && (state.lastSaved === null || (typeof state.lastSaved === 'string' && Number.isFinite(Date.parse(state.lastSaved))))
    && Array.isArray(state.appointments) && state.appointments.length <= 30
    && state.appointments.every(entry => entry && typeof entry.id === 'string' && entry.id.length <= 60
      && typeof entry.title === 'string' && entry.title.trim().length > 0 && entry.title.length <= 80 && isoDate(entry.date))
    && Array.isArray(state.alarms) && state.alarms.length <= 8
    && state.alarms.every(entry => entry && typeof entry.id === 'string' && entry.id.length <= 60
      && typeof entry.label === 'string' && entry.label.length <= 40 && /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time)
      && typeof entry.enabled === 'boolean');
}
function parse(raw: string | null): PhoneState | null {
  if (typeof raw !== 'string') return null;
  try { const value: unknown = JSON.parse(raw); return valid(value) ? value : null; } catch { return null; }
}
export const phoneData = { KEY, initial, valid, parse };
