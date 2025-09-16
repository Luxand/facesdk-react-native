import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';
import RNFS from 'react-native-fs';

export interface FacePosition {

  xc: number;
  yc: number;
  w: number;
  angle: number;

}

export interface Point {

  x: number;
  y: number;

}

export interface Face {

  bbox: { p0: Point; p1: Point };
  features: Point[];

}

export interface NativeFaceImage {

  image: number;
  features: Point[];

}

export interface TrackerID {

  id: number;
  faceID: number;

}

export interface IDSimilarity {

  id: number;
  similarity: number;

}

export interface NativeFunctionResult {

  error: string;
  errorCode: number;

}

export interface VoidResult           { value: {} }
export interface NumberResult         { value: number }
export interface NumbersResult        { value: number[] }
export interface StringResult         { value: string }
export interface StringsResult        { value: string[] }
export interface FacePositionResult   { value: FacePosition }
export interface FacePositionsResult  { value: FacePosition[] }
export interface FaceResult           { value: Face }
export interface FacesResult          { value: Face[] }
export interface FeaturesResult       { value: Point[] }
export interface FaceImageResult      { value: NativeFaceImage }
export interface TrackerIDResult      { value: TrackerID }
export interface IDSimilaritiesResult { value: IDSimilarity[] }

export type NativeFunctionVoidResult           = NativeFunctionResult & { result: VoidResult };
export type NativeFunctionNumberResult         = NativeFunctionResult & { result: NumberResult };
export type NativeFunctionNumbersResult        = NativeFunctionResult & { result: NumbersResult };
export type NativeFunctionStringResult         = NativeFunctionResult & { result: StringResult };
export type NativeFunctionStringsResult        = NativeFunctionResult & { result: StringsResult };
export type NativeFunctionFacePositionResult   = NativeFunctionResult & { result: FacePositionResult };
export type NativeFunctionFacePositionsResult  = NativeFunctionResult & { result: FacePositionsResult };
export type NativeFunctionFaceResult           = NativeFunctionResult & { result: FaceResult };
export type NativeFunctionFacesResult          = NativeFunctionResult & { result: FacesResult };
export type NativeFunctionFeaturesResult       = NativeFunctionResult & { result: FeaturesResult };
export type NativeFunctionFaceImageResult      = NativeFunctionResult & { result: FaceImageResult };
export type NativeFunctionTrackerIDResult      = NativeFunctionResult & { result: TrackerIDResult };
export type NativeFunctionIDSimilaritiesResult = NativeFunctionResult & { result: IDSimilaritiesResult };

export interface Spec extends TurboModule {

  getConstants: () => {
    ERROR:                { [key: string]: number },
    IMAGEMODE:            { [key: string]: number },
    VIDEOCOMPRESSIONTYPE: { [key: string]: number },
    FEATURE:              { [key: string]: number }
  };

  ActivateLibrary(key: string): NativeFunctionVoidResult;
  Initialize(): NativeFunctionVoidResult;
  Finalize(): NativeFunctionVoidResult;
  GetLicenseInfo(): NativeFunctionStringResult;

  CreateEmptyImage(): NativeFunctionNumberResult;
  FreeImage(image: number): NativeFunctionVoidResult;
  LoadImageFromFile(filename: string): NativeFunctionNumberResult;
  LoadImageFromFileWithAlpha(filename: string): NativeFunctionNumberResult;
  SaveImageToFile(filename: string, image: number): NativeFunctionVoidResult;
  SetJpegCompressionQuality(quality: number): NativeFunctionVoidResult;
  GetImageWidth(image: number): NativeFunctionNumberResult;
  GetImageHeight(image: number): NativeFunctionNumberResult;
  LoadImageFromBuffer(buffer: string, width: number, height: number, scanLine: number, imageMode: number): NativeFunctionNumberResult;
  GetImageBufferSize(image: number, imageMode: number): NativeFunctionNumberResult;
  SaveImageToBuffer(image: number, imageMode: number, bufferSize: number): NativeFunctionStringResult;
  LoadImageFromJpegBuffer(buffer: string): NativeFunctionNumberResult;
  LoadImageFromPngBuffer(buffer: string): NativeFunctionNumberResult;
  LoadImageFromPngBufferWithAlpha(buffer: string): NativeFunctionNumberResult;
  CopyImage(image: number): NativeFunctionNumberResult;
  ResizeImage(image: number, ratio: number): NativeFunctionNumberResult;
  RotateImage90(image: number, multiplier: number): NativeFunctionNumberResult;
  RotateImage(image: number, angle: number): NativeFunctionNumberResult;
  RotateImageCenter(image: number, angle: number, x: number, y: number): NativeFunctionNumberResult;
  CopyRect(image: number, x1: number, y1: number, x2: number, y2: number): NativeFunctionNumberResult;
  CopyRectReplicateBorder(image: number, x1: number, y1: number, x2: number, y2: number): NativeFunctionNumberResult;
  MirrorImage(image: number, vertical: boolean): NativeFunctionVoidResult;
  ExtractFaceImage(image: number, features: Point[], width: number, height: number): NativeFunctionFaceImageResult;

