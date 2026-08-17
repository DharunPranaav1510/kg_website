import Image from "next/image";
import { Leaf, FlaskConical, Award, CheckCircle } from "lucide-react";
import { business } from "@/data/business";

const pillars = [
	{
		icon: Leaf,
		title: "Farm Fresh Products",
		description:
			"We work directly with trusted farms, cutting out middlemen to bring you the freshest produce possible — sourced and delivered within 24 hours.",
	},
	{
		icon: FlaskConical,
		title: "Strict Hygiene",
		description:
			"Our processing facility follows strict hygiene protocols at every step. Clean hands, clean blades, clean packaging — always.",
	},
	{
		icon: Award,
		title: "Expert Processing",
		description:
			"Our trained butchers bring years of expertise to every cut. Precise, consistent, and crafted for the way you cook.",
	},
	{
		icon: CheckCircle,
		title: "Trusted Quality",
		description:
			"Every batch is quality-checked before dispatch. If it doesn't meet our standards, it doesn't reach your table. Simple as that.",
	},
];

export default function WhyKGFoods() {
	return (
		<section className="py-24 bg-background overflow-hidden">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
					{/* Image side */}
					<div className="relative order-2 lg:order-1">
						<div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-card">
							<Image
								src="/images/about/about-company.jpg"
								alt="KG Foods processing facility and team"
								fill
								className="object-cover"
								sizes="(max-width: 1024px) 100vw, 50vw"
							/>
							{/* Overlay info card */}
							<div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-soft">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
										<CheckCircle
											size={22}
											className="text-success"
											strokeWidth={1.75}
										/>
									</div>
									<div>
										<div className="font-semibold text-sm text-primary-text">
											FSSAI Certified Facility
										</div>
										<div className="text-xs text-secondary-text mt-0.5">
											{business.address.city}, {business.address.state}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Decorative element */}
						<div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-accent/5 -z-10" />
						<div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-success/5 -z-10" />
					</div>

					{/* Content side */}
					<div className="order-1 lg:order-2">
						<span className="section-label block mb-4">Why Choose Us</span>
						<h2 className="section-title mb-6">
							The KG Foods
							<br />
							Difference
						</h2>
						<p className="section-subtitle mb-12 max-w-lg">
							We started KG Foods because we believed every family deserved access
							to clean, fresh, honestly-processed meat — not the mystery packages
							from the cold shelf.
						</p>

						<div className="flex flex-col gap-8">
							{pillars.map((pillar, idx) => (
								<div key={idx} className="flex gap-5 group">
									<div className="w-12 h-12 rounded-xl bg-accent/8 flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-accent/15">
										<pillar.icon
											size={20}
											className="text-accent"
											strokeWidth={1.75}
										/>
									</div>
									<div>
										<h3 className="font-semibold text-base text-primary-text mb-1">
											{pillar.title}
										</h3>
										<p className="text-sm text-secondary-text leading-relaxed">
											{pillar.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
