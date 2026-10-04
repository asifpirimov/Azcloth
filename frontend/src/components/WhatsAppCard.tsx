import { MessageCircle } from 'lucide-react';
import { siteConfig, whatsappLink } from '../config/site';

interface WhatsAppCardProps {
  message?: string;
}

export const WhatsAppCard = ({ message }: WhatsAppCardProps) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
      {/* Accent Top Border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#25D366]"></div>
      
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="bg-[#25D366]/10 p-4 rounded-2xl shrink-0">
          <MessageCircle size={32} className="text-[#25D366]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Suallarınız var? WhatsApp-da yazın
          </h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Mağaza yaratmaq və ya sistemdən istifadə ilə bağlı sizə kömək edək.
          </p>
          
          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3 px-5 sm:px-8 rounded-xl hover:bg-[#1ebd59] transition-colors"
          >
            <MessageCircle size={20} />
            WhatsApp-da yazın
          </a>
          
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <span className="font-semibold text-gray-600">{siteConfig.whatsapp.display}</span>
            <span>&bull;</span>
            <span>Bu nömrəyə yalnız WhatsApp-da yazmaq olar, zəng qəbul olunmur.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
