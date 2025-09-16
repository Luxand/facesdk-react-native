import { Alert } from 'react-native';

import LuxandFaceSDK, {
  type Face,
  type FaceImageResult,
  type FacePosition,
  type IDSimilarity,
  type NativeFunctionNumberResult,
  type NativeFunctionResult,
  type Point,
  type TrackerID
} from './NativeFaceSDK';

import {
  ERROR,
  IMAGEMODE,
  ON_ERROR,
  VIDEOCOMPRESSIONTYPE,
  type FacialAttribute,
  type Parameter,
  type Parameters,
  type ParameterValue,
  type TrackerFacialAttribute,
  type TrackerParameter,
  type TrackerParameters
} from './definitions';

import { getParametersString } from './utils';

import { VisionCameraProxy, type Frame, type FrameProcessorPlugin } from 'react-native-vision-camera';
import { Worklets, type ISharedValue } from 'react-native-worklets-core';

export interface FaceImage {

  image: number;
  features: Point[];

}

var alert: (msg: string) => Promise<void>;
if (Worklets !== undefined)
  alert = Worklets.createRunOnJS((msg: string) => Alert.alert('FaceSDK Error', msg));

var onError: ISharedValue<ON_ERROR>;
if (Worklets !== undefined)
  onError = Worklets.createSharedValue<number>(ON_ERROR.THROW);

function executeSDKFunction<P extends any[], T, V extends Record<string, any>>(func: (...args: P) => NativeFunctionResult & { result: V }, funcName: string, processor: (a?: V) => T, ...args: P): T {
  'worklet'
  const result = func(...args);
  const errorCode = result.errorCode;

  if (errorCode === ERROR.OK)
    return processor(result.result);

  if (onError.value == ON_ERROR.SILENT)
    return processor === returnErrorPosition ? processor(result.result) : processor();

  var msg = `Fuction FSDK.${funcName} failed with error ${result.error}: ${errorCode}.\nArguments were ${JSON.stringify(args)}.\nResult was ${JSON.stringify(result.result)}`;
  if (errorCode == -2)
    msg += '\nPlease call FSDK.ActivateLibrary(yourLicenseKey) before using any other function.';

  if (onError.value == ON_ERROR.ALERT) {
    alert(msg);
    return processor === returnErrorPosition ? processor(result.result) : processor();
  }

  if (onError.value == ON_ERROR.THROW)
    throw new Error(msg);

  throw new Error(`Unknown ON_ERROR value ${onError.value}`);
}

function returnVoid(_: {} = {}): void {
  'worklet'

  return;
}

function returnFaceImage(result: FaceImageResult = { value : { image: -1, features: [] } }): FaceImage {
  'worklet'

  return {
      image: result.value.image,
      features: result.value.features
  };
}

function returnDefault<T>(defaultValue: T): (result?: { value: T }) => T {
  return (result?: { value: T }) => {
    'worklet'

    if (result === null || result === undefined)
      return defaultValue;

    return result.value;
  }
}


const emptyPoint: Point = { x: 0, y: 0 };
const emptyFacePosition: FacePosition = { xc: 0, yc: 0, w: 0, angle: 0 };
const emptyFace: Face = { bbox: { p0: emptyPoint, p1: emptyPoint }, features: Array(5).fill(emptyPoint) };
const emptyTrackerID: TrackerID = { id: -1, faceID: -1 };

const returnZero           = returnDefault(0);
const returnNegativeOne    = returnDefault(-1);
const returnEmptyString    = returnDefault('');
const returnFacePosition   = returnDefault(emptyFacePosition);
const returnFacePositions  = returnDefault<FacePosition[]>([]);
const returnFace           = returnDefault(emptyFace);
const returnFaces          = returnDefault<Face[]>([]);
const returnFeatures       = returnDefault<Point[]>([]);
const returnIDs            = returnDefault<number[]>([]);
const returnTrackerID      = returnDefault(emptyTrackerID);
const returnIDSimilarities = returnDefault<IDSimilarity[]>([]);
const returnErrorPosition  = returnDefault<number>(0);

var frameToFSDKImagePlugin: FrameProcessorPlugin | undefined;
if (VisionCameraProxy !== undefined)
  frameToFSDKImagePlugin = VisionCameraProxy.initFrameProcessorPlugin('frameToFSDKImage', {});

