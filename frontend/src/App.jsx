import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Releases from './pages/Releases';
import ReleaseDetails from './pages/ReleaseDetails';
import SimulationLab from './pages/SimulationLab';
import MetricsIncidents from './pages/MetricsIncidents';
import SettingsThresholds from './pages/SettingsThresholds';
import Documentation from './pages/Documentation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="releases" element={<Releases />} />
          <Route path="releases/:id" element={<ReleaseDetails />} />
          <Route path="simulation" element={<SimulationLab />} />
          <Route path="incidents" element={<MetricsIncidents />} />
          <Route path="settings" element={<SettingsThresholds />} />
          <Route path="docs" element={<Documentation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
