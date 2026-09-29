import React from 'react';

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-4xl font-bold mb-8">Haqqımızda</h1>
      
      <section className="mb-8">
        <p className="leading-relaxed mb-4">
          AzCloth, Azərbaycan bazarındakı geyim mağazalarını və dizaynerləri alıcılarla bir araya gətirən müasir "marketplace" (bazar yeri) platformasıdır. Bizim məqsədimiz həm kiçik bizneslərə, həm də fərdi mağazalara onlayn satış imkanlarını artırmaq üçün rəqəmsal bir mühit təmin etməkdir.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Biz Nə Edirik?</h2>
        <p className="leading-relaxed mb-4">
          İstifadəçilər bizim platformamızda yüzlərlə mağazanın məhsullarını asanlıqla axtara, incələyə və ehtiyaclarına uyğun olanı seçə bilərlər. Satın almaq istədikləri məhsullar üçün isə birbaşa satıcı ilə WhatsApp üzərindən əlaqə qururlar. Biz sadəcə kataloqlaşdırma və kəşf (discovery) prosesini asanlaşdırırıq.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Biz Nə Etmirik?</h2>
        <p className="leading-relaxed mb-4">
          AzCloth vasitəçi ödəniş sistemi və ya logistika xidməti təqdim etmir. Biz satışdan heç bir faiz və ya komissiya götürmürük. Bütün alış-veriş prosesi, ödəmə və çatdırılma tamamilə Alıcı və Satıcı arasında həyata keçirilir.
        </p>
      </section>
      
      <section>
        <p className="leading-relaxed font-semibold">
          Platformamıza qoşulmaq və ya əlavə məlumat almaq üçün <a href="/contact" className="text-orange-500 hover:underline">Əlaqə</a> səhifəsini ziyarət edə bilərsiniz.
        </p>
      </section>
    </div>
  );
};
