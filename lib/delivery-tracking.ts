import type { OrderStatus } from "@/lib/order-status";

export type DeliveryTrackingInfo = {
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  codAmountDue: number | null;
  codCollectedAt: string | null;
  dispatchedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
};

export const defaultCourierName = "Scentora Courier";

export function buildTrackingNumber(orderId: string) {
  return `SCT-${orderId.slice(0, 8).toUpperCase()}`;
}

export function getTrackingHref(trackingUrl: string | null) {
  const trimmed = trackingUrl?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function statusNote(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "COD order received and awaiting confirmation";
    case "ACCEPTED":
      return "Order confirmed for cash on delivery";
    case "REJECTED":
      return "Order rejected and will not be processed";
    case "PROCESSING":
      return "Order is packed and ready for courier handover";
    case "DISPATCHED":
      return "Order dispatched from Scentora";
    case "SHIPPED":
      return "Shipment handed to courier";
    case "IN_TRANSIT":
      return "Order is in transit to the delivery area";
    case "OUT_FOR_DELIVERY":
      return "Courier is out for delivery. Please keep cash ready";
    case "DELIVERED":
      return "Order delivered and COD payment collected";
    case "CANCELLED":
      return "Order cancelled";
    case "RETURN_REQUESTED":
      return "Return requested for this order";
    case "RETURNED":
      return "Your return request has been accepted. Our team will contact you with the next steps.";
    case "REFUNDED":
      return "Refund processed for this order";
    default:
      return `Order status changed to ${status}`;
  }
}

export function getCourierStepLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Order placed";
    case "ACCEPTED":
      return "Confirmed";
    case "PROCESSING":
      return "Order processing";
    case "DISPATCHED":
      return "Order dispatched";
    case "SHIPPED":
      return "Shipped";
    case "IN_TRANSIT":
      return "In transit";
    case "OUT_FOR_DELIVERY":
      return "Out for delivery";
    case "DELIVERED":
      return "Delivered";
    case "REJECTED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
    case "RETURN_REQUESTED":
      return "Return requested";
    case "RETURNED":
      return "Return accepted";
    case "REFUNDED":
      return "Refunded";
    default:
      return status;
  }
}

export function isDeliveryStatus(status: string) {
  return [
    "PENDING",
    "ACCEPTED",
    "PROCESSING",
    "DISPATCHED",
    "SHIPPED",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ].includes(status);
}

export const customerTrackingSteps = [
  "PENDING",
  "PROCESSING",
  "DISPATCHED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export const fulfillmentFlow = [
  "PENDING",
  "ACCEPTED",
  "PROCESSING",
  "DISPATCHED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const satisfies readonly OrderStatus[];

const terminalStatuses = [
  "REJECTED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];

function getFulfillmentFlowIndex(status: string) {
  if (status === "SHIPPED") {
    return fulfillmentFlow.findIndex((step) => step === "IN_TRANSIT");
  }

  return fulfillmentFlow.findIndex((step) => step === status);
}

export function canCustomerCancel(status: string) {
  return ["PENDING", "ACCEPTED", "PROCESSING"].includes(status);
}

const RETURN_WINDOW_DAYS = 15;

export function canCustomerReturn(status: string, deliveredAt?: Date | string | null) {
  if (status !== "DELIVERED") {
    return false;
  }

  if (!deliveredAt) {
    return false;
  }

  const deliveredDate = deliveredAt instanceof Date ? deliveredAt : new Date(deliveredAt);

  if (Number.isNaN(deliveredDate.getTime())) {
    return false;
  }

  const now = new Date();
  const cutoff = new Date(deliveredDate);
  cutoff.setDate(cutoff.getDate() + RETURN_WINDOW_DAYS);

  return now <= cutoff;
}

export function getNextFulfillmentStatus(status: string): OrderStatus | null {
  const currentIndex = getFulfillmentFlowIndex(status);

  if (currentIndex < 0 || currentIndex >= fulfillmentFlow.length - 1) {
    return null;
  }

  return fulfillmentFlow[currentIndex + 1];
}

export function getHighestFulfillmentStatus(statuses: string[]) {
  let highestIndex = -1;

  for (const status of statuses) {
    const index = getFulfillmentFlowIndex(status);

    if (index > highestIndex) {
      highestIndex = index;
    }
  }

  return highestIndex >= 0 ? fulfillmentFlow[highestIndex] : null;
}

export function getEffectiveOrderStatus(
  currentStatus: string,
  historyStatuses: string[],
) {
  if ((terminalStatuses as readonly string[]).includes(currentStatus)) {
    return currentStatus;
  }

  return getHighestFulfillmentStatus([...historyStatuses, currentStatus]) ?? currentStatus;
}

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) {
  if (currentStatus === nextStatus) {
    return { allowed: true };
  }

  if ((terminalStatuses as readonly string[]).includes(currentStatus)) {
    return {
      allowed: false,
      reason: `Order is already ${getCourierStepLabel(currentStatus).toLowerCase()}`,
    };
  }

  if (nextStatus === "REJECTED") {
    return currentStatus === "PENDING"
      ? { allowed: true }
      : { allowed: false, reason: "Only newly placed orders can be rejected" };
  }

  if (nextStatus === "CANCELLED") {
    return canCustomerCancel(currentStatus)
      ? { allowed: true }
      : { allowed: false, reason: "Orders can only be cancelled before dispatch" };
  }

  if (nextStatus === "RETURN_REQUESTED") {
    return currentStatus === "DELIVERED"
      ? { allowed: true }
      : { allowed: false, reason: "Returns can only be requested after delivery" };
  }

  if (nextStatus === "RETURNED") {
    return currentStatus === "RETURN_REQUESTED"
      ? { allowed: true }
      : { allowed: false, reason: "A return must be requested before it can be accepted" };
  }

  if (nextStatus === "REFUNDED") {
    return currentStatus === "RETURNED"
      ? { allowed: true }
      : { allowed: false, reason: "Refunds can only be marked after return" };
  }

  const currentIndex = getFulfillmentFlowIndex(currentStatus);
  const nextIndex = getFulfillmentFlowIndex(nextStatus);

  if (currentIndex < 0 || nextIndex < 0) {
    return { allowed: false, reason: "This status is not part of fulfillment" };
  }

  if (nextIndex < currentIndex) {
    return { allowed: false, reason: "Order tracking cannot move backward" };
  }

  if (nextIndex > currentIndex + 1) {
    return {
      allowed: false,
      reason: `Advance to ${getCourierStepLabel(fulfillmentFlow[currentIndex + 1])} first`,
    };
  }

  return { allowed: true };
}
