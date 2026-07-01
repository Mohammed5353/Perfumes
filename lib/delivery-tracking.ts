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
    case "SHIPPED":
      return "Shipment handed to courier";
    case "OUT_FOR_DELIVERY":
      return "Courier is out for delivery. Please keep cash ready";
    case "DELIVERED":
      return "Order delivered and COD payment collected";
    case "CANCELLED":
      return "Order cancelled";
    case "RETURN_REQUESTED":
      return "Return requested for this order";
    case "RETURNED":
      return "Order returned successfully";
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
      return "Packed";
    case "SHIPPED":
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
      return "Returned";
    case "REFUNDED":
      return "Refunded";
    default:
      return status;
  }
}

export function isDeliveryStatus(status: string) {
  return ["PENDING", "ACCEPTED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status);
}
