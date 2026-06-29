"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./LocationPickerMap.module.css";
import Button from "@/components/ui/Button";

// Leaflet default icon workaround for Next.js/Webpack
const markerIcon = typeof window !== "undefined" ? L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : undefined;

interface LocationPickerMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
}

export default function LocationPickerMap({
  initialLat,
  initialLng,
  onConfirm,
  onCancel
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || 20.5937); // Default to India's center
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || 78.9629);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: [selectedLat, selectedLng],
      zoom: initialLat && initialLng ? 16 : 5,
      zoomControl: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a draggable marker
    const marker = L.marker([selectedLat, selectedLng], {
      draggable: true,
      icon: markerIcon
    }).addTo(map);

    // Map Click Listener
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handleLocationChange(lat, lng);
    });

    // Marker Drag Listener
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      handleLocationChange(position.lat, position.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Initial reverse geocode if preloaded location exists
    if (initialLat && initialLng) {
      reverseGeocode(initialLat, initialLng);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Debounced search suggestion fetcher (live autocomplete as you type)
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setError("");
      setInfo("");
      try {
        let res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          let data = await res.json();

          // Fallback: If no results and query has no spaces and length > 5, try prefix/nearest matching
          if (data.length === 0 && !query.includes(" ") && query.length > 5) {
            const prefixLen = query.length > 8 ? 6 : 5;
            const fallbackQuery = query.substring(0, prefixLen);
            const fallbackRes = await fetch(`/api/locations/search?q=${encodeURIComponent(fallbackQuery)}`);
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (fallbackData.length > 0) {
                data = fallbackData;
                setInfo(`No exact match. Showing closest results for "${fallbackQuery}"...`);
              }
            }
          }

          setSearchResults(data);
        }
      } catch (err) {
        console.error("Debounced search failed:", err);
      }
    }, 600); // 600ms debounce to prevent hitting Nominatim limits

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Sync state and geocode address
  const handleLocationChange = (lat: number, lng: number) => {
    setSelectedLat(parseFloat(lat.toFixed(6)));
    setSelectedLng(parseFloat(lng.toFixed(6)));
    reverseGeocode(lat, lng);
  };

  // Reverse Geocoding using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setReverseGeocoding(true);
    setError("");
    try {
      const res = await fetch(`/api/locations/reverse?lat=${lat}&lon=${lng}`);
      if (!res.ok) throw new Error("Reverse geocoding request failed.");
      
      const data = await res.json();
      if (data && data.display_name) {
        setSelectedAddress(data.display_name);
      } else {
        setSelectedAddress(`Pin Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (err: any) {
      console.error(err);
      setSelectedAddress(`Location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setReverseGeocoding(false);
    }
  };

  // Search Address using Nominatim
  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError("");
    setInfo("");
    setSearchResults([]);

    try {
      let res = await fetch(`/api/locations/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Search request failed.");

      let data = await res.json();

      // Fallback: If no results and query has no spaces and length > 5, try prefix/nearest matching
      if (data.length === 0 && !searchQuery.trim().includes(" ") && searchQuery.trim().length > 5) {
        const prefixLen = searchQuery.trim().length > 8 ? 6 : 5;
        const fallbackQuery = searchQuery.trim().substring(0, prefixLen);
        const fallbackRes = await fetch(`/api/locations/search?q=${encodeURIComponent(fallbackQuery)}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.length > 0) {
            data = fallbackData;
            setInfo(`No exact match. Showing closest results for "${fallbackQuery}"...`);
          }
        }
      }

      setSearchResults(data);
      if (data.length === 0) {
        setError("No locations found matching your search. Try using spaces (e.g. 'gujjar kere').");
      }
    } catch (err: any) {
      setError("Failed to fetch search results. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Select search result
  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setSelectedLat(lat);
    setSelectedLng(lng);
    setSelectedAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery("");

    // Update Map
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 16, { animate: true });
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Choose Shop Location on Map</h3>
        <p>Search, click on the map, or drag the marker to your business location.</p>
      </div>

      {/* Address Search Wrapper for Absolute Dropdown Positioning */}
      <div style={{ position: "relative", width: "100%", zIndex: 10 }}>
        <div className={styles.searchForm}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              placeholder="Search address, landmark, area, pincode..."
              className={styles.searchInput}
            />
          </div>
          <Button type="button" onClick={() => handleSearch()} loading={searching} className={styles.searchBtn}>
            Search
          </Button>
        </div>

        {/* Search Results Dropdown List */}
        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                className={styles.searchResultItem}
                onClick={() => handleSelectResult(result)}
              >
                <span className={styles.resultIcon}>📍</span>
                <span className={styles.resultText}>{result.display_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {info && <div className={styles.infoBanner}>{info}</div>}

      {/* Map Container */}
      <div className={styles.mapWrapper}>
        <div ref={mapContainerRef} className={styles.map} />
      </div>

      {/* Address Details Output */}
      <div className={styles.locationDetails}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Detected Address:</span>
          <span className={styles.detailValue}>
            {reverseGeocoding ? (
              <span className={styles.loadingText}>Reverse geocoding coordinates...</span>
            ) : (
              selectedAddress || "Move the pin to select a location"
            )}
          </span>
        </div>
        <div className={styles.coordinates}>
          <div>
            <span className={styles.coordLabel}>Latitude:</span>
            <code className={styles.coordValue}>{selectedLat}</code>
          </div>
          <div>
            <span className={styles.coordLabel}>Longitude:</span>
            <code className={styles.coordValue}>{selectedLng}</code>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!selectedAddress || reverseGeocoding}
          onClick={() => onConfirm(selectedLat, selectedLng, selectedAddress)}
        >
          Confirm Location
        </Button>
      </div>
    </div>
  );
}
