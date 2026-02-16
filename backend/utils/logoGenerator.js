const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');

// Color palettes for different business types
const colorPalettes = [
  { name: 'Blue', bg: '#3B82F6', text: '#FFFFFF', accent: '#1D4ED8' },
  { name: 'Red', bg: '#EF4444', text: '#FFFFFF', accent: '#B91C1C' },
  { name: 'Green', bg: '#10B981', text: '#FFFFFF', accent: '#047857' },
  { name: 'Orange', bg: '#F59E0B', text: '#FFFFFF', accent: '#D97706' },
  { name: 'Purple', bg: '#8B5CF6', text: '#FFFFFF', accent: '#6D28D9' },
  { name: 'Pink', bg: '#EC4899', text: '#FFFFFF', accent: '#BE185D' },
  { name: 'Teal', bg: '#14B8A6', text: '#FFFFFF', accent: '#0F766E' },
  { name: 'Indigo', bg: '#6366F1', text: '#FFFFFF', accent: '#4338CA' },
];

// Business type keywords to determine colors
const businessKeywords = {
  'food': ['food', 'restaurant', 'cafe', 'coffee', 'bakery', 'kitchen', 'catering', 'cuisine', 'makanan', 'restoran', 'kafe', 'kopi', 'roti'],
  'tech': ['tech', 'software', 'digital', 'app', 'web', 'computer', 'code', 'data', 'ai', 'teknologi', 'perangkat lunak', 'aplikasi', 'komputer'],
  'fashion': ['fashion', 'clothing', 'boutique', 'style', 'wear', 'apparel', 'dress', 'fesyen', 'pakaian', 'butik', 'gaya'],
  'health': ['health', 'medical', 'wellness', 'fitness', 'care', 'clinic', 'pharmacy', 'kesehatan', 'medis', 'kebugaran', 'klinik', 'apotek'],
  'beauty': ['beauty', 'salon', 'spa', 'cosmetic', 'makeup', 'skincare', 'kecantikan', 'salon', 'kosmetik', 'rias'],
  'education': ['education', 'school', 'learning', 'academy', 'training', 'course', 'pendidikan', 'sekolah', 'belajar', 'akademi', 'kursus'],
  'finance': ['finance', 'bank', 'money', 'invest', 'accounting', 'tax', 'financial', 'keuangan', 'bank', 'uang', 'investasi', 'pajak'],
  'construction': ['construction', 'builder', 'renovation', 'contractor', 'repair', 'konstruksi', 'pembangun', 'renovasi', 'kontraktor', 'reparasi'],
};

