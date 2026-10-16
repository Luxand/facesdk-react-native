import { decode, encode } from 'base64-arraybuffer';
import { Alert } from 'react-native';

import LuxandFaceSDK, { Platform } from './native';

import type {
  Face,
  FaceImage as NativeFaceImage,
  IDSimilarity,
  Point,
  TrackerID,
} from './FaceSDK.nitro';

import {
  ERROR,
  FACIAL_FEATURE_COUNT,
  FEATURE,
  FSDKError,
  type FacialAttribute,
  type FlatType,
  IMAGEMODE,
  ON_ERROR,
  type Parameter,
  type ParameterValue,
  type ParameterValueType,
  type Parameters,
  type TrackerFacialAttribute,
  type TrackerParameter,
  type TrackerParameters,
  VIDEOCOMPRESSIONTYPE,
} from './definitions';

import { getParameterValue, getParametersString } from './utils';

export {
  ERROR,
  FACIAL_FEATURE_COUNT,
  FEATURE,
  FSDKError,
  IMAGEMODE,
  ON_ERROR,
  VIDEOCOMPRESSIONTYPE,
  type Face,
  type FacialAttribute,
  type IDSimilarity,
  type Parameter,
  type ParameterValue,
  type Parameters,
  type Point,
  type TrackerFacialAttribute,
  type TrackerID,
  type TrackerParameter,
  type TrackerParameters,
};

export interface FaceImage {
  image: Image;
  features: Point[];
}

interface SDKResult {
  error: string;
  errorCode: number;
  value?: any;
}

type SDKMethods = typeof LuxandFaceSDK;

type SDKMethodName = {
  [K in keyof SDKMethods]: SDKMethods[K] extends (...args: any[]) => SDKResult
    ? K
    : never;
}[keyof SDKMethods];

type ArgsOf<F> = F extends (...args: infer A) => any ? A : never;

type ResultOf<F> = F extends (...args: any[]) => infer R ? R : never;

function executeSDKFunction<K extends SDKMethodName & keyof SDKMethods, T>(
  name: K,
  processor: (result?: ResultOf<SDKMethods[K]>) => T,
  ...args: ArgsOf<SDKMethods[K]>
): T {
  const method = LuxandFaceSDK[name];
  const result = Reflect.apply(method, LuxandFaceSDK, args) as ResultOf<
    SDKMethods[K]
  > &
    SDKResult;
  const errorCode = result.errorCode;

  if (errorCode === ERROR.OK) return processor(result);

  if (FSDK.onError === ON_ERROR.SILENT)
    return processor === returnErrorPosition ? processor(result) : processor();

  let msg =
    `Function FSDK.${name} failed with error ${result.error}: ${errorCode}.\n` +
    `Arguments were ${JSON.stringify(args)}.\n` +
    `Result was ${JSON.stringify(result)}.`;

  if (errorCode === ERROR.NOT_ACTIVATED)
    msg +=
      '\nPlease call FSDK.ActivateLibrary(yourLicenseKey) before using any other function.';

  if (FSDK.onError === ON_ERROR.ALERT) {
    Alert.alert('FaceSDK Error', msg);
    return processor === returnErrorPosition ? processor(result) : processor();
  }

  if (FSDK.onError === ON_ERROR.THROW)
    throw new FSDKError(msg, errorCode, result);

  throw new Error(`Unknown ON_ERROR value: ${FSDK.onError}`);
}

function returnVoid(_: any = {}): void {
  return;
}

function returnImage(result: { value: number } = { value: -1 }): Image {
  return new Image(result.value);
}

function returnTracker(result: { value: number } = { value: -1 }): Tracker {
  return new Tracker(result.value);
}

function returnCamera(result: { value: number } = { value: -1 }): Camera {
  return new Camera(result.value);
}

function returnFaceImage(
  result: { value: NativeFaceImage } = { value: { image: -1, features: [] } }
): FaceImage {
  return {
    image: new Image(result.value.image),
    features: result.value.features,
  };
}

function returnFaceTemplate(
  result: { value: ArrayBuffer } = { value: new ArrayBuffer(0) }
): FaceTemplate {
  return FaceTemplate.FromBuffer(result.value);
}

function returnBuffer(
  result: { value: ArrayBuffer } = { value: new ArrayBuffer(0) }
): Buffer {
  return Buffer.FromArrayBuffer(result.value);
}

function getAttributeValueRegex(key: string): RegExp {
  return new RegExp(`${key}=(.*?)(?=\\s*[;\r\n:]|$)`);
}

const AgeGroups = ['0-2', '4-6', '8-13', '15-20', '25-32', '38-43', '48-53', '60-'] as const;
const Angles = ['Roll', 'Pan', 'Tilt'] as const;
const Expression = ['Smile', 'EyesOpen'] as const;
const Gender = ['Male', 'Female'] as const;

const attributeKeys = {
  AgeGroups: AgeGroups,
  Angles: Angles,
  Expression: Expression,
  Gender: Gender,
};

type FacialAttributeKeyLists = {
  AgeGroups: typeof AgeGroups;
  Gender: typeof Gender;
  Expression: typeof Expression;
  Angles: typeof Angles;
};

type FacialAttributeTypes = {
  LivenessError: string;
};

type FacialAttributeKeys<T extends TrackerFacialAttribute> =
  T extends keyof FacialAttributeKeyLists ? FacialAttributeKeyLists[T] : [T];
type FacialAttributeType<T> = T extends keyof FacialAttributeTypes
  ? FacialAttributeTypes[T]
  : number;

type FacialAttributesResultsHelper<T extends TrackerFacialAttribute[]> = {
  [K in keyof T as T[K] extends TrackerFacialAttribute
    ? FacialAttributeKeys<T[K]>[number]
    : never]: any;
};

type FacialAttributesResults<T extends TrackerFacialAttribute[]> = {
  [K in keyof FacialAttributesResultsHelper<T>]: FacialAttributeType<K>;
};

