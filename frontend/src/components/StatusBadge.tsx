import { Clock, CheckCircle, Package, XCircle } from 'lucide-react';

const STATUS_CONFIGS = {
  CREATED: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  VALIDATED: { label: 'Validado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  BATCHED: { label: 'En lote', color: 'bg-blue-100 text-blue-800', icon: Package },
  REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIGS }) {
  const config = STATUS_CONFIGS[status];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}