// Indonesian to English translations for logo prompts
const indonesianTranslations = {
  // Common words
  'logo': 'logo',
  'desain': 'design',
  'minimalis': 'minimalist',
  'modern': 'modern',
  'sederhana': 'simple',
  'elegan': 'elegant',
  'profesional': 'professional',
  'kreatif': 'creative',
  'unik': 'unique',
  'bersih': 'clean',
  'cerah': 'bright',
  'gelap': 'dark',
  'warna': 'color',
  'biru': 'blue',
  'merah': 'red',
  'hijau': 'green',
  'kuning': 'yellow',
  'oranye': 'orange',
  'ungu': 'purple',
  'pink': 'pink',
  'hitam': 'black',
  'putih': 'white',
  'coklat': 'brown',
  'abu-abu': 'gray',
  'emas': 'gold',
  'perak': 'silver',
  'gradasi': 'gradient',
  'lingkaran': 'circle',
  'segitiga': 'triangle',
  'persegi': 'square',
  'ikon': 'icon',
  'simbol': 'symbol',
  'gambar': 'image',
  'ilustrasi': 'illustration',
  'vektor': 'vector',
  'teks': 'text',
  'tulisan': 'text',
  'huruf': 'letter',
  'font': 'font',
  'latar belakang': 'background',
  'putih bersih': 'white background',
  'latar putih': 'white background',
  
  // Business types
  'perusahaan': 'company',
  'bisnis': 'business',
  'usaha': 'business',
  'toko': 'shop',
  'warung': 'stall',
  'kedai': 'shop',
  'restoran': 'restaurant',
  'kafe': 'cafe',
  'coffee shop': 'coffee shop',
  'kedai kopi': 'coffee shop',
  'warung kopi': 'coffee stall',
  'makanan': 'food',
  'minuman': 'drink',
  'kuliner': 'culinary',
  'nasi': 'rice',
  'nasi goreng': 'fried rice',
  'mie': 'noodles',
  'bakso': 'meatball',
  'sate': 'satay',
  'ayam': 'chicken',
  'sapi': 'beef',
  'ikan': 'fish',
  'seafood': 'seafood',
  'roti': 'bread',
  'kue': 'cake',
  'pizza': 'pizza',
  'burger': 'burger',
  'sushi': 'sushi',
  'katering': 'catering',
  'bakery': 'bakery',
  'toko roti': 'bakery',
  'teknologi': 'technology',
  'digital': 'digital',
  'aplikasi': 'application',
  'website': 'website',
  'komputer': 'computer',
  'internet': 'internet',
  'pakaian': 'clothing',
  'baju': 'clothes',
  'fashion': 'fashion',
  'butik': 'boutique',
  'salon': 'salon',
  'spa': 'spa',
  'kecantikan': 'beauty',
  'kosmetik': 'cosmetics',
  'kesehatan': 'health',
  'kebugaran': 'fitness',
  'apotek': 'pharmacy',
  'klinik': 'clinic',
  'rumah sakit': 'hospital',
  'dokter': 'doctor',
  'pendidikan': 'education',
  'sekolah': 'school',
  'kursus': 'course',
  'les': 'tutoring',
  'bimbingan': 'guidance',
  'keuangan': 'finance',
  'bank': 'bank',
  'investasi': 'investment',
  'asuransi': 'insurance',
  'properti': 'property',
  'real estat': 'real estate',
  'konstruksi': 'construction',
  'kontraktor': 'contractor',
  'tukang': 'handyman',
  'montir': 'mechanic',
  'bengkel': 'workshop',
  'transportasi': 'transportation',
  'travel': 'travel',
  'tour': 'tour',
  'jasa': 'service',
  'servis': 'service',
  'rental': 'rental',
  'sewa': 'rental',
  'kebersihan': 'cleaning',
  'keamanan': 'security',
  'peternakan': 'farming',
  'pertanian': 'agriculture',
  'perkebunan': 'plantation',
};

// Translate Indonesian prompt to English
function translateIndonesianPrompt(prompt) {
  let translated = prompt.toLowerCase();
  
  // Sort by length (longest first) to avoid partial matches
  const sortedWords = Object.keys(indonesianTranslations).sort((a, b) => b.length - a.length);
  
  for (const indoWord of sortedWords) {
    const regex = new RegExp(`\\b${indoWord}\\b`, 'gi');
    translated = translated.replace(regex, indonesianTranslations[indoWord]);
  }
  
  return translated;
}

// Check if prompt contains Indonesian words
function containsIndonesian(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  return Object.keys(indonesianTranslations).some(word => lowerPrompt.includes(word));
}

function detectBusinessType(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  for (const [type, keywords] of Object.entries(businessKeywords)) {
    if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
      return type;
    }
  }
  return 'general';
}

function getInitials(prompt) {
  // Remove common words
  const skipWords = ['logo', 'design', 'for', 'the', 'and', 'with', 'a', 'an', 'of'];
  const words = prompt.split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(w => w.length > 2 && !skipWords.includes(w.toLowerCase()));
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return 'LG';
}

function getBusinessName(prompt) {
  // Extract business name from prompt
  const words = prompt.split(/\s+/).filter(w => w.length > 2);
  if (words.length >= 2) {
    return words.slice(0, 2).join(' ');
  }
  return 'Business';
}

