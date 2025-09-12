'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { depositsService } from '@/services/deposits.service';
import { Plus, Filter, Search, Package } from 'lucide-react';
import Link from 'next/link';

const MATERIAL_TYPES = [
  'PET', 'HDPE', 'PP', 'LDPE', 'PS', 'PVC', 
  'CARTON', 'GLASS', 'ALUMINUM', 'STEEL', 'COPPER', 'OTHER_METAL'
];

const STATUS_COLORS = {
  CREATED: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-green-100 text-green-800',
  BATCHED: 'bg-blue-100 text-blue-800',
};

export default function DepositsPage() {
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');

  const { data: deposits = [], isLoading, refetch } = useQuery({
    queryKey: ['my-deposits'],
    queryFn: depositsService.getMyDeposits,
    enabled: !!user,
  });

  const filteredDeposits = deposits.filter((deposit) => {
    const matchesSearch = deposit.materialType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || deposit.status === selectedStatus;
    const matchesMaterial = !selectedMaterial || deposit.materialType === selectedMaterial;
    
    return matchesSearch && matchesStatus && matchesMaterial;
  });

  const totalWeight = deposits.reduce((sum, deposit) => sum + deposit.estimatedWeight, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Depósitos</h1>
          <p className="text-gray-600 mt-2">
            Total: {deposits.length} depósitos ({totalWeight.toFixed(1)} kg)
          </p>
        </div>
        
        <Link
          href="/deposits/create"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Depósito
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="CREATED">Creado</option>
            <option value="VALIDATED">Validado</option>
            <option value="BATCHED">En lote</option>
          </select>

          {/* Material Filter */}
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos los materiales</option>
            {MATERIAL_TYPES.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deposits List */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando depósitos...</p>
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay depósitos</h3>
          <p className="text-gray-500 mb-6">
            {deposits.length === 0 
              ? 'Aún no has creado ningún depósito. ¡Comienza creando tu primer depósito!'
              : 'No se encontraron depósitos con los filtros aplicados.'
            }
          </p>
          {deposits.length === 0 && (
            <Link
              href="/deposits/create"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear primer depósito
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peso Estimado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {deposit.materialType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deposit.estimatedWeight} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[deposit.status]}`}>
                        {deposit.status === 'CREATED' ? 'Creado' :
                         deposit.status === 'VALIDATED' ? 'Validado' : 'En lote'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(deposit.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {deposit.observations || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}