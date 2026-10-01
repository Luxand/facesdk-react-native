import FSDK, { Tracker } from 'react-native-facesdk';
import type { Frame } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';

/** Maximal number of faces detected on a single frame */
const MAX_FACES = 4;

/** Internal image size for face detection */
const IMAGE_SIZE = 128;

/** Use the iBeta liveness add-on. If false, uses a simpler but less accurate model. */
const USE_IBETA_LIVENESS_ADDON = true;

/** Liveness scores above this mean a live face */
const LIVENESS_THRESHOLD = 0.5;

/** Below this image quality the iBeta plugin's liveness score is not trustworthy */
const LIVENESS_IMAGE_QUALITY_THRESHOLD = 0.5;

/** The face crop is scaled to this width before the sharpness is measured, so the metric does not depend on how close the face is to the camera */
const SHARPNESS_CROP_WIDTH = 128;

/** Faces blurrier than this get no liveness verdict. Picked from the measured distributions: live faces sit around 570, blurred ones around 130 */
export const SHARPNESS_THRESHOLD = 125.0;

/**
 * Liveness verdict for a tracked face.
 * UNKNOWN, LOW_QUALITY and BLURRED mean no liveness decision was made.
 */
export enum LivenessStatus {
  UNKNOWN,
  LOW_QUALITY,
  BLURRED,
  LIVE,
  FAKE,
}

/** Extracts the "message" field from the LivenessError value, which looks like "{status=...,message=...}" */
function parseLivenessErrorMessage(value: string): string {
  const messageKey = 'message=';

  const messageStart = value.indexOf(messageKey);
  if (messageStart < 0) return value;

  const messageIndex = messageStart + messageKey.length;
  const messageEnd = value.indexOf('}', messageIndex);

  return value.substring(messageIndex, messageEnd < 0 ? value.length : messageEnd);
}

export class BoundingBox {
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x1: number,
    public readonly y1: number
  ) {}

  public scaled(scale: number): BoundingBox {
    return new BoundingBox(
      this.x0 * scale,
      this.y0 * scale,
      this.x1 * scale,
      this.y1 * scale
    );
  }

  public get values(): [x0: number, y0: number, x1: number, y1: number] {
    return [this.x0, this.y0, this.x1, this.y1];
  }
}

export class Face {
  private _name: string;

  public readonly bbox: BoundingBox;
  /** Liveness score, -1 when the Liveness attribute is not available yet */
  public readonly liveness: number = -1;
  public readonly livenessError: string | undefined = undefined;
  /** Image quality score, -1 when the ImageQuality attribute is not available */
  public readonly imageQuality: number = -1;
  /**
   * Variance of the Laplacian over the face crop, -1 when it could not be measured.
   * The SDK image quality does not react to motion blur, this does
   */
  public readonly sharpness: number = -1;
  public readonly livenessStatus: LivenessStatus = LivenessStatus.UNKNOWN;

  constructor(
    private readonly id: number,
    private readonly tracker: Tracker
  ) {
    tracker.lockID(id);
    this._name = tracker.getName(id);
    tracker.unlockID(id);

    //** Get a bounding box for the id */
    const face = tracker.getFace(id);

    this.bbox = new BoundingBox(
      face.bbox.p0.x,
      face.bbox.p0.y,
      face.bbox.p1.x,
      face.bbox.p1.y
    );

    //** Get liveness info */
    if (FacesProcessor.livenessEnabled) {
      try {
        ({ Liveness: this.liveness } = tracker.getFacialAttribute(id, 'Liveness'));
      } catch (error) {
        // Liveness was not determined for this face yet
        this.liveness = -1;
      }

      //** The iBeta plugin reports why liveness failed and how good the image was */
      if (USE_IBETA_LIVENESS_ADDON && this.liveness >= 0) {
        try {
          ({ ImageQuality: this.imageQuality } = tracker.getFacialAttribute(id, 'ImageQuality'));
        } catch (error) {
          this.imageQuality = -1;
        }

        this.sharpness = FacesProcessor.getSharpness(id);
        [this.livenessStatus, this.livenessError] = this.checkLiveness(tracker);
      } else if (this.liveness >= 0) {
        this.livenessStatus = this.liveness > LIVENESS_THRESHOLD ? LivenessStatus.LIVE : LivenessStatus.FAKE;
      }
    }
  }

