import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export const geocodingService = {
  /**
   * Geocode an address using Nominatim (OpenStreetMap) API - gratuito e sem limite rígido
   * Se falhar, tenta Google Geocoding API como fallback
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim() === '') {
      return null;
    }

    // Tentar Nominatim primeiro (gratuito)
    try {
      const nominatimResult = await this.geocodeWithNominatim(address);
      if (nominatimResult) {
        return nominatimResult;
      }
    } catch (error) {
      console.error('Nominatim error, trying Google:', error);
    }

    // Fallback para Google se tiver API key
    if (GOOGLE_MAPS_API_KEY) {
      return this.geocodeWithGoogle(address);
    }

    return null;
  },

  /**
   * Limpa o endereço para melhor resultado no geocoding
   * Remove prefixos como "SÃO PAULO/SP", "CURITIBA/PR", etc.
   */
  cleanAddress(address: string): string {
    let cleaned = address;

    // Remove prefixos de cidade/estado no início (ex: "SÃO PAULO/SP Rua...")
    cleaned = cleaned.replace(/^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ\s]+\/[A-Z]{2}\s+/i, '');

    // Remove "nº" e substitui por espaço
    cleaned = cleaned.replace(/\s*nº\s*/gi, ' ');

    // Remove complementos complexos e tudo após eles
    // (apartamento, apto, casa, bloco, bl, torre, cob, cobertura seguido de qualquer coisa até a próxima vírgula)
    cleaned = cleaned.replace(/,?\s*(apartamento|apto|apt|casa|bloco|bl|torre|cob|cobertura)[^,]*/gi, '');

    // Remove "c X vgs" (X vagas)
    cleaned = cleaned.replace(/\s*c\s*\d+\s*vg[as]*/gi, '');

    // Simplifica CEP - remove a palavra CEP
    cleaned = cleaned.replace(/CEP\s*[-\s]*/gi, '');

    // Remove cidade/estado duplicada no final (já temos no bairro)
    // Ex: "São Paulo/SP, 01421-002" -> mantem apenas CEP se existir
    cleaned = cleaned.replace(/,\s*[A-Za-záàâãéèêíìîóòôõúùûç\s]+\/[A-Z]{2}\s*,/gi, ',');

    // Remove espaços múltiplos e vírgulas duplicadas
    cleaned = cleaned.replace(/,\s*,/g, ',');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/,\s*$/, ''); // Remove vírgula no final

    return cleaned;
  },

  /**
   * Geocode using Nominatim (OpenStreetMap)
   */
  async geocodeWithNominatim(address: string): Promise<GeocodingResult | null> {
    try {
      // Limpar o endereço antes de geocodificar
      const cleanedAddress = this.cleanAddress(address);

      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: cleanedAddress,
            format: 'json',
            countrycodes: 'br',
            limit: 1,
          },
          headers: {
            'User-Agent': 'Monofloor-Admin/1.0 (contact@monofloor.com.br)',
          },
        }
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
        };
      }

      return null;
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return null;
    }
  },

  /**
   * Geocode using Google Geocoding API
   */
  async geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
    if (!GOOGLE_MAPS_API_KEY) {
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
      console.error('Google geocoding error:', error);
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
