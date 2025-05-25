import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    supplier: "",
    image: null
  });
  const [previewImage, setPreviewImage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, productId: null, productName: "" });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
        setCategories(response.data.categories);
        setSuppliers(response.data.suppliers);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchInput = (e) => {
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("supplier", formData.supplier);
  
      // Handle image differently for edit vs add
      if (editingId) {
        // For editing, we need to handle three cases:
        // 1. New image uploaded
        // 2. Existing image removed
        // 3. No change to image
        if (formData.image) {
          // Case 1: New image uploaded
          formDataToSend.append("image", formData.image);
        } else if (previewImage === "" && formData.image === null) {
          // Case 2: Image was removed
          formDataToSend.append("removeImage", "true");
        }
        // Case 3: No change (don't send anything about image)
      } else {
        // For new product, just append if image exists
        if (formData.image) {
          formDataToSend.append("image", formData.image);
        }
      }
  
      if (editingId) {
        const response = await axiosInstance.put(
          `/products/${editingId}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.data.success) {
          fetchProducts();
        }
      } else {
        const token = localStorage.getItem("ims_token");
        const response = await axiosInstance.post("/products/add", formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        if (response.data.success) {
          fetchProducts();
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  
    // Reset form and close modal
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      supplier: "",
      image: null
    });
    setPreviewImage("");
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category._id,
      supplier: product.supplier._id,
      image: null
    });
    setPreviewImage(
      product.image
        ? `${import.meta.env.VITE_API_URL}/uploads/${product.image}`
        : ""
    );
    setIsModalOpen(true);
  };

  const openDeleteConfirmation = (product) => {
    setDeleteConfirmation({
      show: true,
      productId: product._id,
      productName: product.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ show: false, productId: null, productName: "" });
  };

  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete(`/products/${deleteConfirmation.productId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      if (response.data.success) {
        setProducts((prev) => prev.filter((product) => product._id !== deleteConfirmation.productId));
        setFilteredProducts((prev) =>
          prev.filter((product) => product._id !== deleteConfirmation.productId)
        );
        closeDeleteConfirmation();
      }
    } catch (error) {
      alert(error.message);
      closeDeleteConfirmation();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      supplier: "",
      image: null
    });
    setPreviewImage("");
  };

  // Product card for mobile view
  const ProductCard = ({ product }) => (
    <div className="bg-white p-4 rounded-lg shadow mb-4 border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(product)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => openDeleteConfirmation(product)}
            className="text-red-600 hover:text-red-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      {product.image && (
        <div className="mt-2">
          <img 
            src={`${import.meta.env.VITE_API_URL}/uploads/${product.image}`}
            alt={product.name} 
            className="h-20 w-20 object-cover rounded-md"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
        <div>
          <span className="text-gray-500">Category:</span>
          <p className="font-medium">{product.category?.name}</p>
        </div>
        <div>
          <span className="text-gray-500">Supplier:</span>
          <p className="font-medium">{product.supplier?.name}</p>
        </div>
        <div>
          <span className="text-gray-500">Price:</span>
          <p className="font-medium">₹{product.price.toLocaleString('en-IN')}</p>
        </div>
        <div>
  <span className="text-gray-500">Stock:</span>
  <div className="flex items-center gap-1">
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
        product.stock === 0
          ? "bg-red-100 text-red-800"
          : product.stock <= 5
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {product.stock} in stock
    </span>
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
      product.stock > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
    }`}>
      {product.stock > 0 ? "Available" : "Unavailable"}
    </span>
  </div>
</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Menu Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your dishes and kitchen stock
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 sm:mt-0 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Menu
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search items by name..."
                onChange={handleSearchInput}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="block sm:hidden">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
              No products found. Try adjusting your search.
            </div>
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chef
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.image && (
                          <img 
                          src={`${import.meta.env.VITE_API_URL}/uploads/${product.image}`}
                            alt={product.name} 
                            className="h-10 w-10 object-cover rounded-md"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.category?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.supplier?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center gap-2">
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        product.stock === 0
          ? "bg-red-100 text-red-800"
          : product.stock <= 5
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {product.stock} in stock
    </span>
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
      product.stock > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
    }`}>
      {product.stock > 0 ? "Available" : "Unavailable"}
    </span>
  </div>
</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No products found. Try adjusting your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {editingId ? "Edit Product" : "Add New Product"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Image
                      </label>
                      <div className="mt-1 flex items-center">
                        <label className="cursor-pointer">
                          <span className="inline-block px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Choose File
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        {previewImage && (
  <div className="ml-4 relative">
    <img 
      src={previewImage.includes('blob:') ? previewImage : previewImage}
      alt="Preview" 
      className="h-16 w-16 object-cover rounded-md"
    />
    <button
      type="button"
      onClick={() => {
        setPreviewImage("");
        setFormData(prev => ({ ...prev, image: null }));
      }}
      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </div>
)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        JPEG, PNG, JPG (Max 2MB)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock *
                        </label>
                        <input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleInputChange}
                          required
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chef *
                      </label>
                      <select
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select a Chef</option>
                        {suppliers.map((sup) => (
                          <option key={sup._id} value={sup._id}>
                            {sup.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {editingId ? "Update Product" : "Add Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 rounded-full p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete <span className="font-medium text-gray-700">"{deleteConfirmation.productName}"</span>? This action cannot be undone.
                </p>
                
                <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    onClick={closeDeleteConfirmation}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;