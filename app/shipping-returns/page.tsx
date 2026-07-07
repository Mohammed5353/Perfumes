import { PackageCheck, RefreshCcw, Truck } from "lucide-react";
import Link from "next/link";
import Newsletter from "@/components/common/Newsletter";

export const metadata = {
  title: "Shipping & Returns Policy | SCENTORA",
  description:
    "Read SCENTORA shipping, delivery, returns, exchanges, damaged order, and refund policies for Kuwait.",
};

export default function ShippingReturnsPage() {
  return (
    <main className="mx-auto max-w-[1300px] px-4 font-body">
      <section className="py-10 md:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Customer Care
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight text-textPrimary md:text-5xl">
            Shipping & Returns Policy
          </h1>
          <p className="mt-5 text-sm leading-7 text-textSecondary md:text-base">
            At SCENTORA, we are committed to delivering your favorite fragrances
            safely and efficiently across Kuwait.
          </p>
        </div>
      </section>

      <section className="grid gap-6 pb-14 lg:grid-cols-12 md:pb-20">
        <aside className="lg:col-span-4">
          <div className="sticky top-6 space-y-4">
            <PolicyCard
              icon={<Truck className="h-5 w-5" aria-hidden="true" />}
              title="Delivery"
              text="Standard delivery within Kuwait typically takes 1-3 business days."
            />
            <PolicyCard
              icon={<RefreshCcw className="h-5 w-5" aria-hidden="true" />}
              title="Returns"
              text="Eligible return or exchange requests must be made within 15 days."
            />
            <PolicyCard
              icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />}
              title="Condition"
              text="Products must be unused, unopened, and in original packaging."
            />
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <PolicySection title="Shipping Policy">
            <PolicySubsection title="Order Processing">
              <p>
                All orders are processed within 1-2 business days after payment
                confirmation. Orders placed during weekends or public holidays
                may require additional processing time.
              </p>
            </PolicySubsection>

            <PolicySubsection title="Delivery Time">
              <p>
                Standard delivery within Kuwait typically takes 1-3 business
                days. Delivery times may vary depending on your location and
                courier availability.
              </p>
            </PolicySubsection>

            <PolicySubsection title="Shipping Charges">
              <p>
                Shipping fees, if applicable, will be displayed during checkout
                before completing your order. Free delivery promotions may be
                available during special campaigns or for qualifying order
                amounts.
              </p>
            </PolicySubsection>

            <PolicySubsection title="Order Tracking">
              <p>
                Once your order is shipped, you may receive tracking details or
                delivery updates through the provided contact information.
              </p>
            </PolicySubsection>

            <PolicySubsection title="Delivery Issues">
              <p>
                Please ensure your delivery address and contact details are
                accurate when placing an order. SCENTORA is not responsible for
                delays caused by incorrect shipping information or unforeseen
                courier delays.
              </p>
            </PolicySubsection>
          </PolicySection>

          <PolicySection title="Returns & Exchange Policy">
            <p>
              Customer satisfaction is important to us. Due to the nature of
              perfume and cosmetic products, specific conditions apply to returns
              and exchanges.
            </p>

            <PolicySubsection title="Return Eligibility">
              <p>Returns or exchanges are accepted only if:</p>
              <ul>
                <li>The product received is damaged, defective, or incorrect.</li>
                <li>The request is made within 15 days of receiving the order.</li>
                <li>
                  The product remains unused, unopened, and in its original
                  packaging.
                </li>
              </ul>
              <p>
                After 15 days from delivery, the return option will no longer be
                available for that order.
              </p>
            </PolicySubsection>

            <PolicySubsection title="Non-Returnable Items">
              <p>
                For hygiene and safety reasons, we cannot accept returns or
                exchanges for:
              </p>
              <ul>
                <li>Opened or used perfumes</li>
                <li>Products with damaged packaging caused after delivery</li>
                <li>Sale or clearance items</li>
              </ul>
            </PolicySubsection>

            <PolicySubsection title="Damaged or Incorrect Orders">
              <p>If you receive a damaged or incorrect item:</p>
              <ul>
                <li>Contact our customer support team immediately.</li>
                <li>Provide your order number and photos of the product/package.</li>
                <li>
                  Our team will review the request and assist with a replacement
                  or suitable resolution.
                </li>
              </ul>
            </PolicySubsection>

            <PolicySubsection title="Refunds">
              <p>
                Approved refunds will be processed through the original payment
                method. Refund processing times may vary depending on your bank
                or payment provider.
              </p>
            </PolicySubsection>
          </PolicySection>

          <section className="rounded-lg border border-black/10 bg-white/80 p-6 shadow-card">
            <h2 className="font-heading text-2xl font-semibold">Contact Us</h2>
            <p className="mt-3 text-sm leading-7 text-textSecondary">
              For any shipping, return, or exchange inquiries, please contact
              SCENTORA customer support through our website or official contact
              channels.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-textPrimary px-5 text-sm font-semibold text-white transition hover:bg-textPrimary/85"
            >
              Contact Support
            </Link>
            <p className="mt-5 text-sm leading-7 text-textSecondary">
              Thank you for shopping with SCENTORA. Your trust and satisfaction
              are our priority.
            </p>
          </section>
        </div>
      </section>

      <section className="pb-14 md:pb-20">
        <Newsletter />
      </section>
    </main>
  );
}

function PolicyCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white/80 p-5 shadow-card">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-textPrimary text-white">
        {icon}
      </span>
      <h2 className="mt-4 font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-textSecondary">{text}</p>
    </div>
  );
}

function PolicySection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-black/10 bg-white/80 p-6 shadow-card">
      <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      <div className="mt-5 space-y-5 text-sm leading-7 text-textSecondary">
        {children}
      </div>
    </section>
  );
}

function PolicySubsection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <h3 className="font-heading text-xl font-semibold text-textPrimary">
        {title}
      </h3>
      <div className="mt-2 space-y-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
