import React, { useState } from 'react';

export default function OrderList({ orders, products, customers, refreshData, API_URL, addToast }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // Detailed view modal

  // Wizard state
  const [wizardCustomerId, setWizardCustomerId] = useState('');
  const [wizardItems, setWizardItems] = useState([{ product_id: '', quantity: 1 }]);

  // Open wizard
  const openWizard = () => {
    if (customers.length === 0) {
      addToast("Please register at least one customer before creating orders.", "warning");
      return;
    }
    if (products.length === 0) {
      addToast("Please add at least one product before creating orders.", "warning");
      return;
    }
    setWizardCustomerId(customers[0].id.toString());
    setWizardItems([{ product_id: products[0].id.toString(), quantity: 1 }]);
    setIsWizardOpen(true);
  };

  // Add item row in wizard
  const addWizardItem = () => {
    setWizardItems([...wizardItems, { product_id: products[0].id.toString(), quantity: 1 }]);
  };

  // Remove item row in wizard
  const removeWizardItem = (index) => {
    if (wizardItems.length === 1) return;
    setWizardItems(wizardItems.filter((_, i) => i !== index));
  };

  // Handle wizard item field changes
  const handleWizardItemChange = (index, field, value) => {
    const updated = [...wizardItems];
    updated[index][field] = value;
    setWizardItems(updated);
  };

  // Real-time pre-calculated total
  const calculateEstimatedTotal = () => {
    let total = 0;
    wizardItems.forEach(item => {
      const prod = products.find(p => p.id.toString() === item.product_id);
      const qty = parseInt(item.quantity) || 0;
      if (prod && qty > 0) {
        total += parseFloat(prod.price) * qty;
      }
    });
    return total;
  };

  // Place Order submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!wizardCustomerId) {
      addToast("Please select a customer.", "warning");
      return;
    }

    // Format items payload
    const itemsPayload = [];
    for (let i = 0; i < wizardItems.length; i++) {
      const it = wizardItems[i];
      const prodId = parseInt(it.product_id);
      const qty = parseInt(it.quantity);

      if (isNaN(prodId) || prodId <= 0) {
        addToast(`Invalid product selected at row ${i + 1}`, "warning");
        return;
      }
      if (isNaN(qty) || qty <= 0) {
        addToast(`Quantity must be greater than 0 at row ${i + 1}`, "warning");
        return;
      }

      // Check client side stock limits as immediate warning
      const targetProd = products.find(p => p.id === prodId);
      if (targetProd && targetProd.quantity_in_stock < qty) {
        addToast(`Insufficient stock for "${targetProd.name}". Available: ${targetProd.quantity_in_stock}, requested: ${qty}.`, "warning");
        return;
      }

      // Check duplicates in selected items list
      const duplicate = itemsPayload.find(p => p.product_id === prodId);
      if (duplicate) {
        duplicate.quantity += qty;
      } else {
        itemsPayload.push({ product_id: prodId, quantity: qty });
      }
    }

    const payload = {
      customer_id: parseInt(wizardCustomerId),
      items: itemsPayload
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to place order.");
      }

      addToast("Order checked out successfully!", "success");
      setIsWizardOpen(false);
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Cancel order (restore inventory)
  const handleCancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?\nThis will remove the transaction and restore product stock.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to cancel order.");
      }

      addToast("Order canceled and stock quantities restored.", "success");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Order Directory</h1>
          <p className="view-subtitle">Monitor invoices, checkout logs, and transaction states.</p>
        </div>
        <button className="btn-primary" onClick={openWizard}>
          🛍️ Create Order Wizard
        </button>
      </div>

      {/* Table grid */}
      <div className="glass-card table-panel">
        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💸</span>
            <p>No orders recorded in the system.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Items Count</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const dateStr = new Date(order.order_date).toLocaleString();
                  const totalItemsQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>
                        <span className="text-bold">{order.customer_name}</span>
                      </td>
                      <td className="text-muted">{dateStr}</td>
                      <td className="text-bold text-accent">${parseFloat(order.total_amount).toFixed(2)}</td>
                      <td>{totalItemsQty} units</td>
                      <td className="actions-cell">
                        <button className="btn-secondary btn-sm" onClick={() => setSelectedOrder(order)}>
                          👁️ View Info
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => handleCancelOrder(order.id)}>
                          🚫 Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content glass-card detailed-order-modal">
            <div className="modal-header">
              <h3 className="modal-title">📄 Order Details #{selectedOrder.id}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            <div className="order-details-info">
              <div className="info-row">
                <span className="info-label">Customer:</span>
                <span className="info-value">{selectedOrder.customer_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date Placed:</span>
                <span className="info-value">{new Date(selectedOrder.order_date).toLocaleString()}</span>
              </div>
            </div>

            <h4 className="section-title-sm">Items Breakdown</h4>
            <div className="modal-items-list">
              {selectedOrder.items_detailed && selectedOrder.items_detailed.map((item, idx) => (
                <div key={idx} className="modal-item-row">
                  <div className="modal-item-info">
                    <span className="modal-item-name">{item.product_name}</span>
                    <span className="modal-item-sku">SKU: {item.product_sku}</span>
                  </div>
                  <div className="modal-item-pricing">
                    <span>{item.quantity} x ${parseFloat(item.unit_price).toFixed(2)}</span>
                    <span className="text-bold">${parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-details-total">
              <span>Grand Total</span>
              <span className="text-accent text-bold">${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card wizard-modal">
            <div className="modal-header">
              <h3 className="modal-title">🛍️ Order Creation Wizard</h3>
              <button className="modal-close-btn" onClick={() => setIsWizardOpen(false)}>×</button>
            </div>
            <form onSubmit={handlePlaceOrder}>
              
              {/* Select Customer */}
              <div className="form-group">
                <label className="form-label">Assign Customer Profile *</label>
                <select
                  required
                  value={wizardCustomerId}
                  onChange={(e) => setWizardCustomerId(e.target.value)}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Section */}
              <div className="wizard-items-header">
                <label className="form-label">Line Items *</label>
                <button type="button" className="btn-secondary btn-sm" onClick={addWizardItem}>
                  ➕ Add Row
                </button>
              </div>

              <div className="wizard-rows-container">
                {wizardItems.map((item, index) => {
                  const selectedProd = products.find(p => p.id.toString() === item.product_id);
                  const availableStock = selectedProd ? selectedProd.quantity_in_stock : 0;
                  const itemPrice = selectedProd ? parseFloat(selectedProd.price) : 0;
                  
                  return (
                    <div key={index} className="wizard-item-row-edit glass-card">
                      <div className="wizard-row-fields">
                        
                        {/* Select Product */}
                        <div className="form-group row-field-prod">
                          <label className="form-label-sub">Product</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleWizardItemChange(index, 'product_id', e.target.value)}
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (${parseFloat(p.price).toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="form-group row-field-qty">
                          <label className="form-label-sub">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleWizardItemChange(index, 'quantity', e.target.value)}
                          />
                        </div>

                        {/* Status / Preview */}
                        <div className="row-field-status">
                          <span className="row-stock-status">
                            Stock: <strong className={availableStock < parseInt(item.quantity) ? "text-error" : ""}>{availableStock}</strong>
                          </span>
                          <span className="row-subtotal">
                            Sub: <strong>${(itemPrice * (parseInt(item.quantity) || 0)).toFixed(2)}</strong>
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          className="btn-danger btn-icon-sm"
                          disabled={wizardItems.length === 1}
                          onClick={() => removeWizardItem(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal Preview */}
              <div className="wizard-estimated-summary">
                <div className="estimate-label">Estimated Total Amount</div>
                <div className="estimate-value">${calculateEstimatedTotal().toFixed(2)}</div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsWizardOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Place Order & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
