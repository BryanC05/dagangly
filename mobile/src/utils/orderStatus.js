export function getBuyerStatusLabel(order) {
  if (!order) return "";
  if (order.payment_status === "proof_submitted" && order.status === "payment_pending") {
    return "Payment proof sent";
  }
  const labels = {
    payment_pending: "Waiting for payment",
    confirmed: "Payment confirmed",
    preparing: "Being prepared",
    ready: "Ready for pickup",
    delivered: order.deliveryType === "pickup" ? "Picked up" : "Delivered",
  };
  return labels[order.status] || order.status;
}

export function getSellerStatusLabel(order) {
  if (!order) return "";
  if (order.payment_status === "proof_submitted" && order.status === "payment_pending") {
    return "Verify payment proof";
  }
  const labels = {
    payment_pending: "Awaiting payment",
    confirmed: "Paid — prepare order",
    preparing: "Preparing",
    ready: "Ready for customer",
    delivered: "Completed",
  };
  return labels[order.status] || order.status;
}

export function formatScheduledPickup(order) {
  const time = order.preorderTime || order.preorder_time;
  const date = order.deliveryDate || order.delivery_date;
  if (!time && !date) return null;
  const parts = [];
  if (date) parts.push(new Date(date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }));
  if (time) parts.push(time);
  return parts.join(" · ");
}
