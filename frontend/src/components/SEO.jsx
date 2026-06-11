import { useEffect } from 'react';

const SEO = ({ title, description, keywords, ogImage, ogUrl }) => {
  useEffect(() => {
    // 1. Update Title
    const prevTitle = document.title;
    if (title) {
      document.title = title;
    }

    // Helper function to update or create meta tags
    const updateOrCreateMeta = (attrName, attrVal, contentVal) => {
      if (!contentVal) return;
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', contentVal);
    };

    // 2. Update Meta Description
    updateOrCreateMeta('name', 'description', description);

    // 3. Update Meta Keywords
    if (keywords) {
      updateOrCreateMeta('name', 'keywords', keywords);
    }

    // 4. Update OpenGraph Meta Tags
    updateOrCreateMeta('property', 'og:title', title);
    updateOrCreateMeta('property', 'og:description', description);
    if (ogImage) {
      updateOrCreateMeta('property', 'og:image', ogImage);
    }
    if (ogUrl) {
      updateOrCreateMeta('property', 'og:url', ogUrl);
    }

    // 5. Update Twitter Meta Tags
    updateOrCreateMeta('name', 'twitter:title', title);
    updateOrCreateMeta('name', 'twitter:description', description);
    if (ogImage) {
      updateOrCreateMeta('name', 'twitter:image', ogImage);
    }

    // Return cleanup to restore original title (optional, but good practice for transitions)
    return () => {
      document.title = prevTitle;
    };
  }, [title, description, keywords, ogImage, ogUrl]);

  return null; // This component doesn't render anything visually
};

export default SEO;
