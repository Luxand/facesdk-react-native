import { decode, encode } from 'base64-arraybuffer';
import { Alert } from 'react-native';

import LuxandFaceSDK, {
  type Face,
  type FaceImageResult,
  type FacePosition,
  type IDSimilarity,
  type NativeFunctionResult,
  type NumberResult,
  type Point,
  type StringResult,
  type TrackerID,
  copyAssetsToCacheDirectory,
} from './NativeFaceSDK';

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

import {
  getParameterValue,
  getParametersString
} from './utils';

import FSDKWorklets from './FaceSDKWorklets';

export {
  ERROR, FACIAL_FEATURE_COUNT, FEATURE, FSDKError, IMAGEMODE, ON_ERROR, VIDEOCOMPRESSIONTYPE, type Face, type FacePosition,
  type FacialAttribute, type IDSimilarity, type Parameter, type ParameterValue,
  type Parameters, type Point, type TrackerFacialAttribute, type TrackerID, type TrackerParameter, type TrackerParameters
};

export interface FaceImage {

  image: Image;
  features: Point[];

}

function executeSDKFunction<P extends any[], T, V extends Record<string, any>>(func: (...args: P) => NativeFunctionResult & { result: V }, processor: (a?: V) => T, ...args: P): T {
  const result = func(...args);
  const errorCode = result.errorCode;

  if (errorCode == ERROR.OK)
    return processor(result.result);

  if (FSDK.onError == ON_ERROR.SILENT)
    return processor === returnErrorPositsion ? processor(result.result) : processor();

  var msg = `Fuction FSDK.${func.name} failed with error ${result.error}: ${errorCode}.\nArguments were ${JSON.stringify(args)}.\nResult was ${JSON.stringify(result.result)}.`;
  if (errorCode === ERROR.NOT_ACTIVATED)
    msg += '\nPlease call FSDK.ActivateLibrary(yourLicenseKey) before using any other function.';

  if (FSDK.onError === ON_ERROR.ALERT) {
    Alert.alert('FaceSDK Error', msg);
    return processor === returnErrorPositsion ? processor(result.result) : processor();
  }

  if (FSDK.onError === ON_ERROR.THROW)
    throw new FSDKError(msg, errorCode, result.result);

  throw new Error(`Unknown ON_ERROR value: ${FSDK.onError}`);
}

function returnVoid(_: {} = {}): void {
  return;
}

function returnImage(result: NumberResult = { value: -1 }): Image {
  return new Image(result.value);
}

function returnTracker(result: NumberResult = { value: -1 }): Tracker {
  return new Tracker(result.value);
}

function returnCamera(result: NumberResult = { value: -1 }): Camera {
  return new Camera(result.value);
}

function returnFaceImage(result: FaceImageResult = { value : { image: -1, features: [] } }): FaceImage {
  return {
    image: new Image(result.value.image),
    features: result.value.features
  };
}

function returnFaceTemplate(result: StringResult = { value: '' }): FaceTemplate {
  return FaceTemplate.FromBase64(result.value);
}

function returnBuffer(result: StringResult = { value: '' }): Buffer {
  return Buffer.FromBase64(result.value);
}

function getAttributeValueRegex(key: string): RegExp {
  return new RegExp(`${key}=(.*?)(?=\s*[;\r\n:]|$)`);
}

const AgeGroups = [ '0-2', '4-6', '8-13', '15-20', '25-32', '38-43', '48-53', '60-' ] as const;
const Angles = [ 'Roll', 'Pan', 'Tilt' ] as const;
const Expression = [ 'Smile', 'EyesOpen' ] as const;
const Gender = [ 'Male', 'Female' ] as const;

const attributeKeys = {  
  'AgeGroups': AgeGroups,
  'Angles': Angles,
  'Expression': Expression,
  'Gender': Gender
};

type FacialAttributeKeyLists = {
  AgeGroups: typeof AgeGroups,
  Gender: typeof Gender,
  Expression: typeof Expression,
  Angles: typeof Angles,
};

type FacialAttributeTypes = {
  LivenessError: string
};

type FacialAttributeKeys<T extends TrackerFacialAttribute> = T extends keyof FacialAttributeKeyLists ? FacialAttributeKeyLists[T] : [T];
type FacialAttributeType<T> = T extends keyof FacialAttributeTypes ? FacialAttributeTypes[T] : number;

type FacialAttributesResultsHelper<T extends TrackerFacialAttribute[]> = {
  [K in keyof T as T[K] extends TrackerFacialAttribute ? FacialAttributeKeys<T[K]>[number] : never]: any
};

type FacialAttributesResults<T extends TrackerFacialAttribute[]> = {
  [K in keyof FacialAttributesResultsHelper<T>]: FacialAttributeType<K>
};

function getAttributeValue<T>(value: string, key: string, converter: (value?: string) => T): T {
  const result = value.match(getAttributeValueRegex(key));
  return result ? converter(result[1]!) : converter();
}

function getStringAttributeValue(value: string, key: string): string {
  return getAttributeValue(value, key, (value?: string) => value ?? '');
}

function getNumberAttributeValue(value: string, key: string): number {
  return getAttributeValue(value, key, (value?: string) => value ? Number.parseFloat(value) : 0);
}

function getNumberAttributeValues(value: string, keys: readonly string[]): [string, number][] {
  return keys.map(key => [key, getNumberAttributeValue(value, key)]);
}

function parseAttribute<A extends TrackerFacialAttribute>(value: string, attribute: A): [string, number | string][] {
  if (attribute === 'LivenessError')
    return [['LivenessError', getStringAttributeValue(value, 'LivenessError')]];

  return getNumberAttributeValues(value, attribute in attributeKeys ? attributeKeys[attribute as keyof typeof attributeKeys] : [attribute]);
}

function makeReturnAttributes<S extends TrackerFacialAttribute[]>(...attributes: S): (result?: StringResult) => FlatType<FacialAttributesResults<S>> {
  return (result: StringResult = { value: '' }): FlatType<FacialAttributesResults<S>> => {
    return Object.fromEntries(attributes.flatMap(a => parseAttribute(result.value, a))) as any;
  };
}

function makeReturnParameterValue<P extends TrackerParameter>(parameter: P): (result?: StringResult) => ParameterValueType<P> {
  return (result: StringResult = { value: '' }): ParameterValueType<P> => {
    return getParameterValue<P>(result.value, parameter);
  }
}

function returnNamesList(result: StringResult = { value: '' }): string[] {
  return result.value.split(';');
}

