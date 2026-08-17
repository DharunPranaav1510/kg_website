interface PageHeaderProps {
  label: string;
  title: string;
  description?: string;
}

export default function PageHeader({ label, title, description }: PageHeaderProps) {
  return (
    <section className="pt-32 pb-16 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-accent" />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-white/70">
              {label}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-white/60 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
