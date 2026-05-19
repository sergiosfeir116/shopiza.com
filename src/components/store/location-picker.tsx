'use client';

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";

type LocationValue = {
  label: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
};

function formatLocationLabel(latitude: number, longitude: number) {
  return `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
}

function requestBrowserLocation() {
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location services are not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        reject(new Error("Location access is required to continue."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  });
}

export async function requestCurrentLocationValue() {
  const position = await requestBrowserLocation();

  return {
    label: formatLocationLabel(position.lat, position.lng),
    latitude: position.lat,
    longitude: position.lng,
    placeId: null,
  } satisfies LocationValue;
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasLocation =
    Boolean(value.label) &&
    value.latitude !== null &&
    value.longitude !== null;

  return (
    <div className="space-y-4 rounded-[28px] border border-[var(--line-soft)] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--navy-950)]">
            Order location
          </p>
          <p className="text-sm leading-7 text-[var(--ink-700)]">
            Use your current device location for this order. If permission has
            not been granted yet, your browser will ask for access when you click
            the button.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          disabled={isLocating}
          onClick={() => {
            setLocationError(null);
            setIsLocating(true);
            void requestCurrentLocationValue()
              .then((currentLocation) => {
                onChange(currentLocation);
              })
              .catch((error) => {
                setLocationError(
                  error instanceof Error
                    ? error.message
                    : "Could not read your current location.",
                );
              })
              .finally(() => {
                setIsLocating(false);
              });
          }}
        >
          <Navigation className="mr-2 h-4 w-4" />
          {isLocating
            ? "Locating..."
            : hasLocation
              ? "Update my current location"
              : "Use my current location"}
        </Button>
      </div>

      {hasLocation ? (
        <div className="rounded-[24px] border border-[rgba(244,71,161,0.14)] bg-[rgba(244,71,161,0.05)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--pink-500)]">
            Selected location
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm font-medium text-[var(--navy-950)]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pink-500)]" />
            <span>{value.label}</span>
          </p>
        </div>
      ) : (
        <p className="rounded-[24px] border border-dashed border-[var(--line-soft)] px-4 py-4 text-sm text-[var(--ink-700)]">
          No location selected yet.
        </p>
      )}

      {locationError ? (
        <p className="rounded-2xl bg-[rgba(214,47,85,0.08)] px-4 py-3 text-sm text-[var(--danger-500)]">
          {locationError}
        </p>
      ) : null}
    </div>
  );
}