export function frameToFSDKImage(frame: Frame): NativeFunctionNumberResult {
  'worklet'

  if (frameToFSDKImagePlugin === undefined)
    return { error: 'Could not load frameToFSDKImage plugin', errorCode: 1, result: { value: -1 } }

  const result = frameToFSDKImagePlugin.call(frame);
  if (result === undefined          ||
      typeof result === 'number'    ||
      typeof result === 'string'    ||
      typeof result === 'boolean'   ||
      result instanceof ArrayBuffer ||
      result instanceof Array)
    return { error: `Unsupported value returned from FrameToFSDKImage plugin: ${JSON.stringify(result)}`, errorCode: 1, result: { value: -1 } };

  const error = result['error'];
  if (typeof error !== 'string')
    return { error: `Unsupported value returned for 'error' from FrameToFSDKImage plugin: ${JSON.stringify(error)}`, errorCode: 1, result: { value: -1 } };

  const errorCode = result['errorCode'];
  if (typeof errorCode !== 'number')
    return { error: `Unsupported value returned for 'errorCode' from FrameToFSDKImage plugin: ${JSON.stringify(error)}`, errorCode: 1, result: { value: -1 } };

  const handle = result['handle'];
  if (typeof handle !== 'number')
    return { error: `Unsupported value returned for 'handle' from FrameToFSDKImage plugin: ${JSON.stringify(error)}`, errorCode: 1, result: { value: -1 } };

  return {
    error: error,
    errorCode: errorCode,
    result: {
      value: handle
    }
  };
}

export default class FSDK {

  public static SetOnError(value: ON_ERROR): void {
    onError.value = value;
  }