function getAttributeValue<T>(
  value: string,
  key: string,
  converter: (value?: string) => T
): T {
  const result = value.match(getAttributeValueRegex(key));
  return result ? converter(result[1]!) : converter();
}

function getStringAttributeValue(value: string, key: string): string {
  return getAttributeValue(value, key, (v?: string) => v ?? '');
}

function getNumberAttributeValue(value: string, key: string): number {
  return getAttributeValue(value, key, (v?: string) =>
    v ? Number.parseFloat(v) : 0
  );
}

function getNumberAttributeValues(
  value: string,
  keys: readonly string[]
): [string, number][] {
  return keys.map((key) => [key, getNumberAttributeValue(value, key)]);
}

function parseAttribute<A extends TrackerFacialAttribute>(
  value: string,
  attribute: A
): [string, number | string][] {
  if (attribute === 'LivenessError')
    return [['LivenessError', getStringAttributeValue(value, 'LivenessError')]];

  return getNumberAttributeValues(
    value,
    attribute in attributeKeys
      ? attributeKeys[attribute as keyof typeof attributeKeys]
      : [attribute]
  );
}

function makeReturnAttributes<S extends TrackerFacialAttribute[]>(
  ...attributes: S
): (result?: { value: string }) => FlatType<FacialAttributesResults<S>> {
  return (
    result: { value: string } = { value: '' }
  ): FlatType<FacialAttributesResults<S>> => {
    return Object.fromEntries(
      attributes.flatMap((a) => parseAttribute(result.value, a))
    ) as any;
  };
}

function makeReturnParameterValue<P extends TrackerParameter>(
  parameter: P
): (result?: { value: string }) => ParameterValueType<P> {
  return (result: { value: string } = { value: '' }): ParameterValueType<P> => {
    return getParameterValue<P>(result.value, parameter);
  };
}

function returnNamesList(result: { value: string } = { value: '' }): string[] {
  return result.value.split(';');
}

function returnDefault<T>(defaultValue: T): (result?: { value: T }) => T {
  return (result?: { value: T }) => {
    if (result === null || result === undefined) return defaultValue;
    return result.value;
  };
}

const emptyPoint: Point = { x: 0, y: 0 };
const emptyFace: Face = {
  score: 0,
  angle: 0,
  bbox: { p0: emptyPoint, p1: emptyPoint },
  features: [],
};
const emptyTrackerID: TrackerID = { id: -1, faceID: -1 };

const returnZero = returnDefault(0);
const returnNegativeOne = returnDefault(-1);
const returnEmptyString = returnDefault('');
const returnFace = returnDefault(emptyFace);
const returnFaces = returnDefault<Face[]>([]);
const returnFeatures = returnDefault<Point[]>([]);
const returnIDs = returnDefault<number[]>([]);
const returnTrackerID = returnDefault(emptyTrackerID);
const returnIDSimilarities = returnDefault<IDSimilarity[]>([]);
const returnErrorPosition = returnDefault<number>(0);

/**
 * A byte buffer to be used with FSDK functions. Allows access as a base64 string or ArrayBuffer.
 */
export class Buffer {
  protected constructor(
    private base64: string | null = null,
    private buffer: ArrayBuffer | null = null
  ) {}

  /** Create a Buffer from a base64 encoded string. */
  public static FromBase64(base64: string): Buffer {
    return new Buffer(base64, null);
  }

  /** Create a Buffer from an ArrayBuffer. */
  public static FromArrayBuffer(buffer: ArrayBuffer): Buffer {
    return new Buffer(null, buffer);
  }

  /** Obtain the buffer as a base64 string. */
  public asBase64(): string {
    if (this.base64 == null)
      this.base64 = this.buffer == null ? '' : encode(this.buffer);

    return this.base64;
  }

  /** Obtain the buffer as an ArrayBuffer. */
  public asArrayBuffer(): ArrayBuffer {
    if (this.buffer == null)
      this.buffer =
        this.base64 == null || this.base64 === ''
          ? new ArrayBuffer(0)
          : decode(this.base64);

    return this.buffer;
  }
}

/** A face template representing a person. */
export class FaceTemplate extends Buffer {
  /** Create a FaceTemplate from a base64 encoded string. */
  public static override FromBase64(base64: string): FaceTemplate {
    return new FaceTemplate(base64, null);
  }

  /** Create a FaceTemplate from an ArrayBuffer. */
  public static FromBuffer(buffer: ArrayBuffer): FaceTemplate {
    return new FaceTemplate(null, buffer);
  }

  /** Get the similarity score between this template and another. */
  public match(other: FaceTemplate): number {
    return FSDK.MatchFaces(this, other);
  }
}

/** A base64 encoded buffer. */
type Base64 = string;

/** Anything interpretable as a byte buffer. */
type BufferLike = Buffer | Base64 | ArrayBuffer;

function getBuffer(buffer: BufferLike): Buffer {
  if (buffer instanceof Buffer) return buffer;
  if (buffer instanceof ArrayBuffer) return Buffer.FromArrayBuffer(buffer);
  return Buffer.FromBase64(buffer);
}

function getArrayBuffer(buffer: BufferLike): ArrayBuffer {
  return getBuffer(buffer).asArrayBuffer();
}

/** A wrapper object for a native handle. */
class FSDKObject {
  constructor(public handle: number = -1) {}

  public isValid(): boolean {
    return this.handle >= 0;
  }
}

/** A wrapper object for an FSDK image. */
export class Image extends FSDKObject {
  /** Create a new empty image. */
  public static Empty(): Image {
    return executeSDKFunction('CreateEmptyImage', returnImage);
  }

  /** Load an image from a file. */
  public static FromFile(filename: string): Image {
    return executeSDKFunction('LoadImageFromFile', returnImage, filename);
  }

  /** Load an image from a file, preserving its alpha channel. */
  public static FromFileWithAlpha(filename: string): Image {
    return executeSDKFunction(
      'LoadImageFromFileWithAlpha',
      returnImage,
      filename
    );
  }

