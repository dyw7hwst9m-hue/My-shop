import React from 'react';
import { OrderStatus } from '../../types';
import {
  Clock,
  FileCheck,
  CheckCircle2,
  Package,
  Sparkles,
  Check,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs: Record<
    OrderStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    pending_payment: {
      label: 'รอชำระเงิน',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
    },
    verifying_payment: {
      label: 'รอตรวจสอบสลิป',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: FileCheck,
    },
    paid: {
      label: 'ชำระเงินแล้ว',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    preparing: {
      label: 'กำลังเตรียมสินค้า',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: Package,
    },
    ready: {
      label: 'พร้อมรับสินค้า',
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      icon: Sparkles,
    },
    completed: {
      label: 'สำเร็จ',
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: Check,
    },
    cancelled: {
      label: 'ยกเลิก',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: XCircle,
    },
  };

  const config = configs[status] || configs.pending_payment;
  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-xs gap-1'
      : 'px-3 py-1 text-sm gap-1.5 font-medium';

  return (
    <span
      id={`badge-status-${status}`}
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} whitespace-nowrap font-medium transition-all shadow-xs`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
};
