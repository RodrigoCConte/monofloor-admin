declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    setCenter(latLng: LatLngLiteral): void;
    setZoom(zoom: number): void;
    getCenter(): LatLng;
    getZoom(): number;
    fitBounds(bounds: LatLngBounds): void;
    panTo(latLng: LatLngLiteral | LatLng): void;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setPosition(latLng: LatLngLiteral): void;
    getPosition(): LatLng | null;
    setMap(map: Map | null): void;
    setIcon(icon: string | Icon): void;
    addListener(event: string, callback: () => void): void;
  }

  class InfoWindow {
    constructor(options?: InfoWindowOptions);
    open(options?: { anchor?: Marker; map?: Map } | Map, marker?: Marker): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(latLng: LatLngLiteral | LatLng): void;
    isEmpty(): boolean;
    getCenter(): LatLng;
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    styles?: any[];
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }

  interface MarkerOptions {
    position?: LatLngLiteral;
    map?: Map;
    icon?: string | Icon;
    title?: string;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    maxWidth?: number;
  }

  interface Icon {
    url: string;
    scaledSize?: Size;
    anchor?: Point;
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  namespace event {
    function addListener(instance: any, eventName: string, handler: (...args: any[]) => void): void;
    function removeListener(listener: any): void;
    function trigger(instance: any, eventName: string, ...args: any[]): void;
  }

  namespace places {
    class Autocomplete {
      constructor(input: HTMLInputElement, options?: AutocompleteOptions);
      addListener(event: string, callback: () => void): void;
      getPlace(): PlaceResult;
      setBounds(bounds: LatLngBounds): void;
      setComponentRestrictions(restrictions: ComponentRestrictions): void;
    }

    interface AutocompleteOptions {
      bounds?: LatLngBounds;
      componentRestrictions?: ComponentRestrictions;
      fields?: string[];
      types?: string[];
    }

    interface ComponentRestrictions {
      country: string | string[];
    }

    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
      geometry?: PlaceGeometry;
      name?: string;
      place_id?: string;
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface PlaceGeometry {
      location?: LatLng;
      viewport?: LatLngBounds;
    }
  }
}

interface Window {
  google: typeof google;
  initMap: () => void;
}
