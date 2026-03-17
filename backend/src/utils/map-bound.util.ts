import { VINH_KHANH_BOUNDS } from '../constants/poi.constants';

export const isWithinVinhKhanhBounds = (latitude: number, longitude: number): boolean => (
  latitude >= VINH_KHANH_BOUNDS.minLat
  && latitude <= VINH_KHANH_BOUNDS.maxLat
  && longitude >= VINH_KHANH_BOUNDS.minLng
  && longitude <= VINH_KHANH_BOUNDS.maxLng
);
