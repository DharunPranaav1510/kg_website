import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MapPin, Phone, Mail, MessageSquare } from "lucide-react";
import { business as staticBusiness } from "@/data/business";
import { getBusiness } from "@/lib/content";

const footerCategories = [
	{ label: "Chicken", href: "/shop?category=Chicken" },
	{ label: "Mutton", href: "/shop?category=Mutton" },
	{ label: "Eggs", href: "/shop?category=Eggs" },
	{ label: "Frozen Products", href: "/shop?category=Frozen%20Products" },
	{ label: "Ready To Cook", href: "/shop?category=Ready%20To%20Cook" },
];

const footerLinks = [
	{ label: "About Us", href: "/about" },
	{ label: "Our Process", href: "/about#process" },
	{ label: "Shop", href: "/shop" },
	{ label: "Track Order", href: "/track" },
	{ label: "Blog", href: "/blog" },
	{ label: "Careers", href: "/careers" },
	{ label: "Contact", href: "/contact" },
];

const legalLinks = [
	{ label: "Privacy Policy", href: "/privacy" },
	{ label: "Terms of Service", href: "/terms" },
	{ label: "Refunds", href: "/refunds" },
	{ label: "Cancellation", href: "/cancellation" },
	{ label: "Delivery", href: "/delivery" },
];

const socialLinks = [
	{ icon: Instagram, label: "Instagram", href: staticBusiness.social.instagram },
	{ icon: Facebook, label: "Facebook", href: staticBusiness.social.facebook },
];

export default async function Footer() {
	const business = await getBusiness();
	const year = new Date().getFullYear();
	const phoneHref = `tel:${business.contact.phone}`;
	const mailHref = `mailto:${business.contact.email}`;
	const mapsUrl = business.maps.url;
	const whatsappHref = `https://wa.me/${business.contact.whatsapp.replace("+", "")}`;

	return (
		<footer className="bg-[#0D0D0D] text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-9 sm:gap-10">
					<div className="col-span-2 lg:col-span-1">
						<div className="flex items-center gap-3 mb-5">
							<div className="relative w-10 h-10 rounded-full overflow-hidden bg-white border border-white/10 flex items-center justify-center flex-shrink-0">
								<Image
									src="/images/logo/kg-logo.png"
									alt={`${business.name} logo`}
									width={32}
									height={32}
									className="object-contain"
								/>
							</div>
							<div>
								<div className="font-display font-bold text-lg tracking-tight">{business.name}</div>
								<div className="text-[10px] tracking-[0.15em] uppercase text-white/40">
									{business.tagline}
								</div>
							</div>
						</div>
						<p className="text-white/50 text-sm leading-relaxed mb-7 max-w-xs">
							{business.seo.description}
						</p>
						<div className="flex items-center gap-3">
							{socialLinks.map(
								(s) =>
									s.href && (
										<a
											key={s.label}
											href={s.href}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={s.label}
											className="w-9 h-9 rounded-full bg-white/5 hover:bg-accent/80 flex items-center justify-center transition-all duration-200 hover:scale-110"
										>
											<s.icon size={15} />
										</a>
									)
							)}
						</div>
					</div>

					<div>
						<h4 className="font-semibold text-sm tracking-wide mb-5 text-white/80">Categories</h4>
						<ul className="flex flex-col gap-3">
							{footerCategories.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm text-white/50 hover:text-white transition-colors duration-200"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-semibold text-sm tracking-wide mb-5 text-white/80">Company</h4>
						<ul className="flex flex-col gap-3">
							{footerLinks.map((item) => (
								<li key={item.href}>
									<Link
										href={item.href}
										className="text-sm text-white/50 hover:text-white transition-colors duration-200"
									>
										{item.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className="col-span-2 lg:col-span-1">
						<h4 className="font-semibold text-sm tracking-wide mb-5 text-white/80">Contact</h4>
						<ul className="flex flex-col gap-4">
							<li className="flex items-start gap-3">
								<MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" strokeWidth={1.75} />
								<a
									href={mapsUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-white/50 leading-snug hover:underline"
								>
									{business.address.full}
								</a>
							</li>
							<li className="flex items-center gap-3">
								<Phone size={14} className="text-accent flex-shrink-0" strokeWidth={1.75} />
								<a
									href={phoneHref}
									className="text-sm text-white/50 hover:text-white transition-colors"
								>
									{business.contact.phoneDisplay}
								</a>
							</li>
							<li className="flex items-center gap-3">
								<MessageSquare size={14} className="text-accent flex-shrink-0" strokeWidth={1.75} />
								<a
									href={whatsappHref}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-white/50 hover:text-white transition-colors"
								>
									WhatsApp us
								</a>
							</li>
							<li className="flex items-center gap-3">
								<Mail size={14} className="text-accent flex-shrink-0" strokeWidth={1.75} />
								<a
									href={mailHref}
									className="text-sm text-white/50 hover:text-white transition-colors"
								>
									{business.contact.email}
								</a>
							</li>
						</ul>
						<p className="text-xs text-white/30 mt-6">
							{business.hours.display}, {business.hours.days}
						</p>
					</div>
				</div>
			</div>

			<div className="border-t border-white/5">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
					<p className="text-xs text-white/30 text-center sm:text-left">
						© {year} {business.legal.legalName || business.name}. All rights reserved.
					</p>
					{(business.legal.fssai || business.legal.grievanceEmail) && (
						<p className="text-xs text-white/30 text-center">
							{business.legal.fssai && <>FSSAI Lic. No. {business.legal.fssai}</>}
							{business.legal.fssai && business.legal.grievanceEmail && " · "}
							{business.legal.grievanceEmail && (
								<>Grievance officer{business.legal.grievanceName ? `: ${business.legal.grievanceName}` : ""}, <a href={`mailto:${business.legal.grievanceEmail}`} className="underline">{business.legal.grievanceEmail}</a></>
							)}
						</p>
					)}
					<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
						<a href="?view=mobile" className="text-xs text-white/30 hover:text-white/60 transition-colors">
							Mobile version
						</a>
						{legalLinks.map((l) => (
							<Link
								key={l.href}
								href={l.href}
								className="text-xs text-white/30 hover:text-white/60 transition-colors"
							>
								{l.label}
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