  DetectFace(image: number): NativeFunctionFacePositionResult;
  DetectFace2(image: number): NativeFunctionFaceResult;
  DetectMultipleFaces(image: number, maxFaces: number): NativeFunctionFacePositionsResult;
  DetectMultipleFaces2(image: number, maxFaces: number): NativeFunctionFacesResult;
  SetFaceDetectionParameters(handleArbitraryRotations: boolean, determineFaceRotationAngle: boolean, internalResizeWidth: number): NativeFunctionVoidResult;
  SetFaceDetectionThreshold(theshold: number): NativeFunctionVoidResult;
  GetDetectedFaceConfidence(): NativeFunctionNumberResult;
  DetectFacialFeatures(image: number): NativeFunctionFeaturesResult;
  DetectFacialFeaturesInRegion(image: number, position: FacePosition): NativeFunctionFeaturesResult;
  DetectEyes(image: number): NativeFunctionFeaturesResult;
  DetectEyesInRegion(image: number, position: FacePosition): NativeFunctionFeaturesResult;

  GetFaceTemplate(image: number): NativeFunctionStringResult;
  GetFaceTemplate2(image: number): NativeFunctionStringResult;
  GetFaceTemplateInRegion(image: number, position: FacePosition): NativeFunctionStringResult;
  GetFaceTemplateInRegion2(image: number, face: Face): NativeFunctionStringResult;
  GetFaceTemplateUsingFeatures(image: number, features: Point[]): NativeFunctionStringResult;
  GetFaceTemplateUsingEyes(image: number, features: Point[]): NativeFunctionStringResult;

  MatchFaces(template1: string, template2: string): NativeFunctionNumberResult;
  GetMatchingThresholdAtFAR(value: number): NativeFunctionNumberResult;
  GetMatchingThresholdAtFRR(value: number): NativeFunctionNumberResult;

