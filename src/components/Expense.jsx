import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/api';
import { Chart, registerables } from 'chart.js';
import { FiEdit, FiTrash2, FiDownload, FiX, FiPlus, FiFilter, FiCalendar, FiDollarSign, FiFile, FiBarChart2, FiPieChart, FiPaperclip, FiEye } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal';

// Register Chart.js components
Chart.register(...registerables);

// Set app element for accessibility
Modal.setAppElement('#root');

const categories = [
  'Rent', 'Salaries', 'Ingredients', 'Utilities', 'Maintenance',
  'Marketing', 'Equipment', 'Licensing', 'Cleaning Supplies', 'Taxes', 'Other'
];
const paymentMethods = ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Cheque', 'Other'];
const statuses = ['Pending', 'Paid', 'Disputed'];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatAttachmentUrl = (url) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5176';
  if (url.includes(FRONTEND_URL)) return url.replace(FRONTEND_URL, API_URL);
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const getFilenameFromPath = (path) => path ? path.split('/').pop().split('\\').pop() : 'Unknown file';

const getFileIcon = (filename) => {
  if (!filename) return <FiFile />;

  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return <span className="text-red-500">PDF</span>;
    case 'doc':
    case 'docx':
      return <span className="text-blue-500">DOC</span>;
    case 'xls':
    case 'xlsx':
      return <span className="text-green-500">XLS</span>;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <span className="text-purple-500">IMG</span>;
    default:
      return <FiFile />;
  }
};

