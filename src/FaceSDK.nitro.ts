import type { HybridObject } from 'react-native-nitro-modules';

export interface Point {
  x: number;
  y: number;
}

export interface FaceBBox {
  p0: Point;
  p1: Point;
}

export interface Face {
  score: number;
  angle: number;
  bbox: FaceBBox;
  features: Point[];
}

export interface FaceImage {
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

export interface FramePlane {
  buffer: ArrayBuffer;
  bytesPerRow: number;
  pixelStride: number;
}

/**
 * Every binding returns the SDK's error code alongside its value, rather than throwing. The TS
 * layer decides what to do with it (`ON_ERROR`: silent, alert or throw).
 *
 * `value` is meaningless when `errorCode` is not `OK`; it holds a type-appropriate default.
 */
export interface VoidResult {
  error: string;
  errorCode: number;
}

export interface NumberResult {
  error: string;
  errorCode: number;
  value: number;
}

export interface NumbersResult {
  error: string;
  errorCode: number;
  value: number[];
}

export interface StringResult {
  error: string;
  errorCode: number;
  value: string;
}

export interface BufferResult {
  error: string;
  errorCode: number;
  value: ArrayBuffer;
}

export interface FaceResult {
  error: string;
  errorCode: number;
  value: Face;
}

export interface FacesResult {
  error: string;
  errorCode: number;
  value: Face[];
}

export interface FeaturesResult {
  error: string;
  errorCode: number;
  value: Point[];
}

export interface FaceImageResult {
  error: string;
  errorCode: number;
  value: FaceImage;
}

export interface TrackerIDResult {
  error: string;
  errorCode: number;
  value: TrackerID;
}

export interface IDSimilaritiesResult {
  error: string;
  errorCode: number;
  value: IDSimilarity[];
}

/**
 * The native FaceSDK binding, implemented once in C++ and shared by both platforms.
 *
 * Callable from a worklet runtime as well as the main JS runtime, because Nitro HybridObjects are
 * runtime-agnostic.
 *
 * Image, tracker and camera handles are plain numbers, as they are in the SDK itself. Byte buffers
 * (face templates, tracker memory, encoded images) cross as `ArrayBuffer`.
 */
export interface LuxandFaceSDK extends HybridObject<{
  ios: 'c++';
  android: 'c++';
}> {
  readonly ERROR: Record<string, number>;
  readonly IMAGEMODE: Record<string, number>;
  readonly VIDEOCOMPRESSIONTYPE: Record<string, number>;
  readonly FEATURE: Record<string, number>;

  // Initialization

  ActivateLibrary(key: string): VoidResult;
  Initialize(): VoidResult;
  Finalize(): VoidResult;
  GetLicenseInfo(): StringResult;
  GetVersionInfo(): StringResult;
  SetNumThreads(count: number): VoidResult;
  GetNumThreads(): NumberResult;

  // Images

  CreateEmptyImage(): NumberResult;
  FreeImage(image: number): VoidResult;
  LoadImageFromFile(filename: string): NumberResult;
  LoadImageFromFileWithAlpha(filename: string): NumberResult;
  SaveImageToFile(filename: string, image: number): VoidResult;
  SetJpegCompressionQuality(quality: number): VoidResult;
  GetImageWidth(image: number): NumberResult;
  GetImageHeight(image: number): NumberResult;
  LoadImageFromBuffer(
    buffer: ArrayBuffer,
    width: number,
    height: number,
    scanLine: number,
    imageMode: number
  ): NumberResult;
  GetImageBufferSize(image: number, imageMode: number): NumberResult;
  SaveImageToBuffer(
    image: number,
    imageMode: number,
    bufferSize: number
  ): BufferResult;
  LoadImageFromFrame(
    planes: FramePlane[],
    pixelFormat: string,
    width: number,
    height: number
  ): NumberResult;
  LoadImageFromJpegBuffer(buffer: ArrayBuffer): NumberResult;
  LoadImageFromPngBuffer(buffer: ArrayBuffer): NumberResult;
  LoadImageFromPngBufferWithAlpha(buffer: ArrayBuffer): NumberResult;
  CopyImage(image: number): NumberResult;
  ResizeImage(image: number, ratio: number): NumberResult;
  RotateImage90(image: number, multiplier: number): NumberResult;
  RotateImage(image: number, angle: number): NumberResult;
  RotateImageCenter(
    image: number,
    angle: number,
    x: number,
    y: number
  ): NumberResult;
  CopyRect(
    image: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): NumberResult;
  CopyRectReplicateBorder(
    image: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): NumberResult;
  MirrorImage(image: number, vertical: boolean): VoidResult;
  ExtractFaceImage(
    image: number,
    features: Point[],
    width: number,
    height: number
  ): FaceImageResult;

  // Detection

  DetectFace(image: number): FaceResult;
  DetectMultipleFaces(image: number, maxFaces: number): FacesResult;
  DetectFacialFeatures(image: number): FeaturesResult;
  DetectFacialFeaturesInRegion(image: number, face: Face): FeaturesResult;

  // Templates and matching

  GetFaceTemplate(image: number): BufferResult;
  GetFaceTemplateInRegion(image: number, face: Face): BufferResult;
  MatchFaces(template1: ArrayBuffer, template2: ArrayBuffer): NumberResult;

  // Tracker

  CreateTracker(): NumberResult;
  LoadTrackerMemoryFromFile(filename: string): NumberResult;
  LoadTrackerMemoryFromBuffer(buffer: ArrayBuffer): NumberResult;
  FreeTracker(tracker: number): VoidResult;
  ClearTracker(tracker: number): VoidResult;
  SaveTrackerMemoryToFile(tracker: number, filename: string): VoidResult;
  GetTrackerMemoryBufferSize(tracker: number): NumberResult;
  SaveTrackerMemoryToBuffer(tracker: number, bufferSize: number): BufferResult;
  SetTrackerParameter(
    tracker: number,
    name: string,
    value: string
  ): VoidResult;
  SetTrackerMultipleParameters(
    tracker: number,
    parameters: string
  ): NumberResult;
  GetTrackerParameter(
    tracker: number,
    name: string,
    maxSize: number
  ): StringResult;
  FeedFrame(
    tracker: number,
    index: number,
    image: number,
    maxFaces: number
  ): NumbersResult;
  GetTrackerFacialFeatures(
    tracker: number,
    index: number,
    id: number
  ): FeaturesResult;
  GetTrackerEyes(tracker: number, index: number, id: number): FeaturesResult;
  GetTrackerFace(tracker: number, index: number, id: number): FaceResult;
  LockID(tracker: number, id: number): VoidResult;
  UnlockID(tracker: number, id: number): VoidResult;
  PurgeID(tracker: number, id: number): VoidResult;
  SetName(tracker: number, id: number, name: string): VoidResult;
  GetName(tracker: number, id: number, maxSize: number): StringResult;
  GetAllNames(tracker: number, id: number, maxSize: number): StringResult;
  GetIDReassignment(tracker: number, id: number): NumberResult;
  GetSimilarIDCount(tracker: number, id: number): NumberResult;
  GetSimilarIDList(tracker: number, id: number, count: number): NumbersResult;
  GetTrackerIDsCount(tracker: number): NumberResult;
  GetTrackerAllIDs(tracker: number, count: number): NumbersResult;
  GetTrackerFaceIDsCountForID(tracker: number, id: number): NumberResult;
  GetTrackerFaceIDsForID(
    tracker: number,
    id: number,
    count: number
  ): NumbersResult;
  GetTrackerIDByFaceID(tracker: number, faceID: number): NumberResult;
  GetTrackerFaceTemplate(tracker: number, faceID: number): BufferResult;
  GetTrackerFaceImage(tracker: number, faceID: number): NumberResult;
  SetTrackerFaceImage(
    tracker: number,
    faceID: number,
    image: number
  ): VoidResult;
  DeleteTrackerFaceImage(tracker: number, faceID: number): VoidResult;
  TrackerCreateID(tracker: number, faceTemplate: ArrayBuffer): TrackerIDResult;
  AddTrackerFaceTemplate(
    tracker: number,
    id: number,
    faceTemplate: ArrayBuffer
  ): NumberResult;
  DeleteTrackerFace(tracker: number, faceID: number): VoidResult;
  TrackerMatchFaces(
    tracker: number,
    faceTemplate: ArrayBuffer,
    threshold: number,
    maxSize: number
  ): IDSimilaritiesResult;

  // Attributes

  GetTrackerFacialAttribute(
    tracker: number,
    index: number,
    id: number,
    name: string,
    maxSize: number
  ): StringResult;
  DetectFacialAttributeUsingFeatures(
    image: number,
    features: Point[],
    name: string,
    maxSize: number
  ): StringResult;
  DetectFacialAttributeUsingFace(
    image: number,
    face: Face,
    name: string,
    maxSize: number
  ): StringResult;
  GetValueConfidence(values: string, value: string): NumberResult;

  // Camera

  SetHTTPProxy(
    address: string,
    port: number,
    username: string,
    password: string
  ): VoidResult;
  OpenIPVideoCamera(
    compression: number,
    url: string,
    username: string,
    password: string,
    timeout: number
  ): NumberResult;
  CloseVideoCamera(camera: number): VoidResult;
  GrabFrame(camera: number): NumberResult;
  InitializeCapturing(): VoidResult;
  FinalizeCapturing(): VoidResult;

  // Parameters

  SetParameter(name: string, value: string): VoidResult;
  SetParameters(parameters: string): NumberResult;
}
