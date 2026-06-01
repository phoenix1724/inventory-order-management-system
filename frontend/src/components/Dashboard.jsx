import React, { useState } from 'react';

export default function Dashboard({ stats, refreshStats, API_URL, addToast }) {
  const [replenishQty, setReplenishQty] = useState({});

  const handleQuickReplenish = async (productId, currentStock, currentSku, currentPrice, currentName) => {
    const quantityToAdd = parseInt(replenishQty[productId]);
    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      addToast("Please enter a valid positive quantity.", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity_in_stock: currentStock + quantityToAdd
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to update stock");
      }

      addToast(`Replenished ${quantityToAdd} units of "${currentName}"`, "success");
      setReplenishQty(prev => ({ ...prev, [productId]: '' }));
      refreshStats();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Safe destructuring of stats with defaults
  const { total_products = 0, total_customers = 0, total_orders = 0, low_stock_products = [] } = stats || {};

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Dashboard</h1>
          <p className="view-subtitle">Real-time statistics and critical system alerts.</p>
        </div>
        <button className="btn-secondary" onClick={refreshStats}>
          🔄 Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid-cols-3 metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon bg-violet">📦</div>
          <div className="metric-info">
            <span className="metric-label">Total Products</span>
            <h3 className="metric-val">{total_products}</h3>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon bg-blue">👥</div>
          <div className="metric-info">
            <span className="metric-label">Registered Customers</span>
            <h3 className="metric-val">{total_customers}</h3>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon bg-teal">💰</div>
          <div className="metric-info">
            <span className="metric-label">Total Orders</span>
            <h3 className="metric-val">{total_orders}</h3>
          </div>
        </div>
      </div>

      {/* Layout Panels: Low Stock + Chart */}
      <div className="grid-cols-2 dashboard-details">
        {/* Low Stock Alerts */}
        <div className="glass-card detail-panel">
          <div className="panel-header">
            <h3 className="panel-title text-warning">⚠️ Low Stock Alerts ({low_stock_products.length})</h3>
            <span className="badge badge-warning">Threshold: &lt; 10 units</span>
          </div>

          {low_stock_products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎉</span>
              <p>All items are sufficiently stocked!</p>
            </div>
          ) : (
            <div className="low-stock-list">
              {low_stock_products.map((product) => (
                <div key={product.id} className="low-stock-item">
                  <div className="low-stock-info">
                    <span className="low-stock-name">{product.name}</span>
                    <span className="low-stock-sku">SKU: {product.sku}</span>
                    <span className="low-stock-badge">
                      In Stock: <strong className="text-warning">{product.quantity_in_stock}</strong>
                    </span>
                  </div>
                  <div className="quick-refill">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      className="refill-input"
                      value={replenishQty[product.id] || ''}
                      onChange={(e) => setReplenishQty({ ...replenishQty, [product.id]: e.target.value })}
                    />
                    <button
                      className="btn-primary btn-refill"
                      onClick={() => handleQuickReplenish(product.id, product.quantity_in_stock, product.sku, product.price, product.name)}
                    >
                      Refill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Visual Panel */}
        <div className="glass-card detail-panel">
          <div className="panel-header">
            <h3 className="panel-title">📊 Inventory Breakdown</h3>
          </div>

          <div className="chart-container">
            {low_stock_products.length > 0 ? (
              <div className="chart-wrapper">
                <p className="chart-desc">Critical stock vs minimum recommended buffer.</p>
                <div className="custom-chart">
                  {low_stock_products.slice(0, 5).map((p) => {
                    const pct = Math.min((p.quantity_in_stock / 10) * 100, 100);
                    return (
                      <div key={p.id} className="chart-bar-group">
                        <div className="chart-bar-label">
                          <span>{p.name}</span>
                          <span>{p.quantity_in_stock} / 10 units</span>
                        </div>
                        <div className="chart-bar-track">
                          <div
                            className="chart-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct <= 30 ? 'var(--color-error)' : 'var(--color-warning)'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="chart-empty">
                <svg width="120" height="120" viewBox="0 0 100 100" className="radial-graph">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="var(--accent)" strokeWidth="8" fill="transparent"
                          strokeDasharray="251.2" strokeDashoffset="50" strokeLinecap="round" />
                  <text x="50%" y="53%" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">Healthy</text>
                </svg>
                <p className="chart-desc">Warehouse stock levels are optimal.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