  /**
   * Determines the liveness status the same way the Android sample does: a face with a low
   * image quality or a blurred face gets no liveness verdict at all
   */
  private checkLiveness(tracker: Tracker): [LivenessStatus, string | undefined] {
    if (this.imageQuality >= 0 && this.imageQuality < LIVENESS_IMAGE_QUALITY_THRESHOLD)
      return [LivenessStatus.LOW_QUALITY, undefined];

    // The liveness score drops on motion blur that the SDK image quality does not react to
    if (this.sharpness >= 0 && this.sharpness < SHARPNESS_THRESHOLD)
      return [LivenessStatus.BLURRED, undefined];

    if (this.liveness > LIVENESS_THRESHOLD) return [LivenessStatus.LIVE, undefined];

    try {
      const { LivenessError: livenessError } = tracker.getFacialAttribute(this.id, 'LivenessError');

      // The attribute is absent whenever liveness succeeded, which surfaces as a throw with
      // the default ON_ERROR, and as an empty string with ON_ERROR.SILENT.
      return [LivenessStatus.FAKE, livenessError !== '' ? parseLivenessErrorMessage(livenessError) : undefined];
    } catch (error) {
      return [LivenessStatus.FAKE, undefined];
    }
  }

  //** Lock face */
  public lock(): void {
    this.tracker.lockID(this.id);
  }

  //** Unlock face */
  public unlock(): void {
    this.tracker.unlockID(this.id);
  }

  //** Purge face */
  public purge(): void {
    this.tracker.purgeID(this.id);
  }

  //** Get face name */
  public get name(): string {
    return this._name;
  }

  //** Set face name */
  public set name(value: string) {
    this._name = value;
    this.tracker.setName(this.id, value);
  }
}

/** Contains definitions for handling faces using FaceSDK library */
export default class FacesProcessor {
  private static _tracker: Tracker;
  private static _onFaceIDsReady: ((ids: number[]) => void) | undefined;
  private static _livenessEnabled: boolean = false;
  private static _initializeAlreadyRequested: boolean = false;
  private static _sharpness: Map<number, number> = new Map();
  private static _iBetaInitResult: number | undefined = undefined;

  /** FaceSDK library is activated and initialized here */
  public static async initialize(): Promise<void> {
    if (this._initializeAlreadyRequested) return;

    this._initializeAlreadyRequested = true;

    FSDK.ActivateLibrary('INSERT THE LICENSE KEY HERE');
    FSDK.Initialize();

    /** Try to load tracker memory from the saved file */
    try {
      this._tracker = Tracker.FromFile(this.trackerFilename);
    } catch (error) {
      /** If there were any errors, create an empty tracker instead */
      if (error instanceof FSDK.Error) {
        this._tracker = Tracker.Create();
      } else throw error;
    }

    this.setTrackerParameters();

    /** Unpack the bundled iBeta data and load the plugin. The first call copies the data to the caches directory */
    if (USE_IBETA_LIVENESS_ADDON) {
      try {
        FSDK.InitializeIBeta();
        this._iBetaInitResult = FSDK.ERROR.OK;
      } catch (error) {
        if (!(error instanceof FSDK.Error)) throw error;
        this._iBetaInitResult = error.errorCode;
      }
    }
  }

  /**
   * Result of the iBeta plugin initialization: FSDK.ERROR.OK means iBeta liveness is initialized.
   * undefined means the initialization was not attempted.
   */
  public static get iBetaInitResult(): number | undefined {
    return this._iBetaInitResult;
  }

  //** Check if the iBeta liveness add-on is in use */
  public static get useIBetaLivenessAddon(): boolean {
    return USE_IBETA_LIVENESS_ADDON;
  }

  /** Get the path to tracker memory file */
  private static get trackerFilename(): string {
    return `${FSDK.DocumentsDirectory}/tracker90`;
  }

  //** Get the tracker handle to feed camera frames to */
  public static get trackerHandle(): number {
    return this._tracker.handle;
  }

