

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
// Fix: Import Leaflet library to resolve errors where the 'L' namespace was not found.
import L from 'leaflet';

// Import types, data, and icons
import { NavPage, Alert, Device, User, AlertSeverity, DeviceStatus, UserRole } from './types';
import { mockAlerts, mockDevices, mockUsers, movementChartData, alertTypesData, mockHistoricalLocations } from './data';
import { HomeIcon, MapIcon, ChartIcon, BellIcon, DeviceIcon, UsersIcon, SearchIcon, ChevronDownIcon, MenuIcon, CloseIcon, WarningIcon, InfoIcon } from './constants';

// --- Reusable UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-dark-card border border-dark-border rounded-2xl shadow-lg p-4 sm:p-6 ${className}`}
        >
            {children}
        </motion.div>
    );
};

const CardTitle: React.FC<{ children: React.ReactNode; }> = ({ children }) => (
    <h3 className="text-lg font-semibold text-gray-200 mb-4">{children}</h3>
);


// --- Chart Components ---

const MovementChart: React.FC = () => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={movementChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }} />
            <Legend />
            <Line type="monotone" dataKey="movements" stroke="#39FF14" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
    </ResponsiveContainer>
);

const AlertPieChart: React.FC = () => (
    <ResponsiveContainer width="100%" height={300}>
        <PieChart>
            <Pie data={alertTypesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label >
                {alertTypesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }} />
            <Legend />
        </PieChart>
    </ResponsiveContainer>
);

// --- Map Component ---

const MapView: React.FC<{ devices: Device[], alerts: Alert[], center: [number, number], zoom: number }> = ({ devices, alerts, center, zoom }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const dataLayerRef = useRef<L.LayerGroup | null>(null);

    // Initialization and cleanup effect
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current).setView(center, zoom);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            dataLayerRef.current = L.layerGroup().addTo(map);
            mapRef.current = map;
            
            // Fix for map container size issues on initial render or tab switch
            setTimeout(() => map.invalidateSize(), 100);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to update map view when center or zoom props change
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setView(center, zoom);
        }
    }, [center, zoom]);
    
    // Effect to update data layers (markers, circles)
    useEffect(() => {
        const layerGroup = dataLayerRef.current;
        if (layerGroup) {
            layerGroup.clearLayers(); // Clear previous markers and circles safely

            // Add device markers
            devices.forEach(device => {
                 const statusColorClass = 
                    device.status === DeviceStatus.Online ? 'bg-green-500' : 
                    device.status === DeviceStatus.LowBattery ? 'bg-yellow-500' : 
                    'bg-red-500';

                const icon = L.divIcon({
                    html: `
                        <div class="p-1 rounded-full ${statusColorClass}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>`,
                    className: 'bg-transparent border-0'
                });
                L.marker([device.location.lat, device.location.lng], { icon })
                    .addTo(layerGroup)
                    .bindPopup(`<b>Device:</b> ${device.id}<br><b>Battery:</b> ${device.battery}%`);
            });

            // Add alert circles
            alerts.forEach(alert => {
                if (alert.severity !== AlertSeverity.Resolved) {
                    const color = alert.severity === AlertSeverity.High ? 'red' : 'orange';
                    L.circle([alert.location.lat, alert.location.lng], {
                        color,
                        fillColor: color,
                        fillOpacity: 0.3,
                        radius: 200
                    }).addTo(layerGroup)
                    .bindPopup(`<b>Alert:</b> ${alert.id}<br><b>Severity:</b> ${alert.severity}`);
                }
            });
        }
    }, [devices, alerts]);


    return <div ref={mapContainerRef} className="h-full w-full" />;
};


// --- Page Specific Components ---

