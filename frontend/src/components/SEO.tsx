import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { siteConfig } from '../config/site';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  noindex?: boolean;
  product?: any;
  price?: number;
  fullTitle?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const updateTag = (type: 'meta' | 'link', attr: string, attrValue: string, contentAttr: string, contentValue: string) => {
  let element = document.querySelector(`${type}[${attr}="${attrValue}"]`);
  if (!element) {
    element = document.createElement(type);
    element.setAttribute(attr, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute(contentAttr, contentValue);
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description = siteConfig.description,
  canonicalUrl,
  ogImage, // Do not default to svg
  type = 'website',
  noindex = false,
  product,
  price,
  fullTitle,
  breadcrumbs,
}) => {
  const location = useLocation();
  
  useEffect(() => {
    // Original values to restore
    const originalTitle = document.title;

    try {
      const computedTitle = fullTitle ? fullTitle : (title ? `${title} | ${siteConfig?.name || 'AzCloth'}` : (siteConfig?.name || 'AzCloth'));
      const baseCanonical = canonicalUrl || `${siteConfig?.url || ''}${location.pathname === '/' ? '' : location.pathname}`;
      
      // Update simple tags
      document.title = computedTitle;
      updateTag('meta', 'name', 'description', 'content', description);
      updateTag('link', 'rel', 'canonical', 'href', baseCanonical);
      
      // Robots
      if (noindex) {
        updateTag('meta', 'name', 'robots', 'content', 'noindex, nofollow');
      } else {
        updateTag('meta', 'name', 'robots', 'content', 'index, follow');
      }

      // Open Graph
      updateTag('meta', 'property', 'og:title', 'content', fullTitle);
      updateTag('meta', 'property', 'og:description', 'content', description);
      updateTag('meta', 'property', 'og:url', 'content', baseCanonical);
      updateTag('meta', 'property', 'og:type', 'content', type);
      updateTag('meta', 'property', 'og:site_name', 'content', siteConfig?.name || 'AzCloth');
      
      if (ogImage) {
        updateTag('meta', 'property', 'og:image', 'content', ogImage);
        updateTag('meta', 'name', 'twitter:image', 'content', ogImage);
        updateTag('meta', 'name', 'twitter:card', 'content', 'summary_large_image');
      } else {
        const ogImgMeta = document.querySelector('meta[property="og:image"]');
        if (ogImgMeta) ogImgMeta.remove();
        const twImgMeta = document.querySelector('meta[name="twitter:image"]');
        if (twImgMeta) twImgMeta.remove();
        updateTag('meta', 'name', 'twitter:card', 'content', 'summary');
      }

      // Twitter basic
      updateTag('meta', 'name', 'twitter:title', 'content', computedTitle);
      updateTag('meta', 'name', 'twitter:description', 'content', description);

      // JSON-LD scripts
      let schemaScript = document.getElementById('route-schema');
      
      const schemas = [];
      
      if (product) {
        const productPrice = price !== undefined ? price : product.base_price;
        const schemaPayload: any = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "brand": {
            "@type": "Brand",
            "name": product.store?.name || siteConfig?.name || 'AzCloth'
          }
        };

        if (ogImage) {
          schemaPayload.image = ogImage;
        }
        
        if (product.description) {
          schemaPayload.description = product.description;
        }

        if (productPrice !== undefined && productPrice !== null) {
          schemaPayload.offers = {
            "@type": "Offer",
            "url": baseCanonical,
            "priceCurrency": "AZN",
            "price": productPrice
          };
        }
        schemas.push(schemaPayload);
      }
      
      if (schemas.length > 0) {
        if (!schemaScript) {
          schemaScript = document.createElement('script');
          schemaScript.id = 'route-schema';
          schemaScript.type = 'application/ld+json';
          document.head.appendChild(schemaScript);
        }
        schemaScript.textContent = JSON.stringify(schemas);
      } else if (schemaScript) {
        schemaScript.remove();
      }
    } catch (e) {
      console.error('SEO Error:', e);
    }

    return () => {
      document.title = originalTitle;
    };
  }, [title, description, canonicalUrl, ogImage, type, noindex, product, location.pathname]);

  return null;
};
