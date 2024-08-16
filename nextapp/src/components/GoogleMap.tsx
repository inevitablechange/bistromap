import { useEffect, useRef, useMemo } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface MapProps {
  address: string;
}

const GoogleMap = ({ address }: MapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  const geocoder = useMemo(() => {
    // google 객체가 글로벌 환경에서 존재하는지 확인
    if (typeof google !== "undefined") {
      return new google.maps.Geocoder();
    }
    return null;
  }, []);

  useEffect(() => {
    if (!geocoder) {
      console.error("Geocoder is not available");
      return;
    }

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
      version: "weekly",
    });

    loader.load().then(() => {
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const map = new google.maps.Map(mapRef.current as HTMLElement, {
            center: results[0].geometry.location,
            zoom: 8,
          });

          new google.maps.Marker({
            map: map,
            position: results[0].geometry.location,
          });
        } else {
          console.error(
            `Geocode was not successful for the following reason: ${status}`
          );
        }
      });
    });
  }, [address, geocoder]);

  return <div style={{ height: "400px" }} ref={mapRef} />;
};

export default GoogleMap;
