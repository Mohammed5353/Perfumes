export const orderStatusValues = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof orderStatusValues)[number];

export const activeOrderStatuses = [
  "PENDING",
  "ACCEPTED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
] as const;

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export function formatOrderStatus(status: string) {
  if (isOrderStatus(status)) {
    return orderStatusLabels[status];
  }

  return humanizeStatus(status);
}

export function getOrderStatusTone(
  status: string,
): "blue" | "danger" | "green" | "neutral" | "warning" {
  switch (status) {
    case "PENDING":
    case "RETURN_REQUESTED":
      return "warning";
    case "ACCEPTED":
    case "PROCESSING":
    case "OUT_FOR_DELIVERY":
      return "blue";
    case "SHIPPED":
    case "DELIVERED":
    case "RETURNED":
      return "green";
    case "REJECTED":
    case "CANCELLED":
    case "REFUNDED":
      return "danger";
    default:
      return "neutral";
  }
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatusValues as readonly string[]).includes(value);
}

export function isActiveOrderStatus(value: string) {
  return (activeOrderStatuses as readonly string[]).includes(value);
}

function humanizeStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
