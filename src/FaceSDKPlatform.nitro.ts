import type { HybridObject } from 'react-native-nitro-modules';

export interface FaceSDKPlatform extends HybridObject<{
  ios: 'swift';
  android: 'kotlin';
}> {
  readonly documentsDirectory: string;
  readonly cachesDirectory: string;

  /**
   * Copies the bundled `data` directory into the caches directory, skipping files that are already
   * there. The iBeta liveness add-on loads its models from that location.
   */
  prepareIBetaData(): void;
}