function returnDefault<T>(defaultValue: T): (result?: { value: T }) => T {
  return (result?: { value: T }) => {
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
const returnErrorPositsion = returnDefault<number>(0);


/**
 * A byte buffer object to be used with FSDK function. Allows access as a base64 string and ArrayBuffer.
 */
export class Buffer {

  protected constructor(private base64: string | null = null, private buffer: ArrayBuffer | null = null) {}

  /**
   * Create a Buffer object from a base64 encoded buffer.
   * @param {string} base64 the encoded buffer.
   * @returns {Buffer} The created Buffer object.
   */
  public static FromBase64(base64: string): Buffer {
    return new Buffer(base64, null);
  }

  /**
   * Create a Buffer object from an ArrayBuffer object.
   * @param {ArrayBuffer} buffer the buffer.
   * @returns {Buffer} The created Buffer object.
   */
  public static FromArrayBuffer(buffer: ArrayBuffer): Buffer {
    return new Buffer(null, buffer);
  }

  /**
   * Obtain the buffer as a base64 string.
   * @returns {string} base64 encoded buffer.
   */
  public asBase64(): string {
    if (this.base64 == null)
      this.base64 = this.buffer == null ? '': encode(this.buffer);

    return this.base64;
  }

  /**
   * Obtain the buffer as an ArrayBuffer object.
   * @returns {ArrayBuffer} The buffer.
   */
  public asArrayBuffer(): ArrayBuffer {
    if (this.buffer == null)
      this.buffer = this.base64 == null || this.base64 == '' ? new ArrayBuffer(0) : decode(this.base64);

    return this.buffer;
  }

}


/**
 * A face template representing a person. Allows access as a base64 string and ArrayBuffer.
 */
export class FaceTemplate extends Buffer {

  /**
   * Create a FaceTemplate object from a base64 encoded buffer.
   * @param {string} base64 the encoded buffer.
   * @returns {Buffer} The created FaceTemplate object.
   */
  public static FromBase64(base64: string): FaceTemplate { return new FaceTemplate(base64, null) }

  /**
   * Create a FaceTemplate object from an ArrayBuffer object.
   * @param {ArrayBuffer} buffer the buffer.
   * @returns {Buffer} The created FaceTemplate object.
   */
  public static FromBuffer(buffer: ArrayBuffer): FaceTemplate { return new FaceTemplate(null, buffer) }


  /**
   * Get the similarity score between this template and another.
   * @param {FaceTemplate} other The template to match with.
   * @returns {number} The similarity score.
   */
  public match(other: FaceTemplate): number {
    return FSDK.MatchFaces(this, other);
  }
  
}

/**
 * A base64 encoded buffer.
 */
type Base64 = string;

/**
 * An object that can be enterpreted as a byte buffer. Can be either a base64 {@type string}, an {@type ArrayBuffer} or a {@type Buffer} object.
 */
type BufferLike = Buffer | Base64 | ArrayBuffer;

function getBuffer(buffer: BufferLike): Buffer {
  if (buffer instanceof Buffer)
    return buffer;

  if (buffer instanceof ArrayBuffer)
    return Buffer.FromArrayBuffer(buffer);

  return Buffer.FromBase64(buffer);
}

function getBase64(buffer: BufferLike): Base64 { return getBuffer(buffer).asBase64(); }

/**
 * A wrapper object for a native handle.
 */
class FSDKObject {

  constructor(public handle: number = -1) {}

  public isValid(): boolean {
    return this.handle >= 0;
  }

}


/**
 * A wrapper object for a FSDK image.
 */
export class Image extends FSDKObject {
  
  /**
   * Create an empty image.
   * @returns {Image} The image.
   */
  public static Empty(): Image {
    return executeSDKFunction(LuxandFaceSDK.CreateEmptyImage, returnImage);
  }

  /**
   * Open an image from a file. PNG, JPG and BMP formats are supported.
   * @param {string} filename The path to the image file.
   * @returns {Image} The image.
   */
  public static FromFile(filename: string): Image {
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromFile, returnImage, filename);
  }

  /**
   * Open an image from a file preserving the alpha channel. PNG, JPG and BMP formats are supported.
   * @param {string} filename The path to the image file.
   * @returns {Image} The image.
   */
  public static FromFileWithAlpha(filename: string): Image {
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromFileWithAlpha, returnImage, filename);
  }

  /**
   * Load an image from a pixel byte buffer. The buffer encodes the image top to bottom with pixel stride equal to pixel byte size and row stride equal to {@param scanLine}.
   * @param {BufferLike} buffer The image buffer.
   * @param {number} width The width of the image.
   * @param {number} height The height of the image.
   * @param {number} scanLine The number of bytes per image row -- row stride.
   * @param {IMAGEMODE} imageMode Image pixel format.
   * @returns {Image} The image.
   */
  public static FromBuffer(buffer: BufferLike, width: number, height: number, scanLine: number, imageMode: IMAGEMODE): Image {
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromBuffer, returnImage, getBase64(buffer), width, height, scanLine, imageMode);
  }

  /**
   * Load an image from a JPEG buffer.
   * @param {BufferLike} buffer The image encoded in JPEG format. 
   * @returns {Image} The image.
   */
  public static FromJpegBuffer(buffer: BufferLike): Image {
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromJpegBuffer, returnImage, getBase64(buffer));
  }

  /**
   * Load an image from a PNG buffer.
   * @param {BufferLike} buffer The image encoded in PNG format. 
   * @returns {Image} The image.
   */
  public static FromPngBuffer(buffer: BufferLike): Image {
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromPngBuffer, returnImage, getBase64(buffer));
  }

  /**
   * Load an image from a PNG buffer preserving the alpha channel.
   * @param {BufferLike} buffer The image encoded in PNG format. 
   * @returns {Image} The image.
   */
  public static FromPngBufferWithAlpha(buffer: BufferLike): Image {
    return executeSDKFunction(LuxandFaceSDK.LoadImageFromPngBufferWithAlpha, returnImage, getBase64(buffer));
  }

  /**
   * Save the image into a file specified by {@param filename}.
   * @param {string} filename Path to save the image to.
   * @returns {void}
   */
  public saveToFile(filename: string): void {
    return executeSDKFunction(LuxandFaceSDK.SaveImageToFile, returnVoid, filename, this.handle);
  }

  /**
   * Get image width.
   * @returns {number} The width of the image.
   */
  public getWidth(): number {
    return executeSDKFunction(LuxandFaceSDK.GetImageWidth, returnZero, this.handle);
  }

  /**
   * Get image height.
   * @returns {number} The height of the image.
   */
  public getHeight(): number {
    return executeSDKFunction(LuxandFaceSDK.GetImageHeight, returnZero, this.handle);
  }

  /**
   * Get the size (in bytes) of a byte buffer that encodes the image in {@param IMAGEMODE} format. Such buffer is guaranteed to have the pixel stride equal to the pixel size in bytes and row stride equal to {@member width} * pixel stride.
   * @param {IMAGEMODE} imageMode The image format to use.
   * @returns {number} The buffer size in bytes.
   */
  public getBufferSize(imageMode: IMAGEMODE): number {
    return executeSDKFunction(LuxandFaceSDK.GetImageBufferSize, returnZero, this.handle, imageMode);
  }

  /**
   * Get image width.
   * @returns {number} The width of the image.
   */
  public get width(): number {
    return this.getWidth();
  }

  /**
   * Get image height.
   * @returns {number} The height of the image.
   */
  public get height(): number {
    return this.getHeight();
  }

  /**
   * Save image into a byte buffer.
   * @param {IMAGEMODE} imageMode Image format to use. 
   * @returns {Buffer} The buffer.
   */
  public saveToBuffer(imageMode: IMAGEMODE): Buffer {
    const bufferSize = this.getBufferSize(imageMode);
    return executeSDKFunction(LuxandFaceSDK.SaveImageToBuffer, returnBuffer, this.handle, imageMode, bufferSize);
  }

  /**
   * Free the internal image buffer. The image becomes invalid.
   * @returns {void}
   */
  public free(): void {
    const result = executeSDKFunction(LuxandFaceSDK.FreeImage, returnVoid, this.handle);
    this.handle = -1;
    return result;
  }

  /**
   * Create a copy of the image.
   * @returns {Image} The image copy.
   */
  public copy(): Image {
    return executeSDKFunction(LuxandFaceSDK.CopyImage, returnImage, this.handle);
  }

  /**
   * Create a new image by increasing (or decreasing) the total size by {@param ratio}.
   * @param {number} ratio The ratio to change the size of the image by. 
   * @returns {Image} The resized image.
   */
  public resize(ratio: number): Image {
    return executeSDKFunction(LuxandFaceSDK.ResizeImage, returnImage, this.handle, ratio);
  }

  /**
   * Create a new image by rotating 90 * {@param multiplier} degrees around the center. Negative values rotate counterclockwise.
   * @param {number} multiplier The number of times to rotate the image 90 degrees.
   * @returns {Image} The rotated image.
   */
  public rotate90(multiplier: number): Image {
    return executeSDKFunction(LuxandFaceSDK.RotateImage90, returnImage, this.handle, multiplier);
  }

  /**
   * Create a new image by rotating {@param angle} degrees around the center.
   * @param {number} angle The angle to rotate the image by.
   * @returns {Image} The rotated image.
   */
  public rotate(angle: number): Image {
    return executeSDKFunction(LuxandFaceSDK.RotateImage, returnImage, this.handle, angle);
  }

  /**
   * Create a new image by rotating {@param angle} degrees around the point ({@param x}, {@param y}).
   * @param {number} angle The angle to rotate the image by.
   * @param {number} x The x coordinate of the center. 
   * @param {number} y The y coordinate of the center.
   * @returns {Image} The rotated image.
   */
  public rotateCenter(angle: number, x: number, y: number): Image {
    return executeSDKFunction(LuxandFaceSDK.RotateImageCenter, returnImage, this.handle, angle, x, y);
  }

  /**
   * Create a new image by copying an axis aligned rectangle bounded by the top left ({@param x1}, {@param y1}) and the bottom right ({@param x2}, {@param y2}) points.
   * @param {number} x1 The top left point x coordinate. 
   * @param {number} y1 The top left point y coordinate. 
   * @param {number} x2 The bottom right point x coordinate.
   * @param {number} y2 The bottom right point y coordinate. 
   * @returns {Image} The copied image.
   */
  public copyRect(x1: number, y1: number, x2: number, y2: number): Image {
    return executeSDKFunction(LuxandFaceSDK.CopyRect, returnImage, this.handle, x1, y1, x2, y2);
  }

  /**
   * Create a new image by copying an axis aligned rectangle bounded by the top left ({@param x1}, {@param y1}) and the bottom right ({@param x2}, {@param y2}) points. The part of the copy that lies outside of the image will be repeated from the border.
   * @param {number} x1 The top left point x coordinate. 
   * @param {number} y1 The top left point y coordinate. 
   * @param {number} x2 The bottom right point x coordinate.
   * @param {number} y2 The bottom right point y coordinate. 
   * @returns {Image} The copied image.
   */
  public copyRectReplicateBorder(x1: number, y1: number, x2: number, y2: number): Image {
    return executeSDKFunction(LuxandFaceSDK.CopyRectReplicateBorder, returnImage, this.handle, x1, y1, x2, y2);
  }

  /**
   * Mirror the image. 
   * @param {boolean} vertical Whether mirroring is performed around the vertical or horizontal axis.
   * @returns {void}
   */
  public mirror(vertical: boolean = true): void {
    return executeSDKFunction(LuxandFaceSDK.MirrorImage, returnVoid, this.handle, vertical);
  }

  /**
   * Extract the part of the image that contains the face specified by {@param features} and resize it to {@param width}x{@param height}.
   * @param {Point[]} features Array of face key points. 
   * @param {number} width Target image width. 
   * @param {height} height Target image height.
   * @returns {FaceImage} The extracted part of the image and new features.
   */
  public extractFace(features: Point[], width: number, height: number): FaceImage {
    return executeSDKFunction(LuxandFaceSDK.ExtractFaceImage, returnFaceImage, this.handle, features, width, height);
  }

  /**
   * Detect a single face in the image. If multiple faces are present returns the one with the highest detection score. 
   * @returns {FacePosition} The detected face.
   */
  public detectFace(): FacePosition {
    return executeSDKFunction(LuxandFaceSDK.DetectFace, returnFacePosition, this.handle);
  }

  /**
   * Detect a single face in the image using the imroved face detection algorithm. If multiple faces are present returns the one with the highest detection score. 
   * @returns {Face} The detected face.
   */
  public detectFace2(): Face {
    return executeSDKFunction(LuxandFaceSDK.DetectFace2, returnFace, this.handle);
  }

  /**
   * Detect multiple faces in the image. The faces are sorted by detection score in descending order.
   * @param {number} maxFaces The maximal number of faces to detect.
   * @returns {FacePosition[]} The detected faces.
   */
  public detectMultipleFaces(maxFaces: number = 100): FacePosition[] {
    return executeSDKFunction(LuxandFaceSDK.DetectMultipleFaces, returnFacePositions, this.handle, maxFaces);
  }

  /**
   * Detect multiple faces in the image using the improved face detection algorithm. The faces are sorted by detection score in descending order.
   * @param {number} maxFaces The maximal number of faces to detect.
   * @returns {Face[]} The detected faces.
   */
  public detectMultipleFaces2(maxFaces: number = 100): Face[] {
    return executeSDKFunction(LuxandFaceSDK.DetectMultipleFaces2, returnFaces, this.handle, maxFaces);
  }

  /**
   * Detect 70 facial key points of a single face in the image. If multiple faces are present detects points for the face with the highest detection score. 
   * @returns {Point[]} The detected key points.
   */
  public detectFacialFeatures(): Point[] {
    return executeSDKFunction(LuxandFaceSDK.DetectFacialFeatures, returnFeatures, this.handle);
  }

  /**
   * Detect 70 facial key points for a given face {@param position}.
   * @param {FacePosition} position The face to detect key points for.
   * @returns {Point[]} The detected key points.
   */
  public detectFacialFeaturesInRegion(position: FacePosition): Point[] {
    return executeSDKFunction(LuxandFaceSDK.DetectFacialFeaturesInRegion, returnFeatures, this.handle, position);
  }

  /**
   * Detect the corrdinates of eye centers of a single face in the image. If multiple faces are present detects points for the face with the highest detection score. 
   * @returns {Point[]} The detected eyes points.
   */
  public detectEyes(): Point[] {
    return executeSDKFunction(LuxandFaceSDK.DetectEyes, returnFeatures, this.handle);
  }

  /**
   * Detect coordinates of eyes for a given face {@param position}.
   * @param {FacePosition} position The face to detect eyes for.
   * @returns {Point[]} The detected eyes points.
   */
  public detectEyesInRegion(position: FacePosition): Point[] {
    return executeSDKFunction(LuxandFaceSDK.DetectEyesInRegion, returnFeatures, this.handle, position);
  }

  /**
   * Get face template of a single face in the image. If multiple faces are present the face with the highest detection score is considered.
   * @returns {FaceTemplate} The face template.
   */
  public getFaceTemplate(): FaceTemplate {
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplate, returnFaceTemplate, this.handle)
  }

  /**
   * Get face template of a single face in the image using the improved face recognition algorithm. If multiple faces are present the face with the highest detection score is considered.
   * @returns {FaceTemplate} The face template.
   */
  public getFaceTemplate2(): FaceTemplate {
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplate2, returnFaceTemplate, this.handle)
  }

  /**
   * Get face template for a given face {@param position}.
   * @param {FacePosition} position The face to get template for.
   * @returns {FaceTemplate} The face template.
   */
  public getFaceTemplateInRegion(position: FacePosition): FaceTemplate {
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateInRegion, returnFaceTemplate, this.handle, position)
  }

  /**
   * Get face template for a given {@param face} using the improved face recognition algorithm.
   * @param {Face} face The face to get template for.
   * @returns {FaceTemplate} The face template.
   */
  public getFaceTemplateInRegion2(face: Face): FaceTemplate {
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateInRegion2, returnFaceTemplate, this.handle, face)
  }

  /**
   * Get face template given facial keypoints.
   * @param {Point[]} features The face to get template for.
   * @returns {FaceTemplate} The face template.
   */
  public getFaceTemplateUsingFeatures(features: Point[]): FaceTemplate {
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateUsingFeatures, returnFaceTemplate, this.handle, features)
  }


  /**
   * Get face template given eye coodinates.
   * @param {Point[]} eyes Coordinates of the eye centers.
   * @returns {FaceTemplate} The face template.
   */
  public getFaceTemplateUsingEyes(eyes: Point[]): FaceTemplate {
    return executeSDKFunction(LuxandFaceSDK.GetFaceTemplateUsingFeatures, returnFaceTemplate, this.handle, eyes)
  }

  /**
   * Detect facial attribute values (i.e. angles, liveness) using facial keypoints.
   * @template {FacialAttribute[]} A
   * @param {Point[]} features Array of facial keypoints.
   * @param {A} attributes The attributes to detect.
   * @returns {Object} An object with attribute values. The obejct keys depend on which attriutes are requested.
   */
  public detectFacialAttributeUsingFeatures<A extends FacialAttribute[]>(features: Point[], ...attributes: A): FlatType<FacialAttributesResults<A>> {
    return executeSDKFunction(LuxandFaceSDK.DetectFacialAttributeUsingFeatures, makeReturnAttributes(...attributes), this.handle, features, attributes.join(';'), 128 * attributes.length);
  }

  /**
   * Detect facial attribute values (i.e. angles, liveness) using facial keypoints.
   * @param {Point[]} features Array of facial keypoints.
   * @param {string | string[]} attribute The attribute (or array of attributes) to detect.
   * @param {string} maxSize The maximal size of the returned string.
   * @returns {string} A string with the detected attribute values in key1=value1;key2=value2; format.
   */
  public detectFacialAttributeUsingFeaturesRaw(features: Point[], attribute: string | string[], maxSize: number = 256): string {
    return executeSDKFunction(LuxandFaceSDK.DetectFacialAttributeUsingFeatures, returnEmptyString, this.handle, features, attribute instanceof Array ? attribute.join(';') : attribute, maxSize);
  }
}


