export type ResolveOrientationInput = {
  exifOrientation?: number;
  cameraWidth?: number;
  cameraHeight?: number;
  screenWidth: number;
  screenHeight: number;
};

export type ResolveOrientationDebug = {
  exifOrientation: number;
  cameraWidth: number;
  cameraHeight: number;
  fallbackByScreen: boolean;
};

export function parseOptionalNumber(value?: string): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function resolveIsLandscape(input: ResolveOrientationInput): boolean {
  const exif = input.exifOrientation ?? 0;
  const camW = input.cameraWidth ?? 0;
  const camH = input.cameraHeight ?? 0;

  // EXIF orientation:
  // 6/8: portrait display in most phone-capture cases.
  // 1/3: landscape display.
  if (exif === 6 || exif === 8) return false;
  if (exif === 1 || exif === 3) return true;

  if (camW > 0 && camH > 0) {
    if (camW === camH) return input.screenWidth > input.screenHeight;
    return camW > camH;
  }

  return input.screenWidth > input.screenHeight;
}

export function getOrientationDebug(input: ResolveOrientationInput): ResolveOrientationDebug {
  const exif = input.exifOrientation ?? 0;
  const camW = input.cameraWidth ?? 0;
  const camH = input.cameraHeight ?? 0;
  const fallbackByScreen = exif === 0 && (camW <= 0 || camH <= 0 || camW === camH);

  return {
    exifOrientation: exif,
    cameraWidth: camW,
    cameraHeight: camH,
    fallbackByScreen,
  };
}
