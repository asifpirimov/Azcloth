import React from 'react';
import { SEO } from '../../components/SEO';

export const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <SEO title="İstifadə Qaydaları" description="AzCloth platformasının istifadə qaydaları və şərtləri." />
      <h1 className="text-4xl font-bold mb-8">İstifadə Qaydaları</h1>
      
      <p className="mb-4 text-sm text-gray-500">Son yenilənmə: [Effective Date]</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Ümumi Müddəalar</h2>
        <p className="leading-relaxed mb-4">
          Bu Qaydalar [Şirkətin hüquqi adı] (bundan sonra "Şirkət" və ya "AzCloth") tərəfindən idarə olunan platformanın istifadə şərtlərini müəyyən edir. Saytdan istifadə edərək bu şərtlərlə razılaşdığınızı təsdiq edirsiniz.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Alış-veriş və Sifarişlər</h2>
        <p className="leading-relaxed mb-4">
          AzCloth platformasında (səbətdəki məhsulların WhatsApp vasitəsilə satıcıya göndərilməsi daxil olmaqla) edilən əməliyyatlar birbaşa Alıcı ilə Satıcı (Mağaza) arasında baş verir. AzCloth bu əməliyyatların tərəfi deyildir və məhsulun keyfiyyəti, çatdırılması və ya ödənişi ilə bağlı heç bir zəmanət və ya öhdəlik daşımır.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Məsuliyyətin Məhdudlaşdırılması</h2>
        <p className="leading-relaxed mb-4">
          AzCloth platformasında yerləşdirilən məlumatların doğruluğu və məhsulların keyfiyyətinə görə birbaşa satıcı mağazalar məsuliyyət daşıyır. Şirkət yarana biləcək zərərlərə görə məsuliyyət daşımır.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Şikayətlər</h2>
        <p className="leading-relaxed mb-4">
          Platformada mövcud olan "Şikayət Et" xidməti alıcıların saxta və ya problemli mağazaları platforma rəhbərliyinə bildirməsi üçündür. Bu şikayətlər yalnız həmin mağazanın platformadan xaric edilməsi üçün istifadə oluna bilər. Şirkət maddi və ya mənəvi zərərin ödənilməsinə görə məsuliyyət daşımır.
        </p>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">5. Əlaqə</h2>
        <p className="leading-relaxed">
          Suallarınız üçün: [Əlaqə emaili]
        </p>
      </section>
    </div>
  );
};
