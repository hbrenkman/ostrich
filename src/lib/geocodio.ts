const GEOCODIO_API_KEY = process.env.NEXT_PUBLIC_GEOCODIO_API_KEY;
const GEOCODIO_BASE_URL = 'https://api.geocod.io/v1.7/geocode';

interface GeocodioResponse {
  input: {
    address_components: {
      number: string;
      predirectional?: string;
      street: string;
      suffix?: string;
      formatted_street: string;
      city: string;
      state: string;
      zip?: string;
      country: string;
    };
    formatted_address: string;
  };
  results: Array<{
    address_components: {
      number: string;
      predirectional?: string;
      street: string;
      suffix?: string;
      formatted_street: string;
      city: string;
      county?: string;
      state: string;
      zip?: string;
      country: string;
    };
    location: {
      lat: number;
      lng: number;
    };
    accuracy: number;
  }>;
}

// Debounce function to limit API calls
function debounce<T extends (...args: any[]) => Promise<any>>(func: T, wait: number): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let lastPromise: Promise<ReturnType<T>> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise((resolve) => {
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          console.error('Error in debounced function:', error);
          resolve(null as ReturnType<T>);
        }
      }, wait);
    });
  };
}

// Check if the address is complete enough for geocoding
function isAddressComplete(address: string): boolean {
  // Split address into parts and clean them
  const parts = address.split(',').map(part => part.trim());
  
  // Need at least 3 parts: street, city, state
  if (parts.length < 3) return false;
  
  // Check if we have a street number
  const streetPart = parts[0];
  if (!streetPart.match(/^\d+/)) return false;
  
  // Check if we have a city
  const cityPart = parts[1];
  if (!cityPart) return false;
  
  // Check if we have a state (2 letters or full name)
  const statePart = parts[2];
  if (!statePart) return false;
  
  // Optional: Check if we have a zip code
  const zipPart = parts[3];
  if (zipPart && !zipPart.match(/^\d{5}(-\d{4})?$/)) return false;
  
  return true;
}

// Format address for API call
function formatAddressForApi(address: string): string {
  const parts = address.split(',').map(part => part.trim());
  
  // Ensure we have at least street, city, and state
  if (parts.length < 3) return address;
  
  // Format the address parts
  const street = parts[0];
  const city = parts[1];
  const state = parts[2];
  const zip = parts[3] || '';
  
  // Don't modify the street address - preserve it exactly as entered
  // Don't modify the city - preserve it exactly as entered
  // Don't modify the state - preserve it exactly as entered
  // Don't modify the zip - preserve it exactly as entered
  
  // Return formatted address with all parts preserved
  return `${street}, ${city}, ${state}${zip ? ` ${zip}` : ''}`;
}

export const verifyAddress = debounce(async (address: string): Promise<{
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
} | null> => {
  try {
    // Only proceed if the address is complete enough
    if (!isAddressComplete(address)) {
      console.log('Address not complete enough:', address);
      return null;
    }

    // Format the address for the API call
    const formattedAddress = formatAddressForApi(address);
    console.log('Formatted address for API:', formattedAddress);
    
    const response = await fetch(
      `${GEOCODIO_BASE_URL}?q=${encodeURIComponent(formattedAddress)}&api_key=${GEOCODIO_API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Geocodio API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        address: formattedAddress
      });
      return null;
    }
    
    const data: GeocodioResponse = await response.json();
    console.log('Full Geocodio API response:', JSON.stringify(data, null, 2));
    console.log('Input components:', JSON.stringify(data.input.address_components, null, 2));
    console.log('Result components:', JSON.stringify(data.results[0].address_components, null, 2));
    
    if (!data.results || data.results.length === 0) {
      console.log('No results found for address:', formattedAddress);
      return null;
    }

    const result = data.results[0];
    const components = result.address_components;

    // Log the components we're using
    console.log('Components being used:', {
      number: components.number,
      formatted_street: components.formatted_street,
      city: components.city,
      state: components.state,
      zip: components.zip
    });

    // Return the standardized address from Geocodio
    return {
      address_line1: `${components.number} ${components.formatted_street}`,
      city: components.city,
      state: components.state,
      zip: components.zip || ''
    };
  } catch (error) {
    console.error('Error verifying address:', error);
    return null;
  }
}, 500); 