const getSeverityClass = (severity: AlertSeverity) => {
    switch (severity) {
        case AlertSeverity.High: return 'bg-red-500/20 text-red-400 border-red-500/30';
        case AlertSeverity.Medium: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case AlertSeverity.Low: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case AlertSeverity.Resolved: return 'bg-green-500/20 text-green-400 border-green-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getStatusClass = (status: DeviceStatus | User['status']) => {
    switch(status) {
        case DeviceStatus.Online:
        case 'Active':
            return 'bg-green-500/20 text-green-400';
        case DeviceStatus.LowBattery:
            return 'bg-yellow-500/20 text-yellow-400';
        case DeviceStatus.Offline:
        case 'Inactive':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};


const AlertsTable: React.FC<{ alerts: Alert[] }> = ({ alerts }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-dark-border">
                    <th className="p-4">Date</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Device ID</th>
                    <th className="p-4">Actions</th>
                </tr>
            </thead>
            <tbody>
                {alerts.map(alert => (
                    <tr key={alert.id} className="border-b border-dark-border hover:bg-white/5 transition-colors">
                        <td className="p-4">{format(parseISO(alert.timestamp), 'MMM d, yyyy HH:mm')}</td>
                        <td className="p-4">{`${alert.location.lat.toFixed(3)}, ${alert.location.lng.toFixed(3)}`}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityClass(alert.severity)}`}>
                                {alert.severity}
                            </span>
                        </td>
                        <td className="p-4">{alert.deviceId}</td>
                        <td className="p-4">
                             <button className="text-neon-green hover:underline">Acknowledge</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const UsersTable: React.FC<{ users: User[] }> = ({ users }) => (
     <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-dark-border">
                    <th className="p-4">Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Status</th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                    <tr key={user.id} className="border-b border-dark-border hover:bg-white/5 transition-colors">
                        <td className="p-4">{user.name}</td>
                        <td className="p-4">{user.role}</td>
                        <td className="p-4">{user.contact}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(user.status)}`}>
                                {user.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const DeviceStatusCard: React.FC<{ device: Device; onSelect: (device: Device) => void; }> = ({ device, onSelect }) => {
    const batteryColor = device.battery > 60 ? 'text-neon-green' : device.battery > 20 ? 'text-yellow-400' : 'text-red-500';
    return (
        <div onClick={() => onSelect(device)} className="cursor-pointer group">
            <Card className="transition-all duration-300 group-hover:border-neon-green/50 group-hover:scale-105">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-lg">{device.id}</h4>
                        <span className={`text-sm px-2 py-1 rounded-full mt-1 inline-block ${getStatusClass(device.status)}`}>{device.status}</span>
                    </div>
                    <div className={`font-bold text-xl ${batteryColor}`}>
                        {device.battery}%
                    </div>
                </div>
                <div className="mt-4 text-sm text-gray-400">
                    <p>Last Ping: {format(parseISO(device.lastPing), 'HH:mm:ss')}</p>
                    <p>Location: {device.location.lat.toFixed(3)}, {device.location.lng.toFixed(3)}</p>
                </div>
                <div className="mt-4 flex gap-2">
                    <button className="bg-brand-orange/20 text-brand-orange px-3 py-1 text-sm rounded-md hover:bg-brand-orange/40 transition">Reboot</button>
                    <button className="bg-blue-500/20 text-blue-400 px-3 py-1 text-sm rounded-md hover:bg-blue-500/40 transition">Test Alert</button>
                </div>
            </Card>
        </div>
    );
};

// --- Pages ---

const DashboardPage: React.FC<{ alerts: Alert[], devices: Device[] }> = ({ alerts, devices }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardTitle>System Status</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-neon-green animate-pulse"></div>
                    <p className="font-semibold text-lg text-neon-green">All Systems Operational</p>
                </div>
                <p className="text-sm text-gray-400 mt-2">All tracking devices are online and reporting data correctly.</p>
            </Card>
            <Card>
                <CardTitle>Total Active Devices</CardTitle>
                <p className="text-5xl font-bold text-gray-100">{devices.filter(d => d.status === 'Online').length}</p>
                 <p className="text-sm text-gray-400 mt-2">{devices.length} devices total</p>
            </Card>
            <Card className="md:col-span-2">
                <CardTitle>Recent Alerts</CardTitle>
                <ul>
                    {alerts.slice(0, 3).map(alert => (
                        <li key={alert.id} className={`p-3 rounded-lg flex items-center justify-between mb-2 ${getSeverityClass(alert.severity)}`}>
                            <div>
                                <span className="font-semibold">{alert.severity}</span>
                                <span className="text-sm ml-2">on Device {alert.deviceId}</span>
                            </div>
                            <span className="text-xs">{format(parseISO(alert.timestamp), 'p')}</span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
        <Card className="lg:col-span-1 min-h-[300px] flex flex-col">
            <CardTitle>Mini Map</CardTitle>
            <div className="flex-grow rounded-lg overflow-hidden">
                <MapView devices={devices} alerts={[]} center={[6.8, 80.8]} zoom={11} />
            </div>
        </Card>
    </div>
);

const MapPage: React.FC<{ alerts: Alert[], devices: Device[] }> = ({ alerts, devices }) => (
    <Card className="h-[calc(100vh-120px)] p-2 flex flex-col">
        <div className="flex-grow rounded-2xl overflow-hidden">
            <MapView devices={devices} alerts={alerts} center={[6.8, 80.8]} zoom={12} />
        </div>
    </Card>
);

const AnalyticsPage: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
            <CardTitle>Movements per Day</CardTitle>
            <MovementChart />
        </Card>
        <Card>
            <CardTitle>Alert Types Distribution</CardTitle>
            <AlertPieChart />
        </Card>
        <Card>
            <CardTitle>Export Data</CardTitle>
             <p className="text-gray-400 mb-4">Download reports in your preferred format.</p>
             <div className="flex gap-4">
                <button className="bg-neon-green text-dark-bg font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">Export as PDF</button>
                <button className="bg-brand-orange text-dark-bg font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">Export as CSV</button>
             </div>
        </Card>
    </div>
);

const AlertsPage: React.FC<{ alerts: Alert[] }> = ({ alerts }) => (
    <Card>
        <CardTitle>Alert Log</CardTitle>
        <AlertsTable alerts={alerts} />
    </Card>
);

const DevicesPage: React.FC<{ devices: Device[]; onDeviceSelect: (device: Device) => void; }> = ({ devices, onDeviceSelect }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map(device => <DeviceStatusCard key={device.id} device={device} onSelect={onDeviceSelect} />)}
    </div>
);

const UsersPage: React.FC<{ users: User[] }> = ({ users }) => (
     <Card>
        <CardTitle>User Management</CardTitle>
        <UsersTable users={users} />
    </Card>
);


// --- Layout Components ---

const Sidebar: React.FC<{
    activePage: NavPage;
    setActivePage: (page: NavPage) => void;
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
}> = ({ activePage, setActivePage, isSidebarOpen, setSidebarOpen }) => {
    
    const navItems = [
        { page: NavPage.Dashboard, icon: HomeIcon, label: 'Dashboard' },
        { page: NavPage.Map, icon: MapIcon, label: 'Map' },
        { page: NavPage.Analytics, icon: ChartIcon, label: 'Analytics' },
        { page: NavPage.Alerts, icon: BellIcon, label: 'Alerts' },
        { page: NavPage.Devices, icon: DeviceIcon, label: 'Devices' },
        { page: NavPage.Users, icon: UsersIcon, label: 'Users' },
    ];
    
    const baseClasses = "flex items-center p-3 my-1 rounded-lg transition-colors duration-200";
    const activeClasses = "bg-neon-green text-dark-bg font-semibold";
    const inactiveClasses = "text-gray-400 hover:bg-dark-border hover:text-gray-100";
    
    return (
       <>
         <div className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
         <aside className={`fixed lg:relative z-40 lg:z-auto h-full bg-dark-card border-r border-dark-border flex flex-col transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
                <h1 className="text-xl font-bold text-gray-100 whitespace-nowrap">🐘 Elephant Alert</h1>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                    <CloseIcon className="w-6 h-6"/>
                </button>
            </div>
            <nav className="flex-1 p-2">
                <ul>
                    {navItems.map(item => (
                        <li key={item.page}>
                            <a href="#"
                                onClick={(e) => { e.preventDefault(); setActivePage(item.page); setSidebarOpen(false); }}
                                className={`${baseClasses} ${activePage === item.page ? activeClasses : inactiveClasses}`}
                            >
                                <item.icon className="w-6 h-6 mr-3" />
                                <span>{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
         </aside>
       </>
    );
};

const TopNavbar: React.FC<{ onMenuClick: () => void; }> = ({ onMenuClick }) => (
    <header className="bg-dark-card border-b border-dark-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white">
                <MenuIcon className="w-6 h-6"/>
            </button>
            <div className="relative hidden sm:block">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="text" placeholder="Search..." className="bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-neon-green" />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-card"></span>
            </button>
            <div className="flex items-center gap-2">
                <img src={`https://picsum.photos/seed/user1/40/40`} alt="User" className="w-8 h-8 rounded-full" />
                <span className="hidden md:inline font-semibold">Kishore</span>
                <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </div>
        </div>
    </header>
);

const NotificationModal: React.FC<{ alert: Alert, onClose: () => void }> = ({ alert, onClose }) => (
    <AnimatePresence>
        {alert && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-dark-card border-2 border-red-500 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <WarningIcon className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                    <h2 className="text-2xl font-bold text-red-400 mt-4">High Severity Alert!</h2>
                    <p className="text-gray-300 mt-2">
                        Device <span className="font-bold">{alert.deviceId}</span> has triggered a high severity alert.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        Location: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                    </p>
                    <button onClick={onClose} className="mt-6 bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors">
                        Acknowledge
                    </button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const DeviceDetailModal: React.FC<{ device: Device; alerts: Alert[]; onClose: () => void; }> = ({ device, alerts, onClose }) => {
    const batteryColor = device.battery > 60 ? 'text-neon-green' : device.battery > 20 ? 'text-yellow-400' : 'text-red-500';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-dark-card border border-dark-border rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="flex items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-100 mr-4">Device {device.id}</h2>
                        <span className={`text-sm px-3 py-1 font-semibold rounded-full ${getStatusClass(device.status)}`}>{device.status}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <CardTitle>Details</CardTitle>
                            <div className="space-y-3 text-gray-300">
                                <p><strong>Battery:</strong> <span className={`font-bold ${batteryColor}`}>{device.battery}%</span></p>
                                <p><strong>Last Ping:</strong> {format(parseISO(device.lastPing), 'MMM d, yyyy HH:mm:ss')}</p>
                                <p><strong>Location:</strong> {`${device.location.lat.toFixed(4)}, ${device.location.lng.toFixed(4)}`}</p>
                            </div>
                             <div className="mt-6">
                                <CardTitle>Associated Alerts</CardTitle>
                                <div className="max-h-32 overflow-y-auto pr-2">
                                    {alerts.length > 0 ? alerts.map(alert => (
                                        <div key={alert.id} className={`p-2 rounded-lg mb-2 text-sm ${getSeverityClass(alert.severity)}`}>
                                            <strong>{alert.severity}:</strong> {format(parseISO(alert.timestamp), 'MMM d, HH:mm')}
                                        </div>
                                    )) : <p className="text-sm text-gray-500">No alerts for this device.</p>}
                                </div>
                            </div>
                        </div>
                        <div className="min-h-[200px] rounded-lg overflow-hidden">
                             <MapView key={device.id} devices={[device]} alerts={[]} center={[device.location.lat, device.location.lng]} zoom={14} />
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <CardTitle>Historical Movement (Placeholder)</CardTitle>
                        <ResponsiveContainer width="100%" height={150}>
                           <LineChart data={mockHistoricalLocations} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                                <XAxis dataKey="time" stroke="#888" fontSize={12} />
                                <YAxis stroke="#888" domain={['dataMin - 0.005', 'dataMax + 0.005']} fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }} />
                                <Line type="monotone" dataKey="lat" stroke="#39FF14" strokeWidth={2} dot={false} name="Latitude" />
                                 <Line type="monotone" dataKey="lng" stroke="#FF7A00" strokeWidth={2} dot={false} name="Longitude" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<NavPage>(NavPage.Dashboard);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
    const [devices] = useState<Device[]>(mockDevices);
    const [users] = useState<User[]>(mockUsers);
    const [highSeverityAlert, setHighSeverityAlert] = useState<Alert | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const shouldTriggerAlert = Math.random() > 0.9;
            if (shouldTriggerAlert) {
                const randomDevice = devices[Math.floor(Math.random() * devices.length)];
                const newAlert: Alert = {
                    id: `A${Math.floor(Math.random() * 1000)}`,
                    timestamp: new Date().toISOString(),
                    location: { 
                        lat: randomDevice.location.lat + (Math.random() - 0.5) * 0.01, 
                        lng: randomDevice.location.lng + (Math.random() - 0.5) * 0.01
                    },
                    severity: AlertSeverity.High,
                    deviceId: randomDevice.id,
                };
                setAlerts(prev => [newAlert, ...prev]);
                setHighSeverityAlert(newAlert);
            }
        }, 15000); // Trigger a potential alert every 15 seconds

        return () => clearInterval(interval);
    }, [devices]);
    

    const renderPage = () => {
        switch (activePage) {
            case NavPage.Dashboard: return <DashboardPage alerts={alerts} devices={devices} />;
            case NavPage.Map: return <MapPage alerts={alerts} devices={devices} />;
            case NavPage.Analytics: return <AnalyticsPage />;
            case NavPage.Alerts: return <AlertsPage alerts={alerts} />;
            case NavPage.Devices: return <DevicesPage devices={devices} onDeviceSelect={setSelectedDevice} />;
            case NavPage.Users: return <UsersPage users={users} />;
            default: return <DashboardPage alerts={alerts} devices={devices} />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar activePage={activePage} setActivePage={setActivePage} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col">
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-6 overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
            {highSeverityAlert && <NotificationModal alert={highSeverityAlert} onClose={() => setHighSeverityAlert(null)} />}
            {selectedDevice && <DeviceDetailModal device={selectedDevice} alerts={alerts.filter(a => a.deviceId === selectedDevice.id)} onClose={() => setSelectedDevice(null)} />}
        </div>
    );
};

export default App;