  /** Load an image from a raw pixel buffer. */
  public static FromBuffer(
    buffer: BufferLike,
    width: number,
    height: number,
    scanLine: number,
    imageMode: IMAGEMODE
  ): Image {
    return executeSDKFunction(
      'LoadImageFromBuffer',
      returnImage,
      getArrayBuffer(buffer),
      width,
      height,
      scanLine,
      imageMode
    );
  }

  /** Load an image from a JPEG encoded buffer. */
  public static FromJpegBuffer(buffer: BufferLike): Image {
    return executeSDKFunction(
      'LoadImageFromJpegBuffer',
      returnImage,
      getArrayBuffer(buffer)
    );
  }

  /** Load an image from a PNG encoded buffer. */
  public static FromPngBuffer(buffer: BufferLike): Image {
    return executeSDKFunction(
      'LoadImageFromPngBuffer',
      returnImage,
      getArrayBuffer(buffer)
    );
  }

  /** Load an image from a PNG encoded buffer, preserving its alpha channel. */
  public static FromPngBufferWithAlpha(buffer: BufferLike): Image {
    return executeSDKFunction(
      'LoadImageFromPngBufferWithAlpha',
      returnImage,
      getArrayBuffer(buffer)
    );
  }

  /** Save the image into a file. */
  public saveToFile(filename: string): void {
    return executeSDKFunction(
      'SaveImageToFile',
      returnVoid,
      filename,
      this.handle
    );
  }

  /** Get image width. */
  public getWidth(): number {
    return executeSDKFunction('GetImageWidth', returnZero, this.handle);
  }

  /** Get image height. */
  public getHeight(): number {
    return executeSDKFunction('GetImageHeight', returnZero, this.handle);
  }

  /** Get the size in bytes of a buffer encoding the image in the given format. */
  public getBufferSize(imageMode: IMAGEMODE): number {
    return executeSDKFunction(
      'GetImageBufferSize',
      returnZero,
      this.handle,
      imageMode
    );
  }

  public get width(): number {
    return this.getWidth();
  }

  public get height(): number {
    return this.getHeight();
  }

  /** Save the image into a byte buffer. */
  public saveToBuffer(imageMode: IMAGEMODE): Buffer {
    const bufferSize = this.getBufferSize(imageMode);
    return executeSDKFunction(
      'SaveImageToBuffer',
      returnBuffer,
      this.handle,
      imageMode,
      bufferSize
    );
  }

  /** Free the internal image buffer. The image becomes invalid. */
  public free(): void {
    const result = executeSDKFunction('FreeImage', returnVoid, this.handle);
    this.handle = -1;
    return result;
  }

  /** Create a copy of the image. */
  public copy(): Image {
    return executeSDKFunction('CopyImage', returnImage, this.handle);
  }

  /** Create a new image scaled by `ratio`. */
  public resize(ratio: number): Image {
    return executeSDKFunction('ResizeImage', returnImage, this.handle, ratio);
  }

  /** Create a new image rotated by 90 * `multiplier` degrees. Negative values rotate counterclockwise. */
  public rotate90(multiplier: number): Image {
    return executeSDKFunction(
      'RotateImage90',
      returnImage,
      this.handle,
      multiplier
    );
  }

  /** Create a new image rotated `angle` degrees around the center. */
  public rotate(angle: number): Image {
    return executeSDKFunction('RotateImage', returnImage, this.handle, angle);
  }

  /** Create a new image rotated `angle` degrees around (`x`, `y`). */
  public rotateCenter(angle: number, x: number, y: number): Image {
    return executeSDKFunction(
      'RotateImageCenter',
      returnImage,
      this.handle,
      angle,
      x,
      y
    );
  }

  /** Copy the axis-aligned rectangle bounded by (`x1`, `y1`) and (`x2`, `y2`). */
  public copyRect(x1: number, y1: number, x2: number, y2: number): Image {
    return executeSDKFunction(
      'CopyRect',
      returnImage,
      this.handle,
      x1,
      y1,
      x2,
      y2
    );
  }

