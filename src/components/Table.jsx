import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Save, X, Search, Loader, AlertTriangle, Table as TableIcon, List } from 'lucide-react';
import axiosInstance from '../utils/api';

const RoomTableManagement = () => {
  // State management
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showTableForm, setShowTableForm] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ type: '', id: '', roomId: '' });
  const [viewMode, setViewMode] = useState('floorPlan');

  // Form data states
  const [roomFormData, setRoomFormData] = useState({
    roomName: '',
    description: '',
    capacity: '',
    location: '',
    isActive: true,
  });

  const [tableFormData, setTableFormData] = useState({
    tableNumber: '',
    seatingCapacity: '',
    tableType: 'standard',
    status: 'available',
  });

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/rooms');
        setRooms(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // Room CRUD operations
  const handleCreateRoom = async (roomData) => {
    try {
      const response = await axiosInstance.post('/rooms/add', roomData);
      setRooms([...rooms, response.data]);
      setShowRoomForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleUpdateRoom = async (roomData) => {
    try {
      const response = await axiosInstance.put(`/rooms/${editingRoom}`, roomData);
      setRooms(rooms.map(room => room._id === editingRoom ? response.data : room));
      setEditingRoom(null);
      setShowRoomForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update room');
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await axiosInstance.delete(`/rooms/${itemToDelete.id}`);
          setRooms(rooms.filter(room => room._id !== itemToDelete.id));  // <-- Fixed variable name
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete room');
    }
  };

  // Table CRUD operations
  const handleAddTable = async (tableData, roomId) => {
    try {
      const response = await axiosInstance.post(`/rooms/${roomId}/tables/add`, tableData);
      setRooms(rooms.map(room => room._id === roomId ? response.data : room));
      setShowTableForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add table');
    }
  };

  const handleUpdateTable = async (tableData) => {
    try {
      const response = await axiosInstance.put(
        `/rooms/${currentRoomId}/tables/${editingTable}`,
        tableData
      );
      setRooms(rooms.map(room => room._id === currentRoomId ? response.data : room));
      setEditingTable(null);
      setShowTableForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update table');
    }
  };

  const handleDeleteTable = async () => {
    try {
      await axiosInstance.delete(
        `/rooms/${itemToDelete.roomId}/tables/${itemToDelete.id}`
      );
      setRooms(rooms.map(room => {
        if (room._id === itemToDelete.roomId) {
          return {
            ...room,
            tables: room.tables.filter(table => table._id !== itemToDelete.id),
          };
        }
        return room;
      }));
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete table');
    }
  };

  // Form handlers
  const handleRoomFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTableFormChange = (e) => {
    const { name, value } = e.target;
    setTableFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoomFormSubmit = (e) => {
    e.preventDefault();
    if (editingRoom) {
      handleUpdateRoom(roomFormData);
    } else {
      handleCreateRoom(roomFormData);
    }
  };

  const handleTableFormSubmit = (e) => {
    e.preventDefault();
    if (editingTable) {
      handleUpdateTable(tableFormData);
    } else {
      handleAddTable(tableFormData, currentRoomId);
    }
  };

  // Initialize forms when editing
  useEffect(() => {
    if (editingRoom) {
      const room = rooms.find(r => r._id === editingRoom);
      if (room) {
        setRoomFormData({
          roomName: room.roomName,
          description: room.description || '',
          capacity: room.capacity,
          location: room.location || '',
          isActive: room.isActive,
        });
      }
    } else if (showRoomForm) {
      setRoomFormData({
        roomName: '',
        description: '',
        capacity: '',
        location: '',
        isActive: true,
      });
    }
  }, [editingRoom, showRoomForm]);

  useEffect(() => {
    if (editingTable && currentRoomId) {
      const room = rooms.find(r => r._id === currentRoomId);
      if (room) {
        const table = room.tables.find(t => t._id === editingTable);
        if (table) {
          setTableFormData({
            tableNumber: table.tableNumber,
            seatingCapacity: table.seatingCapacity,
            tableType: table.tableType,
            status: table.status,
          });
        }
      }
    } else if (showTableForm) {
      setTableFormData({
        tableNumber: '',
        seatingCapacity: '',
        tableType: 'standard',
        status: 'available',
      });
    }
  }, [editingTable, showTableForm]);

  // Filter rooms based on search term
  const filteredRooms = rooms.filter(room =>
    room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table styles
  const getTableStyles = (table) => {
    const baseStyles = 'relative flex items-center justify-center text-white font-semibold text-sm cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg group';
    const statusStyles = {
      available: 'bg-gradient-to-br from-green-500 to-green-700',
      occupied: 'bg-gradient-to-br from-red-500 to-red-700',
      reserved: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
      'out-of-service': 'bg-gradient-to-br from-gray-500 to-gray-700',
    };
    const typeStyles = {
      standard: 'w-20 h-20 rounded-lg border-2 border-white/30',
      booth: 'w-24 h-16 rounded-full border-2 border-white/30',
      'high-top': 'w-16 h-16 rounded-full border-2 border-white/30',
      outdoor: 'w-20 h-20 rounded-lg border-4 border-green-300/50',
    };
    return `${baseStyles} ${statusStyles[table.status]} ${typeStyles[table.tableType]}`;
  };

  // Render table component
  const renderTable = (table, roomId, index) => (
    <div
      key={table._id}
      className={getTableStyles(table)}
      onClick={() => {
        setCurrentRoomId(roomId);
        setEditingTable(table._id);
        setShowTableForm(true);
      }}
      title={`Table ${table.tableNumber} - Capacity: ${table.seatingCapacity}`}
    >
      <span className="relative z-10">{table.tableNumber}</span>
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          setItemToDelete({ type: 'table', id: table._id, roomId });
          setShowDeleteModal(true);
        }}
        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={12} />
      </button>
      <span className="absolute bottom-0 left-0 text-xs bg-black/50 text-white px-2 py-1 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {table.tableType.charAt(0).toUpperCase() + table.tableType.slice(1)}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-amber-50 to-rose-50">
        <Loader className="animate-spin text-amber-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header and search */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            <TableIcon className="inline-block mr-2 text-amber-600" size={32} />
            Room & Table Management
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode(viewMode === 'floorPlan' ? 'list' : 'floorPlan')}
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-all duration-200"
            >
              {viewMode === 'floorPlan' ? <List size={20} className="mr-2" /> : <TableIcon size={20} className="mr-2" />}
              {viewMode === 'floorPlan' ? 'List View' : 'Floor Plan View'}
            </button>
            <button
              onClick={() => {
                setEditingRoom(null);
                setShowRoomForm(true);
              }}
              className="flex items-center bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
            >
              <PlusCircle className="mr-2" size={20} />
              Add Room
            </button>
          </div>
        </div>

        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search rooms by name or location..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-lg shadow-sm flex items-center">
            <AlertTriangle className="mr-3" size={24} />
            <p>{error}</p>
          </div>
        )}

        {/* Rooms list or floor plan */}
        {filteredRooms.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <p className="text-gray-600 text-lg">No rooms found. Create a new room to get started!</p>
            <button
              onClick={() => {
                setEditingRoom(null);
                setShowRoomForm(true);
              }}
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
            >
              Create New Room
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid gap-8">
            {filteredRooms.map(room => (
              <div key={room._id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="bg-amber-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-xl text-gray-800">{room.roomName}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {room.location} • Capacity: {room.capacity} • Tables: {room.tables.length}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setCurrentRoomId(room._id);
                        setEditingTable(null);
                        setShowTableForm(true);
                      }}
                      className="flex items-center text-amber-600 hover:text-amber-800 transition-colors duration-200"
                    >
                      <PlusCircle size={20} className="mr-2" /> Add Table
                    </button>
                    <button
                      onClick={() => {
                        setEditingRoom(room._id);
                        setShowRoomForm(true);
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                      <Edit size={20} className="mr-2" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({ type: 'room', id: room._id });
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <Trash2 size={20} className="mr-2" /> Delete
                    </button>
                  </div>
                </div>
                {room.description && (
                  <div className="px-6 py-3 bg-gray-50">
                    <p className="text-sm text-gray-700 italic">{room.description}</p>
                  </div>
                )}
                {room.tables.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Table #
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Capacity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {room.tables.map((table, index) => (
                          <tr key={table._id} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {table.tableNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                table.tableType === 'booth' ? 'bg-purple-100 text-purple-800' :
                                table.tableType === 'high-top' ? 'bg-blue-100 text-blue-800' :
                                table.tableType === 'outdoor' ? 'bg-green-100 text-green-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {table.tableType.charAt(0).toUpperCase() + table.tableType.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {table.seatingCapacity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                table.status === 'available' ? 'bg-green-100 text-green-800' :
                                table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <button
                                onClick={() => {
                                  setCurrentRoomId(room._id);
                                  setEditingTable(table._id);
                                  setShowTableForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 mr-4 transition-colors duration-200"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setItemToDelete({ 
                                    type: 'table', 
                                    id: table._id, 
                                    roomId: room._id 
                                  });
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8">
            {filteredRooms.map(room => (
              <div key={room._id} className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-semibold text-xl text-gray-800">{room.roomName}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {room.location} • Capacity: {room.capacity} • Tables: {room.tables.length}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setCurrentRoomId(room._id);
                        setEditingTable(null);
                        setShowTableForm(true);
                      }}
                      className="flex items-center text-amber-600 hover:text-amber-800 transition-colors duration-200"
                    >
                      <PlusCircle size={20} className="mr-2" /> Add Table
                    </button>
                    <button
                      onClick={() => {
                        setEditingRoom(room._id);
                        setShowRoomForm(true);
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                      <Edit size={20} className="mr-2" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({ type: 'room', id: room._id });
                        setShowDeleteModal(true);
                      }}
                      className="flex items-center text-red-600 hover:text-red-800 transition-colors duration-200"
                    >
                      <Trash2 size={20} className="mr-2" /> Delete
                    </button>
                  </div>
                </div>
                {room.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 italic">{room.description}</p>
                  </div>
                )}
                <div className="relative bg-gray-100 rounded-lg p-6 min-h-[200px] border-2 border-gray-300 overflow-auto">
                  {room.tables.length > 0 ? (
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(room.tables.length))}, minmax(0, 1fr))`,
                        maxHeight: '300px',
                        overflowY: 'auto',
                      }}
                    >
                      {room.tables.map((table, index) => renderTable(table, room._id, index))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center">No tables in this room</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Form Modal */}
      {showRoomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button onClick={() => setShowRoomForm(false)} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleRoomFormSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Name *</label>
                <input
                  type="text"
                  name="roomName"
                  value={roomFormData.roomName}
                  onChange={handleRoomFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={roomFormData.description}
                  onChange={handleRoomFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                  rows="4"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  name="capacity"
                  value={roomFormData.capacity}
                  onChange={handleRoomFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                  min="1"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={roomFormData.location}
                  onChange={handleRoomFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                />
              </div>
              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={roomFormData.isActive}
                  onChange={handleRoomFormChange}
                  className="h-5 w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowRoomForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-md transition-all duration-300"
                >
                  <Save size={20} className="mr-2" />
                  {editingRoom ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Form Modal */}
      {showTableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
              <button onClick={() => setShowTableForm(false)} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleTableFormSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number *</label>
                <input
                  type="text"
                  name="tableNumber"
                  value={tableFormData.tableNumber}
                  onChange={handleTableFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seating Capacity *</label>
                <input
                  type="number"
                  name="seatingCapacity"
                  value={tableFormData.seatingCapacity}
                  onChange={handleTableFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                  min="1"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Type *</label>
                <select
                  name="tableType"
                  value={tableFormData.tableType}
                  onChange={handleTableFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                  required
                >
                  <option value="standard">Standard</option>
                  <option value="booth">Booth</option>
                  <option value="high-top">High-top</option>
                  <option value="outdoor">Outdoor</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  name="status"
                  value={tableFormData.status}
                  onChange={handleTableFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-300"
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="out-of-service">Out of Service</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowTableForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-md transition-all duration-300"
                >
                  <Save size={20} className="mr-2" />
                  {editingTable ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Delete {itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)}
            </h2>
            <p className="mb-6 text-gray-600">Are you sure you want to delete this {itemToDelete.type}? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={itemToDelete.type === 'room' ? handleDeleteRoom : handleDeleteTable}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomTableManagement;