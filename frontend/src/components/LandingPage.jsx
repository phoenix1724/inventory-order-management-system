import React, { useState } from 'react';

export default function LandingPage({ onLaunchConsole }) {
  const [activeTab, setActiveTab] = useState('orders');

  const apiPayloads = {
    products: {
      url: "POST /products",
      req: {
        name: "Mechanical Keyboard",
        sku: "KB-MECH-87",
        price: 89.99,
        quantity_in_stock: 45
      },
      res: {
        id: 1,
        name: "Mechanical Keyboard",
        sku: "KB-MECH-87",
        price: 89.99,
        quantity_in_stock: 45
      }
    },
    customers: {
      url: "POST /customers",
      req: {
        full_name: "Jane Doe",
        email: "jane.doe@example.com",
        phone_number: "+1234567890"
      },
      res: {
        id: 10,
        full_name: "Jane Doe",
        email: "jane.doe@example.com",
        phone_number: "+1234567890"
      }
    },
    orders: {
      url: "POST /orders",
      req: {
        customer_id: 10,
        items: [
          { product_id: 1, quantity: 2 }
        ]
      },
      res: {
        id: 101,
        customer_id: 10,
        order_date: "2026-06-01T14:30:00Z",
        total_amount: 179.98,
        items: [
          { product_id: 1, quantity: 2, unit_price: 89.99 }
        ]
      }
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="logo-icon">▲</div>
          <span className="logo-text">APEX<span className="logo-accent">SYS</span></span>
        </div>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#architecture">Architecture</a>
          <a href="#api">Interactive API</a>
        </nav>
        <button className="btn-primary" onClick={onLaunchConsole}>
          Launch Console
        </button>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-pill">✨ Relational Inventory & Order Infrastructure</span>
          <h1 className="hero-title">
            Supply Operations, <br />
            <span className="gradient-text">Streamlined for Scale.</span>
          </h1>
          <p className="hero-subtitle">
            A production-ready microservice framework combining FastAPI's asynchronous core, React client SPA, and PostgreSQL's transaction boundaries.
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-lg" onClick={onLaunchConsole}>
              Open Console Dashboard
            </button>
            <a href="#features" className="btn-secondary btn-lg">
              Explore Features
            </a>
          </div>
        </div>

        {/* Interactive Mock Shell/Terminal */}
        <div className="hero-visual">
          <div className="terminal-window glass-card">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <span className="terminal-title">api_sandbox.sh</span>
            </div>
            
            <div className="terminal-tabs">
              <button 
                className={`terminal-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                Place Order
              </button>
              <button 
                className={`terminal-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Create Product
              </button>
              <button 
                className={`terminal-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
              >
                Register Customer
              </button>
            </div>

            <div className="terminal-body">
              <div className="terminal-line">
                <span className="term-prompt">$</span> curl -X POST "{apiPayloads[activeTab].url}" \
              </div>
              <div className="terminal-line indent">
                -H "Content-Type: application/json" \
              </div>
              <div className="terminal-line indent">
                -d '{JSON.stringify(apiPayloads[activeTab].req, null, 2)}'
              </div>
              
              <div className="terminal-spacer"></div>
              
              <div className="terminal-line text-muted">
                HTTP/1.1 201 Created
              </div>
              <pre className="terminal-json">
                {JSON.stringify(apiPayloads[activeTab].res, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="section-container">
        <div className="section-header-center">
          <h2>Transactional Integrity. Real-time Monitoring.</h2>
          <p>Engineered to prevent supply race conditions and guarantee data durability.</p>
        </div>

        <div className="grid-cols-3 features-grid">
          <div className="glass-card feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>ACID Checkouts</h3>
            <p>
              Row-locking database queries ensure inventory is checked and deducted atomically, rolling back during stock shortages.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon">🔑</div>
            <h3>Unique Key Guarantees</h3>
            <p>
              Case-sensitive uniqueness checks reject duplicate SKU listings and emails natively at both database and payload validations.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-icon">📈</div>
            <h3>Low Stock Warnings</h3>
            <p>
              Real-time calculations automatically report warehouse products dipping below threshold levels, offering one-click refill paths.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="section-container bg-dark-glow">
        <div className="section-header-center">
          <h2>System Orchestration</h2>
          <p>Divided into isolated services connected via private secure network bands.</p>
        </div>

        <div className="architecture-layout glass-card">
          <div className="arch-node">
            <div className="arch-badge browser">UI</div>
            <h4>React Client</h4>
            <p>Vite Development Server</p>
            <span className="arch-port">Port 3000</span>
          </div>

          <div className="arch-connector">
            <div className="connector-line"></div>
            <span className="connector-protocol">REST API</span>
          </div>

          <div className="arch-node">
            <div className="arch-badge api">API</div>
            <h4>FastAPI Core</h4>
            <p>Python Uvicorn Engine</p>
            <span className="arch-port">Port 8000</span>
          </div>

          <div className="arch-connector">
            <div className="connector-line"></div>
            <span className="connector-protocol">SQL Driver</span>
          </div>

          <div className="arch-node">
            <div className="arch-badge db">DB</div>
            <h4>PostgreSQL</h4>
            <p>ACID Compliant Storage</p>
            <span className="arch-port">Port 5432</span>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="cta-section">
        <div className="cta-content glass-card">
          <h2>Ready to Explore?</h2>
          <p>Launch the console management application to register inventory, customers, and checkout order items.</p>
          <button className="btn-primary btn-lg" onClick={onLaunchConsole}>
            Launch Console Dashboard
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 Apex Systems Inc. Built for maximum reliability and transactional safety.</p>
      </footer>
    </div>
  );
}
