import { supabase } from './supabase';

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

interface AddressObject {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  cost_index?: number | null;
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

export async function verifyAddress(address: string | AddressObject): Promise<AddressObject | null> {
  try {
    console.log('verifyAddress called with:', address);
    let addressString: string;
    
    if (typeof address === 'string') {
      addressString = address;
    } else {
      // Convert address object to string
      addressString = [
        address.address_line1,
        address.address_line2,
        `${address.city}, ${address.state} ${address.zip}`
      ].filter(Boolean).join(', ');
    }

    console.log('Formatted address string:', addressString);

    // Make API call to Geocodio
    const response = await fetch(`https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(addressString)}&api_key=${process.env.NEXT_PUBLIC_GEOCODIO_API_KEY}`);
    
    if (!response.ok) {
      console.error('Geocodio API error:', await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Geocodio API response:', data);
    
    if (!data.results || data.results.length === 0) {
      console.log('No results from Geocodio API');
      return null;
    }

    const result = data.results[0];
    const components = result.address_components;
    console.log('Address components:', components);

    // Get the verified address
    const verifiedAddress = {
      address_line1: components.number + ' ' + components.street,
      address_line2: components.secondary_unit || null,
      city: components.city,
      state: components.state,
      zip: components.zip
    };
    console.log('Verified address:', verifiedAddress);

    // Look up the cost index for this location
    console.log('Looking up cost index for:', { city: components.city, state: components.state });
    const { data: costIndexData, error: costIndexError } = await supabase
      .from('construction_index')
      .select(`
        index_value,
        metro_area:metro_areas (
          name,
          state:states (
            name
          )
        )
      `)
      .eq('metro_area.state.name', components.state)
      .eq('metro_area.name', components.city)
      .single();

    console.log('Cost index lookup result:', { data: costIndexData, error: costIndexError });

    if (costIndexError) {
      console.log('Error looking up cost index, trying "Other" metro area');
      // Try to find the "Other" metro area for this state
      const { data: otherCostIndexData, error: otherCostIndexError } = await supabase
        .from('construction_index')
        .select(`
          index_value,
          metro_area:metro_areas (
            name,
            state:states (
              name
            )
          )
        `)
        .eq('metro_area.state.name', components.state)
        .eq('metro_area.name', 'Other')
        .single();

      console.log('"Other" metro area lookup result:', { data: otherCostIndexData, error: otherCostIndexError });

      if (otherCostIndexError) {
        console.error('Error looking up "Other" cost index:', otherCostIndexError);
        return verifiedAddress;
      }

      const otherResult = {
        ...verifiedAddress,
        cost_index: otherCostIndexData.index_value
      };
      console.log('Returning address with "Other" cost index:', otherResult);
      return otherResult;
    }

    const finalResult = {
      ...verifiedAddress,
      cost_index: costIndexData.index_value
    };
    console.log('Returning address with cost index:', finalResult);
    return finalResult;
  } catch (error) {
    console.error('Error in verifyAddress:', error);
    return null;
  }
} 