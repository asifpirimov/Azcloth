import React from 'react';

export const SellerTerms = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-4xl font-bold mb-8">Satıcı Qaydaları (Seller Terms)</h1>
      
      <p className="mb-4 text-sm text-gray-500">Son yenilənmə: [Effective Date]</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Mağaza Yaratmaq və İdarəetmə</h2>
        <p className="leading-relaxed mb-4">
          AzCloth platformasında satıcı olaraq yalnız rəsmi dəvət (invitation) və ya admin təsdiqi ilə mağaza yarada bilərsiniz. Platformada yerləşdirdiyiniz bütün məhsulların keyfiyyəti, qiyməti və şəkillərinin düzgünlüyünə tam olaraq siz məsuliyyət daşıyırsınız.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Qadağan Olunmuş Fəaliyyətlər</h2>
        <p className="leading-relaxed mb-4">
          Platformada aşağıdakıların yerləşdirilməsi qəti qadağandır:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Saxta, replik və ya icazəsiz marka istifadəsi olan məhsullar.</li>
          <li>Qeyri-qanuni və ya təhlükəli materiallar.</li>
          <li>Alıcıları aldatmağa yönəlmiş yanlış təsvirlər və ya qiymətlər.</li>
          <li>Təhqiramiz və ya qeyri-etik məzmunlu şəkillər və ya mətnlər.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Müştəri Müraciətləri və Əməliyyatlar</h2>
        <p className="leading-relaxed mb-4">
          Bütün sifarişlər, suallar və ödəniş prosesləri alıcı ilə birbaşa WhatsApp vasitəsilə və ya sizin təyin etdiyiniz digər kənar kanallarla aparılır. AzCloth bu əməliyyatların heç birinə müdaxilə etmir və alıcı/satıcı mübahisələrində vasitəçi qismində çıxış etmir. Satıcı müştəri məlumatlarının məxfiliyini qorumağa borcludur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Hesabın Dayandırılması (Suspension)</h2>
        <p className="leading-relaxed mb-4">
          Əgər Satıcı yuxarıda göstərilən qaydaları pozarsa, çoxsaylı müştəri şikayətləri alarsa və ya fırıldaqçılıq hallarında şübhəli bilinərsə, AzCloth rəhbərliyi heç bir xəbərdarlıq etmədən mağazanı müvəqqəti və ya daimi olaraq bağlamaq hüququna malikdir.
        </p>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">5. Əlaqə</h2>
        <p className="leading-relaxed">
          Satıcı dəstəyi üçün: [Əlaqə emaili]
        </p>
      </section>
    </div>
  );
};
