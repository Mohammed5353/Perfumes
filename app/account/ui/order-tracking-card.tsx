"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, RotateCcw, Truck, XCircle } from "lucide-react";
import {
  canCustomerCancel,
  canCustomerReturn,
  customerTrackingSteps,
  getEffectiveOrderStatus,
  getCourierStepLabel,
} from "@/lib/delivery-tracking";
import { formatOrderStatus } from "@/lib/order-status";

type OrderTrackingCardProps = {
  order: {
    id: string;
    totalAmount: string | number;
    status: string;
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    codAmountDue: string | number | null;
    codCollectedAt: Date | null;
    createdAt: Date;
    statusHistory: Array<{
      id: string;
      status: string;
      createdAt: Date;
    }>;
  };
};

export function OrderTrackingCard({ order }: OrderTrackingCardProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"cancel" | "return" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const completedStatuses = new Set([
    ...order.statusHistory.map((entry) => entry.status),
    order.status,
  ]);
  const effectiveStatus = getEffectiveOrderStatus(order.status, [
    ...completedStatuses,
  ]);
  const currentStepIndex = customerTrackingSteps.findIndex(
    (step) => step === effectiveStatus,
  );

  async function runOrderAction(action: "cancel" | "return") {
    setPendingAction(action);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/${action}`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok || body?.error) {
        throw new Error(body?.error ?? "Unable to update order");
      }

      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Unable to update order",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="rounded-lg border border-black/10 p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">#{order.id.slice(0, 8)}</span>
        <span className="font-semibold">
          KWD {Number(order.totalAmount).toFixed(2)}
        </span>
      </div>
      <p className="mt-1 text-textSecondary">
        {order.createdAt.toLocaleDateString("en-US")} | {formatOrderStatus(effectiveStatus)}
      </p>
      <div className="mt-3 rounded-lg bg-[#f6f1ea] p-3">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-textSecondary">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-4 w-4" aria-hidden="true" />
            {order.courierName || "Courier pending"}
          </span>
          <span>Tracking: {order.trackingNumber || "Not assigned"}</span>
          <span className="inline-flex items-center gap-1.5">
            <Banknote className="h-4 w-4" aria-hidden="true" />
            COD {order.codCollectedAt ? "collected" : "due"} KWD{" "}
            {Number(order.codAmountDue ?? order.totalAmount).toFixed(2)}
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-6">
          {customerTrackingSteps.map((step, index) => {
            const isComplete =
              completedStatuses.has(step) ||
              (currentStepIndex >= 0 && index <= currentStepIndex);
            return (
              <div
                key={step}
                className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold ${
                  isComplete ? "bg-black text-white" : "bg-white text-textSecondary"
                }`}
              >
                {getCourierStepLabel(step)}
              </div>
            );
          })}
        </div>
        {order.trackingUrl ? (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-xs font-semibold text-textPrimary underline underline-offset-4"
          >
            Open courier tracking
          </a>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {canCustomerCancel(effectiveStatus) ? (
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void runOrderAction("cancel")}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-xs font-semibold hover:bg-black/5 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {pendingAction === "cancel" ? "Cancelling..." : "Cancel order"}
            </button>
          ) : null}
          {canCustomerReturn(effectiveStatus) ? (
            <button
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void runOrderAction("return")}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/15 bg-white px-3 text-xs font-semibold hover:bg-black/5 disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {pendingAction === "return" ? "Requesting..." : "Return order"}
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