/** A wrapper object for a FSDK Tracker */
export class Tracker extends FSDKObject {

  /**
   * Create an empty tracker.
   * @returns {Tracker} The tracker.
   */
  public static Create(): Tracker {
    return executeSDKFunction(LuxandFaceSDK.CreateTracker, returnTracker);
  }

  /**
   * Create a tracker and load its memory from file.
   * @param {string} filename Path to the tracker memory file.
   * @returns {Tracker} The tracker.
   */
  public static FromFile(filename: string): Tracker {
    return executeSDKFunction(LuxandFaceSDK.LoadTrackerMemoryFromFile, returnTracker, filename);
  }

  /**
   * Create a tracker and load its memory from {@param buffer}.
   * @param {BufferLike} buffer A buffer with tracker memory.
   * @returns {Tracker} The tracker.
   */
  public static FromBuffer(buffer: BufferLike): Tracker {
    return executeSDKFunction(LuxandFaceSDK.LoadTrackerMemoryFromBuffer, returnTracker, getBase64(buffer));
  }

  /**
   * Free the tracker. The tracker becomes invalid.
   * @returns {void}
   */
  public free(): void {
    const result = executeSDKFunction(LuxandFaceSDK.FreeTracker, returnVoid, this.handle);
    this.handle = -1;
    return result;
  }

  /**
   * Clear tracker memory. Sets all parameters to their default values and clears any stored faces. 
   * @returns {void}
   */
  public clear(): void {
    return executeSDKFunction(LuxandFaceSDK.ClearTracker, returnVoid, this.handle);
  }

  /**
   * Save tracker memory to file. Including parameters and faces.
   * @param {string} filename Path to save memory to.
   * @returns {void}
   */
  public saveToFile(filename: string): void {
    return executeSDKFunction(LuxandFaceSDK.SaveTrackerMemoryToFile, returnVoid, this.handle, filename);
  }

