import React, { useState, useEffect, useRef, useMemo } from "react";
import axiosInstance from "../utils/api";
import { ShoppingCart, X, Plus, Minus, Printer, Settings, Search, Tag, Package, DollarSign, ChevronLeft, RefreshCw, ChevronDown, MapPin, Users, CheckCircle, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const POSPage = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [orderData, setOrderData] = useState({
    products: [],
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: localStorage.getItem("company_name") || "ROYAL KING DHABA",
    address: localStorage.getItem("company_address") || "Purvanchal Highway Road, UP, Azamgarh 276001",
    phone: localStorage.getItem("company_phone") || "+91-7398549531",
    email: localStorage.getItem("company_email") || "royalkingdhaba9531@gmail.com",
    taxRate: localStorage.getItem("company_taxRate") || "5",
    discount: localStorage.getItem("company_discount") || "0",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  // New state for checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [refreshingRooms, setRefreshingRooms] = useState(false);

  const billRef = useRef(null);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("ims_user"));
  const userId = user?._id;
  const userName = user?.name;

  const invoiceNum = `INV-${Date.now().toString().substr(-6)}`;

  const fetchProducts = async () => {
    setRefreshingProducts(true);
    try {
      const [productsResponse, roomsResponse] = await Promise.all([
        axiosInstance.get("/products", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        }),
        axiosInstance.get("/rooms", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        }),
      ]);

      if (productsResponse.data.success) {
        setCategories(productsResponse.data.categories);
        setProducts(productsResponse.data.products);
        setFilteredProducts(productsResponse.data.products);
      }

      setRooms(roomsResponse.data.filter((room) => room.isActive));
    } catch (error) {
      alert(error.message);
    } finally {
      setRefreshingProducts(false);
    }
  };

  const fetchRooms = async () => {
  setRefreshingRooms(true);
  try {
    const roomsResponse = await axiosInstance.get("/rooms", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
      },
    });
    setRooms(roomsResponse.data.filter((room) => room.isActive));
  } catch (error) {
    alert("Failed to refresh rooms: " + error.message);
  } finally {
    setRefreshingRooms(false);
  }
};



  useEffect(() => {
    fetchProducts();
    const savedCart = localStorage.getItem("ims_cart");
    if (savedCart) {
      setOrderData(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ims_cart", JSON.stringify(orderData));
  }, [orderData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterProducts = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category._id === selectedCategory);
    }

    if (query) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleChangeCategory = (categoryId) => {
    if (categoryId === selectedCategory) {
      setSelectedCategory("");
      setFilteredProducts(
        searchQuery
          ? products.filter((product) =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : products
      );
    } else {
      setSelectedCategory(categoryId);
      let filtered = products.filter((product) => product.category._id === categoryId);
      if (searchQuery) {
        filtered = filtered.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setFilteredProducts(filtered);
    }
    setShowCategoryDropdown(false);
  };

  const handleOrderClick = (product) => {
    if (product.stock <= 0) return;

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

    if (window.innerWidth < 768) {
      setShowCart(true);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const product = products.find((p) => p._id === productId);
    if (quantity > product.stock) return;

    if (quantity < 1) {
      handleRemoveProduct(productId);
      return;
    }

    const updatedProducts = orderData.products.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
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

  // Modified to show checkout modal
  const handleCheckoutClick = () => {
    if (orderData.products.length === 0) {
      alert("Your cart is empty. Add products to proceed.");
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom || !selectedTable) {
      alert("Please select both a room and a table.");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/order/add",
        {
          products: orderData.products,
          totalAmount: calculateGrandTotal(),
          roomId: selectedRoom,
          tableId: selectedTable,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        }
      );
      if (response.data.success) {
        setShowBill(true);
        setShowCheckoutModal(false); // Close modal on success
        await fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    try {
      const printWindow = window.open("", "_blank", "width=800,height=1000,scrollbars=yes,resizable=yes");
      
      if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups for this site to print invoices.");
        return;
      }

      const totalItems = orderData.products.reduce((sum, item) => sum + item.quantity, 0);
      const selectedRoomObj = rooms.find((room) => room._id === selectedRoom);
      const selectedTableObj = selectedRoomObj?.tables.find((table) => table._id === selectedTable);
      const qrData = `INV:${invoiceNum},AMT:${calculateGrandTotal()},COMP:${companyInfo.name},ROOM:${selectedRoomObj?.roomName},TABLE:${selectedTableObj?.tableNumber}`;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${companyInfo.name}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: 80mm 297mm;
              margin: 2mm;
            }
            @media print {
              body {
                width: 100%;
                padding: 0;
                margin: 0;
                font-size: 11px;
              }
              .no-print {
                display: none !important;
              }
              .invoice-container {
                width: 100%;
                max-width: none;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 5mm;
              color: #000;
              font-size: 12px;
              line-height: 1.3;
              width: 70mm;
              background: white;
            }
            .invoice-container {
              max-width: 70mm;
              margin: 0 auto;
            }
            .company-header {
              text-align: center;
              margin-bottom: 5mm;
              border-bottom: 1px dashed #333;
              padding-bottom: 3mm;
            }
            .company-header h1 {
              font-size: 16px;
              margin: 0 0 2mm 0;
              font-weight: bold;
              text-transform: uppercase;
            }
            .company-header p {
              margin: 1mm 0;
              font-size: 10px;
              word-wrap: break-word;
            }
            .invoice-details {
              margin-bottom: 5mm;
              border-bottom: 1px dashed #333;
              padding-bottom: 3mm;
            }
            .invoice-details p {
              margin: 1mm 0;
              font-size: 10px;
              display: flex;
              justify-content: space-between;
            }
            .invoice-details strong {
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
              margin-bottom: 3mm;
            }
            th {
              text-align: left;
              font-weight: bold;
              border-bottom: 1px solid #333;
              padding: 1mm 0;
              font-size: 9px;
            }
            td {
              padding: 0.5mm 0;
              vertical-align: top;
              word-wrap: break-word;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .item-name {
              width: 40%;
              max-width: 25mm;
              word-wrap: break-word;
              hyphens: auto;
            }
            .item-qty, .item-price {
              width: 15%;
              text-align: right;
            }
            .item-total {
              width: 20%;
              text-align: right;
            }
            .summary-section {
              border-top: 1px dashed #333;
              padding-top: 3mm;
              margin-top: 3mm;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 0.5mm 0;
              font-size: 10px;
            }
            .summary-row.total {
              font-weight: bold;
              font-size: 12px;
              border-top: 1px solid #333;
              margin-top: 2mm;
              padding-top: 2mm;
            }
            .footer {
              text-align: center;
              margin-top: 5mm;
              font-size: 9px;
              padding-top: 3mm;
              border-top: 1px dashed #333;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              margin: 3mm 0;
              min-height: 80px;
            }
            .order-summary {
              margin-top: 3mm;
              font-weight: bold;
              text-align: center;
              font-size: 11px;
            }
            .print-controls {
              text-align: center;
              margin: 10px 0;
              padding: 10px;
              background: #f0f0f0;
              border-radius: 5px;
            }
            .print-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              margin: 0 5px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            .print-btn:hover {
              background: #0056b3;
            }
            .print-btn.secondary {
              background: #6c757d;
            }
            .print-btn.secondary:hover {
              background: #545b62;
            }
            .loading {
              text-align: center;
              padding: 20px;
              font-style: italic;
              color: #666;
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </head>
        <body>
          <div class="loading" id="loading">
            Loading invoice... Please wait.
          </div>
          
          <div class="invoice-container" id="invoice-content" style="display: none;">
            <div class="company-header">
              <h1>${companyInfo.name}</h1>
              <p>${companyInfo.address}</p>
              <p>Tel: ${companyInfo.phone}</p>
              ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
            </div>
            
            <div class="invoice-details">
              <p><strong>Invoice:</strong> <span>${invoiceNum}</span></p>
              <p><strong>Date:</strong> <span>${new Date().toLocaleDateString()}</span></p>
              <p><strong>Time:</strong> <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
              <p><strong>Cashier:</strong> <span>${userName || 'Admin'}</span></p>
              <p><strong>Room:</strong> <span>${rooms.find((r) => r._id === selectedRoom)?.roomName || 'N/A'}</span></p>
              <p><strong>Table:</strong> <span>${rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber || 'N/A'}</span></p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th class="item-name">Item</th>
                  <th class="item-qty">Qty</th>
                  <th class="item-price">Price</th>
                  <th class="item-total">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.products
                  .map((item) => {
                    const product = products.find((p) => p._id === item.productId);
                    return `
                      <tr>
                        <td class="item-name">${product?.name || 'Unknown Item'}</td>
                        <td class="item-qty">${item.quantity}</td>
                        <td class="item-price">₹${product?.price ? product.price.toFixed(2) : '0.00'}</td>
                        <td class="item-total">₹${product?.price ? (product.price * item.quantity).toFixed(2) : '0.00'}</td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
            
            <div class="summary-section">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${orderData.totalAmount.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Discount (${companyInfo.discount}%):</span>
                <span>-₹${calculateDiscount()}</span>
              </div>
              <div class="summary-row">
                <span>Subtotal after Discount:</span>
                <span>₹${calculateSubtotalAfterDiscount()}</span>
              </div>
              <div class="summary-row">
                <span>GST (${companyInfo.taxRate}%):</span>
                <span>₹${calculateTax()}</span>
              </div>
              <div class="summary-row total">
                <span>GRAND TOTAL:</span>
                <span>₹${calculateGrandTotal()}</span>
              </div>
              <div class="order-summary">
                Total Items: ${totalItems}
              </div>
            </div>
            
            <div class="qr-container" id="qrcode"></div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Visit us again!</p>
            </div>
          </div>
          
          <div class="print-controls no-print" id="print-controls" style="display: none;">
            <p>Your invoice is ready to print!</p>
            <button class="print-btn" onclick="handlePrint()">🖨️ Print Invoice</button>
            <button class="print-btn secondary" onclick="window.close()">❌ Close</button>
            <br><br>
            <small style="color: #666;">
              💡 Tip: Make sure your printer is connected and ready.<br>
              For POS printers, ensure proper driver installation.
            </small>
          </div>
          
          <script>
            let qrGenerated = false;
            let contentLoaded = false;
            
            function showContent() {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('invoice-content').style.display = 'block';
              document.getElementById('print-controls').style.display = 'block';
              contentLoaded = true;
            }
            
            function generateQR() {
              try {
                if (typeof QRCode !== 'undefined') {
                  new QRCode(document.getElementById("qrcode"), {
                    text: "${qrData}",
                    width: 80,
                    height: 80,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M
                  });
                  qrGenerated = true;
                } else {
                  console.warn('QRCode library not loaded');
                  qrGenerated = true;
                }
              } catch (error) {
                console.error('QR Code generation failed:', error);
                qrGenerated = true;
              }
            }
            
            function handlePrint() {
              try {
                window.focus();
                const controls = document.getElementById('print-controls');
                if (controls) controls.style.display = 'none';
                
                setTimeout(() => {
                  const printResult = window.print();
                  setTimeout(() => {
                    if (controls) controls.style.display = 'block';
                  }, 1000);
                  if (window.matchMedia) {
                    const mediaQueryList = window.matchMedia('print');
                    mediaQueryList.addListener((mql) => {
                      if (!mql.matches) {
                        console.log('Print dialog closed');
                      }
                    });
                  }
                }, 100);
              } catch (error) {
                alert('Print failed: ' + error.message + '\\n\\nPlease check your printer connection and try again.');
                console.error('Print error:', error);
              }
            }
            
            window.addEventListener('beforeprint', () => {
              console.log('Preparing to print...');
            });
            
            window.addEventListener('afterprint', () => {
              console.log('Print completed or cancelled');
            });
            
            window.addEventListener('load', () => {
              console.log('Window loaded');
              generateQR();
              setTimeout(() => {
                showContent();
              }, 1000);
            });
            
            document.addEventListener('DOMContentLoaded', () => {
              console.log('DOM loaded');
              if (!contentLoaded) {
                setTimeout(() => {
                  generateQR();
                  showContent();
                }, 1500);
              }
            });
            
            window.addEventListener('error', (event) => {
              console.error('Window error:', event.error);
              if (!contentLoaded) {
                showContent();
              }
            });
            
            window.addEventListener('beforeunload', (event) => {
              // event.preventDefault();
              // event.returnValue = '';
            });
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      const checkWindowLoaded = setTimeout(() => {
        if (printWindow.closed) {
          console.warn('Print window was closed before content loaded');
        } else {
          console.log('Print window should be ready');
        }
      }, 3000);
      
      printWindow.addEventListener('beforeunload', () => {
        clearTimeout(checkWindowLoaded);
      });
    } catch (error) {
      console.error('Print function error:', error);
      alert(`Print failed: ${error.message}\n\nPlease try again or check your browser settings.`);
    }
  };

  const handleNewOrder = () => {
    setOrderData({ products: [], totalAmount: 0 });
    localStorage.removeItem("ims_cart");
    setShowBill(false);
    setShowCart(false);
    setSelectedRoom("");
    setSelectedTable("");
  };

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem(`company_${name}`, value);
      return updated;
    });
  };

  const calculateDiscount = () => {
    const discountPercent = parseFloat(companyInfo.discount) || 0;
    return (orderData.totalAmount * (discountPercent / 100)).toFixed(2);
  };

  const calculateSubtotalAfterDiscount = () => {
    return (parseFloat(orderData.totalAmount) - parseFloat(calculateDiscount())).toFixed(2);
  };

  const calculateTax = () => {
    const taxRatePercent = parseFloat(companyInfo.taxRate) || 0;
    const subtotalAfterDiscount = parseFloat(calculateSubtotalAfterDiscount());
    return (subtotalAfterDiscount * (taxRatePercent / 100)).toFixed(2);
  };

  const calculateGrandTotal = () => {
    const subtotalAfterDiscount = parseFloat(calculateSubtotalAfterDiscount());
    const tax = parseFloat(calculateTax());
    return (subtotalAfterDiscount + tax).toFixed(2);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return "All Categories";
    const category = categories.find((cat) => cat._id === selectedCategory);
    return category ? category.name : "All Categories";
  };

  const CartToggleButton = () => (
    <motion.button
      onClick={() => setShowCart(!showCart)}
      className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-xl z-50"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      aria-label="Toggle cart"
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

  const memoizedFilteredProducts = useMemo(() => filteredProducts, [filteredProducts]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl md:text-2xl font-bold truncate max-w-[200px] md:max-w-none">
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
              aria-label="Open settings"
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
                  aria-label="Close settings"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    max="100"
                    step="0.1"
                    value={companyInfo.discount}
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

      {/* Checkout Modal */}
   <AnimatePresence>
  {showCheckoutModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col"
      >
        {/* Header */}
       {/* Header */}
<div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white relative overflow-hidden">
  <div className="absolute inset-0 opacity-10">
    <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
  </div>
  <div className="relative flex justify-between items-center">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <MapPin className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Reserve Your Table</h2>
        <p className="text-slate-200 text-sm">Choose your perfect dining spot</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <motion.button
        onClick={fetchRooms}
        disabled={refreshingRooms}
        className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Refresh table availability"
      >
        <RefreshCw size={20} className={refreshingRooms ? 'animate-spin' : ''} />
      </motion.button>
      <button
        onClick={() => setShowCheckoutModal(false)}
        className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
        aria-label="Close checkout modal"
      >
        <X size={24} />
      </button>
    </div>
  </div>
</div>
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-6">
            {/* Room Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <div className="p-1 bg-blue-100 rounded">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                Select Dining Area
              </label>
              <div className="grid gap-3">
                {rooms.map((room) => (
                  <motion.div
                    key={room._id}
                    onClick={() => {
                      setSelectedRoom(room._id);
                      setSelectedTable(""); // Reset table when room changes
                    }}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedRoom === room._id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-slate-800">{room.roomName}</h3>
                        <p className="text-sm text-slate-600">{room.ambiance || 'Comfortable dining experience'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>{room.tables?.filter(t => t.status === 'available').length || 0} available</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Table Selection */}
            {selectedRoom && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <label className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <div className="p-1 bg-green-100 rounded">
                    <Utensils className="w-4 h-4 text-green-600" />
                  </div>
                  Choose Your Table
                </label>
               <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {rooms
                    .find((room) => room._id === selectedRoom)
                    ?.tables
                    .map((table) => (
                      <motion.div
                        key={table._id}
                        onClick={() => table.status === 'available' && setSelectedTable(table._id)}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          table.status !== 'available'
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                            : selectedTable === table._id
                            ? 'border-green-500 bg-green-50 shadow-md cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                        }`}
                        whileHover={table.status === 'available' ? { scale: 1.02 } : {}}
                        whileTap={table.status === 'available' ? { scale: 0.98 } : {}}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{table.tableType === 'Window' ? '🪟' : table.tableType === 'Corner' ? '🏠' : table.tableType === 'Booth' ? '🛋️' : '🍽️'}</span>
                              <div>
                                <h4 className="font-semibold text-slate-800">Table {table.tableNumber}</h4>
                                <p className="text-sm text-slate-600">{table.tableType}</p>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              table.status === 'available' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : table.status === 'occupied'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}>
                              {table.status}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Users className="w-4 h-4" />
                            <span>{table.seatingCapacity} seats</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <div className="flex justify-between items-center gap-4">
            <div className="text-sm text-slate-600">
              {selectedRoom && selectedTable ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Table selected and ready to book</span>
                </div>
              ) : (
                <span>Please select a room and table to continue</span>
              )}
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowCheckoutModal(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleOrderSubmit}
                disabled={!selectedRoom || !selectedTable || loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-blue-800"
                whileHover={!loading && selectedRoom && selectedTable ? { y: -1 } : {}}
                whileTap={!loading && selectedRoom && selectedTable ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Place Order"
                )}
              </motion.button>
            </div>
          </div>
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
                  aria-label="Close invoice"
                >
                  <X size={24} />
                </button>
              </div>

              <div ref={billRef} className="p-6 border border-gray-200 rounded-lg bg-white">
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
                    <p className="text-gray-600">Room: {rooms.find((r) => r._id === selectedRoom)?.roomName || 'N/A'}</p>
                    <p className="text-gray-600">Table: {rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber || 'N/A'}</p>
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
                      <span className="text-gray-600">Discount ({companyInfo.discount}%):</span>
                      <span className="font-medium text-green-600">₹{calculateDiscount()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal after Discount:</span>
                      <span className="font-medium">₹{calculateSubtotalAfterDiscount()}</span>
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
          <div
            className={`w-full md:w-8/12 flex flex-col bg-white ${
              showCart ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Search and filter */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
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
                    aria-label="Search products"
                  />
                </div>

                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="flex items-center justify-between w-full sm:w-48 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-haspopup="true"
                    aria-expanded={showCategoryDropdown}
                  >
                    <span className="truncate">{getSelectedCategoryName()}</span>
                    <ChevronDown
                      size={18}
                      className={`ml-2 transition-transform ${
                        showCategoryDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>
                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-lg mt-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50"
                        role="menu"
                      >
                        <button
                          onClick={() => handleChangeCategory("")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          role="menuitem"
                        >
                          All Categories
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category._id}
                            onClick={() => handleChangeCategory(category._id)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              selectedCategory === category._id
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-700 hover:bg-blue-50"
                            }`}
                            role="menuitem"
                          >
                            <Tag size={14} className="inline-block mr-2" />
                            {category.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={fetchProducts}
                  className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex-shrink-0"
                  whileHover={{ rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={refreshingProducts}
                  aria-label="Refresh products"
                >
                  <RefreshCw
                    size={18}
                    className={refreshingProducts ? "animate-spin" : ""}
                  />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-blue-50">
              <div className="p-4 h-full">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <RefreshCw size={48} className="animate-spin mb-4" />
                    <p className="text-lg">Loading products...</p>
                  </div>
                ) : memoizedFilteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Package size={48} className="mb-4 opacity-30" />
                    <p className="text-lg">No products found</p>
                    <p className="text-sm mt-2">Try a different search or category</p>
                  </div>
                ) : (
                  <div 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 pb-20 md:pb-4"
                    style={{ 
                      minHeight: 'fit-content',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {memoizedFilteredProducts.map((product) => (
                      <motion.div
                        key={product._id}
                        onClick={() => handleOrderClick(product)}
                        className={`border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all bg-white shadow-sm hover:shadow-md ${
                          product.stock > 0
                            ? "hover:border-blue-300"
                            : "opacity-70 cursor-not-allowed"
                        }`}
                        whileHover={{ y: -3 }}
                        role="button"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <div>
                          <div className="bg-blue-100 p-3 rounded-lg flex items-center justify-center mb-3 h-24">
                            {product.image ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}/Uploads/${
                                  product.image
                                }`}
                                alt={product.name}
                                className="h-full object-contain"
                              />
                            ) : (
                              <Package size={24} className="text-blue-600" />
                            )}
                          </div>
                          <h3 className="font-medium text-gray-800 text-sm truncate">
                            {product.name}
                          </h3>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-blue-600 font-bold">
                              ₹{product.price.toFixed(2)}
                            </p>
                            <p
                              className={`text-xs px-2 py-1 rounded-full ${
                                product.stock > 10
                                  ? "bg-green-100 text-green-800"
                                  : product.stock > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
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
          </div>

          {/* Right side - Order */}
          <div
            className={`w-full md:w-4/12 bg-white border-l border-gray-200 flex flex-col shadow-lg ${
              showCart ? "flex" : "hidden md:flex"
            }`}
          >
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-700 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setShowCart(false)}
                  className="md:hidden mr-3 text-blue-200 hover:text-white"
                  aria-label="Back to products"
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
                  aria-label="Clear cart"
                >
                  Clear All
                </button>
              )}
            </div>

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
                          <h4 className="font-medium text-gray-800 text-sm truncate">
                            {product?.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            ₹{product?.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <motion.button
                            onClick={() =>
                              handleQuantityChange(item.productId, item.quantity - 1)
                            }
                            className="w-7 h-7 flex items-center justify-center bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Decrease quantity of ${product?.name}`}
                          >
                            <Minus size={14} />
                          </motion.button>
                          <span className="w-7 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <motion.button
                            onClick={() =>
                              handleQuantityChange(item.productId, item.quantity + 1)
                            }
                            disabled={item.quantity >= product?.stock}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                              item.quantity >= product?.stock
                                ? "bg-gray-100 text-gray-400"
                                : "bg-blue-100 hover:bg-blue-200"
                            }`}
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Increase quantity of ${product?.name}`}
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
                          aria-label={`Remove ${product?.name} from cart`}
                        >
                          <X size={16} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{orderData.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount ({companyInfo.discount}%)</span>
                  <span className="text-green-600">₹{calculateDiscount()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal after Discount</span>
                  <span>₹{calculateSubtotalAfterDiscount()}</span>
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

              <motion.button
                onClick={handleCheckoutClick}
                disabled={orderData.products.length === 0 || loading}
                className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 text-white py-3 rounded-xl font-medium transition-all shadow-md"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Checkout"
              >
                <DollarSign size={18} className="mr-2" />
                {loading ? "Processing..." : "Checkout"}
              </motion.button>
            </div>
          </div>

          <CartToggleButton />
        </div>
      )}
    </div>
  );
};

export default POSPage;