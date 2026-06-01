import React, { useState } from 'react';

export default function ProductList({ products, refreshData, API_URL, addToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding a new product

  // Form states
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('');
    setFormPrice('');
    setFormStock('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormPrice(product.price.toString());
    setFormStock(product.quantity_in_stock.toString());
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!formName.trim() || !formSku.trim()) {
      addToast("Name and SKU are required.", "warning");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      addToast("Price must be a positive number.", "warning");
      return;
    }

    const stockNum = parseInt(formStock);
    if (isNaN(stockNum) || stockNum < 0) {
      addToast("Quantity in stock cannot be negative.", "warning");
      return;
    }

    const payload = {
      name: formName.trim(),
      sku: formSku.trim(),
      price: priceNum,
      quantity_in_stock: stockNum
    };

    try {
      let url = `${API_URL}/products`;
      let method = 'POST';

      if (editingProduct) {
        url = `${API_URL}/products/${editingProduct.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to save product.");
      }

      addToast(
        editingProduct 
          ? `Product "${payload.name}" updated successfully.`
          : `Product "${payload.name}" created successfully.`,
        "success"
      );
      
      setIsModalOpen(false);
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to delete product.");
      }

      addToast(`Product "${name}" deleted.`, "success");
      refreshData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Product Catalog</h1>
          <p className="view-subtitle">Manage items, tracking codes, and stock levels.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          ➕ Add Product
        </button>
      </div>

      {/* Control bar */}
      <div className="control-bar glass-card">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by Name or SKU..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="results-count">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-card table-panel">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>No products found matching the criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLow = product.quantity_in_stock < 10;
                  return (
                    <tr key={product.id} className={isLow ? "row-warning" : ""}>
                      <td>{product.id}</td>
                      <td>
                        <div className="product-table-name">{product.name}</div>
                      </td>
                      <td>
                        <code className="sku-code">{product.sku}</code>
                      </td>
                      <td className="text-bold">${parseFloat(product.price).toFixed(2)}</td>
                      <td>
                        <span className={`stock-pill ${isLow ? "pill-warning" : "pill-success"}`}>
                          {product.quantity_in_stock} Units
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="btn-secondary btn-sm" onClick={() => openEditModal(product)}>
                          ✏️ Edit
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteProduct(product.id, product.name)}>
                          🗑️ Delete
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

      {/* Product Edit/Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? '✏️ Edit Product' : '📦 Create New Product'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Keyboard"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU (Unique Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KB-MECH-87"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                />
              </div>

              <div className="form-cols">
                <div className="form-group">
                  <label className="form-label">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="89.99"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="45"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