  /**
   * Get the size (in bytes) of a byte buffer that is enough to store the tracker memory.
   * @returns {number} The buffer size in bytes.
   */
  public getMemoryBufferSize(): number {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerMemoryBufferSize, returnZero, this.handle);
  }

  /**
   * Save tracker memory to buffer.
   * @returns {Buffer} The buffer.
   */
  public saveToBuffer(): Buffer {
    const size = this.getMemoryBufferSize();
    return executeSDKFunction(LuxandFaceSDK.SaveTrackerMemoryToBuffer, returnBuffer, this.handle, size);
  }

  /**
   * Set tracker parameter.
   * @template {TrackerParameter} P
   * @param {P} name Tracker parameter name.
   * @param {TrackerParameterValueType<P>} value Tracker parameter value.
   * @returns {void}
   */
  public setParameter<P extends TrackerParameter>(name: P, value: ParameterValueType<P>): void {
    return executeSDKFunction(LuxandFaceSDK.SetTrackerParameter, returnVoid, this.handle, name, value instanceof Array ? value.join(',') : value.toString());
  }

  /**
   * Set tracker parameter.
   * @param {TrackerParameter} name Tracker parameter name.
   * @param {string} value Tracker parameter value.
   * @returns {void}
   */
  public setParameterRaw(name: string, value: string): void {
    return executeSDKFunction(LuxandFaceSDK.SetTrackerParameter, returnVoid, this.handle, name, value);
  }

  /**
   * Set multiple tracker parameters.
   * @template {TrackerParameter} P Tracker parameters to set.
   * @param {string | TrackerParameters<P>} parameters Parameters to set. If string, must have the following format 'key1=value1;key2=value2;...'
   * @returns {number} Index of the parsing error position if any.
   */
  public setMultipleParameters<P extends TrackerParameter>(parameters: string | TrackerParameters<P>): number {
    return executeSDKFunction(LuxandFaceSDK.SetTrackerMultipleParameters, returnErrorPositsion, this.handle, getParametersString(parameters));
  }

  /**
   * Get tracker parameter value.
   * @template {TrackerParameter} P
   * @param {P} parameter The parameter to get the value of.
   * @param {number} maxSize The max size of the internal string buffer for parameter value retrieval.
   * @returns {FlatType<ParameterValueType<P>>} The parameter value.
   */
  public getParameter<P extends TrackerParameter>(parameter: P, maxSize: number = 100): ParameterValueType<P> {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerParameter, makeReturnParameterValue(parameter), this.handle, parameter, maxSize);
  }

  /**
   * Process an image using tracker, which includes face detection, recognition, tracking, facial features and attributes detection.
   * @param {Image} image The image to process.
   * @param {number} maxFaces Maximal number of faces to process.
   * @param {number} index Camera index (unused).
   * @returns {number[]} Array of detected ids.
   */
  public feedFrame(image: Image, maxFaces: number = 256, index: number = 0): number[] {
    return executeSDKFunction(LuxandFaceSDK.FeedFrame, returnIDs, this.handle, index, image.handle, maxFaces);
  }

  /**
   * Get eye coordinates for a id.
   * @param {number} id Id of the face to get eye coordinates for.
   * @param {number} index Camera index (unused).
   * @returns {Point[]} Array of two points -- the eye coordinates.
   */
  public getEyes(id: number, index: number = 0): Point[] {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerEyes, returnFeatures, this.handle, index, id);
  }

  /**
   * Get facial feature coordinates for a id.
   * @param {number} id Id of the face to get facial feature coordinates for.
   * @param {number} index Camera index (unused).
   * @returns {Point[]} Array of 70 points -- the facial feature coordinates.
   */
  public getFacialFeatures(id: number, index: number = 0): Point[] {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFacialFeatures, returnFeatures, this.handle, index, id);
  }

  /**
   * Get face position for a id.
   * @param {number} id Id of the face to get face position for.
   * @param {number} index Camera index (unused).
   * @returns {FacePosition} The face position.
   */
  public getFacePosition(id: number, index: number = 0): FacePosition {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFacePosition, returnFacePosition, this.handle, index, id);
  }

  /**
   * Get face (bounding box) for a id.
   * @param {number} id Id of the face to get face for.
   * @param {number} index Camera index (unused).
   * @returns {Face} The face.
   */
  public getFace(id: number, index: number = 0): Face {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFace, returnFace, this.handle, index, id);
  }

  /**
   * Lock a face id. Required for any operation with the id (i.e. getting or setting the name).
   * @param {number} id Face id to lock. 
   * @returns {void}
   */
  public lockID(id: number): void {
    return executeSDKFunction(LuxandFaceSDK.LockID, returnVoid, this.handle, id);
  }

  /**
   * Unlock a id.
   * @param {number} id Face id to unlock. 
   * @returns {void}
   */
  public unlockID(id: number): void {
    return executeSDKFunction(LuxandFaceSDK.UnlockID, returnVoid, this.handle, id);
  }

  /**
   * Purge a id, deleting any information stored for that id.
   * @param {number} id Face id to purge. 
   * @returns {void}
   */
  public purgeID(id: number): void {
    return executeSDKFunction(LuxandFaceSDK.PurgeID, returnVoid, this.handle, id);
  }

  /**
   * Set name for a id.
   * @param {number} id Id to set name for.
   * @param {string} name The new name.
   * @returns {void}
   */
  public setName(id: number, name: string): void {
    return executeSDKFunction(LuxandFaceSDK.SetName, returnVoid, this.handle, id, name);
  }

  /**
   * Get the name for a id.
   * @param {number} id Id to get the name for.
   * @param {number} maxSize The maximal size of the returned string.
   * @returns {string} The name.
   */
  public getName(id: number, maxSize: number = 256): string {
    return executeSDKFunction(LuxandFaceSDK.GetName, returnEmptyString, this.handle, id, maxSize);
  }

  /**
   * Get a list of names associated with the id. This includes the name of the id and also the names of similar ids.
   * @param {number} id Id to get the name for.
   * @param {number} maxSize The maximal size of the returned string.
   * @returns {string[]} The list of names.
   */
  public getAllNames(id: number, maxSize: number = 256): string[] {
    return executeSDKFunction(LuxandFaceSDK.GetAllNames, returnNamesList, this.handle, id, maxSize);
  }

  /**
   * If there was an id merge, return the id that this id was merged into. Otherwise return the same id.
   * @param {number} id Id to get the merged id for.
   * @returns {number} The merged id.
   */
  public getIDReassignment(id: number): number {
    return executeSDKFunction(LuxandFaceSDK.GetIDReassignment, returnNegativeOne, this.handle, id);
  }

  /**
   * Get the number of ids similar to this id.
   * @param {number} id Id to get the number of similar ids for.
   * @returns {number} The number of similar ids.
   */
  public getSimilarIDCount(id: number): number {
    return executeSDKFunction(LuxandFaceSDK.GetSimilarIDCount, returnZero, this.handle, id);
  }

  /**
   * Get the similar ids to this id.
   * @param {number} id Id to get similar ids for.
   * @returns {number[]} Array of ids.
   */
  public getSimilarIDList(id: number): number[] {
    return executeSDKFunction(LuxandFaceSDK.GetSimilarIDList, returnIDs, this.handle, id, this.getSimilarIDCount(id));
  }

  /**
   * Get the total number of ids stored in tracker memory.
   * @returns {number} The number of ids.
   */
  public getIDsCount(): number {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerIDsCount, returnZero, this.handle);
  }

  /**
   * Get all tracker ids.
   * @returns {number[]} Array of tracker ids.
   */
  public getAllIDs(): number[] {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerAllIDs, returnIDs, this.handle, this.getIDsCount());
  }

  /**
   * Get the number of face ids for id.
   * @param {number} id Id to get the number of face ids for.
   * @returns {number} The number of face ids.
   */
  public getFaceIDsCountForID(id: number): number {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceIDsCountForID, returnZero, this.handle, id);
  }

  /**
   * Get face ids for id.
   * @param {number} id Id to get face ids for.
   * @returns {number[]} Array of face ids.
   */
  public getFaceIDsForID(id: number): number[] {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceIDsForID, returnIDs, this.handle, id, this.getFaceIDsCountForID(id));
  }

  /**
   * Get id for a face id.
   * @param {number} faceID Face id to get id for.
   * @returns {number} The id.
   */
  public getIDByFaceID(faceID: number): number {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerIDByFaceID, returnNegativeOne, this.handle, faceID);
  }

  /**
   * Get the face template for face id.
   * @param {number} faceID Face id to get face template for.
   * @returns {FaceTemplate} The face template.
   */
  public getFaceTemplate(faceID: number): FaceTemplate {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceTemplate, returnFaceTemplate, this.handle, faceID);
  }

  /**
   * Get the face image for face id.
   * @param {number} faceID Face id to get face image for.
   * @returns {Image} The face image.
   */
  public getFaceImage(faceID: number): Image {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFaceImage, returnImage, this.handle, faceID);
  }

  /**
   * Set the face image for face id.
   * @param {number} faceID Face id to set face image for.
   * @param {Image} image The face image.
   * @returns {void}
   */
  public setFaceImage(faceID: number, image: Image): void {
    return executeSDKFunction(LuxandFaceSDK.SetTrackerFaceImage, returnVoid, this.handle, faceID, image.handle);
  }

  /**
   * Delete the face image for face id.
   * @param {number} faceID Face id to delete the face image for. 
   * @returns {void}
   */
  public deleteFaceImage(faceID: number): void {
    return executeSDKFunction(LuxandFaceSDK.DeleteTrackerFaceImage, returnVoid, this.handle, faceID);
  }

  /**
   * Create a new id in the tracker memory.
   * @param {FaceTemplate} template Face template of the id.
   * @returns {number} The newly created id.
   */
  public createID(template: FaceTemplate): TrackerID {
    return executeSDKFunction(LuxandFaceSDK.TrackerCreateID, returnTrackerID, this.handle, template.asBase64());
  }

  /**
   * Add a new face template for id.
   * @param {number} id Id to add a new template for.
   * @param {FaceTemplate} template The template.
   * @returns {void}
   */
  public addFaceTemplate(id: number, template: FaceTemplate): void {
    return executeSDKFunction(LuxandFaceSDK.AddTrackerFaceTemplate, returnVoid, this.handle, id, template.asBase64());
  }

  /**
   * Delete face id.
   * @param {number} faceID Face id to delete.
   * @returns {void}
   */
  public deleteFace(faceID: number): void {
    return executeSDKFunction(LuxandFaceSDK.DeleteTrackerFace, returnVoid, this.handle, faceID);
  }

  /**
   * Get ids and their similarities for a face template.
   * @param {FaceTemplate} template The template to find similar ids for.
   * @param {number} threshold Matching similarity threshold for the returned ids.
   * @param {number} maxSize Maximal number of ids to return.
   * @returns {IDSimilarity[]} Array of ids and their similarities.
   */
  public matchFaces(template: FaceTemplate, threshold: number, maxSize: number = 256): IDSimilarity[] {
    return executeSDKFunction(LuxandFaceSDK.TrackerMatchFaces, returnIDSimilarities, this.handle, template.asBase64(), threshold, maxSize);
  }

  /**
   * Get facial attribute values (i.e. angles, liveness) for an id.
   * @template {TrackerFacialAttribute[]} A
   * @param {number} id Id to get attributes for.
   * @param {A} attributes The attributes to get.
   * @returns {Object} An object with attribute values. The obejct keys depend on which attriutes are requested.
   */
  public getFacialAttribute<A extends TrackerFacialAttribute[]>(id: number, ...attributes: A): FlatType<FacialAttributesResults<A>> {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFacialAttribute, makeReturnAttributes(...attributes), this.handle, 0, id, attributes.join(';'), 128 * attributes.length);
  }

  /**
   * Get facial attribute values (i.e. angles, liveness) for an id.
   * @param {number} id Id to get attributes for.
   * @param {string | string[]} attribute The attribute (or array of attributes) to get.
   * @param {string} maxSize The maximal size of the returned string.
   * @param {number} index Camera index (unused).
   * @returns {string} A string with the attribute values in key1=value1;key2=value2; format.
   */
  public getFacialAttributeRaw(id: number, attribute: string | string[], maxSize: number = 256, index: number = 0): string {
    return executeSDKFunction(LuxandFaceSDK.GetTrackerFacialAttribute, returnEmptyString, this.handle, index, id, attribute instanceof Array ? attribute.join(';') : attribute, maxSize);
  }
}


/** A wrapper object for an IP camera */
export class Camera extends FSDKObject {