  public static ActivateLibrary(licenseKey: string): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.ActivateLibrary, 'ActivateLibrary', returnVoid, licenseKey);
  }

  public static Initialize(): void {
    'worklet'
    LuxandFaceSDK.SetParameter('environment', 'React-Native');
    return executeSDKFunction(LuxandFaceSDK.Initialize, 'Initialize', returnVoid);
  }

  public static ActivateAndInitalize(licenseKey: string): void {
    'worklet'
    this.ActivateLibrary(licenseKey);
    return this.Initialize();
  }

  public static GetLicenseInfo(): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetLicenseInfo, 'GetLicenseInfo', returnEmptyString);
  }

  public static CreateEmptyImage(): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.CreateEmptyImage, 'CreateEmptyImage', returnNegativeOne);
  }

  public static FreeImage(image: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.FreeImage, 'FreeImage', returnVoid, image);
  }

  public static LoadImageFromFile(filename: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromFile, 'LoadImageFromFile', returnNegativeOne, filename);
  }

  public static LoadImageFromFileWithAlpha(filename: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromFileWithAlpha, 'LoadImageFromFileWithAlpha', returnNegativeOne, filename);
  }

  public static LoadImageFromBuffer(buffer: string, width: number, height: number, scanLine: number, imageMode: IMAGEMODE): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromBuffer, 'LoadImageFromBuffer', returnNegativeOne, buffer, width, height, scanLine, imageMode);
  }

  public static LoadImageFromJpegBuffer(buffer: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromJpegBuffer, 'LoadImageFromJpegBuffer', returnNegativeOne, buffer);
  }

  public static LoadImageFromPngBuffer(buffer: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromPngBuffer, 'LoadImageFromPngBuffer', returnNegativeOne, buffer);
  }

  public static LoadImageFromPngBufferWithAlpha(buffer: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromPngBufferWithAlpha, 'LoadImageFromPngBufferWithAlpha', returnNegativeOne, buffer);
  }

  public static LoadImageFromFrame(frame: Frame): number {
    'worklet'
    return executeSDKFunction(frameToFSDKImage, 'frameToFSDKImage', returnNegativeOne, frame);
  }

  public static SaveImageToFile(image: number, filename: string): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SaveImageToFile, 'SaveImageToFile', returnVoid, filename, image);
  }

  public static SetJpegCompressionQuality(quality: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetJpegCompressionQuality, 'SetJpegCompressionQuality', returnVoid, quality);
  }

  public static GetImageWidth(image: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetImageWidth, 'GetImageWidth', returnZero, image);
  }

  public static GetImageHeight(image: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetImageHeight, 'GetImageHeight', returnZero, image);
  }

  public static GetImageBufferSize(image: number, imageMode: IMAGEMODE): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetImageBufferSize, 'GetImageBufferSize', returnZero, image, imageMode);
  }

  public static SaveImageToBuffer(image: number, imageMode: IMAGEMODE): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SaveImageToBuffer, 'SaveImageToBuffer', returnEmptyString, image, imageMode, this.GetImageBufferSize(image, imageMode));
  }

  public static CopyImage(image: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.CopyImage, 'CopyImage', returnNegativeOne, image);
  }

  public static ResizeImage(image: number, ratio: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.ResizeImage, 'ResizeImage', returnNegativeOne, image, ratio);
  }

  public static RotateImage90(image: number, multiplier: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.RotateImage90, 'RotateImage90', returnNegativeOne, image, multiplier);
  }

  public static RotateImage(image: number, angle: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.RotateImage, 'RotateImage', returnNegativeOne, image, angle);
  }

  public static RotateImageCenter(image: number, angle: number, x: number, y: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.RotateImageCenter, 'RotateImageCenter', returnNegativeOne, image, angle, x, y);
  }

  public static CopyRect(image: number, x1: number, y1: number, x2: number, y2: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.CopyRect, 'CopyRect', returnNegativeOne, image, x1, y1, x2, y2);
  }

  public static CopyRectReplicateBorder(image: number, x1: number, y1: number, x2: number, y2: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.CopyRectReplicateBorder, 'CopyRectReplicateBorder', returnNegativeOne, image, x1, y1, x2, y2);
  }

  public static MirrorImage(image: number, vertical: boolean = true): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.MirrorImage, 'MirrorImage', returnVoid, image, vertical);
  }

  public static ExtractFaceImage(image: number, features: Point[], width: number, height: number): FaceImage {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.ExtractFaceImage, 'ExtractFaceImage', returnFaceImage, image, features, width, height);
  }

  public static DetectFace(image: number): FacePosition {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectFace, 'DetectFace', returnFacePosition, image);
  }

  public static DetectFace2(image: number): Face {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectFace2, 'DetectFace2', returnFace, image);
  }

  public static DetectMultipleFaces(image: number, maxFaces: number = 100): FacePosition[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectMultipleFaces, 'DetectMultipleFaces', returnFacePositions, image, maxFaces);
  }

  public static DetectMultipleFaces2(image: number, maxFaces: number = 100): Face[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectMultipleFaces2, 'DetectMultipleFaces2', returnFaces, image, maxFaces);
  }

  public static SetFaceDetectionParameters(handleArbitraryRotations: boolean, determineFaceRotationAngle: boolean, internalResizeWidth: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetFaceDetectionParameters, 'SetFaceDetectionParameters', returnVoid, handleArbitraryRotations, determineFaceRotationAngle, internalResizeWidth);
  }

  public static SetFaceDetectionThreshold(threshold: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetFaceDetectionThreshold, 'SetFaceDetectionThreshold', returnVoid, threshold);
  }

  public static GetDetectedFaceConfidence(): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetDetectedFaceConfidence, 'GetDetectedFaceConfidence', returnZero);
  }

  public static DetectFacialFeatures(image: number): Point[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectFacialFeatures, 'DetectFacialFeatures', returnFeatures, image);
  }

  public static DetectFacialFeaturesInRegion(image: number, position: FacePosition): Point[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectFacialFeaturesInRegion, 'DetectFacialFeaturesInRegion', returnFeatures, image, position);
  }

  public static DetectEyes(image: number): Point[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectEyes, 'DetectEyes', returnFeatures, image);
  }

  public static DetectEyesInRegion(image: number, position: FacePosition): Point[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectEyesInRegion, 'DetectEyesInRegion', returnFeatures, image, position);
  }

  public static GetFaceTemplate(image: number): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplate, 'GetFaceTemplate', returnEmptyString, image);
  }

  public static GetFaceTemplate2(image: number): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplate2, 'GetFaceTemplate2', returnEmptyString, image);
  }

  public static GetFaceTemplateInRegion(image: number, position: FacePosition): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateInRegion, 'GetFaceTemplateInRegion', returnEmptyString, image, position);
  }

  public static GetFaceTemplateInRegion2(image: number, face: Face): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateInRegion2, 'GetFaceTemplateInRegion2', returnEmptyString, image, face);
  }

  public static GetFaceTemplateUsingFeatures(image: number, features: Point[]): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateUsingFeatures, 'GetFaceTemplateUsingFeatures', returnEmptyString, image, features);
  }

  public static GetFaceTemplateUsingEyes(image: number, eyes: Point[]): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateUsingEyes, 'GetFaceTemplateUsingEyes', returnEmptyString, image, eyes);
  }

  public static MatchFaces(template1: string, template2: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.MatchFaces, 'MatchFaces', returnZero, template1, template2);
  }

  public static GetMatchingThresholdAtFAR(far: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetMatchingThresholdAtFAR, 'GetMatchingThresholdAtFAR', returnZero, far);
  }

  public static GetMatchingThresholdAtFRR(frr: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetMatchingThresholdAtFRR, 'GetMatchingThresholdAtFRR', returnZero, frr);
  }

  public static CreatTracker(): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.CreateTracker, 'CreateTracker', returnNegativeOne);
  }

  public static LoadTrackerMemoryFromFile(filename: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadTrackerMemoryFromFile, 'LoadTrackerMemoryFromFile', returnNegativeOne, filename);
  }

  public static LoadTrackerMemoryFromBuffer(buffer: string): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LoadTrackerMemoryFromBuffer, 'LoadTrackerMemoryFromBuffer', returnNegativeOne, buffer);
  }

  public static FreeTracker(tracker: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.FreeTracker, 'FreeTracker', returnVoid, tracker);
  }

  public static ClearTracker(tracker: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.ClearTracker, 'ClearTracker', returnVoid, tracker);
  }

  public static SaveTrackerMemoryToFile(tracker: number, filename: string): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SaveTrackerMemoryToFile, 'SaveTrackerMemoryToFile', returnVoid, tracker, filename);
  }

  public static GetTrackerMemoryBufferSize(tracker: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerMemoryBufferSize, 'GetTrackerMemoryBufferSize', returnZero, tracker);
  }

  public static SaveTrackerMemoryToBuffer(tracker: number): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SaveTrackerMemoryToBuffer, 'SaveTrackerMemoryToBuffer', returnEmptyString, tracker, this.GetTrackerMemoryBufferSize(tracker));
  }

  public static SetTrackerParameter(tracker: number, name: TrackerParameter, value: ParameterValue): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetTrackerParameter, 'SetTrackerParameter', returnVoid, tracker, name, value.toString());
  }

  public static SetTrackerMultipleParameters<T extends TrackerParameter>(tracker: number, parameters: string | TrackerParameters<T>): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetTrackerMultipleParameters, 'SetTrackerMultipleParameters', returnNegativeOne, tracker, getParametersString(parameters));
  }

  public static GetTrackerParameter(tracker: number, name: TrackerParameter, maxSize: number = 100): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerParameter, 'GetTrackerParameter', returnEmptyString, tracker, name, maxSize);
  }

  public static FeedFrame(tracker: number, image: number, maxFaces: number = 256, index: number = 0): number[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.FeedFrame, 'FeedFrame', returnIDs, tracker, index, image, maxFaces);
  }

  public static GetTrackerEyes(tracker: number, id: number, index: number = 0): Point[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerEyes, 'GetTrackerEyes', returnFeatures, tracker, index, id);
  }

  public static GetTrackerFacialFeatures(tracker: number, id: number, index: number = 0): Point[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFacialFeatures, 'GetTrackerFacialFeatures', returnFeatures, tracker, index, id);
  }

  public static GetTrackerFacePosition(tracker: number, id: number, index: number = 0): FacePosition {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFacePosition, 'GetTrackerFacePosition', returnFacePosition, tracker, index, id);
  }

  public static GetTrackerFace(tracker: number, id: number, index: number = 0): Face {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFace, 'GetTrackerFace', returnFace, tracker, index, id);
  }

  public static LockID(tracker: number, id: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.LockID, 'LockID', returnVoid, tracker, id);
  }

  public static UnlockID(tracker: number, id: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.UnlockID, 'UnlockID', returnVoid, tracker, id);
  }

  public static PurgeID(tracker: number, id: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.PurgeID, 'PurgeID', returnVoid, tracker, id);
  }

  public static SetName(tracker: number, id: number, name: string): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetName, 'SetName', returnVoid, tracker, id, name);
  }

  public static GetName(tracker: number, id: number, maxSize: number = 256): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetName, 'GetName', returnEmptyString, tracker, id, maxSize);
  }

  public static GetAllNames(tracker: number, id: number, maxSize: number = 256): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetAllNames, 'GetAllNames', returnEmptyString, tracker, id, maxSize);
  }

  public static GetIDReassignment(tracker: number, id: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetIDReassignment, 'GetIDReassignment', returnNegativeOne, tracker, id);
  }

  public static GetSimilarIDCount(tracker: number, id: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetSimilarIDCount, 'GetSimilarIDCount', returnZero, tracker, id);
  }

  public static GetSimilarIDList(tracker: number, id: number): number[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetSimilarIDList, 'GetSimilarIDList', returnIDs, tracker, id, this.GetSimilarIDCount(tracker, id));
  }

  public static GetTrackerIDsCount(tracker: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerIDsCount, 'GetTrackerIDsCount', returnZero, tracker);
  }

  public static GetTrackerAllIDs(tracker: number): number[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerAllIDs, 'GetTrackerAllIDs', returnIDs, tracker, this.GetTrackerIDsCount(tracker));
  }

  public static GetTrackerFaceIDsCountForID(tracker: number, id: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceIDsCountForID, 'GetTrackerFaceIDsCountForID', returnZero, tracker, id);
  }

  public static GetTrackerFaceIDsForID(tracker: number, id: number): number[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceIDsForID, 'GetTrackerFaceIDsForID', returnIDs, tracker, id, this.GetTrackerFaceIDsCountForID(tracker, id));
  }

  public static GetTrackerIDByFaceID(tracker: number, faceID: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerIDByFaceID, 'GetTrackerIDByFaceID', returnNegativeOne, tracker, faceID);
  }

  public static GetTrackerFaceTemplate(tracker: number, faceID: number): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceTemplate, 'GetTrackerFaceTemplate', returnEmptyString, tracker, faceID);
  }

  public static GetTrackerFaceImage(tracker: number, faceID: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceImage, 'GetTrackerFaceImage', returnNegativeOne, tracker, faceID);
  }

  public static SetTrackerFaceImage(tracker: number, faceID: number, image: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetTrackerFaceImage, 'SetTrackerFaceImage', returnVoid, tracker, faceID, image);
  }

  public static DeleteTrackerFaceImage(tracker: number, faceID: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DeleteTrackerFaceImage, 'DeleteTrackerFaceImage', returnVoid, tracker, faceID);
  }

  public static TrackerCreateID(tracker: number, template: string): TrackerID {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.TrackerCreateID, 'TrackerCreateID', returnTrackerID, tracker, template);
  }

  public static AddTrackerFaceTemplate(tracker: number, id: number, template: string): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.AddTrackerFaceTemplate, 'AddTrackerFaceTemplate', returnVoid, tracker, id, template);
  }

  public static DeleteTrackerFace(tracker: number, faceID: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DeleteTrackerFace, 'DeleteTrackerFace', returnVoid, tracker, faceID);
  }

  public static TrackerMatchFaces(tracker: number, template: string, threshold: number, maxSize: number = 256): IDSimilarity[] {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.TrackerMatchFaces, 'TrackerMatchFaces', returnIDSimilarities, tracker, template, threshold, maxSize);
  }

  public static GetTrackerFacialAttribute(tracker: number, id: number, attribute: TrackerFacialAttribute | TrackerFacialAttribute[], maxSize: number = 256, index: number = 0): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFacialAttribute, 'GetTrackerFacialAttribute', returnEmptyString, tracker, index, id, attribute instanceof Array ? attribute.join(';') : attribute, maxSize);
  }

  public static DetectFacialAttributeUsingFeatures(image: number, features: Point[], attribute: FacialAttribute | FacialAttribute[], maxSize: number = 256): string {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.DetectFacialAttributeUsingFeatures, 'DetectFacialAttributeUsingFeatures', returnEmptyString, image, features, attribute instanceof Array ? attribute.join(';') : attribute, maxSize);
  }

  public static GetValueConfidence(values: string, value: FacialAttribute | TrackerFacialAttribute): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GetValueConfidence, 'GetValueConfidence', returnZero, values, value);
  }

  public static SetParameter(name: Parameter, value: ParameterValue) {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetParameter, 'SetParameter', returnVoid, name, value.toString());
  }

  public static SetParameters<T extends Parameter>(parameters: string | Parameters<T>) {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetParameters, 'SetParameters', returnVoid, getParametersString(parameters));
  }

  public static SetHTTPProxy(address: string, port: number, username: string, password: string): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.SetHTTPProxy, 'SetHTTPProxy', returnVoid, address, port, username, password);
  }

  public static OpenIPVideoCamera(comression: VIDEOCOMPRESSIONTYPE, url: string, username: string, password: string, timeout: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.OpenIPVideoCamera, 'OpenIPVideoCamera', returnNegativeOne, comression, url, username, password, timeout);
  }

  public static InitializeCapturing(): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.InitializeCapturing, 'InitializeCapturing', returnVoid);
  }

  public static FinalizeCapturing(): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.FinalizeCapturing, 'FinalizeCapturing', returnVoid);
  }

  public static GrabFrame(camera: number): number {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.GrabFrame, 'GrabFrame', returnNegativeOne, camera);
  }

  public static CloseVideoCamera(camera: number): void {
    'worklet'
    return executeSDKFunction(LuxandFaceSDK.CloseVideoCamera, 'CloseVideoCamera', returnVoid, camera);
  }
}
