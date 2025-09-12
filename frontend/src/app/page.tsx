'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { metricsService } from '@/services/metrics.service';
import { depositsService } from '@/services/deposits.service';
import { batchesService } from '@/services/batches.service';
import { Package, Scale, Leaf, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['my-metrics'],
    queryFn: metricsService.getMyMetrics,
    enabled: !!user,
  });

  const { data: myDeposits, isLoading: depositsLoading } = useQuery({
    queryKey: ['my-deposits'],
    queryFn: depositsService.getMyDeposits,
    enabled: !!user && user.role === 'COLLECTOR',
  });

  const { data: openBatches, isLoading: batchesLoading } = useQuery({
    queryKey: ['open-batches'],
    queryFn: () => batchesService.getOpenBatches(),
    enabled: !!user && (user.role === 'OPERATOR' || user.role === 'ADMIN'),
  });

  const isLoading = metricsLoading || depositsLoading || batchesLoading;

  const getStats = () => {
    if (user?.role === 'COLLECTOR') {
      return [
        {
          title: 'Mis Depósitos',
          value: myDeposits?.length || 0,
          icon: Package,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Peso Total',
          value: `${metrics?.totalWeight || 0} kg`,
          icon: Scale,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          title: 'CO₂ Ahorrado',
          value: `${metrics?.co2Saved || 0} kg`,
          icon: Leaf,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
      ];
    }

    return [
      {
        title: 'Lotes Abiertos',
        value: openBatches?.length || 0,
        icon: Package,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        title: 'Total Procesado',
        value: `${metrics?.totalProcessed || 0} kg`,
        icon: Scale,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Eficiencia',
        value: `${metrics?.efficiency || 0}%`,
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
    ];
  };

  const stats = getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'COLLECTOR' ? 'Panel del Recolector' : 'Panel de Gestión'}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white p-6 rounded-xl shadow-sm border ${stat.bgColor} border-opacity-20`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {isLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h2>
        
        {user?.role === 'COLLECTOR' && (
          <div>
            {myDeposits?.length === 0 ? (
              <p className="text-gray-500">No tienes depósitos aún. ¡Comienza creando tu primer depósito!</p>
            ) : (
              <div className="space-y-3">
                {myDeposits?.slice(0, 5).map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{deposit.materialType}</p>
                        <p className="text-sm text-gray-500">{deposit.estimatedWeight} kg</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      deposit.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                      deposit.status === 'BATCHED' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deposit.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(user?.role === 'OPERATOR' || user?.role === 'ADMIN') && (
          <div>
            {openBatches?.length === 0 ? (
              <p className="text-gray-500">No hay lotes abiertos actualmente.</p>
            ) : (
              <div className="space-y-3">
                {openBatches?.slice(0, 5).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Lote {batch.materialType}</p>
                        <p className="text-sm text-gray-500">{batch.items?.length || 0} depósitos</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {batch.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}