  /**
   * Set an HTTP proxy to be used with an IP camera.
   * @param {string} address Proxy address.
   * @param {number} port Proxy port.
   * @param {string} username Proxy username.
   * @param {string} password Proxy password.
   * @returns {void}
   */
  public static SetHTTPProxy(address: string, port: number, username: string, password: string): void {
    return executeSDKFunction(LuxandFaceSDK.SetHTTPProxy, returnVoid, address, port, username, password);
  }

  /**
   * Open IP video camera at a given URL.
   * @param {FlatType<VIDEOCOMPRESSIONTYPE>} comression Video compression to use.
   * @param {string} url Camera URL.
   * @param {string} username Camera access username.
   * @param {string} password Camera access password.
   * @param {number} timeout Connection timeout in seconds.
   * @returns {Camera} The IP video camera.
   */
  public static OpenIPVideoCamera(comression: FlatType<VIDEOCOMPRESSIONTYPE>, url: string, username: string, password: string, timeout: number): Camera {
    return executeSDKFunction(LuxandFaceSDK.OpenIPVideoCamera, returnCamera, comression, url, username, password, timeout);
  }

  /**
   * Initialize the capturing process.
   * @returns {void}
   */
  public static InitializeCapturing(): void {
    return executeSDKFunction(LuxandFaceSDK.InitializeCapturing, returnVoid);
  }

  /**
   * Finalize the capturing process.
   * @returns {void}
   */
  public static FinalizeCapturing(): void {
    return executeSDKFunction(LuxandFaceSDK.FinalizeCapturing, returnVoid);
  }

  /**
   * Obtain the current camera frame image.
   * @returns {Image} The frame image.
   */
  public grabFrame(): Image {
    return executeSDKFunction(LuxandFaceSDK.GrabFrame, returnImage, this.handle);
  }

  /**
   * Close the camera. Camera becomes invalid.
   * @returns {void}
   */
  public close(): void {
    const result = executeSDKFunction(LuxandFaceSDK.CloseVideoCamera, returnVoid, this.handle);
    this.handle = -1;
    return result;    
  }
}


/** Main FSDK class, exposing all the functions at once */
export default class FSDK {

  public static readonly LuxandFaceSDK = LuxandFaceSDK;

  public static readonly Image = Image;
  public static readonly Buffer = Buffer;
  public static readonly Camera = Camera;
  public static readonly Tracker = Tracker;
  public static readonly FaceTemplate = FaceTemplate;

  public static readonly ERROR = ERROR;
  public static readonly FEATURE = FEATURE;
  public static readonly IMAGEMODE = IMAGEMODE;
  public static readonly FACIAL_FEATURE_COUNT = FACIAL_FEATURE_COUNT;
  public static readonly VIDEOCOMPRESSIONTYPE = VIDEOCOMPRESSIONTYPE;

  public static readonly ON_ERROR = ON_ERROR;
  public static onError = ON_ERROR.THROW;

  public static readonly Worklets = FSDKWorklets;


  /**
   * Set error behaviour. 
   * @param {ON_ERROR} value The new on error behaviour.
   * @returns {void}
   */
  public static SetOnError(value: ON_ERROR): void {
    this.onError = value;
  }

  /**
   * Activate the library. Must be called before any other FSDK function.
   * @param {string} licenseKey The license key string.
   * @returns {void}
   */
  public static ActivateLibrary(licenseKey: string): void {
    return executeSDKFunction(LuxandFaceSDK.ActivateLibrary, returnVoid, licenseKey);
  }

  /**
   * Initializes the library. Must be called after {@member ActivateLibrary}.
   * @returns {void}
   */
  public static Initialize(): void {
    LuxandFaceSDK.SetParameter('environment', 'React-Native');
    return executeSDKFunction(LuxandFaceSDK.Initialize, returnVoid);
  }

  /**
   * Activates and initializes the library. Must be called before any other FSDK function.
   * @param {string} licenseKey The license key string.
   * @returns {void}
   */
  public static ActivateAndInitalize(licenseKey: string): void {
    this.ActivateLibrary(licenseKey);
    return this.Initialize();
  }

  /**
   * Get license information string.
   * @returns {string} The information string.
   */
  public static GetLicenseInfo(): string {
    return executeSDKFunction(LuxandFaceSDK.GetLicenseInfo, returnEmptyString)
  }

  /**
   * Create an empty image.
   * @returns {Image} The image.
   */
  public static CreateEmptyImage(): Image {
    return Image.Empty();
  }

  /**
   * Free the internal image buffer. The image becomes invalid.
   * @param {Image} image The image to free.
   * @returns {void}
   */
  public static FreeImage(image: Image): void {
    return image.free();
  }

  /**
   * Open an image from a file. PNG, JPG and BMP formats are supported.
   * @param {string} filename The path to the image file.
   * @returns {Image} The image.
   */
  public static LoadImageFromFile(filename: string): Image {
    return Image.FromFile(filename);
  }

  /**
   * Open an image from a file preserving the alpha channel. PNG, JPG and BMP formats are supported.
   * @param {string} filename The path to the image file.
   * @returns {Image} The image.
   */
  public static LoadImageFromFileWithAlpha(filename: string): Image {
    return Image.FromFileWithAlpha(filename);
  }

  /**
   * Load an image from a pixel byte buffer. The buffer encodes the image top to bottom with pixel stride equal to pixel byte size and row stride equal to {@param scanLine}.
   * @param {BufferLike} buffer The image buffer.
   * @param {number} width The width of the image.
   * @param {number} height The height of the image.
   * @param {number} scanLine The number of bytes per image row -- row stride.
   * @param {IMAGEMODE} imageMode Image pixel format.
   * @returns {Image} The image.
   */
  public static LoadImageFromBuffer(buffer: BufferLike, width: number, height: number, scanLine: number, imageMode: IMAGEMODE): Image {
    return Image.FromBuffer(buffer, width, height, scanLine, imageMode);
  }

  /**
   * Load an image from a JPEG buffer.
   * @param {BufferLike} buffer The image encoded in JPEG format. 
   * @returns {Image} The image.
   */
  public static LoadImageFromJpegBuffer(buffer: BufferLike): Image {
    return Image.FromJpegBuffer(buffer);
  }

  /**
   * Load an image from a PNG buffer.
   * @param {BufferLike} buffer The image encoded in PNG format. 
   * @returns {Image} The image.
   */
  public static LoadImageFromPngBuffer(buffer: BufferLike): Image {
    return Image.FromPngBuffer(buffer);
  }

  /**
   * Load an image from a PNG buffer preserving the alpha channel.
   * @param {BufferLike} buffer The image encoded in PNG format. 
   * @returns {Image} The image.
   */
  public static LoadImageFromPngBufferWithAlpha(buffer: BufferLike): Image {
    return Image.FromPngBufferWithAlpha(buffer);
  }

  /**
   * Save the image into a file specified by {@param filename}.
   * @param {Image} image The image to save.
   * @param {string} filename Path to save the image to.
   * @returns {void}
   */
  public static SaveImageToFile(image: Image, filename: string): void {
    return image.saveToFile(filename);
  }

  /**
   * Set JPEG compression quality used for saving images in JPEG format.
   * @param {number} quality The quality to use.
   * @returns {void}
   */
  public static SetJpegCompressionQuality(quality: number): void {
    return executeSDKFunction(LuxandFaceSDK.SetJpegCompressionQuality, returnVoid, quality);
  }

  /**
   * Get image width.
   * @param {Image} image The image to get the width of.
   * @returns {number} The width of the image.
   */
  public static GetImageWidth(image: Image): number {
    return image.getWidth();
  }

  /**
   * Get image height.
   * @param {Image} image The image to get the height of.
   * @returns {number} The height of the image.
   */
  public static GetImageHeight(image: Image): number {
    return image.getHeight();
  }

  /**
   * Get the size (in bytes) of a byte buffer that encodes the image in {@param IMAGEMODE} format. Such buffer is guaranteed to have the pixel stride equal to the pixel size in bytes and row stride equal to {@member width} * pixel stride.
   * @param {Image} image The image to get the buffer size of.
   * @param {IMAGEMODE} imageMode The image format to use.
   * @returns {number} The buffer size in bytes.
   */
  public static GetImageBufferSize(image: Image, imageMode: IMAGEMODE): number {
    return image.getBufferSize(imageMode);
  }

  /**
   * Save image into a byte buffer.
   * @param {Image} image Image to save.
   * @param {IMAGEMODE} imageMode Image format to use. 
   * @returns {Buffer} The buffer.
   */
  public static SaveImageToBuffer(image: Image, imageMode: IMAGEMODE): Buffer {
    return image.saveToBuffer(imageMode);
  }

  /**
   * Create a copy of the image.
   * @param {Image} image The image to create a copy of.
   * @returns {Image} The image copy.
   */
  public static CopyImage(image: Image): Image {
    return image.copy();
  }

  /**
   * Create a new image by increasing (or decreasing) the total size by {@param ratio}.
   * @param {Image} image The image to resize.
   * @param {number} ratio The ratio to change the size of the image by. 
   * @returns {Image} The resized image.
   */
  public static ResizeImage(image: Image, ratio: number): Image {
    return image.resize(ratio);
  }

  /**
   * Create a new image by rotating 90 * {@param multiplier} degrees around the center. Negative values rotate counterclockwise.
   * @param {Image} image The image to rotate.
   * @param {number} multiplier The number of times to rotate the image 90 degrees.
   * @returns {Image} The rotated image.
   */
  public static RotateImage90(image: Image, multiplier: number): Image {
    return image.rotate90(multiplier);
  }

  /**
   * Create a new image by rotating {@param angle} degrees around the center.
   * @param {Image} image The image to rotate.
   * @param {number} angle The angle to rotate the image by.
   * @returns {Image} The rotated image.
   */
  public static RotateImage(image: Image, angle: number): Image {
    return image.rotate(angle);
  }