  /** As `copyRect`, but parts outside the image repeat the border pixels. */
  public copyRectReplicateBorder(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Image {
    return executeSDKFunction(
      'CopyRectReplicateBorder',
      returnImage,
      this.handle,
      x1,
      y1,
      x2,
      y2
    );
  }

  /** Mirror the image around the vertical or horizontal axis. */
  public mirror(vertical: boolean = true): void {
    return executeSDKFunction(
      'MirrorImage',
      returnVoid,
      this.handle,
      vertical
    );
  }

  /** Extract the part of the image containing the face, resized to `width` x `height`. */
  public extractFace(
    features: Point[],
    width: number,
    height: number
  ): FaceImage {
    return executeSDKFunction(
      'ExtractFaceImage',
      returnFaceImage,
      this.handle,
      features,
      width,
      height
    );
  }

  /** Detect a single face. If several are present, returns the highest scoring one. */
  public detectFace(): Face {
    return executeSDKFunction('DetectFace', returnFace, this.handle);
  }

  /** Detect multiple faces, sorted by detection score descending. */
  public detectMultipleFaces(maxFaces: number = 100): Face[] {
    return executeSDKFunction(
      'DetectMultipleFaces',
      returnFaces,
      this.handle,
      maxFaces
    );
  }

  /** Detect the facial key points of a single face. */
  public detectFacialFeatures(): Point[] {
    return executeSDKFunction(
      'DetectFacialFeatures',
      returnFeatures,
      this.handle
    );
  }

  /** Detect the facial key points of a given face. */
  public detectFacialFeaturesInRegion(face: Face): Point[] {
    return executeSDKFunction(
      'DetectFacialFeaturesInRegion',
      returnFeatures,
      this.handle,
      face
    );
  }

  /** Get the face template of a single face. */
  public getFaceTemplate(): FaceTemplate {
    return executeSDKFunction(
      'GetFaceTemplate',
      returnFaceTemplate,
      this.handle
    );
  }

  /** Get the face template of a given face. */
  public getFaceTemplateInRegion(face: Face): FaceTemplate {
    return executeSDKFunction(
      'GetFaceTemplateInRegion',
      returnFaceTemplate,
      this.handle,
      face
    );
  }

  /** Detect facial attribute values using facial key points. */
  public detectFacialAttributeUsingFeatures<A extends FacialAttribute[]>(
    features: Point[],
    ...attributes: A
  ): FlatType<FacialAttributesResults<A>> {
    return executeSDKFunction(
      'DetectFacialAttributeUsingFeatures',
      makeReturnAttributes(...attributes),
      this.handle,
      features,
      attributes.join(';'),
      128 * attributes.length
    );
  }

  /** Detect facial attribute values using a detected face. */
  public detectFacialAttributeUsingFace<A extends FacialAttribute[]>(
    face: Face,
    ...attributes: A
  ): FlatType<FacialAttributesResults<A>> {
    return executeSDKFunction(
      'DetectFacialAttributeUsingFace',
      makeReturnAttributes(...attributes),
      this.handle,
      face,
      attributes.join(';'),
      128 * attributes.length
    );
  }

  /** Detect facial attribute values using a detected face, returning the raw `key=value;` string. */
  public detectFacialAttributeUsingFaceRaw(
    face: Face,
    attribute: string | string[],
    maxSize: number = 256
  ): string {
    return executeSDKFunction(
      'DetectFacialAttributeUsingFace',
      returnEmptyString,
      this.handle,
      face,
      attribute instanceof Array ? attribute.join(';') : attribute,
      maxSize
    );
  }

  /** Detect facial attribute values, returning the raw `key=value;` string. */
  public detectFacialAttributeUsingFeaturesRaw(
    features: Point[],
    attribute: string | string[],
    maxSize: number = 256
  ): string {
    return executeSDKFunction(
      'DetectFacialAttributeUsingFeatures',
      returnEmptyString,
      this.handle,
      features,
      attribute instanceof Array ? attribute.join(';') : attribute,
      maxSize
    );
  }
}

/** A wrapper object for an FSDK tracker. */
export class Tracker extends FSDKObject {
  /** Create a new, empty tracker. */
  public static Create(): Tracker {
    return executeSDKFunction('CreateTracker', returnTracker);
  }  

  /** Load tracker memory from a file. */
  public static FromFile(filename: string): Tracker {
    return executeSDKFunction(
      'LoadTrackerMemoryFromFile',
      returnTracker,
      filename
    );
  }

  /** Load tracker memory from a buffer. */
  public static FromBuffer(buffer: BufferLike): Tracker {
    return executeSDKFunction(
      'LoadTrackerMemoryFromBuffer',
      returnTracker,
      getArrayBuffer(buffer)
    );
  }

  /** Free the tracker. It becomes invalid. */
  public free(): void {
    const result = executeSDKFunction('FreeTracker', returnVoid, this.handle);
    this.handle = -1;
    return result;
  }

  /** Clear the tracker's memory. */
  public clear(): void {
    return executeSDKFunction('ClearTracker', returnVoid, this.handle);
  }

  /** Save tracker memory to a file. */
  public saveToFile(filename: string): void {
    return executeSDKFunction(
      'SaveTrackerMemoryToFile',
      returnVoid,
      this.handle,
      filename
    );
  }

  /** Get the size in bytes needed to store the tracker's memory. */
  public getMemoryBufferSize(): number {
    return executeSDKFunction(
      'GetTrackerMemoryBufferSize',
      returnZero,
      this.handle
    );
  }

  /** Save tracker memory to a buffer. */
  public saveToBuffer(): Buffer {
    const size = this.getMemoryBufferSize();
    return executeSDKFunction(
      'SaveTrackerMemoryToBuffer',
      returnBuffer,
      this.handle,
      size
    );
  }

  /** Set a tracker parameter. */
  public setParameter<P extends TrackerParameter>(
    name: P,
    value: ParameterValueType<P>
  ): void {
    return executeSDKFunction(
      'SetTrackerParameter',
      returnVoid,
      this.handle,
      name,
      value instanceof Array ? value.join(',') : value!.toString()
    );
  }

  /** Set a tracker parameter without type checking. */
  public setParameterRaw(name: string, value: string): void {
    return executeSDKFunction(
      'SetTrackerParameter',
      returnVoid,
      this.handle,
      name,
      value
    );
  }

  /** Set several tracker parameters at once. Returns the position of the first syntax error. */
  public setMultipleParameters<P extends TrackerParameter>(
    parameters: string | TrackerParameters<P>
  ): number {
    return executeSDKFunction(
      'SetTrackerMultipleParameters',
      returnErrorPosition,
      this.handle,
      getParametersString(parameters)
    );
  }

  /** Get a tracker parameter. */
  public getParameter<P extends TrackerParameter>(
    parameter: P,
    maxSize: number = 100
  ): ParameterValueType<P> {
    return executeSDKFunction(
      'GetTrackerParameter',
      makeReturnParameterValue(parameter),
      this.handle,
      parameter,
      maxSize
    );
  }

  /** Feed a frame to the tracker, returning the ids detected in it. */
  public feedFrame(
    image: Image,
    maxFaces: number = 256,
    index: number = 0
  ): number[] {
    return executeSDKFunction(
      'FeedFrame',
      returnIDs,
      this.handle,
      index,
      image.handle,
      maxFaces
    );
  }

  /** Get the facial key points detected for an id. */
  public getFacialFeatures(id: number, index: number = 0): Point[] {
    return executeSDKFunction(
      'GetTrackerFacialFeatures',
      returnFeatures,
      this.handle,
      index,
      id
    );
  }

  /** Get the eye centres detected for an id. */
  public getEyes(id: number, index: number = 0): Point[] {
    return executeSDKFunction(
      'GetTrackerEyes',
      returnFeatures,
      this.handle,
      index,
      id
    );
  }

