import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiSearch, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiClock, 
  FiAward, 
  FiCalendar,
  FiUser,
  FiInfo,
  FiAlertCircle,
  FiXCircle
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Update the helper function at the top of your file
const getImageUrl = (filename) => {
  if (!filename) return null;
  // Remove any leading slash if present
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  // Directly point to the uploads folder without /api prefix
  return `${import.meta.env.VITE_API_URL}/uploads/${cleanFilename}`;
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    experienceYears: 0,
    availability: [],
    notes: "",
    profilePicture: null
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);

  const specializationOptions = [
    "Head Chef",
    "Sous Chef",
    "Pastry Chef",
    "Grill Chef",
    "Prep Chef",
    "Other"
  ];

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const statusOptions = ["Active", "On Leave", "Terminated"];

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/supplier", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      if (response.data.success) {
        setSuppliers(response.data.suppliers);
        setFilteredSuppliers(response.data.suppliers);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch chefs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.specialization && supplier.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePicture: file }));
      setFilePreview(URL.createObjectURL(file));
      setRemoveProfilePicture(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({ ...prev, profilePicture: null }));
    setFilePreview(null);
    setRemoveProfilePicture(true);
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => {
      const existingDayIndex = prev.availability.findIndex(a => a.day === day);
      
      if (existingDayIndex >= 0) {
        const updatedAvailability = [...prev.availability];
        updatedAvailability[existingDayIndex] = {
          ...updatedAvailability[existingDayIndex],
          [field]: value
        };
        
        if (field === 'status' && value !== 'On Leave') {
          const allOnLeave = updatedAvailability.every(avail => avail.status === 'On Leave');
          setIsOnLeave(allOnLeave);
        }
        
        return { ...prev, availability: updatedAvailability };
      } else {
        return {
          ...prev,
          availability: [
            ...prev.availability,
            { day, status: "Active" }
          ]
        };
      }
    });
  };

  const toggleOnLeave = () => {
    const newOnLeaveState = !isOnLeave;
    setIsOnLeave(newOnLeaveState);
    
    if (newOnLeaveState) {
      const updatedAvailability = daysOfWeek.map(day => ({
        day,
        status: "On Leave"
      }));
      setFormData(prev => ({ ...prev, availability: updatedAvailability }));
    } else {
      const updatedAvailability = daysOfWeek.map(day => ({
        day,
        status: "Active"
      }));
      setFormData(prev => ({ ...prev, availability: updatedAvailability }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning("Chef name is required");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    if (formData.specialization) formDataToSend.append("specialization", formData.specialization);
    formDataToSend.append("experienceYears", formData.experienceYears);
    if (formData.availability.length > 0) {
      formDataToSend.append("availability", JSON.stringify(formData.availability));
    }
    if (formData.notes) formDataToSend.append("notes", formData.notes);
    if (formData.profilePicture) {
      formDataToSend.append("profilePicture", formData.profilePicture);
    }
    if (removeProfilePicture) {
      formDataToSend.append("removeProfilePicture", "true");
    }

    try {
      if (editingId) {
        const response = await axiosInstance.put(`/supplier/${editingId}`, formDataToSend, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("ims_token")}`,
            "Content-Type": "multipart/form-data"
          },
        });
        if (response.data.success) {
          toast.success("Chef updated successfully");
          fetchSuppliers();
        }
      } else {
        const response = await axiosInstance.post("/supplier/add", formDataToSend, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("ims_token")}`,
            "Content-Type": "multipart/form-data"
          },
        });
        if (response.data.success) {
          toast.success("Chef added successfully");
          fetchSuppliers();
        }
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Operation failed");
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier._id);
    setFormData({
      name: supplier.name,
      specialization: supplier.specialization || "",
      experienceYears: supplier.experienceYears || 0,
      availability: supplier.availability || [],
      notes: supplier.notes || "",
      profilePicture: null
    });
    setFilePreview(supplier.profilePicture ? getImageUrl(supplier.profilePicture) : null);
    setRemoveProfilePicture(false);
    
    const allOnLeave = supplier.availability && 
      supplier.availability.length > 0 && 
      supplier.availability.every(day => day.status === "On Leave");
    setIsOnLeave(allOnLeave);
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this chef?")) {
      try {
        const response = await axiosInstance.delete(`/supplier/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        });
        if (response.data.success) {
          setSuppliers(prev => prev.filter(supplier => supplier._id !== id));
          setFilteredSuppliers(prev => prev.filter(supplier => supplier._id !== id));
          toast.success("Chef deleted successfully");
        }
      } catch (error) {
        toast.error(error.response?.data?.error || error.message || "Delete failed");
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      name: "", 
      specialization: "", 
      experienceYears: 0, 
      availability: [], 
      notes: "",
      profilePicture: null
    });
    setFilePreview(null);
    setIsOnLeave(false);
    setRemoveProfilePicture(false);
  };

  const toggleCardExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "On Leave": return "bg-yellow-100 text-yellow-800";
      case "Terminated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isChefOnLeave = (availability) => {
    return availability && availability.length > 0 && 
      availability.every(day => day.status === "On Leave");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-600">Loading chefs...</p>
        </div>
      </div>
    );
  }

  const MobileCardView = () => (
    <div className="grid grid-cols-1 gap-4 mt-4">
      <AnimatePresence>
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier) => {
            const onLeave = isChefOnLeave(supplier.availability);
            return (
              <motion.div
                key={supplier._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                  onLeave ? 'border-yellow-300' : 'border-gray-100'
                }`}
              >
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer"
                  onClick={() => toggleCardExpand(supplier._id)}
                >
                  <div className="flex items-center">
                    {supplier.profilePicture ? (
                      <img 
                        src={getImageUrl(supplier.profilePicture)} 
                        alt={supplier.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        onLeave ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <FiUser />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className={`text-md font-medium ${
                        onLeave ? 'text-yellow-800' : 'text-gray-900'
                      }`}>
                        {supplier.name}
                        {onLeave && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                            On Leave
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.specialization || "No specialization"}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <FiInfo size={20} />
                  </div>
                </div>
                
                {expandedCard === supplier._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100 px-4 py-3 bg-gray-50"
                  >
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center">
                        <FiAward className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {supplier.specialization || "No specialization"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FiClock className="mr-2 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {supplier.experienceYears ? `${supplier.experienceYears} years experience` : "No experience info"}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <FiCalendar className="mr-2 mt-1 flex-shrink-0 text-gray-500" />
                        <div>
                          <span className="text-sm text-gray-700 block mb-1">Availability:</span>
                          {onLeave ? (
                            <div className="flex items-center">
                              <FiAlertCircle className="mr-2 text-yellow-500" />
                              <span className="text-sm text-yellow-700">On Leave (All Days)</span>
                            </div>
                          ) : supplier.availability && supplier.availability.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {supplier.availability.map((avail, index) => (
                                <div key={index} className="flex flex-col">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {avail.day}
                                  </span>
                                  <span className={`text-xs ${getStatusColor(avail.status)} px-2 py-1 rounded mt-1`}>
                                    {avail.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not specified</span>
                          )}
                        </div>
                      </div>
                      {supplier.notes && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-700">{supplier.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-2 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(supplier);
                        }}
                        className="text-blue-600 hover:text-blue-900 transition p-2"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(supplier._id);
                        }}
                        className="text-red-600 hover:text-red-900 transition p-2"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow p-6 text-center"
          >
            <div className="flex flex-col items-center justify-center text-gray-400">
              <FiSearch className="text-3xl mb-2" />
              <p>No chefs found matching your criteria</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 md:mb-0"
        >
          Chef Management
        </motion.h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chefs..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus className="mr-2" />
            Add Chef
          </motion.button>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chef
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => {
                      const onLeave = isChefOnLeave(supplier.availability);
                      return (
                        <motion.tr
                          key={supplier._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className={`hover:bg-gray-50 ${onLeave ? 'bg-yellow-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {supplier.profilePicture ? (
                                <img 
                                  src={getImageUrl(supplier.profilePicture)} 
                                  alt={supplier.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                  onLeave ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  <FiUser />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className={`text-sm font-medium ${
                                  onLeave ? 'text-yellow-800' : 'text-gray-900'
                                }`}>
                                  {supplier.name}
                                  {onLeave && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                      On Leave
                                    </span>
                                  )}
                                </div>
                                {supplier.notes && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {supplier.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {supplier.specialization || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {supplier.experienceYears ? `${supplier.experienceYears} years` : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {onLeave ? (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                On Leave (All Days)
                              </span>
                            ) : supplier.availability && supplier.availability.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {supplier.availability.map((avail, index) => (
                                  <div key={index} className="flex flex-col">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {avail.day}
                                    </span>
                                    <span className={`text-xs ${getStatusColor(avail.status)} px-2 py-1 rounded mt-1`}>
                                      {avail.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleEdit(supplier)}
                                className="text-blue-600 hover:text-blue-900 transition"
                                title="Edit chef"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => handleDelete(supplier._id)}
                                className="text-red-600 hover:text-red-900 transition"
                                title="Delete chef"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-32"
                    >
                      <td colSpan="5" className="text-center py-10">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FiSearch className="text-3xl mb-2" />
                          <p>No chefs found matching your criteria</p>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <MobileCardView />
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    {editingId ? "Edit Chef" : "Add New Chef"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {filePreview ? (
                      <div className="relative">
                        <img 
                          src={filePreview.startsWith('blob:') ? filePreview : filePreview} 
                          alt="Preview" 
                          className="h-24 w-24 rounded-full object-cover border-4 border-white shadow"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveProfilePicture}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                          title="Remove photo"
                        >
                          <FiXCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-white shadow">
                        <FiUser size={32} />
                      </div>
                    )}
                    {!filePreview && (
                      <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600">
                        <input 
                          type="file" 
                          onChange={handleFileChange} 
                          accept="image/*" 
                          className="hidden"
                        />
                        <FiEdit2 size={16} />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Chef name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Select specialization</option>
                    {specializationOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    min="0"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FiAlertCircle className="text-yellow-500 mr-2" />
                    <span className="font-medium">On Leave</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleOnLeave}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isOnLeave ? 'bg-yellow-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isOnLeave ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability Details
                  </label>
                  <div className="space-y-2">
                    {daysOfWeek.map(day => {
                      const dayAvailability = formData.availability.find(a => a.day === day);
                      return (
                        <div key={day} className={`flex items-center justify-between p-2 border rounded-lg ${
                          isOnLeave ? 'opacity-50' : ''
                        }`}>
                          <span className="text-sm font-medium">{day}</span>
                          <div className="flex items-center space-x-2">
                            <select
                              value={dayAvailability?.status || ""}
                              onChange={(e) => handleAvailabilityChange(day, "status", e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                              disabled={isOnLeave}
                            >
                              <option value="">Not available</option>
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional information about the chef"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    rows="3"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    {editingId ? (
                      <>
                        <FiEdit2 className="mr-2" />
                        Update Chef
                      </>
                    ) : (
                      <>
                        <FiPlus className="mr-2" />
                        Add Chef
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Suppliers;