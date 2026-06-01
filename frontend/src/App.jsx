import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';
import { ToastContainer } from './components/Toast';
import './App.css';

// Read API URL from Vite environment, fallback to localhost:8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [toasts, setToasts] = useState([]);
  
  // Data states
  const [stats, setStats] = useState({ total_products: 0, total_customers: 0, total_orders: 0, low_stock_products: [] });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Toast helper
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State loader
  const fetchData = async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      // 1. Fetch dashboard stats
      const statsRes = await fetch(`${API_URL}/dashboard/stats`);
      if (!statsRes.ok) throw new Error("Failed to load dashboard metrics");
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch products
      const productsRes = await fetch(`${API_URL}/products`);
      if (!productsRes.ok) throw new Error("Failed to load products");
      const productsData = await productsRes.json();
      setProducts(productsData);

      // 3. Fetch customers
      const customersRes = await fetch(`${API_URL}/customers`);
      if (!customersRes.ok) throw new Error("Failed to load customers");
      const customersData = await customersRes.json();
      setCustomers(customersData);

      // 4. Fetch orders
      const ordersRes = await fetch(`${API_URL}/orders`);
      if (!ordersRes.ok) throw new Error("Failed to load orders");
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

    } catch (err) {
      console.error(err);
      setConnectionError(true);
      addToast("Could not communicate with the backend services.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedDatabase = async () => {
    try {
      const res = await fetch(`${API_URL}/seed`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Database already populated");
      }
      addToast("Mock inventory successfully seeded!", "success");
      fetchData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Render view dispatcher
  const renderView = () => {
    if (connectionError) {
      return (
        <div className="connection-error-view glass-card">
          <div className="error-icon">🔌</div>
          <h2>Service Connection Lost</h2>
          <p>We are unable to establish contact with the Apex API backend at <code>{API_URL}</code>.</p>
          <p className="text-muted">Please confirm your Docker containers are fully initialized and listening.</p>
          <button className="btn-primary" onClick={fetchData}>
            🔄 Try Reconnecting
          </button>
        </div>
      );
    }

    if (loading && products.length === 0 && customers.length === 0) {
      return (
        <div className="loading-spinner-view">
          <div className="loading-spinner"></div>
          <p>Syncing Apex Database...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            refreshStats={fetchData}
            API_URL={API_URL}
            addToast={addToast}
          />
        );
      case 'products':
        return (
          <ProductList
            products={products}
            refreshData={fetchData}
            API_URL={API_URL}
            addToast={addToast}
          />
        );
      case 'customers':
        return (
          <CustomerList
            customers={customers}
            refreshData={fetchData}
            API_URL={API_URL}
            addToast={addToast}
          />
        );
      case 'orders':
        return (
          <OrderList
            orders={orders}
            products={products}
            customers={customers}
            refreshData={fetchData}
            API_URL={API_URL}
            addToast={addToast}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  const isDatabaseEmpty = products.length === 0 && customers.length === 0;

  // Render Landing Page as full screen view (no sidebar)
  if (currentView === 'landing') {
    return (
      <div className="landing-layout">
        <LandingPage onLaunchConsole={() => setCurrentView('dashboard')} />
        {/* Toast Alert Portal */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-card">
        <div 
          className="sidebar-brand" 
          onClick={() => setCurrentView('landing')} 
          style={{ cursor: 'pointer' }}
          title="Return to Landing Page"
        >
          <div className="logo-icon">▲</div>
          <span className="logo-text">APEX<span className="logo-accent">SYS</span></span>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          
          <button
            className={`nav-item ${currentView === 'products' ? 'active' : ''}`}
            onClick={() => setCurrentView('products')}
          >
            <span className="nav-icon">📦</span>
            <span>Products</span>
          </button>
          
          <button
            className={`nav-item ${currentView === 'customers' ? 'active' : ''}`}
            onClick={() => setCurrentView('customers')}
          >
            <span className="nav-icon">👥</span>
            <span>Customers</span>
          </button>
          
          <button
            className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentView('orders')}
          >
            <span className="nav-icon">🛍️</span>
            <span>Orders</span>
          </button>
        </nav>

        {/* Database Seeder utility */}
        {isDatabaseEmpty && !connectionError && (
          <div className="seeder-promo glass-card">
            <span className="promo-icon">💡</span>
            <h4>Quick Start</h4>
            <p>Load pre-configured demo inventory, profiles, and order logs.</p>
            <button className="btn-primary btn-sm btn-seed" onClick={handleSeedDatabase}>
              ⚡ Seed Demo Data
            </button>
          </div>
        )}

        <div className="sidebar-footer">
          <span className="footer-status">● System Operational</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        {renderView()}
      </main>

      {/* Toast Alert Portal */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
