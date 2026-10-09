import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { TrafficAnalysis } from './pages/TrafficAnalysis';
import { ThreatDetection } from './pages/ThreatDetection';
import { AttackForecast } from './pages/AttackForecast';
import { Simulation } from './pages/Simulation';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/traffic" element={<TrafficAnalysis />} />
          <Route path="/threats" element={<ThreatDetection />} />
          <Route path="/forecast" element={<AttackForecast />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />

          {/* Legacy navigation redirects */}
          <Route path="/mitre" element={<Navigate to="/threats" replace />} />
          <Route path="/model" element={<Navigate to="/forecast" replace />} />
          <Route path="/status" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