const ExpenseForm = ({ expense, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    category: expense?.category || '',
    amount: expense?.amount || '',
    paymentMethod: expense?.paymentMethod || 'Cash',
    paidTo: expense?.paidTo || '',
    expenseDate: expense?.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: expense?.status || 'Paid',
    notes: expense?.notes || ''
  });
  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(expense?.attachments || []);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleRemoveExistingAttachment = async (attachmentId) => {
    if (!attachmentId || !expense?._id) {
      setError('Invalid attachment or expense ID');
      return;
    }

    try {
      await axiosInstance.delete(`/expenses/${expense._id}/attachments/${attachmentId}`);
      setExistingAttachments(existingAttachments.filter(a => a._id !== attachmentId));
      toast.success('Attachment removed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove attachment');
      toast.error('Failed to remove attachment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Only append new files, not existing attachments
    files.forEach(file => data.append('attachments', file));
    
    // Include existing attachment IDs to preserve them
    if (expense?._id) {
      existingAttachments.forEach(attachment => {
        data.append('existingAttachments', attachment._id);
      });
    }

    try {
      const response = expense?._id
        ? await axiosInstance.put(`/expenses/${expense._id}`, data)
        : await axiosInstance.post('/expenses/add', data);
      onSave(response.data.data);
      toast.success(`Expense ${expense?._id ? 'updated' : 'added'} successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense');
      toast.error(`Failed to ${expense?._id ? 'update' : 'add'} expense`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAttachment = (e, attachmentUrl) => {
    e.preventDefault();
    try {
      const url = formatAttachmentUrl(attachmentUrl);
      window.open(url, '_blank');
    } catch (error) {
      setError('Failed to open attachment.');
      toast.error('Failed to open attachment');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiX size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Amount (₹) *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FiDollarSign />
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Paid To</label>
            <input
              type="text"
              name="paidTo"
              value={formData.paidTo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Expense Date *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FiCalendar />
              </span>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Attachments</label>
          <div className="flex items-center">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 transition-colors">
              <span>Choose Files</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <span className="ml-2 text-sm text-gray-500">
              {files.length > 0 ? `${files.length} file(s) selected` : 'No files selected'}
            </span>
          </div>

          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getFileIcon(file.name)}
                    <span className="text-sm truncate max-w-xs ml-2">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}

          {existingAttachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Attachments</h4>
              <div className="space-y-1">
                {existingAttachments.map(attachment => (
                  <div key={attachment._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getFileIcon(attachment.filename)}
                      <span className="text-sm ml-2">{attachment.filename}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleViewAttachment(e, attachment.url)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <FiEye />
                      </button>
                      <a
                        href={`${axiosInstance.defaults.baseURL}/expenses/attachments/${attachment._id}`}
                        download
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="Download"
                      >
                        <FiDownload />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingAttachment(attachment._id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remove"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ExpenseList = ({ expenses, onEdit, onDelete }) => {
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [viewError, setViewError] = useState('');
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const toggleExpand = (id) => {
    setExpandedExpense(expandedExpense === id ? null : id);
  };

  const handleViewAttachment = (e, attachmentUrl) => {
    e.preventDefault();
    try {
      const url = formatAttachmentUrl(attachmentUrl);
      window.open(url, '_blank');
    } catch (error) {
      setViewError('Failed to open attachment.');
      toast.error('Failed to open attachment');
    }
  };

  const openDeleteModal = (expenseId) => {
    setExpenseToDelete(expenseId);
    setDeleteModalIsOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalIsOpen(false);
    setExpenseToDelete(null);
  };

  const confirmDelete = () => {
    onDelete(expenseToDelete);
    closeDeleteModal();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Expense Records</h2>
      </div>

      {viewError && (
        <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {viewError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No expenses found
                </td>
              </tr>
            ) : (
              expenses.map(expense => (
                <React.Fragment key={expense._id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(expense._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                          <div className="text-sm text-gray-500">{expense.paidTo}</div>
                        </div>
                        {expense.attachments?.length > 0 && (
                          <span className="ml-2 text-gray-400" title="Has attachments">
                            <FiPaperclip />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${expense.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                        className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDeleteModal(expense._id); }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                  {expandedExpense === expense._id && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Method:</span> {expense.paymentMethod}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {expense.notes || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                            {expense.attachments?.length > 0 ? (
                              <div className="space-y-1">
                                {expense.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                                    <div className="flex items-center">
                                      {getFileIcon(attachment)}
                                      <button
                                        onClick={(e) => handleViewAttachment(e, attachment)}
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline ml-2"
                                      >
                                        {getFilenameFromPath(attachment)}
                                      </button>
                                    </div>
                                    <a
                                      href={`${axiosInstance.defaults.baseURL}/expenses/attachments/${expense._id}/${encodeURIComponent(attachment)}`}
                                      download
                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                      title="Download"
                                    >
                                      <FiDownload />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No attachments</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalIsOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Expense Confirmation"
        className="outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
          <p className="mb-6">Are you sure you want to delete this expense? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ExpenseAnalytics = ({ expenses }) => {
  const categoryChartRef = useRef(null);
  const monthlyTrendChartRef = useRef(null);
  const paymentMethodChartRef = useRef(null);
  const categoryChartInstance = useRef(null);
  const monthlyTrendChartInstance = useRef(null);
  const paymentMethodChartInstance = useRef(null);

  useEffect(() => {
    // Destroy previous chart instances
    if (categoryChartInstance.current) categoryChartInstance.current.destroy();
    if (monthlyTrendChartInstance.current) monthlyTrendChartInstance.current.destroy();
    if (paymentMethodChartInstance.current) paymentMethodChartInstance.current.destroy();

    // Prepare data for charts
    const categoryData = categories.reduce((acc, cat) => {
      acc[cat] = expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + Number(exp.amount), 0);
      return acc;
    }, {});

    // Group by month
    const monthlyData = expenses.reduce((acc, exp) => {
      const date = new Date(exp.expenseDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthYear]) {
        acc[monthYear] = 0;
      }
      acc[monthYear] += Number(exp.amount);
      return acc;
    }, {});

    const paymentMethodData = paymentMethods.reduce((acc, method) => {
      acc[method] = expenses.filter(exp => exp.paymentMethod === method).length;
      return acc;
    }, {});

    // Category Distribution Chart (Doughnut)
    categoryChartInstance.current = new Chart(categoryChartRef.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8AC24A', '#607D8B', '#9C27B0', '#E91E63', '#00BCD4'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: 'Expense by Category',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    // Monthly Trend Chart (Line)
    const sortedMonths = Object.keys(monthlyData).sort();
    monthlyTrendChartInstance.current = new Chart(monthlyTrendChartRef.current, {
      type: 'line',
      data: {
        labels: sortedMonths.map(month => {
          const [year, monthNum] = month.split('-');
          return new Date(year, monthNum - 1).toLocaleDateString('default', { month: 'short', year: 'numeric' });
        }),
        datasets: [{
          label: 'Monthly Expenses',
          data: sortedMonths.map(month => monthlyData[month]),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Expense Trend',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatCurrency(value);
              }
            }
          }
        }
      }
    });

    // Payment Method Chart (Bar)
    paymentMethodChartInstance.current = new Chart(paymentMethodChartRef.current, {
      type: 'bar',
      data: {
        labels: Object.keys(paymentMethodData),
        datasets: [{
          label: 'Number of Transactions',
          data: Object.values(paymentMethodData),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Transactions by Payment Method',
            font: {
              size: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });

    return () => {
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();
      if (monthlyTrendChartInstance.current) monthlyTrendChartInstance.current.destroy();
      if (paymentMethodChartInstance.current) paymentMethodChartInstance.current.destroy();
    };
  }, [expenses]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Expense Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <FiPieChart className="text-blue-500 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Category Distribution</h3>
          </div>
          <div className="h-64">
            <canvas ref={categoryChartRef} />
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <FiBarChart2 className="text-blue-500 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
          </div>
          <div className="h-64">
            <canvas ref={paymentMethodChartRef} />
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center mb-3">
          <FiBarChart2 className="text-blue-500 mr-2" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Monthly Expense Trend</h3>
        </div>
        <div className="h-64">
          <canvas ref={monthlyTrendChartRef} />
        </div>
      </div>
    </div>
  );
};

const MonthlySummary = () => {
  const [summary, setSummary] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/expenses/summary/month?year=${year}&month=${month}`);
      setSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [year, month]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Monthly Summary</h2>
        <div className="flex items-center space-x-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Year"
          />
          <button
            onClick={fetchSummary}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Go'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.total)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Number of Expenses</p>
            <p className="text-xl font-bold text-green-600">{summary.expenses.length}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Average per Expense</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(summary.total / (summary.expenses.length || 1))}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const CompareMonths = () => {
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchComparison = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/expenses/summary/compare');
      
      // Process comparison data to avoid NaN values
      const data = response.data;
      if (data) {
        // Handle case when lastMonth.total is 0 (would cause division by zero)
        if (data.lastMonth.total === 0) {
          data.percentageChange = data.currentMonth.total > 0 ? 100 : 0; // 100% increase if current > 0, 0% if current = 0
        } else {
          // Calculate percentage change correctly ((current - last) / last) * 100
          data.percentageChange = ((data.currentMonth.total - data.lastMonth.total) / Math.abs(data.lastMonth.total)) * 100;
        }
      }
      
      setComparison(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch comparison');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const getChangeClass = (value) => {
    if (value > 0) return 'text-red-600';
    if (value < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Month-to-Month Comparison</h2>
        <button
          onClick={fetchComparison}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : comparison ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Month</p>
            <p className="text-xl font-bold text-blue-600">
              {new Date(comparison.currentMonth.year, comparison.currentMonth.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(comparison.currentMonth.total)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Previous Month</p>
            <p className="text-xl font-bold text-green-600">
              {new Date(comparison.lastMonth.year, comparison.lastMonth.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(comparison.lastMonth.total)}</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Difference</p>
              <p className={`text-xl font-bold ${getChangeClass(comparison.difference)}`}>
                {formatCurrency(Math.abs(comparison.difference))} ({comparison.difference > 0 ? 'Increase' : 'Decrease'})
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Percentage Change</p>
              <p className={`text-xl font-bold ${getChangeClass(comparison.percentageChange)}`}>
                {isFinite(comparison.percentageChange) ? `${Math.abs(comparison.percentageChange).toFixed(2)}%` : '0.00%'}
                {comparison.percentageChange > 0 ? ' (Increase)' : comparison.percentageChange < 0 ? ' (Decrease)' : ''}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const DateRangeFilter = ({ onFilter }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  const handleFilter = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsFiltering(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/expenses/by-date-range?startDate=${startDate}&endDate=${endDate}`);
      onFilter(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setError('');
    onFilter([]); // Reset to fetch all expenses
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Filter Expenses by Date</h2>
        <FiFilter className="text-blue-500" size={24} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <div className="relative mb-4 sm:mb-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <FiCalendar />
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Start Date"
          />
        </div>
        <div className="relative mb-4 sm:mb-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <FiCalendar />
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="End Date"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleFilter}
            disabled={isFiltering}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isFiltering ? 'Filtering...' : 'Apply Filter'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchExpenses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/expenses');
      setExpenses(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
      toast.error('Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSave = (savedExpense) => {
    setExpenses(prev => {
      if (editingExpense) {
        return prev.map(exp => exp._id === savedExpense._id ? savedExpense : exp);
      }
      return [savedExpense, ...prev];
    });
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(exp => exp._id !== id));
      toast.success('Expense deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense');
      toast.error('Failed to delete expense');
    }
  };

  const handleFilter = (filteredExpenses) => {
    if (filteredExpenses.length === 0) {
      fetchExpenses(); // Reset to all expenses if filter returns empty
    } else {
      setExpenses(filteredExpenses);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Expense Management Dashboard</h1>
          <button
            onClick={() => { setShowForm(true); setEditingExpense(null); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <FiPlus className="mr-2" />
            Add Expense
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {showForm && (
              <ExpenseForm
                expense={editingExpense}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingExpense(null); }}
              />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlySummary />
              <CompareMonths />
            </div>
            <DateRangeFilter onFilter={handleFilter} />
            <ExpenseAnalytics expenses={expenses} />
            <ExpenseList
              expenses={expenses}
              onEdit={(expense) => { setEditingExpense(expense); setShowForm(true); }}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Expense;