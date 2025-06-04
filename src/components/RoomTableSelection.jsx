import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table as TableIcon, Search, Loader, AlertTriangle } from 'lucide-react';
import axiosInstance from '../utils/api';

const RoomTableSelection = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/rooms', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('ims_token')}`,
          },
        });
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

  // Filter rooms based on search term
  const filteredRooms = rooms.filter(
    (room) =>
      room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle table selection
  const handleTableSelect = (roomId, tableId) => {
    navigate('/pos', { state: { roomId, tableId } });
  };

  // Table styles
  const getTableStyles = (table) => {
    const baseStyles =
      'relative flex items-center justify-center text-white font-semibold text-sm cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg';
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            <TableIcon className="inline-block mr-2 text-amber-600" size={32} />
            Select Room & Table
          </h1>
        </div>

        <div className="mb-8 relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Search rooms by name or location..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-lg shadow-sm flex items-center">
            <AlertTriangle className="mr-3" size={24} />
            <p>{error}</p>
          </div>
        )}

        {filteredRooms.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <p className="text-gray-600 text-lg">No rooms found. Please contact the administrator.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {filteredRooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-semibold text-xl text-gray-800">{room.roomName}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {room.location} • Capacity: {room.capacity} • Tables: {room.tables.length}
                    </p>
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
                        gridTemplateColumns: `repeat(${Math.ceil(
                          Math.sqrt(room.tables.length)
                        )}, minmax(0, 1fr))`,
                        maxHeight: '300px',
                        overflowY: 'auto',
                      }}
                    >
                      {room.tables.map((table) => (
                        <div
                          key={table._id}
                          className={getTableStyles(table)}
                          onClick={() =>
                            table.status === 'available' && handleTableSelect(room._id, table._id)
                          }
                          title={`Table ${table.tableNumber} - Capacity: ${table.seatingCapacity}`}
                        >
                          <span className="relative z-10">{table.tableNumber}</span>
                        </div>
                      ))}
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
    </div>
  );
};

export default RoomTableSelection;