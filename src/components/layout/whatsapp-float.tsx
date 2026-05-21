const WHATSAPP_PHONE_NUMBER = "+96103118776";

function getWhatsAppUrl(phoneNumber: string) {
  const cleaned = phoneNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${cleaned}`;
}

export function WhatsAppFloat() {
  return (
    <a
      href={getWhatsAppUrl(WHATSAPP_PHONE_NUMBER)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,211,102,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#20ba59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/18 text-base"
      >
        W
      </span>
      <span className="hidden sm:inline">Chat on WhatsApp</span>
      <span className="sm:hidden">Chat</span>
    </a>
  );
}