  /** Set tracker parameters */
  private static setTrackerParameters(): void {
    this._tracker.setMultipleParameters({
      FaceDetectionPatchSize: IMAGE_SIZE,
    });

    if (this._livenessEnabled) this._tracker.setParameter('DetectLiveness', true);

    if (USE_IBETA_LIVENESS_ADDON)
      // Disabling liveness smoothing when using the iBeta plugin, so the tracker reports the
      // liveness score as soon as it is available.
      this._tracker.setMultipleParameters({
        SmoothAttributeLiveness: false,
        LivenessFramesCount: 1,
      });
    else if (this._livenessEnabled)
      this._tracker.setMultipleParameters({
        SmoothAttributeLiveness: true,
        LivenessFramesCount: 6,
      });
  }

  //** Check if liveness is enabled */
  public static get livenessEnabled(): boolean {
    return this._livenessEnabled;
  }

  //** Toggle liveness */
  public static toggleLiveness(): void {
    this._livenessEnabled = !this._livenessEnabled;
    this._tracker.setParameter('DetectLiveness', this._livenessEnabled);
  }

  //** Save tracker memory to a file */
  public static saveTrackerMemory(): void {
    if (this._tracker) this._tracker.saveToFile(this.trackerFilename);
  }

  //** Set callback function for detected ids */
  public static onFaceIDsReady(func: ((ids: number[]) => void) | undefined) {
    this._onFaceIDsReady = func;
  }

  //** Pass the ids detected on a frame to the callback function, keeping the sharpness measured for each of them */
  public static handleFaceIDs(ids: number[], sharpness: number[]): void {
    this._sharpness = new Map(ids.map((id, index) => [id, sharpness[index] ?? -1]));
    this._onFaceIDsReady?.(ids);
  }

  //** Get the sharpness of the face with the given id on the last processed frame, -1 when it was not measured */
  public static getSharpness(id: number): number {
    return this._sharpness.get(id) ?? -1;
  }

  //** Get face for id */
  public static getFace(id: number): Face {
    return new Face(id, this._tracker);
  }

  //** Clear tracker memory */
  public static clear(): void {
    this._tracker.clear();
    this.setTrackerParameters();
  }
}

/** Collect the pixel buffers of a frame. A planar frame has one buffer per plane, an interleaved one a single buffer */
function planesOf(frame: Frame) {
  'worklet';

  if (!frame.isPlanar)
    return [
      {
        buffer: frame.getPixelBuffer(),
        bytesPerRow: frame.bytesPerRow,
        pixelStride: frame.bytesPerRow / frame.width,
      },
    ];

  return frame.getPlanes().map((plane) => ({
    buffer: plane.getPixelBuffer(),
    bytesPerRow: plane.bytesPerRow,
    pixelStride: plane.bytesPerRow / plane.width,
  }));
}

/** Hands the detected ids back to the React Native runtime, where the callback can touch React state */
function reportFaceIDs(ids: number[], sharpness: number[]): void {
  FacesProcessor.handleFaceIDs(ids, sharpness);
}

/**
 * A worklet cannot capture classes, so `FSDK` is `undefined` inside `processFrame` and the binding
 * has to be captured here, at module scope, where it is a plain Nitro HybridObject — those are
 * runtime-agnostic and cross into the worklet runtime intact.
 *
 * Methods must be called on it rather than detached: Nitro resolves the native instance from
 * `this`, so `const FeedFrame = FSDKNative.FeedFrame` throws when called.
 */
const FSDKNative = FSDK.Native;

/** Captured as a plain number, since the enum itself cannot cross into the worklet */
const IMAGE_GRAYSCALE_8BIT = FSDK.IMAGEMODE.IMAGE_GRAYSCALE_8BIT;

/**
 * Variance of the Laplacian over the face crop: the classic sharpness metric. Low values mean a
 * blurred face, high values a sharp one. The crop is a square of the face width around the face
 * center, scaled to a fixed width to keep the values comparable. Returns -1 when the sharpness
 * cannot be measured.
 */
