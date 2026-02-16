export const logoPromptSuggestions = {
  restaurant: {
    label: 'Restaurant & Food',
    icon: '🍽️',
    prompts: [
      "Minimalist coffee shop logo, brown and cream colors, steaming cup icon, modern sans-serif font",
      "Vibrant food truck logo, street food theme, bold colors, burger and fries illustration",
      "Elegant fine dining restaurant logo, gold accents, sophisticated typography, white background",
      "Cozy bakery logo, warm bread and wheat illustration, golden brown colors, rustic style",
      "Fresh juice bar logo, tropical fruits, bright green and orange, modern minimalist design",
      "Pizzeria logo, Italian flag colors, pizza slice icon, vintage typography",
      "Sushi restaurant logo, Japanese minimalist style, red and black, fish silhouette",
      "Logo warung kopi minimalis, warna coklat dan krem, ikon cangkir kopi, font modern",
      "Logo restoran Padang elegan, warna merah dan emas, ikon rumah gadang, tradisional",
      "Logo bakery Indonesia, roti dan gandum, warna keemasan, gaya rustic"
    ]
  },
  retail: {
    label: 'Retail & Shop',
    icon: '🛍️',
    prompts: [
      "Elegant boutique logo, floral elements, gold and pink colors, sophisticated typography",
      "Modern tech store logo, circuit patterns, blue gradient, futuristic design",
      "Cozy bookstore logo, vintage style, warm brown tones, stack of books illustration",
      "Fashion clothing store logo, hanger silhouette, monochrome, high fashion aesthetic",
      "Toy shop logo, playful colors, building blocks illustration, friendly rounded font",
      "Jewelry store logo, diamond sparkle effect, elegant gold and black, luxury feel",
      "Organic grocery logo, leaf and vegetable elements, green and earth tones, natural look"
    ]
  },
  service: {
    label: 'Service Business',
    icon: '🤝',
    prompts: [
      "Professional consulting logo, abstract geometric shape, navy blue, clean lines",
      "Friendly cleaning service logo, sparkling bubbles, green and white, simple and clean",
      "Trustworthy financial services logo, shield element, deep blue and gold, professional",
      "Landscaping company logo, tree and leaf elements, green and brown, outdoor aesthetic",
      "Auto repair shop logo, wrench and gear icons, bold red and black, industrial style",
      "Hair salon logo, scissors and comb silhouette, elegant purple and silver",
      "Fitness trainer logo, muscular figure silhouette, energetic orange and black"
    ]
  },
  creative: {
    label: 'Creative & Arts',
    icon: '🎨',
    prompts: [
      "Artistic craft store logo, paintbrush and palette, rainbow colors, hand-drawn style",
      "Vintage clothing boutique logo, retro badge style, muted earth tones",
      "Modern photography studio logo, camera aperture design, black and white, sleek",
      "Music studio logo, sound wave visualization, electric blue, modern gradient",
      "Dance studio logo, graceful dancer silhouette, vibrant magenta and purple",
      "Art gallery logo, abstract brush strokes, sophisticated black and gold",
      "Graphic design studio logo, pen tool icon, creative multicolor, contemporary style"
    ]
  },
  tech: {
    label: 'Tech & Digital',
    icon: '💻',
    prompts: [
      "Innovative software company logo, code brackets, gradient purple to blue, modern",
      "Digital marketing agency logo, upward arrow graph, vibrant orange, energetic",
      "App development studio logo, mobile phone icon, minimalist, tech blue",
      "Cloud computing logo, cloud with data streams, sky blue, futuristic",
      "Cybersecurity logo, shield with lock, dark blue and green, trustworthy",
      "AI startup logo, neural network pattern, electric purple, cutting-edge",
      "E-commerce platform logo, shopping cart with sparkles, professional blue"
    ]
  },
  general: {
    label: 'General & Minimalist',
    icon: '✨',
    prompts: [
      "Minimalist abstract logo, single geometric shape, monochrome, clean and modern",
      "Professional business logo, lettermark design, navy blue and white, timeless",
      "Creative studio logo, brushstroke element, artistic, black and gold",
      "Modern startup logo, simple icon with gradient, vibrant but professional",
      "Corporate logo, abstract connection lines, blue gradient, trustworthy feel",
      "Small business logo, hand-crafted feel, warm earth tones, friendly typography",
      "Community organization logo, connected people icon, warm colors, welcoming"
    ]
  }
};

export const getAllPrompts = () => {
  return Object.values(logoPromptSuggestions).flatMap(category => category.prompts);
};

export const getCategoryPrompts = (categoryKey) => {
  return logoPromptSuggestions[categoryKey]?.prompts || [];
};

export const getCategoryLabel = (categoryKey) => {
  return logoPromptSuggestions[categoryKey]?.label || categoryKey;
};

export const getCategoryIcon = (categoryKey) => {
  return logoPromptSuggestions[categoryKey]?.icon || '💡';
};
