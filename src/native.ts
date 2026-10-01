import { NitroModules } from 'react-native-nitro-modules';
import type { LuxandFaceSDK } from './FaceSDK.nitro';
import type { FaceSDKPlatform } from './FaceSDKPlatform.nitro';

const LuxandFaceSDKNative =
  NitroModules.createHybridObject<LuxandFaceSDK>('LuxandFaceSDK');

export const Platform =
  NitroModules.createHybridObject<FaceSDKPlatform>('FaceSDKPlatform');

export default LuxandFaceSDKNative;
