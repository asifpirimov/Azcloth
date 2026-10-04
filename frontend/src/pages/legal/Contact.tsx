import React, { useState } from 'react';
import { SEO } from '../../components/SEO';
import { WhatsAppCard } from '../../components/WhatsAppCard';
import { whatsappLink } from '../../config/site';
export const Contact = () => {
  const [name, setName] = useState('');
  const [emailField, setEmailField] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Ad və mesaj sahələri mütləqdir.');
      return;
    }
    setError('');
    
    const text = `Ad: ${name.trim()}\nMesaj: ${message.trim()}`;
    const url = whatsappLink(text);
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <SEO title="Əlaqə" description="AzCloth ilə əlaqə saxlayın. Suallarınız, təklifləriniz və əməkdaşlıq üçün bizə yazın." />
      <h1 className="text-4xl font-bold mb-16">Əlaqə</h1>
      
      <section className="mb-12">
        <p className="leading-relaxed mb-4">
          Hər hansı bir sualınız, təklifiniz və ya iradınız varsa, bizimlə əlaqə saxlamaqdan çəkinməyin. Komandamız ən qısa zamanda sizə geri dönüş edəcək.
        </p>
      </section>

      <div className="mb-8">
        <WhatsAppCard message="Salam, AzCloth haqqında məlumat almaq istəyirəm." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6">Məlumatlarımız</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">Email</p>
              <p className="text-lg">
                <a href="mailto:azcloth65@gmail.com" className="text-gray-800 hover:underline">azcloth65@gmail.com</a>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">İş Saatları</p>
              <p className="text-lg">Bazar ertəsi - Cümə, 10:00 - 18:00</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6">Bizə Yazın</h2>
          {error && <div className="mb-4 text-red-500 text-sm font-bold">{error}</div>}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adınız *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#25D366]" placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={emailField} onChange={e => setEmailField(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#25D366]" placeholder="email@nümunə.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız *</label>
              <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#25D366] resize-none" placeholder="Mesajınızı bura yazın..."></textarea>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Mesajınız WhatsApp-da açılacaq və oradan göndərə bilərsiniz.
            </div>
            <button type="submit" className="bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1ebd59] transition">
              WhatsApp ilə göndər
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
