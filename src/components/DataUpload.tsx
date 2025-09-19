import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Search, Trash2, Calendar, User } from 'lucide-react';
import { Account, SalesData, Category } from '../types';

interface DataUploadProps {
  accounts: Account[];
  salesData: SalesData[];
  categories: Category[];
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'superadmin';
    managed_accounts: string[];
  };
  onUploadData: (accountId: string, data: Omit<SalesData, 'id' | 'account_id' | 'created_at'>[]) => void;
  onDeleteSalesData: (accountId: string, dateRange?: { start: string; end: string }) => void;
}

interface ParsedRow {
  date: string;
  clicks: number;
  orders: number;
  gross_commission: number;
  products_sold: number;
  total_purchases: number;
  new_buyers: number;
}

const DataUpload: React.FC<DataUploadProps> = ({ 
  accounts, 
  salesData, 
  categories, 
  currentUser,
  onUploadData, 
  onDeleteSalesData 
}) => {
  // Filter accounts based on user role
  const filteredAccountsByRole = React.useMemo(() => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'superadmin') {
      return accounts;
    } else {
      // Regular users can only see accounts they manage
      return accounts.filter(account => 
        currentUser.managed_accounts.includes(account.id)
      );
    }
  }, [accounts, currentUser]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAccountForUpload, setSelectedAccountForUpload] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState('');
  const [deleteStartDate, setDeleteStartDate] = useState('');
  const [deleteEndDate, setDeleteEndDate] = useState('');

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'Belum Diatur';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Belum Diatur';
  };

  // Filter accounts based on search term
  const filteredAccounts = filteredAccountsByRole.filter(account => 
    account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(account.category_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccountSalesDataCount = (accountId: string) => {
    return salesData.filter(data => data.account_id === accountId).length;
  };

  const getAccountDateRange = (accountId: string) => {
    const accountData = salesData.filter(data => data.account_id === accountId);
    if (accountData.length === 0) return null;
    
    const dates = accountData.map(data => new Date(data.date)).sort((a, b) => a.getTime() - b.getTime());
    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    };
  };

  // Upload functions
  const openUploadModal = (accountId: string) => {
    setSelectedAccountForUpload(accountId);
    setShowUploadModal(true);
    setUploadResult(null);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedAccountForUpload('');
    setFile(null);
    setParsedData([]);
    setUploadResult(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseCSV = (csvText: string): ParsedRow[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    // Validate headers
    const expectedHeaders = [
      'Tanggal',
      'Klik', 
      'Pesanan',
      'Komisi Kotor(Rp)',
      'Produk Terjual',
      'Total Pembelian yang Dibuat(Rp)',
      'Pembeli Baru'
    ];

    const data: ParsedRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length === expectedHeaders.length) {
        data.push({
          date: row[0],
          clicks: parseInt(row[1]) || 0,
          orders: parseInt(row[2]) || 0,
          gross_commission: parseFloat(row[3]) || 0,
          products_sold: parseInt(row[4]) || 0,
          total_purchases: parseFloat(row[5]) || 0,
          new_buyers: parseInt(row[6]) || 0,
        });
      }
    }
    
    return data;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setUploadResult(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const parsed = parseCSV(csvText);
          setParsedData(parsed);
        } catch (error) {
          setUploadResult({
            success: false,
            message: 'Error parsing CSV file. Please check the file format.',
          });
        }
      };
      reader.readAsText(selectedFile);
    } else {
      setUploadResult({
        success: false,
        message: 'Please select a valid CSV file.',
      });
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setUploadResult(null);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const csvText = event.target?.result as string;
            const parsed = parseCSV(csvText);
            setParsedData(parsed);
          } catch (error) {
            setUploadResult({
              success: false,
              message: 'Error parsing CSV file. Please check the file format.',
            });
          }
        };
        reader.readAsText(droppedFile);
      } else {
        setUploadResult({
          success: false,
          message: 'Please drop a valid CSV file.',
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedAccountForUpload || !file || parsedData.length === 0) {
      setUploadResult({
        success: false,
        message: 'Please upload a valid CSV file.',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await onUploadData(selectedAccountForUpload, parsedData);
      setUploadResult({
        success: true,
        message: `Successfully uploaded ${parsedData.length} records.`,
      });
      
      // Reset form after successful upload
      setTimeout(() => {
        closeUploadModal();
      }, 2000);
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Failed to upload data. Please try again.',
      });
    }
    
    setIsUploading(false);
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setUploadResult(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete functions
  const openDeleteModal = (accountId: string) => {
    setDeleteAccountId(accountId);
    setShowDeleteModal(true);
    setDeleteStartDate('');
    setDeleteEndDate('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteAccountId('');
    setDeleteStartDate('');
    setDeleteEndDate('');
  };

  const handleDeleteSalesData = () => {
    if (!deleteAccountId) return;
    
    const dateRange = deleteStartDate && deleteEndDate 
      ? { start: deleteStartDate, end: deleteEndDate }
      : undefined;
    
    onDeleteSalesData(deleteAccountId, dateRange);
    closeDeleteModal();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Sales Data</h1>
          <p className="text-gray-600">
            {currentUser?.role === 'superadmin' 
              ? 'Manage sales data for all affiliate accounts'
              : `Manage sales data for your ${filteredAccountsByRole.length} affiliate accounts`}
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search accounts by name, email, code, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Accounts ({filteredAccounts.length})
            </h3>
          </div>
          
          {filteredAccounts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAccounts.map((account) => {
                const salesCount = getAccountSalesDataCount(account.id);
                const dateRange = getAccountDateRange(account.id);
                
                return (
                  <div key={account.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{account.username}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {account.account_code}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>{account.email}</span>
                            <span>•</span>
                            <span>{account.phone}</span>
                            <span>•</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              account.status === 'active' ? 'bg-green-100 text-green-800' :
                              account.status === 'violation' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {account.status === 'active' ? 'Aktif' : 
                               account.status === 'violation' ? 'Pelanggaran' : 'Non-Aktif'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              account.payment_data === 'belum diatur' ? 'bg-gray-100 text-gray-800' :
                              account.payment_data === 'utamakan' ? 'bg-yellow-100 text-yellow-800' :
                              account.payment_data === 'dimasukkan' ? 'bg-blue-100 text-blue-800' :
                              account.payment_data === 'disetujui' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {account.payment_data === 'belum diatur' ? 'Belum Diatur' :
                               account.payment_data === 'utamakan' ? 'Utamakan' :
                               account.payment_data === 'dimasukkan' ? 'Dimasukkan' :
                               account.payment_data === 'disetujui' ? 'Disetujui' : 'Sah'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getCategoryName(account.category_id)}
                            </span>
                          </div>
                          {salesCount > 0 && (
                            <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <FileText className="w-3 h-3" />
                                <span>{salesCount} sales records</span>
                              </span>
                              {dateRange && (
                                <>
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(dateRange.start).toLocaleDateString('id-ID')} - {new Date(dateRange.end).toLocaleDateString('id-ID')}
                                    </span>
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openUploadModal(account.id)}
                          className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Data</span>
                        </button>
                        
                        {salesCount > 0 && (
                          <button
                            onClick={() => openDeleteModal(account.id)}
                            className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Data</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filteredAccountsByRole.length === 0 ? 'No accounts assigned to you' : 'No accounts match your search'}
              </h3>
              <p className="text-gray-600">
                {filteredAccountsByRole.length === 0 
                  ? currentUser?.role === 'superadmin'
                    ? 'Please add accounts first in the Account Management section'
                    : 'No accounts have been assigned to you yet. Contact your administrator.'
                  : 'Try adjusting your search criteria'
                }
              </p>
            </div>
          )}
        </div>

        {/* CSV Format Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">CSV Format Requirements</h3>
          <p className="text-blue-800 mb-4">Your CSV file should contain the following columns in this exact order:</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-900">1. Tanggal (Date)</p>
              <p className="font-medium text-blue-900">2. Klik (Clicks)</p>
              <p className="font-medium text-blue-900">3. Pesanan (Orders)</p>
              <p className="font-medium text-blue-900">4. Komisi Kotor(Rp) (Gross Commission)</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">5. Produk Terjual (Products Sold)</p>
              <p className="font-medium text-blue-900">6. Total Pembelian yang Dibuat(Rp) (Total Purchases)</p>
              <p className="font-medium text-blue-900">7. Pembeli Baru (New Buyers)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upload Sales Data</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload CSV file for: {accounts.find(acc => acc.id === selectedAccountForUpload)?.username}
                  </p>
                </div>
                <button
                  onClick={closeUploadModal}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                  isDragOver 
                    ? 'border-purple-400 bg-purple-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                
                {!file ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {isDragOver ? 'Drop your CSV file here' : 'Drop your CSV file here, or click to browse'}
                    </h3>
                    <p className={`mb-4 ${isDragOver ? 'text-purple-600' : 'text-gray-600'}`}>
                      CSV files up to 10MB are supported
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Choose File
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-6 h-6 text-green-500" />
                      <span className="font-medium text-gray-900">{file.name}</span>
                      <button
                        onClick={clearFile}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {parsedData.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p>{parsedData.length} rows parsed successfully</p>
                        <p className="text-xs mt-1">
                          Date range: {parsedData[parsedData.length - 1]?.date} to {parsedData[0]?.date}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className={`border rounded-lg p-4 mb-6 flex items-start space-x-3 ${
                  uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-medium ${
                      uploadResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                    </h3>
                    <p className={`text-sm ${
                      uploadResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {uploadResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={closeUploadModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !file || parsedData.length === 0}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sales Data Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Delete Sales Data</h2>
                <button
                  onClick={closeDeleteModal}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-900">Warning</h3>
                      <p className="text-sm text-red-700 mt-1">
                        This action cannot be undone. Sales data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {(() => {
                      const account = accounts.find(acc => acc.id === deleteAccountId);
                      return account ? (
                        <div>
                          <div className="font-medium text-gray-900">{account.username}</div>
                          <div className="text-sm text-gray-500">{account.account_code} • {account.email}</div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={deleteStartDate}
                      onChange={(e) => setDeleteStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={deleteEndDate}
                      onChange={(e) => setDeleteEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  {deleteStartDate || deleteEndDate 
                    ? 'Only data within the specified date range will be deleted.'
                    : 'All sales data for this account will be deleted.'
                  }
                </p>
              </div>
              
              <div className="flex space-x-3 pt-6">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSalesData}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataUpload;