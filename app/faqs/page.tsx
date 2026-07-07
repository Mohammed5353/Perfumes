import { HelpCircle } from "lucide-react";
import Newsletter from "@/components/common/Newsletter";

export const metadata = {
  title: "FAQs | SCENTORA",
  description:
    "Frequently asked questions about SCENTORA perfumes, delivery, payments, returns, and customer support.",
};

const faqs = [
  {
    question: "Are your perfumes original and authentic?",
    answer:
      "Yes, all products available at SCENTORA are 100% authentic and carefully sourced from trusted suppliers and brands.",
  },
  {
    question: "Do you sell Arabic and international perfumes?",
    answer:
      "Absolutely. We offer a wide range of fragrances including Arabic oud, oriental perfumes, and popular international perfume brands.",
  },
  {
    question: "How long has SCENTORA been in business?",
    answer:
      "SCENTORA has been serving perfume lovers since 2000, with over two decades of experience in the fragrance industry.",
  },
  {
    question: "Do you deliver across Kuwait?",
    answer:
      "Yes, we provide delivery services across Kuwait to ensure your favorite fragrances reach you safely and quickly.",
  },
  {
    question: "How can I place an order?",
    answer:
      "You can easily place an order through our website by selecting your desired products, adding them to your cart, and proceeding to checkout.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept secure online payment methods including debit cards, credit cards, and other available payment options shown during checkout.",
  },
  {
    question: "Can I return or exchange a perfume?",
    answer:
      "Eligible returns and exchanges must be requested within 15 days of delivery. After 15 days, the return option will no longer be available for that order.",
  },
  {
    question: "How can I choose the right perfume?",
    answer:
      "Our collection includes detailed product descriptions and fragrance notes to help you choose the perfect scent based on your preference.",
  },
  {
    question: "Do you offer gift packaging?",
    answer:
      "Yes, selected products may include gift packaging options, making them perfect for special occasions and gifts.",
  },
  {
    question: "How can I contact SCENTORA customer support?",
    answer:
      "You can contact our support team through our website contact page, email, or available social media channels for any assistance.",
  },
  {
    question: "Do you offer discounts or special promotions?",
    answer:
      "Yes, we regularly offer seasonal promotions, exclusive deals, and special discounts for our customers.",
  },
  {
    question: "Why should I choose SCENTORA?",
    answer:
      "With over 20 years of experience, premium quality products, and a passion for fragrances, SCENTORA is committed to delivering a trusted and luxurious perfume shopping experience.",
  },
];

export default function FaqsPage() {
  return (
    <main className="mx-auto max-w-[1300px] px-4 font-body">
      <section className="py-10 md:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Customer Care
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight text-textPrimary md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-5 text-sm leading-7 text-textSecondary md:text-base">
            Find quick answers about SCENTORA products, delivery, payments,
            returns, and fragrance support.
          </p>
        </div>
      </section>

      <section className="pb-14 md:pb-20">
        <div className="grid gap-4 lg:grid-cols-2">
          {faqs.map((faq, index) => (
            <article
              key={faq.question}
              className="rounded-lg border border-black/10 bg-white/80 p-5 shadow-card"
            >
              <div className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-textPrimary text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-textPrimary">
                    {faq.question}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-textSecondary">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-14 md:pb-20">
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-black/10 bg-white/80 p-5 shadow-card">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accentLight/30 text-textPrimary">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm leading-6 text-textSecondary">
            Need more help? Contact SCENTORA customer support through the
            contact page.
          </p>
        </div>
        <Newsletter />
      </section>
    </main>
  );
}