function measureSharpness(image: number, tracker: number, id: number): number {
  'worklet';

  const face = FSDKNative.GetTrackerFace(tracker, 0, id);
  const imageWidth = FSDKNative.GetImageWidth(image);
  const imageHeight = FSDKNative.GetImageHeight(image);

  if (
    face.errorCode !== FSDKNative.ERROR.OK ||
    imageWidth.errorCode !== FSDKNative.ERROR.OK ||
    imageHeight.errorCode !== FSDKNative.ERROR.OK
  )
    return -1;

  const { p0, p1 } = face.value.bbox;
  const size = p1.x - p0.x;
  if (size <= 0) return -1;

  const xc = Math.floor((p0.x + p1.x) / 2);
  const yc = Math.floor((p0.y + p1.y) / 2);
  const half = Math.floor(size / 2);

  const x1 = Math.max(xc - half, 0);
  const y1 = Math.max(yc - half, 0);
  const x2 = Math.min(xc + half, imageWidth.value);
  const y2 = Math.min(yc + half, imageHeight.value);

  if (x2 - x1 < 8 || y2 - y1 < 8) return -1;

  const crop = FSDKNative.CopyRect(image, x1, y1, x2, y2);
  if (crop.errorCode !== FSDKNative.ERROR.OK) return -1;

  let target = crop.value;
  let scaled = -1;

  const ratio = SHARPNESS_CROP_WIDTH / (x2 - x1);
  if (ratio < 1) {
    const resized = FSDKNative.ResizeImage(crop.value, ratio);
    if (resized.errorCode === FSDKNative.ERROR.OK) {
      scaled = resized.value;
      target = scaled;
    }
  }

  let result = -1;

  const width = FSDKNative.GetImageWidth(target).value;
  const height = FSDKNative.GetImageHeight(target).value;
  const bufferSize = FSDKNative.GetImageBufferSize(target, IMAGE_GRAYSCALE_8BIT);

  if (width >= 3 && height >= 3 && bufferSize.errorCode === FSDKNative.ERROR.OK) {
    const saved = FSDKNative.SaveImageToBuffer(target, IMAGE_GRAYSCALE_8BIT, bufferSize.value);

    if (saved.errorCode === FSDKNative.ERROR.OK) {
      const pixels = new Uint8Array(saved.value);

      // Laplacian of every interior pixel, accumulated for mean and variance
      let sum = 0;
      let sumOfSquares = 0;
      let count = 0;

      for (let y = 1; y < height - 1; ++y) {
        const row = y * width;

        for (let x = 1; x < width - 1; ++x) {
          const laplacian =
            4 * pixels[row + x]! -
            pixels[row + x - 1]! -
            pixels[row + x + 1]! -
            pixels[row - width + x]! -
            pixels[row + width + x]!;

          sum += laplacian;
          sumOfSquares += laplacian * laplacian;
          ++count;
        }
      }

      if (count > 0) {
        const mean = sum / count;
        result = sumOfSquares / count - mean * mean;
      }
    }
  }

  if (scaled >= 0) FSDKNative.FreeImage(scaled);
  FSDKNative.FreeImage(crop.value);

  return result;
}

/**
 * Detect faces on a single camera frame and report the ids the tracker assigned to them.
 * With `measureBlur` the sharpness of every face is measured too, while the frame is still alive
 */
export function processFrame(frame: Frame, tracker: number, measureBlur: boolean): void {
  'worklet';

  const loaded = FSDKNative.LoadImageFromFrame(
    planesOf(frame),
    frame.pixelFormat,
    frame.width,
    frame.height
  );

  if (loaded.errorCode !== FSDKNative.ERROR.OK) return;

  const fed = FSDKNative.FeedFrame(tracker, 0, loaded.value, MAX_FACES);

  if (fed.errorCode === FSDKNative.ERROR.OK) {
    const sharpness = measureBlur
      ? fed.value.map((id) => measureSharpness(loaded.value, tracker, id))
      : [];

    scheduleOnRN(reportFaceIDs, fed.value, sharpness);
  }

  FSDKNative.FreeImage(loaded.value);
}

/** Whether processFrame should measure the face sharpness: only the iBeta liveness verdict depends on it */
export function shouldMeasureBlur(livenessEnabled: boolean): boolean {
  return USE_IBETA_LIVENESS_ADDON && livenessEnabled;
}
