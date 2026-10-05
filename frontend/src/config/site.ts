export const siteConfig = {
  name: "AzCloth",
  description: "Yerli butiklər və hər zövqə uyğun geyimlər bir arada. AzCloth ilə yeni tərzini kəşf et.",
  url: "https://www.azcloth.store",
  ogImage: "", // Fallback OG image (Will be manual item for a proper 1200x630 image)
  links: {
    instagram: "", // Needs to be provided by user
    facebook: "", // Needs to be provided by user
    whatsapp: "", // Needs to be provided by user
  },
  contact: {
    email: "",
    phone: "", // Needs to be provided by user
  },
  whatsapp: {
    number: "994507035757",
    display: "+994 50 703 57 57"
  }
};

export const whatsappLink = (message?: string) => {
  const baseUrl = `https://wa.me/${siteConfig.whatsapp.number}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

export type SiteConfig = typeof siteConfig;
