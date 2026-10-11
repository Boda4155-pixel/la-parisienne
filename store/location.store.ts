import { create } from 'zustand';
export type SelectedLocation = {
  label: string;
  street: string;
  fullAddress: string;
  lat: number;
  lng: number;
  city: string;
  area: string;
  district?: string;
}
type Store = {
  selected: SelectedLocation | null;
  setSelected: (l: SelectedLocation) => void;
  isLocating: boolean;
  setIsLocating: (v:boolean)=>void;
}
export const useLocationStore = create<Store>((set)=> ({
  selected: null,
  isLocating: true,
  setIsLocating: (v)=> set({ isLocating: v }),
  setSelected: (s)=> set({ selected: s, isLocating: false }),
}));