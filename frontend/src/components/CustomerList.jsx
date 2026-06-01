import React, { useState } from 'react';

export default function CustomerList({ customers, refreshData, API_URL, addToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formName.trim() || !formEmail.trim()) {
      addToast("Full name and Email are required.", "warning");
      return;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      addToast("Please enter a valid email address.", "warning");
      return;
    }

    const payload = {
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone_number: formPhone.trim() || null
    };

    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to register customer.");
      }

      addToast(`Customer "${payload.full_name}" registered successfully.`, "success");
      setIsModalOpen(false);
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove customer "${name}"?\nThis action will fail if the customer has existing orders.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to remove customer.");
      }

      addToast(`Customer "${name}" removed.`, "success");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Customers</h1>
          <p className="view-subtitle">Register and oversee customer directory profiles.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          👤 Register Customer
        </button>
      </div>

      {/* Control bar */}
      <div className="control-bar glass-card">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="results-count">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-card table-panel">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>No customers found matching the search criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>
                      <div className="user-profile-cell">
                        <span className="user-avatar">{customer.full_name.charAt(0).toUpperCase()}</span>
                        <span className="user-name">{customer.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${customer.email}`} className="email-link">{customer.email}</a>
                    </td>
                    <td>{customer.phone_number || <span className="text-muted">No phone</span>}</td>
                    <td className="actions-cell">
                      <button className="btn-danger btn-sm" onClick={() => handleDeleteCustomer(customer.id, customer.full_name)}>
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Registration Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3 className="modal-title">👤 Register Customer</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane.doe@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
