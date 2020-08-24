///<reference path="google.maps.d.ts" />

declare module google.maps {
    interface GeocoderRequest {
        latLng?: google.maps.LatLng
    }
}