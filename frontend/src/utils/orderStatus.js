const BUYER_LABELS = {
  pending: 'Order placed',
  payment_pending: 'Waiting for payment',
  proof_submitted: 'Payment proof sent',
  confirmed: 'Payment confirmed',
  preparing: 'Being prepared',
  ready: 'Ready for pickup',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  pending_seller_review: 'Awaiting seller approval',
};

const SELLER_LABELS = {
  pending: 'New order',
  payment_pending: 'Awaiting payment',
  proof_submitted: 'Proof uploaded — verify payment',
  confirmed: 'Paid — start preparing',
  preparing: 'Preparing',
  ready: 'Ready for customer',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  pending_seller_review: 'Review scheduled request',
};

export function getBuyerStatusLabel(order) {
  if (!order) return '';
  if (order.paymentStatus === 'proof_submitted' && order.status === 'payment_pending') {
    return BUYER_LABELS.proof_submitted;
  }
  if (order.deliveryType === 'pickup' && order.status === 'delivered') {
    return 'Picked up';
  }
  return BUYER_LABELS[order.status] || order.status;
}

export function getSellerStatusLabel(order) {
  if (!order) return '';
  if (order.paymentStatus === 'proof_submitted' && order.status === 'payment_pending') {
    return SELLER_LABELS.proof_submitted;
  }
  return SELLER_LABELS[order.status] || order.status;
}

export function formatScheduledPickup(order) {
  if (!order?.preorderTime && !order?.deliveryDate) return null;
  const parts = [];
  if (order.deliveryDate) {
    parts.push(new Date(order.deliveryDate).toLocaleDateString('id-ID', {
      weekday: 'short', day: 'numeric', month: 'short',
    }));
  }
  if (order.preorderTime) parts.push(`at ${order.preorderTime}`);
  return parts.join(' ');
}

export function resolveOrderId(order) {
  if (!order) return '';
  if (typeof order._id === 'string') return order._id;
  if (typeof order.id === 'string') return order.id;
  if (typeof order._id?.$oid === 'string') return order._id.$oid;
  return '';
}
