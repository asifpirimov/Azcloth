import React from 'react';
import { SEO } from '../../components/SEO';

export const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <SEO title="Məxfilik Siyasəti" description="AzCloth məxfilik siyasəti və məlumatların qorunması qaydaları." />
      <h1 className="text-4xl font-bold mb-8">Məxfilik Siyasəti</h1>
      
      <p className="mb-4 text-sm text-gray-500">Son yenilənmə: [Effective Date]</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Toplanan Məlumatlar</h2>
        <p className="leading-relaxed mb-4">
          Platformamıza daxil olduğunuz və istifadə etdiyiniz zaman aşağıdakı şəxsi məlumatlar toplanıla bilər: ad, soyad, elektron poçt ünvanı, şifrə hash-i, profil şəkli (əgər varsa) və OAuth (Google) identifikatorları. Şəxsi məlumatlarınız yalnız hesabınızın idarə olunması və təhlükəsizliyin təmin edilməsi üçün istifadə olunur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Məlumatların Saxlanması və Qorunması</h2>
        <p className="leading-relaxed mb-4">
          Biz sizin məlumatlarınızı təhlükəsiz serverlərdə saxlayırıq və üçüncü tərəflərə (qanunvericiliyin tələb etdiyi hallar istisna olmaqla) satmırıq və ötürmürük. Şifrələr şifrələnmiş şəkildə saxlanılır.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Satıcılarla Məlumat Mübadiləsi</h2>
        <p className="leading-relaxed mb-4">
          Alıcılar mağazalara birbaşa WhatsApp vasitəsilə müraciət etdiyi üçün, Alıcıların əlaqə nömrələri və mesajları birbaşa Satıcıya yönləndirilir. Bu proses zamanı WhatsApp-ın məxfilik siyasəti qüvvəyə minir. AzCloth heç bir sifariş, ödəniş və ya çatdırılma məlumatını (WhatsApp danışıqlarını) öz serverlərində saxlamır.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. İstifadəçinin Hüquqları</h2>
        <p className="leading-relaxed mb-4">
          Siz istənilən vaxt hesabınızın və şəxsi məlumatlarınızın silinməsini tələb edə bilərsiniz. Bunun üçün bizimlə əlaqə saxlamağınız xahiş olunur.
        </p>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">5. Əlaqə</h2>
        <p className="leading-relaxed">
          Məxfilik siyasətimizlə bağlı suallarınız üçün: [Privacy contact]
        </p>
      </section>
    </div>
  );
};
