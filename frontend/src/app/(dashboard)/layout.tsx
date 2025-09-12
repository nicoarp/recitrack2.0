'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import Link from 'next/link';
import { Home, Package, Users, LogOut, BarChart } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
    if (!token) {
      router.push('/login');
    }
  }, [token, checkAuth, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Depósitos', href: '/deposits', icon: Package },
    { name: 'Lotes', href: '/batches', icon: Package },
    { name: 'Métricas', href: '/metrics', icon: BarChart },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-green-800 text-white min-h-screen">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Recitrack</h1>
            <p className="text-sm text-green-200 mt-1">{user.role}</p>
          </div>
          
          <nav className="mt-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 hover:bg-green-700 transition-colors"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 w-64 p-4">
            <div className="border-t border-green-700 pt-4">
              <p className="text-sm text-green-200">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-green-300">{user.email}</p>
              <button
                onClick={handleLogout}
                className="mt-4 flex items-center text-sm text-green-200 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}