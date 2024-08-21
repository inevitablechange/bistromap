import React, { FC, useRef, useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Button, Flex, Input } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";

interface Location {
  lng: number;
  lat: number;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

const initialCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

interface GoogleMapsProps {
  onLocationSelect: (location: string) => void;
}

const GoogleMaps: FC<GoogleMapsProps> = ({ onLocationSelect }) => {
  const [mapCenter, setMapCenter] = useState(initialCenter); // 지도의 중심 좌표 상태
  const [searchInput, setSearchInput] = useState<string>(""); // 검색어 상태
  const [markerPosition, setMarkerPosition] = useState<any>(null); // 마커 위치 상태
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>(""); // 선택된 장소 이름 상태
  const mapRef = useRef<any>(null);
  const searchBoxRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  const { register, setValue } = useFormContext();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, // API 키 입력
    libraries: ["places"], // Places 라이브러리 추가
  });

  const onLoad = (map: any) => {
    mapRef.current = map;
  };

  const onUnmount = () => {
    mapRef.current = null;
  };

  const setLocationValue = ({ lat, lng }: Location) => {
    setValue("location.lat", lat);
    setValue("location.lng", lng);
  };

  const handleMapClick = async (event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setLocationValue({ lat, lng });
    // Google Geocoding API를 사용하여 클릭한 좌표의 주소 가져오기
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    const address = data.results[0]?.formatted_address || "Unknown location";

    console.log(data);
    // 선택된 주소를 부모 컴포넌트로 전달
    onLocationSelect(address);
  };

  const handleSearch = () => {
    if (mapRef.current && searchInput) {
      const service = new window.google.maps.places.PlacesService(
        mapRef.current
      );
      const request = {
        query: searchInput,
        fields: ["geometry", "formatted_address", "name"], // 'name' 필드 추가
      };

      service.textSearch(request, (results: any, status: any) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results.length > 0
        ) {
          const location = results[0].geometry.location;
          const address = results[0].formatted_address;
          const placeName = results[0].name; // 검색된 장소 이름

          // 지도 중심을 검색된 장소의 좌표로 이동
          setLocationValue({ lat: location.lat(), lng: location.lng() });
          setMapCenter({
            lat: location.lat(),
            lng: location.lng(),
          });

          // 마커 위치와 장소 이름을 저장
          setMarkerPosition({
            lat: location.lat(),
            lng: location.lng(),
          });
          setSelectedPlaceName(placeName);
        } else {
          alert("Address not found");
        }
      });
    }
  };

  useEffect(() => {
    if (isLoaded && searchBoxRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchBoxRef.current,
        {
          types: ["geocode"], // 자동완성 유형 (geocode, address 등)
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (place.geometry) {
          const location = place.geometry.location!;
          const address = place.formatted_address;

          // 지도 중심을 검색된 장소의 좌표로 이동
          setMapCenter({
            lat: location.lat(),
            lng: location.lng(),
          });
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [isLoaded]);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  return isLoaded ? (
    <Flex flexDir={"column"}>
      {/* 주소 검색 필드 */}
      <Flex>
        <Input
          ref={searchBoxRef} // Autocomplete와 연결된 Input 필드
          type="text"
          placeholder="Search for a place"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </Flex>
      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter} // 검색된 좌표로 이동
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        <input type="text" {...register("location")} />
        {/* Marker 표시 */}
        {markerPosition && (
          <Marker
            position={markerPosition}
            onClick={() => {
              // 마커 클릭 시 장소 이름을 부모 컴포넌트로 전달
              onLocationSelect(selectedPlaceName);
            }}
          />
        )}
      </GoogleMap>
    </Flex>
  ) : (
    <Flex>Loading...</Flex>
  );
};

export default GoogleMaps;
