import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/api";
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiX, FiCheck } from "react-icons/fi";

const InventorySupplier = () => {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/supply");
      setSupplies(res.data.supplies);
    } catch (err) {
      console.error("Failed to load supplies:", err);
      alert("Error loading supplies.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/supply/${editingId}`, form);
        alert("Supplier updated successfully");
      } else {
        await axiosInstance.post("/supply/add", form);
        alert("Supplier added successfully");
      }
      resetForm();
      fetchSupplies();
    } catch (err) {
      console.error("Failed to save supplier:", err);
      alert("Error saving supplier.");
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", address: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (supply) => {
    setForm({
      name: supply.name,
      email: supply.email || "",
      phone: supply.phone || "",
      address: supply.address || "",
    });
    setEditingId(supply._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await axiosInstance.delete(`/supply/${id}`);
      fetchSupplies();
    } catch (err) {
      console.error("Failed to delete supplier:", err);
      alert("Error deleting supplier.");
    }
  };

  const filteredSupplies = supplies.filter(supply =>
    supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supply.email && supply.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supply.phone && supply.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supply.address && supply.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="supplier-management">
      <div className="page-header">
        <h1>Supplier Management</h1>
        <p className="subtitle">Manage your inventory suppliers in one place</p>
      </div>

      <div className="control-panel">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              <FiX />
            </button>
          )}
        </div>
        <button 
          className="btn-add"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <FiPlus /> Add Supplier
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <div className="form-overlay" onClick={resetForm}></div>
          <div className="supplier-form">
            <div className="form-header">
              <h3>{editingId ? "Edit Supplier" : "Add New Supplier"}</h3>
              <button className="btn-close" onClick={resetForm}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Supplier Name<span className="required">*</span></label>
                <input
                  name="name"
                  placeholder="Enter supplier name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  placeholder="Enter full address"
                  value={form.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingId ? "Update Supplier" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="supplier-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading suppliers...</p>
          </div>
        ) : (
          <>
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSupplies.length > 0 ? (
                  filteredSupplies.map((supply) => (
                    <tr key={supply._id}>
                      <td className="supplier-name">{supply.name}</td>
                      <td>{supply.email || "-"}</td>
                      <td>{supply.phone || "-"}</td>
                      <td>{supply.address || "-"}</td>
                      <td className="actions">
                        <button 
                          className="btn-icon edit"
                          onClick={() => handleEdit(supply)}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(supply._id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      {searchTerm ? (
                        <>
                          <div className="no-results-icon">
                            <FiSearch />
                          </div>
                          <p>No suppliers found matching "<strong>{searchTerm}</strong>"</p>
                          <button className="btn-clear-search" onClick={() => setSearchTerm("")}>
                            Clear search
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="empty-state-icon">
                            <FiPlus />
                          </div>
                          <p>No suppliers available</p>
                          <button 
                            className="btn-add-first" 
                            onClick={() => {
                              resetForm();
                              setShowForm(true);
                            }}
                          >
                            Add your first supplier
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredSupplies.length > 0 && (
              <div className="table-footer">
                <p>Showing {filteredSupplies.length} of {supplies.length} suppliers</p>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .supplier-management {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif;
          color: #1f2937;
          background-color: #f9fafb;
          min-height: 100vh;
        }
        
        .page-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
        }
        
        .page-header h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: #111827;
        }
        
        .subtitle {
          color: #6b7280;
          margin: 0;
          font-size: 1rem;
        }
        
        .control-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }
        
        .search-box input {
          width: 100%;
          padding: 0.75rem 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .search-box input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }
        
        .clear-search {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 50%;
        }
        
        .clear-search:hover {
          background-color: #f3f4f6;
          color: #6b7280;
        }
        
        .btn-add {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .btn-add:hover {
          background-color: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .btn-add:active {
          transform: translateY(0);
        }
        
        .form-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .form-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        
        .supplier-form {
          position: relative;
          width: 90%;
          max-width: 600px;
          background-color: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          z-index: 1;
          overflow: hidden;
        }
        
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .form-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        
        .btn-close:hover {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 0;
        }
        
        .form-row .form-group {
          flex: 1;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }
        
        .required {
          color: #ef4444;
          margin-left: 0.125rem;
        }
        
        .form-group input, 
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .form-group input:focus, 
        .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .btn-cancel {
          background-color: white;
          color: #4b5563;
          border: 1px solid #d1d5db;
          padding: 0.75rem 1.25rem;
          border-radius: 0.375rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
        
        .btn-submit {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 0.375rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-submit:hover {
          background-color: #4338ca;
        }
        
        .supplier-table-container {
          background-color: white;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        
        .supplier-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        
        .supplier-table th {
          background-color: #f9fafb;
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: #4b5563;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .supplier-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .supplier-table tr:last-child td {
          border-bottom: none;
        }
        
        .supplier-table tr:hover td {
          background-color: #f9fafb;
        }
        
        .supplier-name {
          font-weight: 500;
          color: #111827;
        }
        
        .actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 0.375rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
        }
        
        .btn-icon.edit {
          color: #4f46e5;
        }
        
        .btn-icon.edit:hover {
          background-color: #eef2ff;
        }
        
        .btn-icon.delete {
          color: #ef4444;
        }
        
        .btn-icon.delete:hover {
          background-color: #fee2e2;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }
        
        .loading-spinner {
          border: 3px solid #e5e7eb;
          border-radius: 50%;
          border-top: 3px solid #4f46e5;
          width: 2rem;
          height: 2rem;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-container p {
          color: #6b7280;
        }
        
        .no-data {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }
        
        .no-results-icon,
        .empty-state-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background-color: #f3f4f6;
          margin: 0 auto 1rem;
          color: #9ca3af;
          font-size: 1.25rem;
        }
        
        .btn-clear-search,
        .btn-add-first {
          background-color: #f3f4f6;
          color: #4b5563;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
        }
        
        .btn-clear-search:hover,
        .btn-add-first:hover {
          background-color: #e5e7eb;
        }
        
        .btn-add-first {
          background-color: #4f46e5;
          color: white;
        }
        
        .btn-add-first:hover {
          background-color: #4338ca;
        }
        
        .table-footer {
          padding: 1rem 1.5rem;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.875rem;
          text-align: right;
        }
        
        .table-footer p {
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .supplier-management {
            padding: 1rem;
          }
          
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          
          .form-actions {
            flex-direction: column-reverse;
            gap: 0.5rem;
          }
          
          .btn-cancel, 
          .btn-submit {
            width: 100%;
          }
          
          .supplier-table th:nth-child(3),
          .supplier-table td:nth-child(3),
          .supplier-table th:nth-child(4),
          .supplier-table td:nth-child(4) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default InventorySupplier;