import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiTrash2, FiUserPlus, FiSearch, FiLoader, FiMenu } from "react-icons/fi";
import { BsShieldLock, BsPerson } from "react-icons/bs";
import { RiAdminLine } from "react-icons/ri";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("ims_token");
      const endpoint = editingId ? `/users/${editingId}` : "/users/add";
      const method = editingId ? "put" : "post";
      
      const response = await axiosInstance[method](endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        fetchUsers();
        resetForm();
        if (window.innerWidth < 1024) {
          setShowForm(false);
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      address: user.address,
      email: user.email,
      password: "",
      role: user.role,
    });
    setEditingId(user._id);
    
    // Show form when editing on mobile
    if (window.innerWidth < 1024) {
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      email: "",
      password: "",
      role: "",
    });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axiosInstance.delete(`/users/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        });
        if (response.data.success) {
          setUsers(prev => prev.filter(user => user._id !== id));
          setFilteredUsers(prev => prev.filter(user => user._id !== id));
        }
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <RiAdminLine className="text-purple-600" />;
      case "user":
        return <BsPerson className="text-blue-500" />;
      default:
        return <BsShieldLock className="text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "user":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-lg text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-2xl md:text-3xl font-bold text-gray-800"
        >
          User Management
        </motion.h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Mobile-only Add/Edit button */}
          <button 
            onClick={toggleForm}
            className="lg:hidden flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? (
              "Hide Form"
            ) : (
              <>
                <FiUserPlus className="mr-2" />
                {editingId ? "Edit User" : "Add User"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit User Form */}
        <div className={`lg:col-span-1 ${!showForm && 'hidden lg:block'}`}>
          <motion.div 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <h2 className="text-xl font-semibold flex items-center">
                <FiUserPlus className="mr-2" />
                {editingId ? "Edit User" : "Add New User"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required={!editingId}
                  minLength={editingId ? 0 : 6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St, City"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
                  required
                >
                  <option value="">Select a role</option>
                  <option value="admin">Administrator</option>
                  <option value="user">Manager</option>
                </select>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium transition ${
                    isSubmitting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : editingId ? (
                    "Update User"
                  ) : (
                    "Add User"
                  )}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>

        {/* Users Table */}
        <div className={`lg:col-span-2 ${showForm && 'mt-8 lg:mt-0'}`}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <h2 className="text-xl font-semibold flex items-center">
                <BsShieldLock className="mr-2" />
                User Directory
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
              </p>
            </div>
            
            {/* Mobile Card View */}
            <div className="block lg:hidden">
              {filteredUsers.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              {getRoleIcon(user.role)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                              {user.address && (
                                <div className="text-xs text-gray-500 mt-1">{user.address}</div>
                              )}
                              <div className="mt-1">
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getRoleColor(
                                    user.role
                                  )}`}
                                >
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-blue-600 hover:text-blue-900 p-1 transition"
                              title="Edit user"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="text-red-600 hover:text-red-900 p-1 transition"
                              title="Delete user"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-400">
                  <FiSearch className="text-3xl mb-2" />
                  <p>No users found matching your criteria</p>
                </div>
              )}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                {getRoleIcon(user.role)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.address}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(
                                user.role
                              )}`}
                            >
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleEdit(user)}
                                className="text-blue-600 hover:text-blue-900 transition"
                                title="Edit user"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="text-red-600 hover:text-red-900 transition"
                                title="Delete user"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-32"
                      >
                        <td colSpan="4" className="text-center py-10">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FiSearch className="text-3xl mb-2" />
                            <p>No users found matching your criteria</p>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Users;