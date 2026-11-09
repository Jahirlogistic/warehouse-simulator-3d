import { create } from 'zustand';

type CameraMode = 'chase' | 'cab' | 'overview';
type SimState = {
  speed: number; forkHeight: number; mastTilt: number; camera: CameraMode;
  carrying: boolean; status: string; distance: number; elapsed: number;
  setTelemetry: (v: Partial<Pick<SimState,'speed'|'forkHeight'|'mastTilt'|'distance'|'elapsed'>>) => void;
  setCamera: (camera: CameraMode) => void; setCarrying: (value: boolean) => void; setStatus: (value: string) => void;
};
export const useSimStore = create<SimState>((set) => ({
  speed: 0, forkHeight: 0, mastTilt: 0, camera: 'chase', carrying: false,
  status: 'Inspecciona el área y acércate al pallet marcado.', distance: 0, elapsed: 0,
  setTelemetry: (v) => set(v), setCamera: (camera) => set({camera}),
  setCarrying: (carrying) => set({carrying}), setStatus: (status) => set({status}),
}));