  /** Get the face detected for an id. */
  public getFace(id: number, index: number = 0): Face {    
    return executeSDKFunction(
      'GetTrackerFace',
      returnFace,
      this.handle,
      index,
      id
    );
  }

  /** Prevent an id from being reassigned or purged. */
  public lockID(id: number): void {
    return executeSDKFunction('LockID', returnVoid, this.handle, id);
  }

  /** Release a lock previously taken with `lockID`. */
  public unlockID(id: number): void {
    return executeSDKFunction('UnlockID', returnVoid, this.handle, id);
  }

  /** Remove an id from the tracker's memory. */
  public purgeID(id: number): void {
    return executeSDKFunction('PurgeID', returnVoid, this.handle, id);
  }

  /** Set the name associated with an id. */
  public setName(id: number, name: string): void {
    return executeSDKFunction('SetName', returnVoid, this.handle, id, name);
  }

  /** Get the name associated with an id. */
  public getName(id: number, maxSize: number = 256): string {
    return executeSDKFunction(
      'GetName',
      returnEmptyString,
      this.handle,
      id,
      maxSize
    );
  }

  /** Get every name associated with an id. */
  public getAllNames(id: number, maxSize: number = 256): string[] {
    return executeSDKFunction(
      'GetAllNames',
      returnNamesList,
      this.handle,
      id,
      maxSize
    );
  }

  /** Get the id this id was reassigned to, if any. */
  public getIDReassignment(id: number): number {
    return executeSDKFunction(
      'GetIDReassignment',
      returnNegativeOne,
      this.handle,
      id
    );
  }

  /** Get the number of ids considered similar to this one. */
  public getSimilarIDCount(id: number): number {
    return executeSDKFunction(
      'GetSimilarIDCount',
      returnZero,
      this.handle,
      id
    );
  }

  /** Get the ids considered similar to this one. */
  public getSimilarIDList(id: number): number[] {
    return executeSDKFunction(
      'GetSimilarIDList',
      returnIDs,
      this.handle,
      id,
      this.getSimilarIDCount(id)
    );
  }

  /** Get the number of ids held by the tracker. */
  public getIDsCount(): number {
    return executeSDKFunction('GetTrackerIDsCount', returnZero, this.handle);
  }

  /** Get every id held by the tracker. */
  public getAllIDs(): number[] {
    return executeSDKFunction(
      'GetTrackerAllIDs',
      returnIDs,
      this.handle,
      this.getIDsCount()
    );
  }

  /** Get the number of face ids stored for an id. */
  public getFaceIDsCountForID(id: number): number {
    return executeSDKFunction(
      'GetTrackerFaceIDsCountForID',
      returnZero,
      this.handle,
      id
    );
  }

  /** Get the face ids stored for an id. */
  public getFaceIDsForID(id: number): number[] {
    return executeSDKFunction(
      'GetTrackerFaceIDsForID',
      returnIDs,
      this.handle,
      id,
      this.getFaceIDsCountForID(id)
    );
  }

  /** Get the id a face id belongs to. */
  public getIDByFaceID(faceID: number): number {
    return executeSDKFunction(
      'GetTrackerIDByFaceID',
      returnNegativeOne,
      this.handle,
      faceID
    );
  }

  /** Get the face template stored for a face id. */
  public getFaceTemplate(faceID: number): FaceTemplate {
    return executeSDKFunction(
      'GetTrackerFaceTemplate',
      returnFaceTemplate,
      this.handle,
      faceID
    );
  }

  /** Get the face image stored for a face id. */
  public getFaceImage(faceID: number): Image {
    return executeSDKFunction(
      'GetTrackerFaceImage',
      returnImage,
      this.handle,
      faceID
    );
  }

  /** Store a face image for a face id. */
  public setFaceImage(faceID: number, image: Image): void {
    return executeSDKFunction(
      'SetTrackerFaceImage',
      returnVoid,
      this.handle,
      faceID,
      image.handle
    );
  }

  /** Delete the face image stored for a face id. */
  public deleteFaceImage(faceID: number): void {
    return executeSDKFunction(
      'DeleteTrackerFaceImage',
      returnVoid,
      this.handle,
      faceID
    );
  }

  /** Get the 5 facial key points of the face image stored for a face id, in the coordinates of that image. */
  public getFaceFeatures(faceID: number): Point[] {
    return executeSDKFunction(
      'GetTrackerFaceFeatures',
      returnFeatures,
      this.handle,
      faceID
    );
  }

  /** Replace the 5 facial key points of the face image stored for a face id. */
  public setFaceFeatures(faceID: number, features: Point[]): void {
    return executeSDKFunction(
      'SetTrackerFaceFeatures',
      returnVoid,
      this.handle,
      faceID,
      features
    );
  }

  /** Create a new id from a face template. */
  public createID(template: FaceTemplate): TrackerID {
    return executeSDKFunction(
      'TrackerCreateID',
      returnTrackerID,
      this.handle,
      template.asArrayBuffer()
    );
  }

  /** Add a face template to an existing id, returning the new face id. */
  public addFaceTemplate(id: number, template: FaceTemplate): number {
    return executeSDKFunction(
      'AddTrackerFaceTemplate',
      returnNegativeOne,
      this.handle,
      id,
      template.asArrayBuffer()
    );
  }

  /** Delete a face from the tracker's memory. */
  public deleteFace(faceID: number): void {
    return executeSDKFunction(
      'DeleteTrackerFace',
      returnVoid,
      this.handle,
      faceID
    );
  }

  /** Match a template against the tracker's memory. */
  public matchFaces(
    template: FaceTemplate,
    threshold: number,
    maxSize: number = 256
  ): IDSimilarity[] {
    return executeSDKFunction(
      'TrackerMatchFaces',
      returnIDSimilarities,
      this.handle,
      template.asArrayBuffer(),
      threshold,
      maxSize
    );
  }

