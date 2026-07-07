import { Facebook, Instagram, Mail, Phone, X, Youtube } from "lucide-react";
import Link from "next/link";

type FooterSettings = {
    facebookUrl: string;
    xUrl: string;
    youtubeUrl: string;
    instagramUrl: string;
    contactPhone: string;
    contactEmail: string;
};

const defaultSettings: FooterSettings = {
    facebookUrl: "",
    xUrl: "",
    youtubeUrl: "",
    instagramUrl: "",
    contactPhone: "+96500000000",
    contactEmail: "support@scentora.com",
};

export default function Footer({ settings }: { settings: FooterSettings }) {
    const merged = { ...defaultSettings, ...settings };

    const socialLinks = [
        { label: "Facebook", href: normalizeSocialUrl(merged.facebookUrl), icon: Facebook },
        { label: "X", href: normalizeSocialUrl(merged.xUrl), icon: X },
        { label: "YouTube", href: normalizeSocialUrl(merged.youtubeUrl), icon: Youtube },
        { label: "Instagram", href: normalizeSocialUrl(merged.instagramUrl), icon: Instagram },
    ].filter((item) => item.href.length > 0);
    const phoneHref = merged.contactPhone
        ? `tel:${merged.contactPhone.replace(/\s+/g, "")}`
        : "#";
    const emailHref = merged.contactEmail ? `mailto:${merged.contactEmail}` : "#";

    return (
        <footer className=" text-textPrimary font-body">

            {/* Footer Links */}
            <div className="max-w-[1300px] mx-auto px-4 pb-10 text-base font-semibold">
                <div className="flex flex-col md:flex-row justify-between gap-10 border-b border-gray-300 pb-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <h3 className="font-heading text-xl tracking-wide">SCENTORA</h3>
                        <p className="font-semibold text-textSecondary">
                            Timeless Scents, Lasting Impressions
                        </p>

                        <div className="flex gap-3 mt-4">
                            <Link
                                href={phoneHref}
                                className="flex items-center gap-2 border border-textPrimary rounded-full px-4 py-2 hover:bg-black hover:text-white transition"
                            >
                                <Phone className="w-4 h-4" />
                                Call
                            </Link>
                            <Link
                                href={emailHref}
                                className="flex items-center gap-2 border border-textPrimary rounded-full px-4 py-2 hover:bg-black hover:text-white transition"
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </Link>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                        <div>
                            <h4 className="font-semibold mb-3">Shop</h4>
                            <ul className="space-y-2 font-semibold text-textSecondary">
                                <li>New Arrivals</li>
                                <li>Bestsellers</li>
                                <li>Collections</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">About Us</h4>
                            <ul className="space-y-2 font-semibold text-textSecondary">
                                <li>
                                    <Link href="/about" className="hover:opacity-70">Our Story</Link>
                                </li>
                                <li>Sustainability</li>
                                <li>Ingredients</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Customer Care</h4>
                            <ul className="space-y-2 font-semibold text-textSecondary">
                                <li>
                                    <Link href="/faqs" className="hover:opacity-70">FAQ&apos;s</Link>
                                </li>
                                <li>
                                    <Link href="/shipping-returns" className="hover:opacity-70">Shipping & Returns</Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="hover:opacity-70">Contact Us</Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Social Icons */}
                    <div className="flex md:flex-col items-center md:items-end gap-3">
                        <div className="flex gap-3">
                            {socialLinks.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        aria-label={item.label}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 rounded-full border border-textPrimary flex items-center justify-center hover:bg-black hover:text-white transition"
                                    >
                                        <Icon size={18} />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 text-sm font-semibold text-textSecondary">
                    <p>© 2025 Scentora. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:opacity-70">Terms of Service</Link>
                        <Link href="/privacy" className="hover:opacity-70">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function normalizeSocialUrl(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
        return "";
    }

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    return `https://${trimmed}`;
}