// Generate SVG logo with Sharp
async function generateSvgLogo(prompt, outputPath) {
  const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
  const initials = getInitials(prompt);
  const businessType = detectBusinessType(prompt);
  
  // Create SVG with logo design
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${palette.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="512" height="512" fill="url(#bgGrad)" rx="64" ry="64"/>
      
      <!-- Decorative Circle -->
      <circle cx="256" cy="200" r="120" fill="${palette.text}" fill-opacity="0.1"/>
      <circle cx="256" cy="200" r="100" fill="${palette.text}" fill-opacity="0.15"/>
      
      <!-- Main Circle Background for Text -->
      <circle cx="256" cy="200" r="80" fill="${palette.text}" filter="url(#shadow)"/>
      
      <!-- Initials Text -->
      <text x="256" y="225" 
            font-family="Arial, sans-serif" 
            font-size="72" 
            font-weight="bold" 
            fill="${palette.bg}" 
            text-anchor="middle"
            dominant-baseline="middle">${initials}</text>
      
      <!-- Business Type Icon (simplified) -->
      <g transform="translate(236, 320)">
        <rect x="0" y="0" width="40" height="40" fill="${palette.text}" fill-opacity="0.2" rx="8"/>
        <text x="20" y="28" 
              font-family="Arial, sans-serif" 
              font-size="20" 
              fill="${palette.text}" 
              text-anchor="middle">${businessType[0].toUpperCase()}</text>
      </g>
      
      <!-- Tagline -->
      <text x="256" y="400" 
            font-family="Arial, sans-serif" 
            font-size="24" 
            fill="${palette.text}" 
            text-anchor="middle"
            fill-opacity="0.9">${businessType.charAt(0).toUpperCase() + businessType.slice(1)}</text>
    </svg>
  `;

  // Convert SVG to PNG using Sharp
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(outputPath);

  return outputPath;
}

// Generate using OpenAI DALL-E (if API key available)
async function generateWithOpenAI(prompt, outputPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('No OpenAI API key configured');
  }

  try {
    console.log('Using OpenAI DALL-E...');
    
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      model: "dall-e-3",
      prompt: `Professional minimalist logo design: ${prompt}, vector style, clean, modern, suitable for business branding, high quality`,
      size: "1024x1024",
      quality: "standard",
      n: 1
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    const imageUrl = response.data.data[0].url;
    const imageResponse = await axios.get(imageUrl, { 
      responseType: 'stream',
      timeout: 60000 
    });

    const writer = fs.createWriteStream(outputPath);
    imageResponse.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    }
    throw new Error(`OpenAI error: ${error.message}`);
  }
}

// Generate using Pollinations.ai
async function generateWithPollinations(prompt, outputPath) {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  
  if (!apiKey) {
    throw new Error('No Pollinations API key configured');
  }

  console.log('Using Pollinations AI...');
  
  try {
    // Use the unified Pollinations API endpoint with API key
    const encodedPrompt = encodeURIComponent(`Professional minimalist logo design: ${prompt}, vector style, clean, modern, white background, suitable for business branding, high quality, no text`);
    const seed = Math.floor(Math.random() * 1000000);
    
    // API endpoint with key
    const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true&model=flux&negative_prompt=text,words,letters,watermark,signature,typography&key=${apiKey}`;

    console.log('Requesting from Pollinations...');

    // Download the image with longer timeout
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 120000, // 2 minutes
      maxRedirects: 5,
      headers: {
        'Accept': 'image/*,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; LogoBot/1.0)'
      }
    });

    const writer = fs.createWriteStream(outputPath);
    imageResponse.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('✅ Pollinations generation successful');
        resolve(outputPath);
      });
      writer.on('error', (err) => {
        reject(new Error(`Failed to write image: ${err.message}`));
      });
    });

  } catch (error) {
    console.error('❌ Pollinations failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data).substring(0, 200));
    }
    throw error;
  }
}

// Main logo generation function
async function generateLogo(prompt, outputPath) {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  try {
    // Translate Indonesian prompts to English
    let processedPrompt = prompt;
    if (containsIndonesian(prompt)) {
      console.log('🌏 Detected Indonesian language, translating...');
      processedPrompt = translateIndonesianPrompt(prompt);
      console.log(`   Original: "${prompt}"`);
      console.log(`   Translated: "${processedPrompt}"`);
    }

    console.log(`Generating logo for: "${processedPrompt}"`);
    
    // 1. Try OpenAI if API key is available (best quality)
    if (process.env.OPENAI_API_KEY) {
      try {
        return await generateWithOpenAI(processedPrompt, outputPath);
      } catch (err) {
        console.log('OpenAI failed:', err.message);
      }
    }

    // 2. Try Pollinations if API key is available
    if (process.env.POLLINATIONS_API_KEY) {
      try {
        return await generateWithPollinations(processedPrompt, outputPath);
      } catch (err) {
        console.log('Pollinations failed:', err.message);
      }
    }

    // 3. Use Sharp SVG generator (always works, no external API)
    console.log('Using SVG generator...');
    return await generateSvgLogo(processedPrompt, outputPath);

  } catch (error) {
    console.error('Logo generation error:', error);
    throw new Error('Failed to generate logo: ' + error.message);
  }
}

module.exports = { generateLogo };