  /** Get facial attribute values (angles, liveness, ...) for an id. */
  public getFacialAttribute<A extends TrackerFacialAttribute[]>(
    id: number,
    ...attributes: A
  ): FlatType<FacialAttributesResults<A>> {
    return executeSDKFunction(
      'GetTrackerFacialAttribute',
      makeReturnAttributes(...attributes),
      this.handle,
      0,
      id,
      attributes.join(';'),
      128 * attributes.length
    );
  }

  /** Get facial attribute values, returning the raw `key=value;` string. */
  public getFacialAttributeRaw(
    id: number,
    attribute: string | string[],
    maxSize: number = 256,
    index: number = 0
  ): string {
    return executeSDKFunction(
      'GetTrackerFacialAttribute',
      returnEmptyString,
      this.handle,
      index,
      id,
      attribute instanceof Array ? attribute.join(';') : attribute,
      maxSize
    );
  }
}

/** A wrapper object for an FSDK video camera. */
export class Camera extends FSDKObject {
  /** Set the HTTP proxy used for IP cameras. */
  public static SetHTTPProxy(
    address: string,
    port: number,
    username: string,
    password: string
  ): void {
    return executeSDKFunction(
      'SetHTTPProxy',
      returnVoid,
      address,
      port,
      username,
      password
    );
  }

  /** Open an IP video camera. */
  public static OpenIPVideoCamera(
    compression: FlatType<VIDEOCOMPRESSIONTYPE>,
    url: string,
    username: string,
    password: string,
    timeout: number
  ): Camera {
    return executeSDKFunction(
      'OpenIPVideoCamera',
      returnCamera,
      compression,
      url,
      username,
      password,
      timeout
    );
  }

  /** Initialize the capturing subsystem. */
  public static InitializeCapturing(): void {
    return executeSDKFunction('InitializeCapturing', returnVoid);
  }

  /** Finalize the capturing subsystem. */
  public static FinalizeCapturing(): void {
    return executeSDKFunction('FinalizeCapturing', returnVoid);
  }

  /** Grab a frame from the camera. */
  public grabFrame(): Image {
    return executeSDKFunction('GrabFrame', returnImage, this.handle);
  }

  /** Close the camera. It becomes invalid. */
  public close(): void {
    const result = executeSDKFunction(
      'CloseVideoCamera',
      returnVoid,
      this.handle
    );
    this.handle = -1;
    return result;
  }
}

export default class FSDK {
  public static readonly Native = LuxandFaceSDK;

  public static readonly Image = Image;
  public static readonly Buffer = Buffer;
  public static readonly Camera = Camera;
  public static readonly Tracker = Tracker;
  public static readonly FaceTemplate = FaceTemplate;
  public static readonly Error = FSDKError;

  public static readonly ERROR = ERROR;
  public static readonly FEATURE = FEATURE;
  public static readonly IMAGEMODE = IMAGEMODE;
  public static readonly FACIAL_FEATURE_COUNT = FACIAL_FEATURE_COUNT;
  public static readonly VIDEOCOMPRESSIONTYPE = VIDEOCOMPRESSIONTYPE;

  public static readonly ON_ERROR = ON_ERROR;
  public static onError = ON_ERROR.THROW;

  /** Writable directory that persists across launches. */
  public static get DocumentsDirectory(): string {
    return Platform.documentsDirectory;
  }

  /** Writable directory the system may purge under storage pressure. */
  public static get CachesDirectory(): string {
    return Platform.cachesDirectory;
  }

  /** Choose how errors returned by the SDK are surfaced. */
  public static SetOnError(value: ON_ERROR): void {
    this.onError = value;
  }

  public static ActivateLibrary(licenseKey: string): void {
    LuxandFaceSDK.SetParameter('environment', 'reactnative');
    return executeSDKFunction('ActivateLibrary', returnVoid, licenseKey);
  }

  public static Initialize(): void {
    return executeSDKFunction('Initialize', returnVoid);
  }

  public static ActivateAndInitalize(licenseKey: string): void {
    this.ActivateLibrary(licenseKey);
    return this.Initialize();
  }

  /** Point the liveness model at the iBeta add-on's data, extracted to the caches directory. */
  public static InitializeIBeta(): void {
    Platform.prepareIBetaData();

    return this.SetParameter(
      'LivenessModel',
      `external:model=pegasus,dataDir=${this.CachesDirectory}`
    );
  }

  public static Finalize(): void {
    return executeSDKFunction('Finalize', returnVoid);
  }

  public static GetLicenseInfo(): string {
    return executeSDKFunction('GetLicenseInfo', returnEmptyString);
  }

  public static GetVersionInfo(): string {
    return executeSDKFunction('GetVersionInfo', returnEmptyString);
  }

  /** Limit how many threads the SDK uses. Pass 0 to let it decide. */
  public static SetNumThreads(count: number): void {
    return executeSDKFunction('SetNumThreads', returnVoid, count);
  }

  public static GetNumThreads(): number {
    return executeSDKFunction('GetNumThreads', returnZero);
  }

  public static CreateEmptyImage(): Image {
    return Image.Empty();
  }

  public static FreeImage(image: Image): void {
    return image.free();
  }

  public static LoadImageFromFile(filename: string): Image {
    return Image.FromFile(filename);
  }

  public static LoadImageFromFileWithAlpha(filename: string): Image {
    return Image.FromFileWithAlpha(filename);
  }

  public static LoadImageFromBuffer(
    buffer: BufferLike,
    width: number,
    height: number,
    scanLine: number,
    imageMode: IMAGEMODE
  ): Image {
    return Image.FromBuffer(buffer, width, height, scanLine, imageMode);
  }

  public static LoadImageFromJpegBuffer(buffer: BufferLike): Image {
    return Image.FromJpegBuffer(buffer);
  }

  public static LoadImageFromPngBuffer(buffer: BufferLike): Image {
    return Image.FromPngBuffer(buffer);
  }

  public static LoadImageFromPngBufferWithAlpha(buffer: BufferLike): Image {
    return Image.FromPngBufferWithAlpha(buffer);
  }

