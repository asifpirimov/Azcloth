import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { whatsappLink } from '../config/site';

export const FloatingWhatsApp = () => {
  const location = useLocation();
  
  // Do not show on these routes
  const hideOnPaths = ['/seller', '/admin', '/cart'];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) return null;

  return (
    <a
      href={whatsappLink("Salam, AzCloth haqqında məlumat almaq istəyirəm.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp-da yazın"
      className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#1ebd59] hover:scale-110 transition-all duration-300"
    >
      <MessageCircle size={28} />
    </a>
  );
};
