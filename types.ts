
export enum NavPage {
  Dashboard = 'Dashboard',
  Map = 'Map',
  Analytics = 'Analytics',
  Alerts = 'Alerts',
  Devices = 'Devices',
  Users = 'Users'
}

export enum AlertSeverity {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Resolved = 'Resolved'
}

export interface Alert {
  id: string;
  timestamp: string;
  location: { lat: number; lng: number };
  severity: AlertSeverity;
  deviceId: string;
}

export enum DeviceStatus {
  Online = 'Online',
  Offline = 'Offline',
  LowBattery = 'Low Battery'
}

export interface Device {
  id: string;
  status: DeviceStatus;
  battery: number;
  lastPing: string;
  location: { lat: number; lng: number };
}

export enum UserRole {
  Admin = 'Admin',
  Operator = 'Operator',
  Viewer = 'Viewer'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  contact: string;
  status: 'Active' | 'Inactive';
}
