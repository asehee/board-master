export const CAMERA_PALETTE = {
  background: '#131313',
  surface: 'rgba(19,19,19,0.9)',
  surfaceStrong: 'rgba(0,0,0,0.45)',
  surfaceChip: 'rgba(53,53,52,0.9)',
  borderSoft: 'rgba(255,255,255,0.12)',
  primaryContainer: '#ff6b00',
  onPrimaryContainer: '#351000',
  onSurface: '#e5e2e1',
  onSurfaceDim: 'rgba(229,226,225,0.7)',
  live: '#22c55e',
} as const;

export type CameraFlashMode = 'off' | 'on';
