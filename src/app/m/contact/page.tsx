import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import AppBar from "@/components/mobile/AppBar";
import ContactForm from "@/components/ContactForm";
import { business as staticBusiness } from "@/data/business";
import { getBusiness } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact Us",
  description: `Get in touch with ${staticBusiness.name} in Hosur.`,
  path: "/contact",
});

const action = "flex min-h-14 items-center gap-3 rounded-2xl border border-warm-gray/70 bg-white px-4 text-sm font-semibold text-primary-text shadow-soft active:bg-warm-gray/60";

export default async function PhoneContact() {
  const business = await getBusiness();
  const wa = `https://wa.me/${business.contact.whatsapp.replace("+", "")}`;
  return (
    <>
      <AppBar title="Contact" back="/more" />
      <main className="space-y-6 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${business.contact.phone}`} className="flex flex-col items-center gap-1.5 rounded-2xl bg-accent py-4 text-white active:bg-accent-light"><Phone size={20} /><span className="text-sm font-semibold">Call</span></a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#25D366] py-4 text-white active:opacity-80"><MessageSquare size={20} /><span className="text-sm font-semibold">WhatsApp</span></a>
        </div>
        <div className="space-y-2.5">
          <a href={business.maps.url} target="_blank" rel="noopener noreferrer" className={action}><MapPin size={18} className="flex-shrink-0 text-accent" /><span className="font-normal text-secondary-text">{business.address.full}</span></a>
          <a href={`mailto:${business.contact.email}`} className={action}><Mail size={18} className="flex-shrink-0 text-accent" /><span className="break-all font-normal text-secondary-text">{business.contact.email}</span></a>
          <p className={action.replace("active:bg-warm-gray/60", "")}><Clock size={18} className="flex-shrink-0 text-accent" /><span className="font-normal text-secondary-text">{business.hours.display}, {business.hours.days}</span></p>
        </div>
        <ContactForm />
      </main>
    </>
  );
}
