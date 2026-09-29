import React from 'react';

export const Contact = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-4xl font-bold mb-8">Əlaqə</h1>
      
      <section className="mb-12">
        <p className="leading-relaxed mb-4">
          Hər hansı bir sualınız, təklifiniz və ya iradınız varsa, bizimlə əlaqə saxlamaqdan çəkinməyin. Komandamız ən qısa zamanda sizə geri dönüş edəcək.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6">Məlumatlarımız</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">Email</p>
              <p className="text-lg">
                <a href="mailto:azcloth65@gmail.com" className="text-orange-500 hover:underline">azcloth65@gmail.com</a>
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
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adınız</label>
              <input type="text" className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500" placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500" placeholder="email@nümunə.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 resize-none" placeholder="Mesajınızı bura yazın..."></textarea>
            </div>
            <button type="button" className="bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition">
              Göndər
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