  public static SaveImageToFile(image: Image, filename: string): void {
    return image.saveToFile(filename);
  }

  public static SetJpegCompressionQuality(quality: number): void {
    return executeSDKFunction(
      'SetJpegCompressionQuality',
      returnVoid,
      quality
    );
  }

  public static GetImageWidth(image: Image): number {
    return image.getWidth();
  }

  public static GetImageHeight(image: Image): number {
    return image.getHeight();
  }

  public static GetImageBufferSize(
    image: Image,
    imageMode: IMAGEMODE
  ): number {
    return image.getBufferSize(imageMode);
  }

  public static SaveImageToBuffer(image: Image, imageMode: IMAGEMODE): Buffer {
    return image.saveToBuffer(imageMode);
  }

  public static CopyImage(image: Image): Image {
    return image.copy();
  }

  public static ResizeImage(image: Image, ratio: number): Image {
    return image.resize(ratio);
  }

  public static RotateImage90(image: Image, multiplier: number): Image {
    return image.rotate90(multiplier);
  }

  public static RotateImage(image: Image, angle: number): Image {
    return image.rotate(angle);
  }

  public static RotateImageCenter(
    image: Image,
    angle: number,
    x: number,
    y: number
  ): Image {
    return image.rotateCenter(angle, x, y);
  }