  /**
   * Create a new image by rotating {@param angle} degrees around the point ({@param x}, {@param y}).
   * @param {Image} image The image to rotate.
   * @param {number} angle The angle to rotate the image by.
   * @param {number} x The x coordinate of the center. 
   * @param {number} y The y coordinate of the center.
   * @returns {Image} The rotated image.
   */
  public static RotateImageCenter(image: Image, angle: number, x: number, y: number): Image {
    return image.rotateCenter(angle, x, y);
  }

  /**
   * Create a new image by copying an axis aligned rectangle bounded by the top left ({@param x1}, {@param y1}) and the bottom right ({@param x2}, {@param y2}) points.
   * @param {Image} image The image to copy a rect from.
   * @param {number} x1 The top left point x coordinate. 
   * @param {number} y1 The top left point y coordinate. 
   * @param {number} x2 The bottom right point x coordinate.
   * @param {number} y2 The bottom right point y coordinate. 
   * @returns {Image} The copied image.
   */
  public static CopyRect(image: Image, x1: number, y1: number, x2: number, y2: number): Image {
    return image.copyRect(x1, y1, x2, y2);
  }

  /**
   * Create a new image by copying an axis aligned rectangle bounded by the top left ({@param x1}, {@param y1}) and the bottom right ({@param x2}, {@param y2}) points. The part of the copy that lies outside of the image will be repeated from the border.
   * @param {Image} image The image to copy a rect from.
   * @param {number} x1 The top left point x coordinate. 
   * @param {number} y1 The top left point y coordinate. 
   * @param {number} x2 The bottom right point x coordinate.
   * @param {number} y2 The bottom right point y coordinate. 
   * @returns {Image} The copied image.
   */
  public static CopyRectReplicateBorder(image: Image, x1: number, y1: number, x2: number, y2: number): Image {
    return image.copyRectReplicateBorder(x1, y1, x2, y2);
  }

  /**
   * Mirror the image.
   * @param {Image} image The image to mirror.
   * @param {boolean} vertical Whether mirroring is performed around the vertical or horizontal axis.
   * @returns {void}
   */
  public static MirrorImage(image: Image, vertical: boolean = true): void {
    return image.mirror(vertical);
  }

  /**
   * Extract the part of the image that contains the face specified by {@param features} and resize it to {@param width}x{@param height}.
   * @param {Image} image The imate to extract a face image from.
   * @param {Point[]} features Array of face key points. 
   * @param {number} width Target image width. 
   * @param {height} height Target image height.
   * @returns {FaceImage} The extracted part of the image and new features.
   */
  public static ExtractFaceImage(image: Image, features: Point[], width: number, height: number): FaceImage {
    return image.extractFace(features, width, height);
  }

  /**
   * Detect a single face in the image. If multiple faces are present returns the one with the highest detection score. 
   * @param {Image} image The image to detect face on.
   * @returns {FacePosition} The detected face.
   */
  public static DetectFace(image: Image): FacePosition {
    return image.detectFace();
  }

  /**
   * Detect a single face in the image using the imroved face detection algorithm. If multiple faces are present returns the one with the highest detection score. 
   * @param {Image} image The image to detect face on.
   * @returns {Face} The detected face.
   */
  public static DetectFace2(image: Image): Face {
    return image.detectFace2();
  }

  /**
   * Detect multiple faces in the image. The faces are sorted by detection score in descending order.
   * @param {Image} image The image to detect faces on.
   * @param {number} maxFaces The maximal number of faces to detect.
   * @returns {FacePosition[]} The detected faces.
   */
  public static DetectMultipleFaces(image: Image, maxFaces: number = 100): FacePosition[] {
    return image.detectMultipleFaces(maxFaces);
  }

  /**
   * Detect multiple faces in the image using the improved face detection algorithm. The faces are sorted by detection score in descending order.
   * @param {Image} image The image to detect faces on.
   * @param {number} maxFaces The maximal number of faces to detect.
   * @returns {Face[]} The detected faces.
   */
  public static DetectMultipleFaces2(image: Image, maxFaces: number = 100): Face[] {
    return image.detectMultipleFaces2(maxFaces);
  }

  /**
   * Set face detection parameters. These do not apply to the improved face detection algorithm.
   * @param {boolean} handleArbitraryRotations Detect rotated faces.
   * @param {boolean} determineFaceRotationAngle Determine the face box rotation angle.
   * @param {number} internalResizeWidth 
   * @returns {void} 
   */
  public static SetFaceDetectionParameters(handleArbitraryRotations: boolean, determineFaceRotationAngle: boolean, internalResizeWidth: number): void {
    return executeSDKFunction(LuxandFaceSDK.SetFaceDetectionParameters, returnVoid, handleArbitraryRotations, determineFaceRotationAngle, internalResizeWidth);
  }

  /**
   * Set face detection threshold. This does not apply to the improved face detection algorithm.
   * @param {number} threshold The face detection threshold.
   * @returns {void}
   */
  public static SetFaceDetectionThreshold(threshold: number): void {
    return executeSDKFunction(LuxandFaceSDK.SetFaceDetectionThreshold, returnVoid, threshold);
  }

  /**
   * Get the last detected face confidence.
   * @returns {number} The confidence.
   */
  public static GetDetectedFaceConfidence(): number {
    return executeSDKFunction(LuxandFaceSDK.GetDetectedFaceConfidence, returnZero);
  }

  /**
   * Detect 70 facial key points of a single face in the image. If multiple faces are present detects points for the face with the highest detection score. 
   * @param {Image} image The image to detect features on.
   * @returns {Point[]} The detected key points.
   */
  public static DetectFacialFeatures(image: Image): Point[] {
    return image.detectFacialFeatures();
  }

  /**
   * Detect 70 facial key points for a given face {@param position}.
   * @param {Image} image The image to detect features on.
   * @param {FacePosition} position The face to detect key points for.
   * @returns {Point[]} The detected key points.
   */
  public static DetectFacialFeaturesInRegion(image: Image, position: FacePosition): Point[] {
    return image.detectFacialFeaturesInRegion(position);
  }

  /**
   * Detect the corrdinates of eye centers of a single face in the image. If multiple faces are present detects points for the face with the highest detection score. 
   * @param {Image} image The image to detect eyes on.
   * @returns {Point[]} The detected eyes points.
   */
  public static DetectEyes(image: Image): Point[] {
    return image.detectEyes();
  }

  /**
   * Detect coordinates of eyes for a given face {@param position}.
   * @param {Image} image The image to detect eyes on.
   * @param {FacePosition} position The face to detect eyes for.
   * @returns {Point[]} The detected eyes points.
   */
  public static DetectEyesInRegion(image: Image, position: FacePosition): Point[] {
    return image.detectEyesInRegion(position);
  }

  /**
   * Get face template of a single face in the image. If multiple faces are present the face with the highest detection score is considered.
   * @param {Image} image The image to get face template for.
   * @returns {FaceTemplate} The face template.
   */
  public static GetFaceTemplate(image: Image): FaceTemplate {
    return image.getFaceTemplate();
  }

  /**
   * Get face template of a single face in the image using the improved face recognition algorithm. If multiple faces are present the face with the highest detection score is considered.
   * @param {Image} image The image to get face template for.
   * @returns {FaceTemplate} The face template.
   */
  public static GetFaceTemplate2(image: Image): FaceTemplate {
    return image.getFaceTemplate2();
  }

  /**
   * Get face template for a given face {@param position}.
   * @param {Image} image The image to get face template for.
   * @param {FacePosition} position The face to get template for.
   * @returns {FaceTemplate} The face template.
   */
  public static GetFaceTemplateInRegion(image: Image, position: FacePosition): FaceTemplate {
    return image.getFaceTemplateInRegion(position);
  }

  /**
   * Get face template for a given {@param face} using the improved face recognition algorithm.
   * @param {Image} image The image to get face template for.
   * @param {Face} face The face to get template for.
   * @returns {FaceTemplate} The face template.
   */
  public static GetFaceTemplateInRegion2(image: Image, face: Face): FaceTemplate {
    return image.getFaceTemplateInRegion2(face);
  }

  /**
   * Get face template given facial keypoints.
   * @param {Image} image The image to get face template for.
   * @param {Point[]} features The face to get template for.
   * @returns {FaceTemplate} The face template.
   */
  public static GetFaceTemplateUsingFeatures(image: Image, features: Point[]): FaceTemplate {
    return image.getFaceTemplateUsingFeatures(features);
  }

  /**
   * Get face template given eye coodinates.
   * @param {Image} image The image to get face template for.
   * @param {Point[]} eyes Coordinates of the eye centers.
   * @returns {FaceTemplate} The face template.
   */
  public static GetFaceTemplateUsingEyes(image: Image, eyes: Point[]): FaceTemplate {
    return image.getFaceTemplateUsingEyes(eyes);
  }

  /**
   * Get the similarity score between two face templates.
   * @param {FaceTemplate} template1 First template.
   * @param {FaceTemplate} template1 Second template.
   * @returns {number} The similarity score.
   */
  public static MatchFaces(template1: FaceTemplate, template2: FaceTemplate): number {
    return executeSDKFunction(LuxandFaceSDK.MatchFaces, returnZero, template1.asBase64(), template2.asBase64());
  }

  /**
   * Get a matching threshold that achieves the gives false acceptance rate ({@param far}).
   * @param {number} far Requested false acceptance rate.
   * @returns {number} The matching threshold.
   */
  public static GetMatchingThresholdAtFAR(far: number): number {
    return executeSDKFunction(LuxandFaceSDK.GetMatchingThresholdAtFAR, returnZero, far);
  }

  /**
   * Get a matching threshold that achieves the gives false rejection rate ({@param frr}).
   * @param {number} frr Requested false rejection rate.
   * @returns {number} The matching threshold.
   */
  public static GetMatchingThresholdAtFRR(frr: number): number {
    return executeSDKFunction(LuxandFaceSDK.GetMatchingThresholdAtFRR, returnZero, frr);
  }

