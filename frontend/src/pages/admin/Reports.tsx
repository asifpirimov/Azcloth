import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, CheckCircle, Ban } from 'lucide-react';

export const AdminReports = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [productReports, setProductReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STORE' | 'PRODUCT'>('STORE');
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; storeId: number | null }>({ open: false, storeId: null });
  const [suspendReason, setSuspendReason] = useState('');

  const fetchReports = () => {
    const token = localStorage.getItem('azcloth_token');
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/reports/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/product-reports/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json())
    ]).then(([storeData, productData]) => {
      setReports(storeData);
      setProductReports(productData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchReports();
  }, [isAuthenticated, user]);

  const handleStatusToggle = async (storeId: number, action: 'suspend' | 'activate') => {
    if (action === 'suspend' && !suspendReason) return;
    
    try {
      const token = localStorage.getItem('azcloth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stores/${storeId}/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason: action === 'suspend' ? suspendReason : '' })
      });
      
      if (res.ok) {
        setSuspendModal({ open: false, storeId: null });
        setSuspendReason('');
        fetchReports(); // Refresh data to show updated store status
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductReportAction = async (reportId: number, action: 'review' | 'resolve') => {
    try {
      const token = localStorage.getItem('azcloth_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/product-reports/${reportId}/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-20 text-center">Yüklənir...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Şikayətlər</h1>
          <p className="text-gray-500">Platforma daxili mağaza və məhsul şikayətləri.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('STORE')}
          className={`px-6 py-2 rounded-full font-bold text-sm transition ${activeTab === 'STORE' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          Mağaza Şikayətləri
        </button>
        <button 
          onClick={() => setActiveTab('PRODUCT')}
          className={`px-6 py-2 rounded-full font-bold text-sm transition ${activeTab === 'PRODUCT' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
        >
          Məhsul Şikayətləri
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'STORE' ? (
          reports.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Hələ heç bir mağaza şikayəti yoxdur.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Tarix</th>
                  <th className="px-6 py-4">Müştəri</th>
                  <th className="px-6 py-4">Mağaza</th>
                  <th className="px-6 py-4">Səbəb</th>
                  <th className="px-6 py-4">Açıqlama</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {report.user.username}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{report.store.name}</span>
                      {report.store.status === 'SUSPENDED' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Dondurulub
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {report.reason === 'fake_product' ? 'Saxta məhsul' : 
                       report.reason === 'scam' ? 'Dələduzluq' : 
                       report.reason === 'inappropriate' ? 'Uyğunsuz məzmun' : 'Digər'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={report.description}>
                      {report.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.store.status === 'SUSPENDED' ? (
                        <button 
                          onClick={() => handleStatusToggle(report.store.id, 'activate')}
                          className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition flex items-center gap-1 inline-flex"
                        >
                          <CheckCircle size={16} /> Aktivləşdir
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSuspendModal({ open: true, storeId: report.store.id })}
                          className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1 inline-flex"
                        >
                          <Ban size={16} /> Dondur
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          productReports.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Hələ heç bir məhsul şikayəti yoxdur.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tarix</th>
                  <th className="px-6 py-4">Müştəri</th>
                  <th className="px-6 py-4">Səbəb</th>
                  <th className="px-6 py-4">Açıqlama</th>
                  <th className="px-6 py-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      {report.status === 'OPEN' && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">Açıq</span>}
                      {report.status === 'UNDER_REVIEW' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg">Baxışda</span>}
                      {report.status === 'RESOLVED' && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Həll edilib</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {report.reporter?.username}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {report.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={report.description}>
                      {report.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.status !== 'RESOLVED' && (
                        <div className="flex gap-2 justify-end">
                          {report.status === 'OPEN' && (
                            <button 
                              onClick={() => handleProductReportAction(report.id, 'review')}
                              className="text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition"
                            >
                              Baxışa götür
                            </button>
                          )}
                          <button 
                            onClick={() => handleProductReportAction(report.id, 'resolve')}
                            className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition flex items-center gap-1 inline-flex"
                          >
                            <CheckCircle size={16} /> Həll et
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {suspendModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2 text-center text-red-600">
              Mağazanı Dondur
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
              Mağazanı dondurmaq onun bütün məhsullarını sistemdən gizlədəcək. Zəhmət olmasa səbəb qeyd edin.
            </p>
            <textarea 
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:border-red-500 mb-6 h-32 resize-none"
              placeholder="Dondurulma səbəbini (qayda pozuntusunu) buraya yazın..."
              required
            ></textarea>
            <div className="flex gap-3">
              <button 
                onClick={() => setSuspendModal({ open: false, storeId: null })}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Ləğv et
              </button>
              <button 
                onClick={() => suspendModal.storeId && handleStatusToggle(suspendModal.storeId, 'suspend')}
                disabled={!suspendReason.trim()}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50"
              >
                Təsdiqlə
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
