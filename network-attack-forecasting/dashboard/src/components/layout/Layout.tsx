import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { predictionApi } from '../../services/predictionApi';
import { threatApi } from '../../services/threatApi';

export const Layout: React.FC = () => {
  const [apiConnected, setApiConnected] = useState<boolean>(true);
  const [modelOnline, setModelOnline] = useState<boolean>(true);
  const [networkOperational, setNetworkOperational] = useState<boolean>(true);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const checkHealth = async () => {
    try {
      const health = await predictionApi.getHealth();
      setApiConnected(health.isBackendConnected ?? true);
      setModelOnline(health.modelLoaded ?? true);
      setNetworkOperational(health.status === 'ok');
    } catch {
      setApiConnected(false);
      setModelOnline(false);
      setNetworkOperational(false);
    }
  };

  const fetchAlertCount = async () => {
    try {
      const alerts = await threatApi.getAlerts();
      setUnreadAlertCount(alerts?.length || 0);
    } catch {
      // silently ignore error
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([checkHealth(), fetchAlertCount()]);
    setLastUpdated(new Date());
    window.dispatchEvent(new CustomEvent('netforecast-refresh'));
    setTimeout(() => setIsRefreshing(false), 400);
  };

  useEffect(() => {
    checkHealth();
    fetchAlertCount();
    const interval = setInterval(() => {
      checkHealth();
      fetchAlertCount();
      setLastUpdated(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#080d1a] text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          unreadAlertCount={unreadAlertCount}
          apiConnected={apiConnected}
          modelOnline={modelOnline}
          networkOperational={networkOperational}
        />

        {/* Main Workspace Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