  public static CopyRect(
    image: Image,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Image {
    return image.copyRect(x1, y1, x2, y2);
  }

  public static CopyRectReplicateBorder(
    image: Image,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Image {
    return image.copyRectReplicateBorder(x1, y1, x2, y2);
  }

  public static MirrorImage(image: Image, vertical: boolean = true): void {
    return image.mirror(vertical);
  }

  public static ExtractFaceImage(
    image: Image,
    features: Point[],
    width: number,
    height: number
  ): FaceImage {
    return image.extractFace(features, width, height);
  }

  public static DetectFace(image: Image): Face {
    return image.detectFace();
  }

  public static DetectMultipleFaces(
    image: Image,
    maxFaces: number = 100
  ): Face[] {
    return image.detectMultipleFaces(maxFaces);
  }

  public static DetectFacialFeatures(image: Image): Point[] {
    return image.detectFacialFeatures();
  }

  public static DetectFacialFeaturesInRegion(
    image: Image,
    face: Face
  ): Point[] {
    return image.detectFacialFeaturesInRegion(face);
  }

  public static GetFaceTemplate(image: Image): FaceTemplate {
    return image.getFaceTemplate();
  }

  public static GetFaceTemplateInRegion(
    image: Image,
    face: Face
  ): FaceTemplate {
    return image.getFaceTemplateInRegion(face);
  }

  public static MatchFaces(
    template1: FaceTemplate,
    template2: FaceTemplate
  ): number {
    return executeSDKFunction(
      'MatchFaces',
      returnZero,
      template1.asArrayBuffer(),
      template2.asArrayBuffer()
    );
  }

  public static CreateTracker(): Tracker {
    return Tracker.Create();
  }

  public static LoadTrackerMemoryFromFile(filename: string): Tracker {
    return Tracker.FromFile(filename);
  }

  public static LoadTrackerMemoryFromBuffer(buffer: BufferLike): Tracker {
    return Tracker.FromBuffer(buffer);
  }

  public static FreeTracker(tracker: Tracker): void {
    return tracker.free();
  }

  public static ClearTracker(tracker: Tracker): void {
    return tracker.clear();
  }

  public static SaveTrackerMemoryToFile(
    tracker: Tracker,
    filename: string
  ): void {
    return tracker.saveToFile(filename);
  }

  public static GetTrackerMemoryBufferSize(tracker: Tracker): number {
    return tracker.getMemoryBufferSize();
  }

  public static SaveTrackerMemoryToBuffer(tracker: Tracker): Buffer {
    return tracker.saveToBuffer();
  }

  public static SetTrackerParameter<P extends TrackerParameter>(
    tracker: Tracker,
    name: P,
    value: ParameterValueType<P>
  ): void {
    return tracker.setParameter(name, value);
  }

  public static SetTrackerParameterRaw(
    tracker: Tracker,
    name: string,
    value: string
  ): void {
    return tracker.setParameterRaw(name, value);
  }

  public static SetTrackerMultipleParameters<T extends TrackerParameter>(
    tracker: Tracker,
    parameters: string | TrackerParameters<T>
  ): number {
    return tracker.setMultipleParameters(parameters);
  }

  public static GetTrackerParameter<P extends TrackerParameter>(
    tracker: Tracker,
    parameter: P,
    maxSize: number = 100
  ): ParameterValueType<P> {
    return tracker.getParameter<P>(parameter, maxSize);
  }

  public static FeedFrame(
    tracker: Tracker,
    image: Image,
    maxFaces: number = 256,
    index: number = 0
  ): number[] {
    return tracker.feedFrame(image, maxFaces, index);
  }

  public static GetTrackerFacialFeatures(
    tracker: Tracker,
    id: number,
    index: number = 0
  ): Point[] {
    return tracker.getFacialFeatures(id, index);
  }

  public static GetTrackerEyes(
    tracker: Tracker,
    id: number,
    index: number = 0
  ): Point[] {
    return tracker.getEyes(id, index);
  }

  public static GetTrackerFace(
    tracker: Tracker,
    id: number,
    index: number = 0
  ): Face {    
    return tracker.getFace(id, index);
  }

  public static LockID(tracker: Tracker, id: number): void {
    return tracker.lockID(id);
  }

  public static UnlockID(tracker: Tracker, id: number): void {
    return tracker.unlockID(id);
  }

  public static PurgeID(tracker: Tracker, id: number): void {
    return tracker.purgeID(id);
  }

  public static SetName(tracker: Tracker, id: number, name: string): void {
    return tracker.setName(id, name);
  }

  public static GetName(
    tracker: Tracker,
    id: number,
    maxSize: number = 256
  ): string {
    return tracker.getName(id, maxSize);
  }

  public static GetAllNames(
    tracker: Tracker,
    id: number,
    maxSize: number = 256
  ): string[] {
    return tracker.getAllNames(id, maxSize);
  }

  public static GetIDReassignment(tracker: Tracker, id: number): number {
    return tracker.getIDReassignment(id);
  }

  public static GetSimilarIDCount(tracker: Tracker, id: number): number {
    return tracker.getSimilarIDCount(id);
  }

  public static GetSimilarIDList(tracker: Tracker, id: number): number[] {
    return tracker.getSimilarIDList(id);
  }

  public static GetTrackerIDsCount(tracker: Tracker): number {
    return tracker.getIDsCount();
  }

  public static GetTrackerAllIDs(tracker: Tracker): number[] {
    return tracker.getAllIDs();
  }

  public static GetTrackerFaceIDsCountForID(
    tracker: Tracker,
    id: number
  ): number {
    return tracker.getFaceIDsCountForID(id);
  }

  public static GetTrackerFaceIDsForID(
    tracker: Tracker,
    id: number
  ): number[] {
    return tracker.getFaceIDsForID(id);
  }

  public static GetTrackerIDByFaceID(
    tracker: Tracker,
    faceID: number
  ): number {
    return tracker.getIDByFaceID(faceID);
  }

  public static GetTrackerFaceTemplate(
    tracker: Tracker,
    faceID: number
  ): FaceTemplate {
    return tracker.getFaceTemplate(faceID);
  }

  public static GetTrackerFaceImage(tracker: Tracker, faceID: number): Image {
    return tracker.getFaceImage(faceID);
  }

  public static SetTrackerFaceImage(
    tracker: Tracker,
    faceID: number,
    image: Image
  ): void {
    return tracker.setFaceImage(faceID, image);
  }

  public static DeleteTrackerFaceImage(
    tracker: Tracker,
    faceID: number
  ): void {
    return tracker.deleteFaceImage(faceID);
  }

  public static TrackerCreateID(
    tracker: Tracker,
    template: FaceTemplate
  ): TrackerID {
    return tracker.createID(template);
  }

  public static AddTrackerFaceTemplate(
    tracker: Tracker,
    id: number,
    template: FaceTemplate
  ): number {
    return tracker.addFaceTemplate(id, template);
  }

  public static DeleteTrackerFace(tracker: Tracker, faceID: number): void {
    return tracker.deleteFace(faceID);
  }

  public static TrackerMatchFaces(
    tracker: Tracker,
    template: FaceTemplate,
    threshold: number,
    maxSize: number = 256
  ): IDSimilarity[] {
    return tracker.matchFaces(template, threshold, maxSize);
  }

  public static GetTrackerFacialAttribute<A extends TrackerFacialAttribute[]>(
    tracker: Tracker,
    id: number,
    ...attributes: A
  ): FlatType<FacialAttributesResults<A>> {
    return tracker.getFacialAttribute<A>(id, ...attributes);
  }

  public static GetTrackerFacialAttributeRaw(
    tracker: Tracker,
    id: number,
    attribute: string | string[],
    maxSize: number = 256,
    index: number = 0
  ): string {
    return tracker.getFacialAttributeRaw(id, attribute, maxSize, index);
  }

  public static DetectFacialAttributeUsingFeatures<
    A extends FacialAttribute[],
  >(
    image: Image,
    features: Point[],
    ...attributes: A
  ): FlatType<FacialAttributesResults<A>> {
    return image.detectFacialAttributeUsingFeatures(features, ...attributes);
  }

  public static DetectFacialAttributeUsingFace<A extends FacialAttribute[]>(
    image: Image,
    face: Face,
    ...attributes: A
  ): FlatType<FacialAttributesResults<A>> {
    return image.detectFacialAttributeUsingFace(face, ...attributes);
  }

  public static DetectFacialAttributeUsingFaceRaw(
    image: Image,
    face: Face,
    attribute: string | string[],
    maxSize: number = 256
  ): string {
    return image.detectFacialAttributeUsingFaceRaw(face, attribute, maxSize);
  }

  public static DetectFacialAttributeUsingFeaturesRaw(
    image: Image,
    features: Point[],
    attribute: string | string[],
    maxSize: number = 256
  ): string {
    return image.detectFacialAttributeUsingFeaturesRaw(
      features,
      attribute,
      maxSize
    );
  }

  public static GetValueConfidence(
    values: string,
    value: FacialAttribute | TrackerFacialAttribute
  ): number {
    return executeSDKFunction(
      'GetValueConfidence',
      returnZero,
      values,
      value
    );
  }

  public static SetParameter<P extends Parameter>(
    parameter: P,
    value: ParameterValueType<P>
  ): void {
    return executeSDKFunction(
      'SetParameter',
      returnVoid,
      parameter,
      value!.toString()
    );
  }

  public static SetParameters<T extends Parameter>(
    parameters: string | Parameters<T>
  ): number {
    return executeSDKFunction(
      'SetParameters',
      returnErrorPosition,
      getParametersString(parameters)
    );
  }

  public static SetHTTPProxy(
    address: string,
    port: number,
    username: string,
    password: string
  ): void {
    return Camera.SetHTTPProxy(address, port, username, password);
  }

  public static OpenIPVideoCamera(
    compression: VIDEOCOMPRESSIONTYPE,
    url: string,
    username: string,
    password: string,
    timeout: number
  ): Camera {
    return Camera.OpenIPVideoCamera(
      compression,
      url,
      username,
      password,
      timeout
    );
  }

  public static InitializeCapturing(): void {
    return Camera.InitializeCapturing();
  }

  public static FinalizeCapturing(): void {
    return Camera.FinalizeCapturing();
  }

  public static GrabFrame(camera: Camera): Image {
    return camera.grabFrame();
  }

  public static CloseVideoCamera(camera: Camera): void {
    return camera.close();
  }
}