  /**
   * Create an empty tracker.
   * @returns {Tracker} The tracker.
   */
  public static CreatTracker(): Tracker {
    return Tracker.Create();
  }

  /**
   * Create a tracker and load its memory from file.
   * @param {string} filename Path to the tracker memory file.
   * @returns {Tracker} The tracker.
   */
  public static LoadTrackerMemoryFromFile(filename: string): Tracker {
    return Tracker.FromFile(filename);
  }

  /**
   * Create a tracker and load its memory from {@param buffer}.
   * @param {BufferLike} buffer A buffer with tracker memory.
   * @returns {Tracker} The tracker.
   */
  public static LoadTrackerMemoryFromBuffer(buffer: BufferLike): Tracker {
    return Tracker.FromBuffer(buffer);
  }

  /**
   * Free the tracker. The tracker becomes invalid.
   * @param {Tracker} tracker The tracker to free.
   * @returns {void}
   */

  public static FreeTracker(tracker: Tracker): void {
    return tracker.free();
  }

  /**
   * Clear tracker memory. Sets all parameters to their default values and clears any stored faces. 
   * @param {Tracker} tracker The tracker to clear.
   * @returns {void}
   */
  public static ClearTracker(tracker: Tracker): void {
    return tracker.clear();
  }

  /**
   * Save tracker memory to file. Including parameters and faces.
   * @param {Tracker} tracker The tracker to save.
   * @param {string} filename Path to save memory to.
   * @returns {void}
   */
  public static SaveTrackerMemoryToFile(tracker: Tracker, filename: string): void {
    return tracker.saveToFile(filename);
  }

  /**
   * Get the size (in bytes) of a byte buffer that is enough to store the tracker memory.
   * @param {Tracker} tracker The tracker to get buffer size for.
   * @returns {number} The buffer size in bytes.
   */
  public static GetTrackerMemoryBufferSize(tracker: Tracker): number {
    return tracker.getMemoryBufferSize();
  }

  /**
   * Save tracker memory to buffer.
   * @param {Tracker} tracker The tracker to save.
   * @returns {Buffer} The buffer.
   */
  public static SaveTrackerMemoryToBuffer(tracker: Tracker): Buffer {
    return tracker.saveToBuffer();
  }

  /**
   * Set tracker parameter.
   * @template {TrackerParameter} P
   * @param {Tracker} tracker The tracker to set the parameter for.
   * @param {P} name Tracker parameter name.
   * @param {TrackerParameterValueType<P>} value Tracker parameter value.
   * @returns {void}
   */
  public static SetTrackerParameter<P extends TrackerParameter>(tracker: Tracker, name: P, value: ParameterValueType<P>): void {
    return tracker.setParameter(name, value);
  }

  /**
   * Set tracker parameter.
   * @param {Tracker} tracker The tracker to set the parameter for.
   * @param {string} name Tracker parameter name.
   * @param {string} value Tracker parameter value.
   * @returns {void}
   */
  public static SetTrackerParameterRaw(tracker: Tracker, name: string, value: string): void {
    return tracker.setParameterRaw(name, value);
  }

  /**
   * Set multiple tracker parameters.
   * @template {TrackerParameter} T Tracker parameters to set.
   * @param {Tracker} tracker The tracker to set the parameters for.
   * @param {string | TrackerParameters<P>} parameters Parameters to set. If string, must have the following format 'key1=value1;key2=value2;...'
   * @returns {number} Index of the parsing error position if any.
   */
  public static SetTrackerMultipleParameters<T extends TrackerParameter>(tracker: Tracker, parameters: string | TrackerParameters<T>): number {
    return tracker.setMultipleParameters(parameters);
  }

  /**
   * Get tracker parameter value.
   * @template {TrackerParameter} P
   * @param {Tracker} tracker The tracker to set the parameters for.
   * @param {P} parameter The parameter to get the value of.
   * @param {number} maxSize The max size of the internal string buffer for parameter value retrieval.
   * @returns {FlatType<ParameterValueType<P>>} The parameter value.
   */
  public static GetTrackerParameter<P extends TrackerParameter>(tracker: Tracker, parameter: P, maxSize: number = 100): ParameterValueType<P> {
    return tracker.getParameter<P>(parameter, maxSize);
  }

  /**
   * Process an image using tracker, which includes face detection, recognition, tracking, facial features and attributes detection.
   * @param {Tracker} tracker The tracker to feed to frame to.
   * @param {Image} image The image to process.
   * @param {number} maxFaces Maximal number of faces to process.
   * @param {number} index Camera index (unused).
   * @returns {number[]} Array of detected ids.
   */
  public static FeedFrame(tracker: Tracker, image: Image, maxFaces: number = 256, index: number = 0): number[] {
    return tracker.feedFrame(image, maxFaces, index);
  }

  /**
   * Get eye coordinates for a id.
   * @param {Tracker} tracker The tracker to get eyes from.
   * @param {number} id Id of the face to get eye coordinates for.
   * @param {number} index Camera index (unused).
   * @returns {Point[]} Array of two points -- the eye coordinates.
   */
  public static GetTrackerEyes(tracker: Tracker, id: number, index: number = 0): Point[] {
    return tracker.getEyes(id, index);
  }

  /**
   * Get facial feature coordinates for a id.
   * @param {Tracker} tracker The tracker to get facial features from.
   * @param {number} id Id of the face to get facial feature coordinates for.
   * @param {number} index Camera index (unused).
   * @returns {Point[]} Array of 70 points -- the facial feature coordinates.
   */
  public static GetTrackerFacialFeatures(tracker: Tracker, id: number, index: number = 0): Point[] {
    return tracker.getFacialFeatures(id, index);
  }

  /**
   * Get face position for a id.
   * @param {Tracker} tracker The tracker to get face position from.
   * @param {number} id Id of the face to get face position for.
   * @param {number} index Camera index (unused).
   * @returns {FacePosition} The face position.
   */
  public static GetTrackerFacePosition(tracker: Tracker, id: number, index: number = 0): FacePosition {
    return tracker.getFacePosition(id, index);
  }

  /**
   * Get face (bounding box) for a id.
   * @param {Tracker} tracker The tracker to get face from.
   * @param {number} id Id of the face to get face for.
   * @param {number} index Camera index (unused).
   * @returns {Face} The face.
   */
  public static GetTrackerFace(tracker: Tracker, id: number, index: number = 0): Face {
    return tracker.getFace(id, index);
  }

  /**
   * Lock a face id. Required for any operation with the id (i.e. getting or setting the name).
   * @param {Tracker} tracker The tracker to lock the id in.
   * @param {number} id Face id to lock. 
   * @returns {void}
   */
  public static LockID(tracker: Tracker, id: number): void {
    return tracker.lockID(id);
  }

  /**
   * Unlock a id.
   * @param {Tracker} tracker The tracker to unlock the id in.
   * @param {number} id Face id to unlock. 
   * @returns {void}
   */
  public static UnlockID(tracker: Tracker, id: number): void {
    return tracker.unlockID(id);
  }

  /**
   * Purge a id, deleting any information stored for that id.
   * @param {Tracker} tracker The tracker to purge the id from.
   * @param {number} id Face id to purge. 
   * @returns {void}
   */
  public static PurgeID(tracker: Tracker, id: number): void {
    return tracker.purgeID(id);
  }

  /**
   * Set name for a id.
   * @param {Tracker} tracker The tracker to set the name in.
   * @param {number} id Id to set name for.
   * @param {string} name The new name.
   * @returns {void}
   */
  public static SetName(tracker: Tracker, id: number, name: string): void {
    return tracker.setName(id, name);
  }

  /**
   * Get the name for a id.
   * @param {Tracker} tracker The tracker to get the name from.
   * @param {number} id Id to get the name for.
   * @param {number} maxSize The maximal size of the returned string.
   * @returns {string} The name.
   */
  public static GetName(tracker: Tracker, id: number, maxSize: number = 256): string {
    return tracker.getName(id, maxSize);
  }

  /**
   * Get a list of names associated with the id. This includes the name of the id and also the names of similar ids.
   * @param {Tracker} tracker The tracker to get the names from.
   * @param {number} id Id to get the name for.
   * @param {number} maxSize The maximal size of the returned string.
   * @returns {string[]} The list of names.
   */
  public static GetAllNames(tracker: Tracker, id: number, maxSize: number = 256): string[] {
    return tracker.getAllNames(id, maxSize);
  }

  /**
   * If there was an id merge, return the id that this id was merged into. Otherwise return the same id.
   * @param {Tracker} tracker The tracker to get the id from.
   * @param {number} id Id to get the merged id for.
   * @returns {number} The merged id.
   */
  public static GetIDReassignment(tracker: Tracker, id: number): number {
    return tracker.getIDReassignment(id);
  }

  /**
   * Get the number of ids similar to this id.
   * @param {Tracker} tracker The tracker to get the number of ids from.
   * @param {number} id Id to get the number of similar ids for.
   * @returns {number} The number of similar ids.
   */
  public static GetSimilarIDCount(tracker: Tracker, id: number): number {
    return tracker.getSimilarIDCount(id);
  }

  /**
   * Get the similar ids to this id.
   * @param {Tracker} tracker The tracker to get the similar ids from.
   * @param {number} id Id to get similar ids for.
   * @returns {number[]} Array of ids.
   */
  public static GetSimilarIDList(tracker: Tracker, id: number): number[] {
    return tracker.getSimilarIDList(id);
  }

  /**
   * Get the total number of ids stored in tracker memory.
   * @param {Tracker} tracker The tracker to get number of ids from.
   * @returns {number} The number of ids.
   */
  public static GetTrackerIDsCount(tracker: Tracker): number {
    return tracker.getIDsCount();
  }

  /**
   * Get all tracker ids.
   * @param {Tracker} tracker The tracker to get ids from.
   * @returns {number[]} Array of tracker ids.
   */
  public static GetTrackerAllIDs(tracker: Tracker): number[] {
    return tracker.getAllIDs();
  }

