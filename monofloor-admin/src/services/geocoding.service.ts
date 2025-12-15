import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export const geocodingService = {
  /**
   * Geocode an address using Google Geocoding API
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!GOOGLE_MAPS_API_KEY || !address || address.trim() === '') {
      return null;
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: address,
            key: GOOGLE_MAPS_API_KEY,
            region: 'br',
            language: 'pt-BR',
          },
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },

  /**
   * Geocode multiple addresses with rate limiting
   */
  async geocodeAddresses(
    addresses: Array<{ index: number; address: string }>
  ): Promise<Map<number, GeocodingResult>> {
    const results = new Map<number, GeocodingResult>();

    for (const item of addresses) {
      if (!item.address || item.address.trim() === '') continue;

      const result = await this.geocodeAddress(item.address);
      if (result) {
        results.set(item.index, result);
      }

      // Rate limiting: 10 requests per second for Google Maps API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  },
};
