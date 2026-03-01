const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-javascript-api';

let googleMapsPromise = null;

export function getGoogleMapsApiKey() {
  const apiKey =
    import.meta.env.VITE_GOOGLEMAPS_API_KEY ||
    import.meta.env.GOOGLEMAPS_API_KEY ||
    '';
  return String(apiKey).trim();
}

export async function loadGoogleMaps(options = {}) {
  if (window.google?.maps) {
    return window.google.maps;
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error(
      'Google Maps API key is missing. Set GOOGLEMAPS_API_KEY or VITE_GOOGLEMAPS_API_KEY.'
    );
  }

  const libraries = Array.isArray(options.libraries) ? options.libraries : [];

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps loaded, but window.google.maps is unavailable.'));
        }
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps script.'));
      });
      return;
    }

    const query = new URLSearchParams({
      key: apiKey,
      v: 'weekly',
    });

    if (libraries.length > 0) {
      query.set('libraries', libraries.join(','));
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?${query.toString()}`;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps loaded, but window.google.maps is unavailable.'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script.'));
    };

    document.head.appendChild(script);
  }).catch((error) => {
    googleMapsPromise = null;
    throw error;
  });

  return googleMapsPromise;
}
