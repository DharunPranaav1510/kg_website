"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";



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

export default function FAQ({ items }: { items: { question: string; answer: string }[] }) {
	const faqs = items;
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
