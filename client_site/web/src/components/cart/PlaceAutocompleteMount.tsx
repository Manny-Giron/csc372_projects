import { useCallback, useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'rr-google-maps-js';

type Props = {
  apiKey: string | undefined;
  onPlaceSelect: (payload: { formattedAddress: string; line1: string; city: string; state: string; postal: string }) => void;
  disabled?: boolean;
};

type ClassicAddrPart = { long_name: string; short_name: string; types: string[] };

type ClassicPlace = {
  formatted_address?: string;
  address_components?: ClassicAddrPart[];
};

/**
 * Classic Places Autocomplete (works with the standard maps/api/js?libraries=places script).
 * Avoids `importLibrary` / PlaceAutocompleteElement, which need the dynamic import bootstrap.
 */
export function PlaceAutocompleteMount({ apiKey, onPlaceSelect, disabled }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  const runPlaceSelect = useCallback((place: ClassicPlace) => {
    const formatted = place.formatted_address || '';
    const parts = parseClassicComponents(place);
    onPlaceSelectRef.current({
      formattedAddress: formatted,
      line1: parts.line1 || formatted,
      city: parts.city,
      state: parts.state,
      postal: parts.postal,
    });
  }, []);

  useEffect(() => {
    if (disabled || !apiKey) {
      setReady(false);
      return;
    }

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let autocomplete: any = null;

    async function boot() {
      setLoadError(null);
      if (!apiKey) return;
      const key = apiKey;
      try {
        await loadGoogleMapsScript(key);
        if (destroyed || !hostRef.current) return;

        const w = window as unknown as { google: { maps: { places: { Autocomplete: new (i: HTMLInputElement, o?: object) => unknown } } } };
        if (!w.google?.maps?.places?.Autocomplete) {
          throw new Error('Google Maps Places Autocomplete is not available');
        }

        if (hostRef.current.firstChild) {
          hostRef.current.innerHTML = '';
        }
        const el = document.createElement('input');
        el.type = 'text';
        el.id = 'addr-autocomplete';
        el.className = 'place-autocomplete-input';
        el.placeholder = 'Start typing an address';
        el.autocomplete = 'off';
        el.setAttribute('aria-label', 'Address search');
        hostRef.current.appendChild(el);

        autocomplete = new w.google.maps.places.Autocomplete(el, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (autocomplete as any).addListener('place_changed', () => {
          if (destroyed) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const place = (autocomplete as any).getPlace() as ClassicPlace;
          if (!place?.address_components?.length) return;
          runPlaceSelect(place);
        });

        if (!destroyed) setReady(true);
      } catch (err) {
        if (!destroyed) {
          setLoadError(err instanceof Error ? err.message : 'Could not load Google Maps');
        }
      }
    }

    boot();

    return () => {
      destroyed = true;
      setReady(false);
      if (autocomplete) {
        const w = window as unknown as { google?: { maps?: { event: { clearInstanceListeners: (x: unknown) => void } } } };
        w.google?.maps?.event?.clearInstanceListeners?.(autocomplete);
      }
      if (hostRef.current) {
        hostRef.current.innerHTML = '';
      }
    };
  }, [apiKey, disabled, runPlaceSelect]);

  if (disabled) {
    return <p className="field-hint">Pickup mode — no delivery address required.</p>;
  }

  if (!apiKey) {
    return (
      <p className="field-hint notice inline-notice">
        Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>web/.env</code> to enable
        address autocomplete and verification.
      </p>
    );
  }

  return (
    <div>
      <div
        ref={hostRef}
        className="place-autocomplete-host"
        style={{ minHeight: ready ? undefined : 48 }}
        aria-label="Address search"
      />
      {loadError && <p className="error-banner">{loadError}</p>}
    </div>
  );
}

function parseClassicComponents(place: ClassicPlace) {
  const comps = place.address_components || [];
  let streetNum = '';
  let route = '';
  let city = '';
  let state = '';
  let postal = '';
  for (const c of comps) {
    const t = c.types;
    if (t.includes('street_number')) streetNum = c.long_name;
    if (t.includes('route')) route = c.long_name;
    if (t.includes('locality')) city = c.long_name;
    if (t.includes('administrative_area_level_1')) state = c.short_name;
    if (t.includes('postal_code')) postal = c.long_name;
  }
  const line1 = [streetNum, route].filter(Boolean).join(' ').trim();
  return { line1, city, state, postal };
}

function loadGoogleMapsScript(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const w = window as unknown as { google?: { maps?: { places?: unknown } } };
    if (w.google?.maps?.places) {
      resolve();
      return;
    }

    const onReady = () => {
      if (w.google?.maps?.places) {
        resolve();
        return;
      }
      const t0 = Date.now();
      const poll = setInterval(() => {
        if (w.google?.maps?.places) {
          clearInterval(poll);
          resolve();
        } else if (Date.now() - t0 > 20000) {
          clearInterval(poll);
          reject(new Error('Google Maps Places did not load'));
        }
      }, 30);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (w.google?.maps?.places) {
        resolve();
        return;
      }
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', () => reject(new Error('Script load error')));
      return;
    }

    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
    s.onload = onReady;
    s.onerror = () => reject(new Error('Failed to load Google Maps JavaScript API'));
    document.head.appendChild(s);
  });
}
