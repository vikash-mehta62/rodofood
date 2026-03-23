import { cn, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import type { OrderStatus } from '@/types';

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', getOrderStatusColor(status))}>
      {getOrderStatusLabel(status)}
    </span>
  );
}