  CreateTracker(): NativeFunctionNumberResult;
  LoadTrackerMemoryFromFile(filename: string): NativeFunctionNumberResult;
  LoadTrackerMemoryFromBuffer(buffer: string): NativeFunctionNumberResult;
  FreeTracker(tracker: number): NativeFunctionVoidResult;
  ClearTracker(tracker: number): NativeFunctionVoidResult;
  SaveTrackerMemoryToFile(tracker: number, filename: string): NativeFunctionVoidResult;
  GetTrackerMemoryBufferSize(tracker: number): NativeFunctionNumberResult;
  SaveTrackerMemoryToBuffer(tracker: number, bufferSize: number): NativeFunctionStringResult;
  SetTrackerParameter(tracker: number, name: string, value: string): NativeFunctionVoidResult;
  SetTrackerMultipleParameters(tracker: number, parameters: string): NativeFunctionNumberResult;
  GetTrackerParameter(tracker: number, name: string, maxSize: number): NativeFunctionStringResult;
  FeedFrame(tracker: number, index: number, image: number, maxFaces: number): NativeFunctionNumbersResult;
  GetTrackerEyes(tracker: number, index: number, id: number): NativeFunctionFeaturesResult;
  GetTrackerFacialFeatures(tracker: number, index: number, id: number): NativeFunctionFeaturesResult;
  GetTrackerFacePosition(tracker: number, index: number, id: number): NativeFunctionFacePositionResult;
  GetTrackerFace(tracker: number, index: number, id: number): NativeFunctionFaceResult;
  LockID(tracker: number, id: number): NativeFunctionVoidResult;
  UnlockID(tracker: number, id: number): NativeFunctionVoidResult;
  PurgeID(tracker: number, id: number): NativeFunctionVoidResult;
  SetName(tracker: number, id: number, name: string): NativeFunctionVoidResult;
  GetName(tracker: number, id: number, maxSize: number): NativeFunctionStringResult;
  GetAllNames(tracker: number, id: number, maxSize: number): NativeFunctionStringResult;
  GetIDReassignment(tracker: number, id: number): NativeFunctionNumberResult;
  GetSimilarIDCount(tracker: number, id: number): NativeFunctionNumberResult;
  GetSimilarIDList(tracker: number, id: number, count: number): NativeFunctionNumbersResult;
  GetTrackerIDsCount(tracker: number): NativeFunctionNumberResult;
  GetTrackerAllIDs(tracker: number, count: number): NativeFunctionNumbersResult;
  GetTrackerFaceIDsCountForID(tracker: number, id: number): NativeFunctionNumberResult;
  GetTrackerFaceIDsForID(tracker: number, id: number, count: number): NativeFunctionNumbersResult;
  GetTrackerIDByFaceID(tracker: number, faceID: number): NativeFunctionNumberResult;
  GetTrackerFaceTemplate(tracker: number, faceID: number): NativeFunctionStringResult;
  GetTrackerFaceImage(tracker: number, faceID: number): NativeFunctionNumberResult;
  SetTrackerFaceImage(tracker: number, faceID: number, image: number): NativeFunctionVoidResult;
  DeleteTrackerFaceImage(tracker: number, faceID: number): NativeFunctionVoidResult;
  TrackerCreateID(tracker: number, faceTemplate: string): NativeFunctionTrackerIDResult;
  AddTrackerFaceTemplate(tracker: number, id: number, faceTemplate: string): NativeFunctionNumberResult;
  DeleteTrackerFace(tracker: number, faceID: number): NativeFunctionVoidResult;
  TrackerMatchFaces(tracker: number, faceTemplate: string, threshold: number, maxSize: number): NativeFunctionIDSimilaritiesResult;
  GetTrackerFacialAttribute(tracker: number, index: number, id: number, name: string, maxSize: number): NativeFunctionStringResult;
  DetectFacialAttributeUsingFeatures(image: number, features: Point[], name: string, maxSize: number): NativeFunctionStringResult;
  GetValueConfidence(values: string, value: string): NativeFunctionNumberResult;

  SetHTTPProxy(address: string, port: number, username: string, password: string): NativeFunctionVoidResult;
  OpenIPVideoCamera(compression: number, url: string, username: string, password: string, timeout: number): NativeFunctionNumberResult;
  CloseVideoCamera(camera: number): NativeFunctionVoidResult;
  GrabFrame(camera: number): NativeFunctionNumberResult;
  InitializeCapturing(): NativeFunctionVoidResult;
  FinalizeCapturing(): NativeFunctionVoidResult;

  SetParameter(name: string, value: string): NativeFunctionVoidResult;
  SetParameters(parameters: string): NativeFunctionNumberResult;

  InitializeIBeta(): NativeFunctionNumberResult;
}

export default TurboModuleRegistry.getEnforcing<Spec>('LuxandFaceSDK');

export async function copyAssetsToCacheDirectory(): Promise<void> {
  const sourceDir = Platform.OS == 'android'
                    ? 'data' 
                    : RNFS.MainBundlePath + '/data';

  const destDir = RNFS.CachesDirectoryPath + '/data';

  const destDirExists = await RNFS.exists(destDir);

  if (!destDirExists)
    await RNFS.mkdir(destDir);

  await copyDirectory(sourceDir, destDir);
};

async function copyDirectory(source: string, destination: string): Promise<void> {
  const files = Platform.OS == 'android'
                ? await RNFS.readDirAssets(source)
                : await RNFS.readDir(source);

  for (const file of files) {
    const sourcePath = file.path;
    const destPath = destination + '/' + file.name;

    if (file.isFile()) {
      if (await RNFS.exists(destPath))
        continue;

      if (Platform.OS === 'android')
        await RNFS.copyFileAssets(sourcePath, destPath);
      else
        await RNFS.copyFile(sourcePath, destPath);
    } else if (file.isDirectory()) {
      if (!await RNFS.exists(destPath))
        await RNFS.mkdir(destPath);

      await copyDirectory(sourcePath, destPath);
    }
  }
}
