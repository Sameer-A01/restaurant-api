import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/api";
import { ShoppingCart, X, Plus, Minus, Printer, Settings, Search, Tag, Package, DollarSign, ChevronLeft, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const POSPage = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [orderData, setOrderData] = useState({
    products: [],
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: localStorage.getItem("company_name") || "ROYAL KING DHABA",
    address: localStorage.getItem("company_address") || "Purvanchal Highway Road,UP, Azamgarh 276001",
    phone: localStorage.getItem("company_phone") || "+91-7398549531",
    email: localStorage.getItem("company_email") || "royalkingdhaba9531@gmail.com",
    taxRate: localStorage.getItem("company_taxRate") || "5",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [refreshingProducts, setRefreshingProducts] = useState(false);

  const billRef = useRef(null);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("ims_user"));
  const userId = user?._id;
  const userName = user?.name;

  // Generate invoice number
  const invoiceNum = `INV-${Date.now().toString().substr(-6)}`;

  // Fetch products from server
  const fetchProducts = async () => {
    setRefreshingProducts(true);
    try {
      const response = await axiosInstance.get("/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      if (response.data.success) {
        setCategories(response.data.categories);
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setRefreshingProducts(false);
    }
  };

  // On component mount
  useEffect(() => {
    fetchProducts();
    // Load cart from localStorage
    const savedCart = localStorage.getItem("ims_cart");
    if (savedCart) {
      setOrderData(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever orderData changes
  useEffect(() => {
    localStorage.setItem("ims_cart", JSON.stringify(orderData));
  }, [orderData]);

  const handleFilterProducts = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const handleChangeCategory = (categoryId) => {
    if (categoryId === selectedCategory) {
      setSelectedCategory("");
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((product) => product.category._id === categoryId)
      );
      setSelectedCategory(categoryId);
    }
  };

  const handleOrderClick = (product) => {
    const existingProductIndex = orderData.products.findIndex(
      (item) => item.productId === product._id
    );

    if (existingProductIndex >= 0) {
      const updatedOrder = [...orderData.products];
      updatedOrder[existingProductIndex].quantity += 1;

      const updatedTotalAmount = updatedOrder.reduce(
        (total, item) =>
          total + item.quantity * products.find((p) => p._id === item.productId).price,
        0
      );

      setOrderData({
        products: updatedOrder,
        totalAmount: updatedTotalAmount,
      });
    } else {
      setOrderData({
        products: [
          ...orderData.products,
          { productId: product._id, quantity: 1 },
        ],
        totalAmount: orderData.totalAmount + product.price,
      });
    }

    // On mobile, show the cart after adding an item
    if (window.innerWidth < 768) {
      setShowCart(true);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const product = products.find(p => p._id === productId);
    if (quantity > product.stock) return;

    if (quantity < 1) {
      handleRemoveProduct(productId);
      return;
    }

    const updatedProducts = orderData.products.map((item) =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    );

    const updatedTotalAmount = updatedProducts.reduce(
      (total, item) =>
        total + item.quantity * products.find((p) => p._id === item.productId).price,
      0
    );

    setOrderData({ products: updatedProducts, totalAmount: updatedTotalAmount });
  };

  const handleRemoveProduct = (productId) => {
    const updatedProducts = orderData.products.filter(
      (item) => item.productId !== productId
    );

    const updatedTotalAmount = updatedProducts.reduce(
      (total, item) =>
        total + item.quantity * products.find((p) => p._id === item.productId).price,
      0
    );

    setOrderData({ products: updatedProducts, totalAmount: updatedTotalAmount });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/order/add",
        { products: orderData.products, totalAmount: orderData.totalAmount },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        }
      );
      if (response.data.success) {
        setShowBill(true);
        // Refresh products after successful order
        await fetchProducts();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Replace the handlePrintBill function with this improved version
const handlePrintBill = () => {
  const printWindow = window.open('', '_blank');
  
  // Calculate total items
  const totalItems = orderData.products.reduce((sum, item) => sum + item.quantity, 0);
  
  // Create QR code data - typically includes invoice number, total amount, and company info
  const qrData = `INV:${invoiceNum},AMT:${calculateGrandTotal()},COMP:${companyInfo.name}`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${companyInfo.name}</title>
      <style>
        @page {
          size: 80mm 297mm; /* Standard thermal receipt size */
          margin: 0;
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 5mm;
          color: #000;
          font-size: 12px;
          line-height: 1.4;
          width: 70mm; /* Actual content width for thermal printers */
        }
        .invoice-container {
          max-width: 70mm;
        }
        .company-header {
          text-align: center;
          margin-bottom: 5mm;
        }
        .company-header h1 {
          font-size: 14px;
          margin: 0;
          font-weight: bold;
        }
        .company-header p {
          margin: 2px 0;
          font-size: 10px;
        }
        .invoice-details {
          display: flex;
          flex-direction: column;
          margin-bottom: 5mm;
          border-top: 1px dashed #999;
          border-bottom: 1px dashed #999;
          padding: 2mm 0;
        }
        .invoice-details p {
          margin: 1mm 0;
          font-size: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        th {
          text-align: left;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
          padding: 1mm 0;
        }
        td {
          padding: 1mm 0;
        }
        .text-right {
          text-align: right;
        }
        .summary-table {
          width: 100%;
          margin-top: 3mm;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 1mm 0;
          font-size: 10px;
        }
        .summary-row.total {
          font-weight: bold;
          border-top: 1px solid #ddd;
          padding-top: 2mm;
          margin-top: 1mm;
        }
        .footer {
          text-align: center;
          margin-top: 5mm;
          font-size: 10px;
          padding-top: 3mm;
          border-top: 1px dashed #999;
        }
        .qr-container {
          display: flex;
          justify-content: center;
          margin: 3mm 0;
        }
        /* Compact item listing */
        .item-row td {
          padding: 0.5mm 0;
        }
        .item-name {
          width: 50%;
        }
        .order-summary {
          margin-top: 5mm;
          font-weight: bold;
          text-align: center;
          border-top: 1px dashed #999;
          padding-top: 2mm;
        }
        @media print {
          body {
            width: 100%;
            padding: 0;
          }
        }
      </style>
      <!-- QR code library -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    </head>
    <body>
      <div class="invoice-container">
        <div class="company-header">
          <h1>${companyInfo.name}</h1>
          <p>${companyInfo.address}</p>
          <p>Tel: ${companyInfo.phone}</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Invoice:</strong> ${invoiceNum}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p><strong>Cashier:</strong> ${userName || 'Admin'}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.products.map((item) => {
              const product = products.find((p) => p._id === item.productId);
              return `
                <tr class="item-row">
                  <td class="item-name">${product?.name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">₹${product?.price.toFixed(2)}</td>
                  <td class="text-right">₹${(product?.price * item.quantity).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="summary-table">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₹${orderData.totalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>GST (${companyInfo.taxRate}%):</span>
            <span>₹${calculateTax()}</span>
          </div>
          <div class="summary-row total">
            <span>Grand Total:</span>
            <span>₹${calculateGrandTotal()}</span>
          </div>
          <div class="order-summary">
            Total Items: ${totalItems}
          </div>
        </div>
        
        <!-- QR Code will be inserted here -->
        <div class="qr-container" id="qrcode"></div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>${companyInfo.email}</p>
        </div>
      </div>
      
      <script>
        // Generate QR code after page loads
        window.onload = function() {
          new QRCode(document.getElementById("qrcode"), {
            text: "${qrData}",
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
          
          // Print automatically after QR code is generated
          setTimeout(() => {
            document.close();
            window.print();
            window.onafterprint = () => window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);


    setTimeout(() => {
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 250);
  };

  const handleNewOrder = () => {
    setOrderData({ products: [], totalAmount: 0 });
    localStorage.removeItem("ims_cart");
    setShowBill(false);
    setShowCart(false);
  };

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem(`company_${name}`, value);
      return updated;
    });
  };

  const calculateTax = () => {
    const taxRatePercent = parseFloat(companyInfo.taxRate) || 0;
    return (orderData.totalAmount * (taxRatePercent / 100)).toFixed(2);
  };

  const calculateGrandTotal = () => {
    return (parseFloat(orderData.totalAmount) + parseFloat(calculateTax())).toFixed(2);
  };

  // Mobile cart toggle button
  const CartToggleButton = () => (
    <motion.button
      onClick={() => setShowCart(!showCart)}
      className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-xl z-30"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      <ShoppingCart size={24} />
      {orderData.products.length > 0 && (
        <motion.span
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {orderData.products.length}
        </motion.span>
      )}
    </motion.button>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl md:text-2xl font-bold truncate max-w-[120px] md:max-w-none">
              {companyInfo.name} <span className="text-blue-200">POS</span>
            </h1>
            {userName && (
              <p className="hidden sm:inline-flex text-xs bg-blue-600 px-3 py-1 rounded-full">
                Cashier: {userName}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm transition-colors"
              whileHover={{ y: -1 }}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Company Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="name"
                    value={companyInfo.name}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={companyInfo.address}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={companyInfo.phone}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={companyInfo.email}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                  <input
                    type="number"
                    name="taxRate"
                    min="0"
                    max="100"
                    step="0.1"
                    value={companyInfo.taxRate}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <motion.button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Settings
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bill Modal */}
      <AnimatePresence>
        {showBill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Invoice</h2>
                <button
                  onClick={handleNewOrder}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div ref={billRef} className="p-6 border border-gray-200 rounded-lg bg-white">
                {/* Bill Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">{companyInfo.name}</h1>
                  <p className="text-gray-600">{companyInfo.address}</p>
                  <p className="text-gray-600">Phone: {companyInfo.phone}</p>
                  <p className="text-gray-600">Email: {companyInfo.email}</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                  <div>
                    <p className="font-semibold">Invoice #: {invoiceNum}</p>
                    <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-gray-600">Time: {new Date().toLocaleTimeString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Cashier: {userName}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full mb-6">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-3 text-gray-700">#</th>
                        <th className="text-left py-3 text-gray-700">Item</th>
                        <th className="text-right py-3 text-gray-700">Price</th>
                        <th className="text-right py-3 text-gray-700">Qty</th>
                        <th className="text-right py-3 text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.products.map((item, index) => {
                        const product = products.find((p) => p._id === item.productId);
                        return (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3">{index + 1}</td>
                            <td className="py-3">{product?.name}</td>
                            <td className="text-right py-3">₹{product?.price.toFixed(2)}</td>
                            <td className="text-right py-3">{item.quantity}</td>
                            <td className="text-right py-3">₹{(product?.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{orderData.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">GST ({companyInfo.taxRate}%):</span>
                      <span className="font-medium">₹{calculateTax()}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold border-t border-gray-300 mt-2 pt-3">
                      <span>Grand Total:</span>
                      <span className="text-blue-600">₹{calculateGrandTotal()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8 text-gray-500">
                  <p>Thank you for your business!</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <motion.button
                  onClick={handlePrintBill}
                  className="flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Printer size={18} />
                  <span>Print Invoice</span>
                </motion.button>
                <motion.button
                  onClick={handleNewOrder}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-md"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  New Order
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showBill && (
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Left side - Products */}
          <div className={`w-full md:w-8/12 flex flex-col bg-white ${showCart ? 'hidden md:flex' : 'flex'}`}>
            {/* Search and filter */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleFilterProducts}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  disabled={loading}
                />
                <motion.button
                  onClick={fetchProducts}
                  className="ml-2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  whileHover={{ rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={refreshingProducts}
                >
                  <RefreshCw size={18} className={refreshingProducts ? "animate-spin" : ""} />
                </motion.button>
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-3 border-b border-gray-200 overflow-x-auto bg-blue-50">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <motion.button
                    key={category._id}
                    onClick={() => handleChangeCategory(category._id)}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${selectedCategory === category._id
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-blue-100 border border-blue-100"
                      }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Tag size={14} className="mr-2" />
                    {category.name}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 p-4 overflow-y-auto bg-blue-50">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Package size={48} className="mb-4 opacity-30" />
                  <p className="text-lg">No products found</p>
                  <p className="text-sm mt-2">Try a different search or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product._id}
                      onClick={() => product.stock > 0 && handleOrderClick(product)}
                      className={`border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all bg-white shadow-sm hover:shadow-md ${product.stock > 0
                          ? "hover:border-blue-300"
                          : "opacity-70 cursor-not-allowed"
                        }`}
                      whileHover={{ y: -3 }}
                    >
                      <div>
                        <div className="bg-blue-100 p-3 rounded-lg flex items-center justify-center mb-3 h-24">
                          {product.image ? (
                            <img
                            src={`${import.meta.env.VITE_API_URL}/uploads/${product.image}`}
                              alt={product.name}
                              className="h-full object-contain"
                            />
                          ) : (
                            <Package size={24} className="text-blue-600" />
                          )}
                        </div>
                        <h3 className="font-medium text-gray-800 text-sm truncate">{product.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-blue-600 font-bold">₹{product.price.toFixed(2)}</p>
                          <p className={`text-xs px-2 py-1 rounded-full ${product.stock > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            Stock: {product.stock}
                          </p>
                        </div>
                      </div>
                      {product.stock > 0 && (
                        <motion.button
                          className="mt-3 bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-lg text-xs hover:bg-blue-100 flex items-center justify-center transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Plus size={14} className="mr-1" /> Add to Cart
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Order */}
          <div className={`w-full md:w-4/12 bg-white border-l border-gray-200 flex flex-col shadow-lg ${showCart ? 'flex' : 'hidden md:flex'}`}>
            {/* Order Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-700 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setShowCart(false)}
                  className="md:hidden mr-3 text-blue-200 hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-bold flex items-center">
                  <ShoppingCart size={20} className="mr-2 text-blue-200" />
                  Current Order
                </h2>
              </div>
              {orderData.products.length > 0 && (
                <button
                  onClick={() => setOrderData({ products: [], totalAmount: 0 })}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto p-4 bg-blue-50">
              {orderData.products.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <ShoppingCart size={48} className="mb-4 opacity-30" />
                  <p className="text-lg">Your cart is empty</p>
                  <p className="text-sm mt-2">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderData.products.map((item, index) => {
                    const product = products.find((p) => p._id === item.productId);
                    return (
                      <motion.div
                        key={index}
                        className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-blue-100"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 text-sm truncate">{product?.name}</h4>
                          <p className="text-xs text-gray-500">₹{product?.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <motion.button
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            whileTap={{ scale: 0.9 }}
                          >
                            <Minus size={14} />
                          </motion.button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <motion.button
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= product?.stock}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${item.quantity >= product?.stock
                                ? "bg-gray-100 text-gray-400"
                                : "bg-blue-100 hover:bg-blue-200"
                              }`}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Plus size={14} />
                          </motion.button>
                        </div>
                        <div className="w-16 text-right font-medium text-sm">
                          ₹{(product?.price * item.quantity).toFixed(2)}
                        </div>
                        <motion.button
                          onClick={() => handleRemoveProduct(item.productId)}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={16} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{orderData.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST ({companyInfo.taxRate}%)</span>
                  <span>₹{calculateTax()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">₹{calculateGrandTotal()}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <motion.button
                onClick={handleOrderSubmit}
                disabled={orderData.products.length === 0 || loading}
                className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 text-white py-3 rounded-xl font-medium transition-all shadow-md"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <DollarSign size={18} className="mr-2" />
                {loading ? "Processing..." : "Checkout"}
              </motion.button>
            </div>
          </div>

          {/* Mobile cart toggle button */}
          <CartToggleButton />
        </div>
      )}
    </div>
  );
};

export default POSPage;