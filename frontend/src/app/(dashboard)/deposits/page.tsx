'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { depositsService } from '@/services/deposits.service';
import { 
  Plus, 
  Filter, 
  Search, 
  Package,
  Weight,
  CheckCircle,
  Clock,
  QrCode,
  TrendingUp,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';

const MATERIAL_TYPES = [
  { value: 'PET', label: 'PET', color: 'bg-blue-100 text-blue-800' },
  { value: 'HDPE', label: 'HDPE', color: 'bg-green-100 text-green-800' },
  { value: 'PP', label: 'PP', color: 'bg-purple-100 text-purple-800' },
  { value: 'LDPE', label: 'LDPE', color: 'bg-pink-100 text-pink-800' },
  { value: 'PS', label: 'PS', color: 'bg-red-100 text-red-800' },
  { value: 'PVC', label: 'PVC', color: 'bg-orange-100 text-orange-800' },
  { value: 'CARTON', label: 'Cartón', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'GLASS', label: 'Vidrio', color: 'bg-teal-100 text-teal-800' },
  { value: 'ALUMINUM', label: 'Aluminio', color: 'bg-gray-100 text-gray-800' },
  { value: 'STEEL', label: 'Acero', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'COPPER', label: 'Cobre', color: 'bg-amber-100 text-amber-800' },
  { value: 'OTHER_METAL', label: 'Otro Metal', color: 'bg-slate-100 text-slate-800' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'CREATED', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'VALIDATED', label: 'Validado', color: 'bg-green-100 text-green-800' },
  { value: 'BATCHED', label: 'En lote', color: 'bg-blue-100 text-blue-800' },
];

export default function DepositsPage() {
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-deposits', page, selectedStatus, selectedMaterial, dateRange],
    queryFn: () => depositsService.getMyDeposits({ 
      page, 
      limit: 10,
      status: selectedStatus || undefined,
      materialType: selectedMaterial || undefined,
      ...dateRange
    }),
    enabled: !!user,
  });

  const deposits = data?.deposits || [];
  const stats = data?.stats || {};
  const pagination = data?.pagination || {};

  const filteredDeposits = deposits.filter((deposit) => {
    return deposit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           deposit.materialType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getMaterialConfig = (type: string) => {
    return MATERIAL_TYPES.find(m => m.value === type) || MATERIAL_TYPES[0];
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Depósitos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y visualiza todos tus depósitos de reciclaje
          </p>
        </div>
        
        <div className="flex gap-3"></div>
        <Link
          href="/deposits/create"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Depósito
        </Link>
        <Link
            href="/deposits/remote"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <QrCode className="w-5 h-5 mr-2" />
            Depósito Remoto
          </Link>
        </div>
      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Depósitos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total || 0}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Peso Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(stats.totalWeight || 0).toFixed(1)} kg
              </p>
            </div>
            <Weight className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validados</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.validated || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.batched || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por ID o material..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                >
                  <option value="">Todos los materiales</option>
                  {MATERIAL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Cargando depósitos...</div>
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No se encontraron depósitos</p>
            <p className="text-sm mt-1">Intenta ajustar los filtros o crear un nuevo depósito</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID / QR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punto de Recolección
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeposits.map((deposit) => {
                  const materialConfig = getMaterialConfig(deposit.materialType);
                  const statusConfig = getStatusConfig(deposit.status);
                  
                  return (
                    <tr key={deposit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{deposit.id.slice(-8)}</div>
                        <div className="text-xs text-gray-500">QR: {deposit.qrCode?.slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${materialConfig.color}`}>
                          {materialConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{deposit.estimatedWeight} kg</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color || ''}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(deposit.createdAt).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(deposit.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deposit.collectionPoint?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/deposits/${deposit.id}`}
                          className="text-green-600 hover:text-green-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, pagination.total)} de {pagination.total} depósitos
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 border rounded text-sm ${
                    page === i + 1
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}