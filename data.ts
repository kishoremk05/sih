import { Alert, Device, User, AlertSeverity, DeviceStatus, UserRole } from './types';
import { subHours, formatISO } from 'date-fns';

const now = new Date();

export const mockAlerts: Alert[] = [
  { id: 'A001', timestamp: formatISO(subHours(now, 1)), location: { lat: 6.8, lng: 80.8 }, severity: AlertSeverity.High, deviceId: 'D101' },
  { id: 'A002', timestamp: formatISO(subHours(now, 2)), location: { lat: 6.82, lng: 80.81 }, severity: AlertSeverity.Medium, deviceId: 'D102' },
  { id: 'A003', timestamp: formatISO(subHours(now, 5)), location: { lat: 6.79, lng: 80.78 }, severity: AlertSeverity.Low, deviceId: 'D103' },
  { id: 'A004', timestamp: formatISO(subHours(now, 8)), location: { lat: 6.81, lng: 80.83 }, severity: AlertSeverity.Resolved, deviceId: 'D101' },
  { id: 'A005', timestamp: formatISO(subHours(now, 12)), location: { lat: 6.83, lng: 80.79 }, severity: AlertSeverity.Resolved, deviceId: 'D104' },
];

export const mockDevices: Device[] = [
  { id: 'D101', status: DeviceStatus.Online, battery: 89, lastPing: formatISO(subHours(now, 0.1)), location: { lat: 6.8, lng: 80.8 } },
  { id: 'D102', status: DeviceStatus.Online, battery: 72, lastPing: formatISO(subHours(now, 0.2)), location: { lat: 6.82, lng: 80.81 } },
  { id: 'D103', status: DeviceStatus.LowBattery, battery: 15, lastPing: formatISO(subHours(now, 1)), location: { lat: 6.79, lng: 80.78 } },
  { id: 'D104', status: DeviceStatus.Offline, battery: 55, lastPing: formatISO(subHours(now, 6)), location: { lat: 6.83, lng: 80.79 } },
  { id: 'D105', status: DeviceStatus.Online, battery: 95, lastPing: formatISO(subHours(now, 0.3)), location: { lat: 6.85, lng: 80.85 } },
];

export const mockUsers: User[] = [
  { id: 'U001', name: 'Dr. Aruni Fonseka', role: UserRole.Admin, contact: 'aruni@wildlife.gov', status: 'Active' },
  { id: 'U002', name: 'Ravi Kumar', role: UserRole.Operator, contact: 'ravi.k@rangers.gov', status: 'Active' },
  { id: 'U003', name: 'Saman Perera', role: UserRole.Operator, contact: 'saman.p@rangers.gov', status: 'Active' },
  { id: 'U004', name: 'Jani Silva', role: UserRole.Viewer, contact: 'jani.s@research.org', status: 'Inactive' },
];

export const movementChartData = [
  { name: 'Mon', movements: 12 },
  { name: 'Tue', movements: 19 },
  { name: 'Wed', movements: 15 },
  { name: 'Thu', movements: 25 },
  { name: 'Fri', movements: 22 },
  { name: 'Sat', movements: 30 },
  { name: 'Sun', movements: 28 },
];

export const alertTypesData = [
    { name: 'High', value: 15, fill: '#EF4444' },
    { name: 'Medium', value: 35, fill: '#F59E0B' },
    { name: 'Low', value: 50, fill: '#10B981' },
];

export const mockHistoricalLocations = [
  { time: '6h ago', lat: 6.805, lng: 80.805 },
  { time: '5h ago', lat: 6.802, lng: 80.808 },
  { time: '4h ago', lat: 6.798, lng: 80.810 },
  { time: '3h ago', lat: 6.799, lng: 80.815 },
  { time: '2h ago', lat: 6.801, lng: 80.812 },
  { time: '1h ago', lat: 6.800, lng: 80.800 },
  { time: 'now', lat: 6.8, lng: 80.8},
];