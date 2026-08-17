"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
	{
		question: "How fresh is the meat when it arrives?",
		answer:
			"All our products are processed and packed fresh each morning. We use cold-chain logistics with insulated packaging to ensure your order stays between 0–4°C from our facility to your door. Most orders arrive within 4–6 hours of dispatch.",
	},
	{
		question: "Do you use any preservatives or additives?",
		answer:
			"Never. KG Foods products contain zero preservatives, artificial colours, or additives of any kind. What you order is exactly what you get — clean, natural meat and poultry. Our products have a shorter shelf life than supermarket alternatives, because they're actually fresh.",
	},
	{
		question: "What areas do you currently deliver to?",
		answer:
			"We deliver across Hosur including Anna Nagar and surrounding neighbourhoods. Same-day delivery is available for orders placed before 12:00 PM. Call us to confirm availability for your area.",
	},
	{
		question: "What is your return or refund policy?",
		answer:
			"If your order arrives damaged, spoiled, or incorrect, contact us within 2 hours of delivery with photos and we'll issue a full refund or replacement immediately. Your satisfaction and trust are non-negotiable for us — we'll always make it right.",
	},
	{
		question: "Are your products halal-certified?",
		answer:
			"Yes. All KG Foods chicken and mutton products are processed in accordance with halal standards by certified personnel. Our facility holds a halal certification which is available on request.",
	},
	{
		question: "Can I schedule a delivery in advance?",
		answer:
			"Absolutely. At checkout you can choose your preferred delivery date and morning time slot. We recommend scheduling at least one day in advance for guaranteed availability, especially for bulk or special orders.",
	},
];

function FAQItem({
	question,
	answer,
	isOpen,
	onToggle,
}: {
	question: string;
	answer: string;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="border-b border-warm-gray last:border-0">
			<button
				onClick={onToggle}
				className="w-full flex items-start justify-between gap-4 py-6 text-left group"
				aria-expanded={isOpen}
			>
				<span
					className={`font-medium text-base transition-colors duration-200 ${
						isOpen ? "text-accent" : "text-primary-text group-hover:text-accent"
					}`}
				>
					{question}
				</span>
				<div
					className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
						isOpen
							? "bg-accent border-accent text-white"
							: "border-warm-gray text-secondary-text group-hover:border-accent/40"
					}`}
				>
					{isOpen ? <Minus size={12} /> : <Plus size={12} />}
				</div>
			</button>
			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					isOpen ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
				}`}
			>
				<p className="text-secondary-text text-[15px] leading-relaxed pr-10">
					{answer}
				</p>
			</div>
		</div>
	);
}

export default function FAQ() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	return (
		<section className="py-24 bg-cream">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-5 gap-16">
					{/* Left — Sticky header */}
					<div className="lg:col-span-2 lg:sticky lg:top-28 lg:self-start">
						<span className="section-label block mb-4">Got Questions?</span>
						<h2 className="section-title mb-6">
							Frequently
							<br />
							Asked
						</h2>
						<p className="section-subtitle mb-8">
							Everything you need to know about our products, delivery, and quality
							standards. Can&apos;t find what you&apos;re looking for?
						</p>
						<a
							href="/contact"
							className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline underline-offset-4"
						>
							Talk to us directly →
						</a>
					</div>

					{/* Right — FAQ list */}
					<div className="lg:col-span-3">
						<div className="bg-white rounded-2xl shadow-soft px-6 sm:px-8">
							{faqs.map((faq, idx) => (
								<FAQItem
									key={idx}
									question={faq.question}
									answer={faq.answer}
									isOpen={openIndex === idx}
									onToggle={() =>
										setOpenIndex(openIndex === idx ? null : idx)
									}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
