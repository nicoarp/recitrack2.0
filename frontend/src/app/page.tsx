'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { metricsService } from '@/services/metrics.service';
import { depositsService } from '@/services/deposits.service';
import { batchesService } from '@/services/batches.service';
import { 
  Package, 
  TrendingUp,  
  Recycle, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Queries según el rol
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => metricsService.getDashboardMetrics(),
    enabled: !!user && ['ADMIN', 'OPERATOR'].includes(user.role),
  });

  const { data: myDeposits } = useQuery({
    queryKey: ['my-recent-deposits'],
    queryFn: () => depositsService.getMyDeposits({ limit: 5 }),
    enabled: !!user && user.role === 'COLLECTOR',
  });

const { data: pendingDeposits } = useQuery({
  queryKey: ['pending-deposits', user?.facilityId],
  queryFn: () => depositsService.getPendingValidation(user?.facilityId),
  enabled: !!user && user.role === 'OPERATOR' && !!user.facilityId
});

  const { data: openBatches } = useQuery({
  queryKey: ['open-batches', user?.facilityId],
  queryFn: () => batchesService.getOpenBatches(user?.facilityId),
  enabled: !!user && ['ADMIN', 'OPERATOR'].includes(user.role) && !!user.facilityId
});

  // Datos para las tarjetas de estadísticas
  const getStatsForRole = () => {
    if (user?.role === 'COLLECTOR') {
      const deposits = Array.isArray(myDeposits) ? myDeposits : myDeposits?.deposits || [];
      const stats = myDeposits?.stats || {};
    
      const totalDeposits = stats.total || deposits.length || 0;
      const validatedCount = stats.validated || deposits.filter(d => d.status === 'VALIDATED').length || 0;
      const totalWeight = deposits.reduce((sum, d) => sum + (Number(d.estimatedWeight) || 0), 0);

      return [
        {
          title: 'Mis Depósitos',
          value: totalDeposits,
          icon: Package,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          change: '+12%',
          trend: 'up'
        },
        {
          title: 'Validados',
          value: validatedCount,
          icon: Activity,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          change: '+8%',
          trend: 'up'
        },
        {
          title: 'Peso Total (kg)',
          value: typeof totalWeight === 'number' ? totalWeight.toFixed(1) : '0.0',
          icon: TrendingUp,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          change: '+15%',
          trend: 'up'
        }
      ];
    }
const totalWeight = myDeposits?.deposits?.reduce((sum, d) => sum + d.estimatedWeight, 0) || 0;
console.log('myDeposits:', myDeposits);
console.log('totalWeight:', totalWeight, typeof totalWeight);

    // Para OPERATOR específicamente
if (user?.role === 'OPERATOR') {
  return [
    {
      title: 'Pendientes de Validar',
      value: pendingDeposits?.length || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: 'Hoy',
      trend: 'up'
    },
    {
      title: 'Lotes Activos',
      value: openBatches?.length || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${openBatches?.[0]?.currentWeight || 0}kg`,
      trend: 'up'
    },
    {
      title: 'Validados Hoy',
      value: metrics?.validatedToday || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%',
      trend: 'up'
    }
  ];
}
    // Para ADMIN y OPERATOR
    return [
      {
        title: 'Depósitos Hoy',
        value: metrics?.depositsToday || 0,
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        change: `${metrics?.depositsTrend || 0}%`,
        trend: metrics?.depositsTrend > 0 ? 'up' : 'down'
      },
      {
        title: 'Peso Total (kg)',
        value: (metrics?.totalWeight || 0).toFixed(1),
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        change: `${metrics?.weightTrend || 0}%`,
        trend: metrics?.weightTrend > 0 ? 'up' : 'down'
      },
      {
        title: 'Lotes Activos',
        value: metrics?.activeBatches || 0,
        icon: Recycle,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        change: '+5%',
        trend: 'up'
      }
    ];
  };

  const stats = getStatsForRole();

  // Gráfico simple de actividad reciente (placeholder)
  const activityData = [
    { day: 'Lun', value: 65 },
    { day: 'Mar', value: 80 },
    { day: 'Mie', value: 75 },
    { day: 'Jue', value: 90 },
    { day: 'Vie', value: 85 },
    { day: 'Sab', value: 70 },
    { day: 'Dom', value: 60 },
  ];

  const maxValue = Math.max(...activityData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Hola, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'COLLECTOR' ? 'Resumen de tu actividad de reciclaje' : 'Resumen del centro de reciclaje'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <Calendar className="inline w-4 h-4 mr-1" />
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Semanal</h2>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex items-end justify-between h-32 gap-2">
          {activityData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-100 rounded-t flex flex-col justify-end" style={{ height: '100%' }}>
                <div 
                  className="bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                  style={{ height: `${(data.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{data.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity / Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {user?.role === 'COLLECTOR' ? 'Mis Últimos Depósitos' : 'Actividad Reciente'}
          </h2>
          
          {user?.role === 'COLLECTOR' && myDeposits?.deposits && (
            <div className="space-y-3">
              {myDeposits.deposits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No tienes depósitos aún. ¡Comienza creando tu primer depósito!
                </p>
              ) : (
                myDeposits.deposits.map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{deposit.materialType}</p>
                        <p className="text-sm text-gray-500">{deposit.estimatedWeight} kg</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      deposit.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                      deposit.status === 'BATCHED' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deposit.status === 'CREATED' ? 'Pendiente' :
                       deposit.status === 'VALIDATED' ? 'Validado' : 'En lote'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {user?.role === 'OPERATOR' && pendingDeposits && (
            <div className="space-y-3">
              {pendingDeposits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay depósitos pendientes de validación
                </p>
              ) : (
                pendingDeposits.map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer"
                       onClick={() => router.push(`/deposits/${deposit.id}/validate`)}>
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">{deposit.materialType} - {deposit.estimatedWeight} kg</p>
                        <p className="text-sm text-gray-500">Por {deposit.collector?.firstName} {deposit.collector?.lastName}</p>
                      </div>
                    </div>
                    <span className="text-sm text-yellow-600 font-medium">
                      Validar →
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick Actions / Open Batches */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {user?.role === 'COLLECTOR' ? 'Acciones Rápidas' : 'Lotes Abiertos'}
          </h2>
          
          {user?.role === 'COLLECTOR' ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/deposits/create')}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
              >
                <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Nuevo Depósito</span>
              </button>
              <button
                onClick={() => router.push('/qr/scan')}
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
              >
                <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Escanear QR</span>
              </button>
              <button
                onClick={() => router.push('/deposits')}
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
              >
                <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Mis Depósitos</span>
              </button>
              <button
                onClick={() => router.push('/metrics')}
                className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center"
              >
                <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Mis Métricas</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {openBatches?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay lotes abiertos en este momento
                </p>
              ) : (
                openBatches?.map((batch) => (
                  <div key={batch.id} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                       onClick={() => router.push(`/batches/${batch.id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{batch.materialType}</h3>
                      <span className="text-sm text-blue-600 font-medium">
                        {batch.currentWeight}/{batch.targetWeight} kg
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(batch.currentWeight / batch.targetWeight) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {batch.depositsCount} depósitos
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}