"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Banknote, MapPin, MessageCircle, Phone } from "lucide-react";
import { City, Country, State } from "country-state-city";
import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { clearGuestCart, getGuestCart } from "@/lib/guest-cart";
import { formatKwd } from "@/lib/currency";
import { isPostalCodeValid } from "@/lib/postal-code";

type CheckoutResponse =
  | {
      message: string;
      data: {
        orderId: string;
      };
    }
  | {
      error: string;
    };

type CheckoutCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  scentOption?: string;
};

type CartResponse = {
  data?: CheckoutCartItem[];
};

type AccountProfileResponse = {
  data?: {
    email: string;
    name: string | null;
    shippingAddress: Partial<typeof emptyShippingAddress> | null;
  };
};

const whatsappCheckoutNumber = "+919664146108";
const emptyShippingAddress = {
  firstName: "",
  lastName: "",
  dialCode: "",
  phone: "",
  countryCode: "",
  stateCode: "",
  city: "",
  state: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  country: "",
};

export default function CheckoutForm() {
  const router = useRouter();
  const [form, setForm] = useState(() => getInitialCheckoutForm());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/account/profile", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as AccountProfileResponse;
        const profile = body.data;

        if (!active || !profile) {
          return;
        }

        setForm((current) => mergeProfileIntoForm(current, profile));
      } catch {
        // Guests or profile fetch failures simply keep the blank checkout form.
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const validationError = validateCheckoutForm();

    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const guestItems = getGuestCart().map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        scentOption: item.scentOption,
      }));
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guestItems, couponCode: form.couponCode }),
      });
      const body = await readCheckoutResponse(response);

      if (response.status === 401) {
        throw new Error("Your cart is empty");
      }

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Unable to place order");
      }

      window.dispatchEvent(new Event("scentora:cart-updated"));
      clearGuestCart();
      router.replace("/account");
      router.refresh();
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Unable to place order",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onWhatsAppCheckout() {
    setWhatsappLoading(true);
    setError(null);

    const validationError = validateCheckoutForm();

    if (validationError) {
      setError(validationError);
      setWhatsappLoading(false);
      return;
    }

    try {
      const cartItems = await loadCheckoutCartItems();

      if (cartItems.length === 0) {
        throw new Error("Your cart is empty");
      }

      const guestItems = getGuestCart().map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        scentOption: item.scentOption,
      }));
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guestItems, couponCode: form.couponCode }),
      });
      const body = await readCheckoutResponse(response);

      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Unable to place order");
      }

      const orderId = body.data.orderId;
      const message = buildWhatsAppCheckoutMessage(orderId, cartItems);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappCheckoutNumber}&text=${encodeURIComponent(
        message,
      )}`;

      window.dispatchEvent(new Event("scentora:cart-updated"));
      clearGuestCart();
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      router.refresh();
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start WhatsApp checkout",
      );
    } finally {
      setWhatsappLoading(false);
    }
  }

  function validateCheckoutForm() {
    const selectedCountry = Country.getCountryByCode(form.countryCode);
    const requiredFields = [
      form.firstName,
      form.lastName,
      form.email,
      form.dialCode,
      form.phone,
      form.countryCode,
      form.stateCode,
      form.city,
      form.addressLine1,
      form.postalCode,
    ];

    if (requiredFields.some((field) => !field.trim())) {
      return "First name, last name, email, phone number, country, state, city, address line 1, and zip/postal code are required.";
    }

    if (!isPostalCodeValid(form.countryCode, form.postalCode)) {
      return `Postal code is not valid for ${selectedCountry?.name || form.country}.`;
    }

    const fullPhone = `${form.dialCode} ${form.phone}`;

    if (!isValidPhoneNumber(fullPhone, form.countryCode as CountryCode)) {
      return `Mobile number is not valid for ${selectedCountry?.name || form.country}.`;
    }

    return null;
  }

  async function loadCheckoutCartItems(): Promise<CheckoutCartItem[]> {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });

      if (response.ok) {
        const body = (await response.json()) as CartResponse;
        return body.data ?? [];
      }
    } catch {
      // Fall back to guest cart below.
    }

    return getGuestCart().map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      scentOption: item.scentOption,
    }));
  }

  function buildWhatsAppCheckoutMessage(orderId: string, cartItems: CheckoutCartItem[]) {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const fullPhone = `${form.dialCode} ${form.phone}`;
    const address = [
      form.addressLine1,
      form.addressLine2,
      form.city,
      form.state,
      form.postalCode,
      form.country,
    ]
      .filter(Boolean)
      .join(", ");
    const itemLines = cartItems.map(
      (item) =>
        `- ${item.name}${item.scentOption ? ` (${item.scentOption})` : ""} x${item.quantity} - ${formatKwd(
          item.price * item.quantity,
        )}`,
    );

    return [
      "New Scentora WhatsApp checkout",
      `Order ID: ${orderId}`,
      `Customer: ${form.firstName} ${form.lastName}`,
      `Email: ${form.email}`,
      `Phone: ${fullPhone}`,
      `Payment: Cash on Delivery`,
      `Address: ${address}`,
      "Items:",
      ...itemLines,
      `Subtotal: ${formatKwd(subtotal)}`,
      form.couponCode ? `Coupon: ${form.couponCode}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const countryOptions = useMemo(() => Country.getAllCountries(), []);
  const stateOptions = useMemo(
    () => State.getStatesOfCountry(form.countryCode),
    [form.countryCode],
  );
  const cityOptions = useMemo(
    () =>
      form.stateCode
        ? City.getCitiesOfState(form.countryCode, form.stateCode)
        : [],
    [form.countryCode, form.stateCode],
  );

  return (
    <main className="min-h-screen bg-pageBg text-textPrimary">
      <section className="mx-auto w-full max-w-[900px] px-4 py-10 lg:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-black text-white">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-textSecondary">
              Shipping details
            </p>
            <h1 className="font-heading text-4xl font-semibold">Checkout</h1>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <InputField
              label="First name"
              value={form.firstName}
              onChange={(value) => updateField("firstName", value)}
              required
            />
            <InputField
              label="Last name"
              value={form.lastName}
              onChange={(value) => updateField("lastName", value)}
              required
            />
            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              required
            />
            <PhoneField
              dialCode={form.dialCode}
              phone={form.phone}
              onDialCodeChange={(value) => updateField("dialCode", value)}
              onPhoneChange={(value) => updateField("phone", value)}
              required
            />
            <CountryField
              countries={countryOptions}
              value={form.countryCode}
              onChange={(countryCode) => {
                const selected = Country.getCountryByCode(countryCode);
                const nextStates = State.getStatesOfCountry(countryCode);
                const firstState = nextStates[0];
                const nextCities = firstState
                  ? City.getCitiesOfState(countryCode, firstState.isoCode)
                  : [];

                setForm((current) => ({
                  ...current,
                  countryCode,
                  country: selected?.name ?? "",
                  dialCode: selected?.phonecode ? `+${selected.phonecode}` : current.dialCode,
                  stateCode: firstState?.isoCode ?? "",
                  state: firstState?.name ?? "",
                  city: nextCities[0]?.name ?? "",
                }));
              }}
              required
            />
            <StateField
              states={stateOptions}
              value={form.stateCode}
              onChange={(stateCode) => {
                const selected = State.getStateByCodeAndCountry(
                  stateCode,
                  form.countryCode,
                );
                const nextCities = City.getCitiesOfState(form.countryCode, stateCode);

                setForm((current) => ({
                  ...current,
                  stateCode,
                  state: selected?.name ?? "",
                  city: nextCities[0]?.name ?? "",
                }));
              }}
              required
            />
            <CityField
              cities={cityOptions}
              value={form.city}
              onChange={(value) => updateField("city", value)}
              required
            />
            <div className="md:col-span-2">
              <InputField
                label="Address line 1"
                value={form.addressLine1}
                onChange={(value) => updateField("addressLine1", value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <InputField
                label="Address line 2"
                value={form.addressLine2}
                onChange={(value) => updateField("addressLine2", value)}
              />
            </div>
            <InputField
              label="Zip / postal code"
              value={form.postalCode}
              onChange={(value) => updateField("postalCode", value)}
              autoComplete="postal-code"
              required
            />
            <InputField
              label="Coupon code (optional)"
              value={form.couponCode}
              onChange={(value) => updateField("couponCode", value.toUpperCase())}
            />
          </div>

          <div className="mt-6 rounded-lg border border-black/10 bg-[#f6f1ea] p-4">
            <p className="mb-3 text-sm font-semibold">Payment method</p>
            <label className="flex items-start gap-3 rounded-lg border border-black bg-white p-4">
              <input
                type="radio"
                name="paymentMethod"
                value="CASH_ON_DELIVERY"
                checked
                readOnly
                className="mt-1"
              />
              <span className="flex flex-1 items-start gap-3">
                <Banknote className="mt-0.5 h-5 w-5 text-textSecondary" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold">Cash on Delivery</span>
                  <span className="mt-1 block text-sm text-textSecondary">
                    Pay in cash when your order is delivered.
                  </span>
                </span>
              </span>
            </label>
          </div>

          {error ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/cart" className="text-center text-sm font-medium hover:opacity-70">
              Back to cart
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={loading || whatsappLoading}
                onClick={onWhatsAppCheckout}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-semibold text-white hover:bg-[#1fb85a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {whatsappLoading ? "Opening WhatsApp..." : "WhatsApp checkout"}
              </button>
              <button
                type="submit"
                disabled={loading || whatsappLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Placing order..." : "Place order"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function mergeProfileIntoForm(
  current: ReturnType<typeof getInitialCheckoutForm>,
  profile: NonNullable<AccountProfileResponse["data"]>,
) {
  const initial = getInitialCheckoutForm();
  const shipping = profile.shippingAddress ?? emptyShippingAddress;
  const [firstNameFromProfile, ...lastNameParts] = (profile.name ?? "").split(" ");
  const lastNameFromProfile = lastNameParts.join(" ");

  return {
    ...current,
    firstName: current.firstName || shipping.firstName || firstNameFromProfile || "",
    lastName: current.lastName || shipping.lastName || lastNameFromProfile || "",
    email: current.email || profile.email || "",
    dialCode:
      current.dialCode === initial.dialCode
        ? shipping.dialCode || current.dialCode
        : current.dialCode,
    phone: current.phone || shipping.phone || "",
    addressLine1: current.addressLine1 || shipping.addressLine1 || "",
    addressLine2: current.addressLine2 || shipping.addressLine2 || "",
    countryCode:
      current.countryCode === initial.countryCode
        ? shipping.countryCode || current.countryCode
        : current.countryCode,
    stateCode:
      current.stateCode === initial.stateCode
        ? shipping.stateCode || current.stateCode
        : current.stateCode,
    city:
      current.city === initial.city ? shipping.city || current.city : current.city,
    state:
      current.state === initial.state ? shipping.state || current.state : current.state,
    postalCode: current.postalCode || shipping.postalCode || "",
    country:
      current.country === initial.country ? shipping.country || current.country : current.country,
  };
}

function getInitialCheckoutForm() {
  const defaultCountryCode = "IN";
  const defaultState = State.getStatesOfCountry(defaultCountryCode)[0];
  const defaultCity = defaultState
    ? City.getCitiesOfState(defaultCountryCode, defaultState.isoCode)[0]
    : undefined;

  return {
    firstName: "",
    lastName: "",
    email: "",
    dialCode: "+91",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    countryCode: defaultCountryCode,
    stateCode: defaultState?.isoCode ?? "",
    city: defaultCity?.name ?? "",
    state: defaultState?.name ?? "",
    postalCode: "",
    country: "India",
    couponCode: "",
  };
}

async function readCheckoutResponse(response: Response): Promise<CheckoutResponse> {
  const text = await response.text();

  if (!text) {
    return { error: "Checkout failed. Please try again." };
  }

  try {
    return JSON.parse(text) as CheckoutResponse;
  } catch {
    return { error: "Checkout failed. Please try again." };
  }
}

function InputField({
  autoComplete,
  icon,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  autoComplete?: string;
  icon?: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <span className="flex items-center rounded-lg border border-black/15 bg-white px-3 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
        {icon}
        <input
          autoComplete={autoComplete}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 flex-1 bg-transparent px-3 text-sm outline-none"
          required={required}
        />
      </span>
    </label>
  );
}

function CountryField({
  countries,
  onChange,
  required,
  value,
}: {
  countries: ReturnType<typeof Country.getAllCountries>;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        Country
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
        required={required}
      >
        {countries.map((country) => (
          <option key={country.isoCode} value={country.isoCode}>
            {country.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function StateField({
  onChange,
  required,
  states,
  value,
}: {
  onChange: (value: string) => void;
  required?: boolean;
  states: ReturnType<typeof State.getStatesOfCountry>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        State
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
        required={required}
      >
        {states.length === 0 ? (
          <option value="">No states available</option>
        ) : (
          states.map((state) => (
            <option key={state.isoCode} value={state.isoCode}>
              {state.name}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

function CityField({
  cities,
  onChange,
  required,
  value,
}: {
  cities: ReturnType<typeof City.getCitiesOfState>;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        City
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
        required={required}
      >
        {cities.length === 0 ? (
          <option value="">No cities available</option>
        ) : (
          cities.map((city) => (
            <option key={`${city.stateCode}-${city.name}`} value={city.name}>
              {city.name}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

function PhoneField({
  dialCode,
  onDialCodeChange,
  onPhoneChange,
  phone,
  required,
}: {
  dialCode: string;
  onDialCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  phone: string;
  required?: boolean;
}) {
  const uniqueDialCodes = Array.from(
    new Map(
      Country.getAllCountries().map((country) => [
        `+${country.phonecode}`,
        { name: country.name, dialCode: `+${country.phonecode}` },
      ]),
    ).values(),
  );

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        Phone number
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <span className="grid grid-cols-[120px_1fr] items-center rounded-lg border border-black/15 bg-white focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 sm:grid-cols-[170px_1fr]">
        <select
          value={dialCode}
          onChange={(event) => onDialCodeChange(event.target.value)}
          className="min-h-11 border-r border-black/10 bg-transparent px-2 text-sm outline-none"
          aria-label="Country calling code"
          required={required}
        >
          {uniqueDialCodes.map((country) => (
            <option key={`${country.name}-${country.dialCode}`} value={country.dialCode}>
              {country.dialCode} {country.name}
            </option>
          ))}
        </select>
        <span className="flex items-center px-3">
          <Phone className="h-4 w-4 text-textSecondary" aria-hidden="true" />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            required={required}
          />
        </span>
      </span>
    </label>
  );
}