  /**
   * Get the number of face ids for id.
   * @param {Tracker} tracker The tracker to get the number of face ids from.
   * @param {number} id Id to get the number of face ids for.
   * @returns {number} The number of face ids.
   */
  public static GetTrackerFaceIDsCountForID(tracker: Tracker, id: number): number {
    return tracker.getFaceIDsCountForID(id);
  }

  /**
   * Get face ids for id.
   * @param {Tracker} tracker The tracker to get the face ids from.
   * @param {number} id Id to get face ids for.
   * @returns {number[]} Array of face ids.
   */
  public static GetTrackerFaceIDsForID(tracker: Tracker, id: number): number[] {
    return tracker.getFaceIDsForID(id);
  }

  /**
   * Get id for a face id.
   * @param {Tracker} tracker The tracker to get the id from.
   * @param {number} faceID Face id to get id for.
   * @returns {number} The id.
   */
  public static GetTrackerIDByFaceID(tracker: Tracker, faceID: number): number {
    return tracker.getIDByFaceID(faceID);
  }

  /**
   * Get the face template for face id.
   * @param {Tracker} tracker The tracker to get face template from.
   * @param {number} faceID Face id to get face template for.
   * @returns {FaceTemplate} The face template.
   */
  public static GetTrackerFaceTemplate(tracker: Tracker, faceID: number): FaceTemplate {
    return tracker.getFaceTemplate(faceID);
  }

  public static GetTrackerFaceImage(tracker: Tracker, faceID: number): Image {
    return tracker.getFaceImage(faceID);
  }

  /**
   * Get the face image for face id.
   * @param {Tracker} tracker The tracker to get face image from.
   * @param {number} faceID Face id to get face image for.
   * @returns {Image} The face image.
   */
  public static SetTrackerFaceImage(tracker: Tracker, faceID: number, image: Image): void {
    return tracker.setFaceImage(faceID, image);
  }

  /**
   * Delete the face image for face id.
   * @param {Tracker} tracker The tracker to delete face image from.
   * @param {number} faceID Face id to delete the face image for. 
   * @returns {void}
   */
  public static DeleteTrackerFaceImage(tracker: Tracker, faceID: number): void {
    return tracker.deleteFaceImage(faceID);
  }

  /**
   * Create a new id in the tracker memory.
   * @param {Tracker} tracker The tracker to create a new id in.
   * @param {FaceTemplate} template Face template of the id.
   * @returns {number} The newly created id.
   */
  public static TrackerCreateID(tracker: Tracker, template: FaceTemplate): TrackerID {
    return tracker.createID(template);
  }

  /**
   * Add a new face template for id.
   * @param {Tracker} tracker The tracker to add a new face template to.
   * @param {number} id Id to add a new template for.
   * @param {FaceTemplate} template The template.
   * @returns {void}
   */
  public static AddTrackerFaceTemplate(tracker: Tracker, id: number, template: FaceTemplate): void {
    return tracker.addFaceTemplate(id, template);
  }

  /**
   * Delete face id.
   * @param {Tracker} tracker The tracker to delete the face id in.
   * @param {number} faceID Face id to delete.
   * @returns {void}
   */
  public static DeleteTrackerFace(tracker: Tracker, faceID: number): void {
    return tracker.deleteFace(faceID);
  }

  /**
   * Get ids and their similarities for a face template.
   * @param {Tracker} tracker The tracker to match faces in.
   * @param {FaceTemplate} template The template to find similar ids for.
   * @param {number} threshold Matching similarity threshold for the returned ids.
   * @param {number} maxSize Maximal number of ids to return.
   * @returns {IDSimilarity[]} Array of ids and their similarities.
   */
  public static TrackerMatchFaces(tracker: Tracker, template: FaceTemplate, threshold: number, maxSize: number = 256): IDSimilarity[] {
    return tracker.matchFaces(template, threshold, maxSize);
  }

  /**
   * Get facial attribute values (i.e. angles, liveness) for an id.
   * @template {FacialAttribute[]} A
   * @param {Tracker} tracker The tracker to get facial attributes in.
   * @param {number} id Id to get attributes for.
   * @param {A} attributes The attributes to get.
   * @returns {Object} An object with attribute values. The obejct keys depend on which attriutes are requested.
   */
  public static GetTrackerFacialAttribute<A extends FacialAttribute[]>(tracker: Tracker, id: number, ...attributes: A): FlatType<FacialAttributesResults<A>> {
    return tracker.getFacialAttribute<A>(id, ...attributes);
  }

  /**
   * Get facial attribute values (i.e. angles, liveness) for an id.
   * @param {Tracker} tracker The tracker to get facial attributes in.
   * @param {number} id Id to get attributes for.
   * @param {string | string[]} attribute The attribute (or array of attributes) to get.
   * @param {string} maxSize The maximal size of the returned string.
   * @param {number} index Camera index (unused).
   * @returns {string} A string with the attribute values in key1=value1;key2=value2; format.
   */
  public static GetTrackerFacialAttributeRaw(tracker: Tracker, id: number, attribute: string | string[], maxSize: number = 256, index: number = 0): string {
    return tracker.getFacialAttributeRaw(id, attribute, index, maxSize);
  }

  /**
   * Detect facial attribute values (i.e. angles, liveness) using facial keypoints.
   * @template {FacialAttribute[]} A
   * @param {Image} image The image to get facial attribute form.
   * @param {Point[]} features Array of facial keypoints.
   * @param {A} attributes The attributes to detect.
   * @returns {Object} An object with attribute values. The obejct keys depend on which attriutes are requested.
   */
  public static DetectFacialAttributeUsingFeatures<A extends FacialAttribute[]>(image: Image, features: Point[], ...attributes: A): FlatType<FacialAttributesResults<A>> {
    return image.detectFacialAttributeUsingFeatures(features, ...attributes);
  }

  /**
   * Detect facial attribute values (i.e. angles, liveness) using facial keypoints.
   * @param {Image} image The image to get facial attribute form.
   * @param {Point[]} features Array of facial keypoints.
   * @param {string | string[]} attribute The attribute (or array of attributes) to detect.
   * @param {string} maxSize The maximal size of the returned string.
   * @returns {string} A string with the detected attribute values in key1=value1;key2=value2; format.
   */
  public static DetectFacialAttributeUsingFeaturesRaw(image: Image, features: Point[], attribute: string | string[], maxSize: number = 256): string {
    return image.detectFacialAttributeUsingFeaturesRaw(features, attribute, maxSize);
  }

  /**
   * Get value from a key=value; string.
   * @param {string} values The string in key1=value1;key2=value2; format.
   * @param {string} value The key for the value to obtain.
   * @returns {number} The value.
   */
  public static GetValueConfidence(values: string, value: FacialAttribute | TrackerFacialAttribute): number {
    return executeSDKFunction(LuxandFaceSDK.GetValueConfidence, returnZero, values, value);
  }

  /**
   * Set FSDK parameter.
   * @template {Parameter} P
   * @param {P} parameter The parameter to set.
   * @param {ParameterValueType<P>} value The value to set.
   * @returns {value}
   */
  public static SetParameter<P extends Parameter>(parameter: P, value: ParameterValueType<P>): void {
    return executeSDKFunction(LuxandFaceSDK.SetParameter, returnVoid, parameter, value.toString());
  }

  /**
   * Set FSDK parameters.
   * @template {Parameter} T Parameters to set.
   * @param {string | Parameters<T>} parameters Parameters to set. If string, must have the following format 'key1=value1;key2=value2;...' 
   * @returns {number} Index of the parsing error position if any.
   */
  public static SetParameters<T extends Parameter>(parameters: string | Parameters<T>): number {
    return executeSDKFunction(LuxandFaceSDK.SetParameters, returnErrorPositsion, getParametersString(parameters));
  }

  /**
   * Set an HTTP proxy to be used with an IP camera.
   * @param {string} address Proxy address.
   * @param {number} port Proxy port.
   * @param {string} username Proxy username.
   * @param {string} password Proxy password.
   * @returns {void}
   */
  public static SetHTTPProxy(address: string, port: number, username: string, password: string): void {
    return Camera.SetHTTPProxy(address, port, username, password);
  }

  /**
   * Open IP video camera at a given URL.
   * @param {FlatType<VIDEOCOMPRESSIONTYPE>} comression Video compression to use.
   * @param {string} url Camera URL.
   * @param {string} username Camera access username.
   * @param {string} password Camera access password.
   * @param {number} timeout Connection timeout in seconds.
   * @returns {Camera} The IP video camera.
   */
  public static OpenIPVideoCamera(comression: VIDEOCOMPRESSIONTYPE, url: string, username: string, password: string, timeout: number): Camera {
      return Camera.OpenIPVideoCamera(comression, url, username, password, timeout);
  }

  /**
   * Initialize the capturing process.
   * @returns {void}
   */
  public static InitializeCapturing(): void {
    return Camera.InitializeCapturing();
  }

  /**
   * Finalize the capturing process.
   * @returns {void}
   */
  public static FinalizeCapturing(): void {
    return Camera.FinalizeCapturing();
  }

  /**
   * Obtain the current camera frame image.
   * @param {Camera} camera The camera to grab the frame from.
   * @returns {Image} The frame image.
   */
  public static GrabFrame(camera: Camera): Image {
    return camera.grabFrame();
  }

  /**
   * Close the camera. Camera becomes invalid.
   * @param {Camera} camera The camera to close.
   * @returns {void}
   */
  public static CloseVideoCamera(camera: Camera): void {
      return camera.close();
  }

  /**
   * Initlize IBeta addon.
   * @returns {Promise<void>}
   */
  public static async InitializeIBeta(): Promise<void> {
    await copyAssetsToCacheDirectory();
    return executeSDKFunction(LuxandFaceSDK.InitializeIBeta, returnVoid);
  }
}
