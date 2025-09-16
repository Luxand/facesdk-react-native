import { Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { createFrameProcessor, runAsync, type ReadonlyFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

import FSDK, { FSDKError, Tracker } from "react-native-face-sdk";


/** Use an improved version of face detection and recognition */
const USE_NEW_FACE_DETECTION = true;


/** Maximal number of faces detected on a single frame */
const MAX_FACES = 4;


/** Use iBeta liveness addon for liveness detection. If false uses a simpler, but less accurate model */
const USE_IBETA_LIVENESS_ADDON = true;


/** Internal image size for face detection */
const IMAGE_SIZE = 256;

export class BoundingBox {

  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x1: number,
    public readonly y1: number) {}

  
  public scaled(scale: number): BoundingBox {
    return new BoundingBox(this.x0 * scale, this.y0 * scale, this.x1 * scale, this.y1 * scale);
  }

  public get values(): [x0: number, y0: number, x1: number, y1: number] {
    return [this.x0, this.y0, this.x1, this.y1];
  }

}

export class Face {

  private _name: string;

  public readonly bbox: BoundingBox;
  public readonly liveness: number = -1;
  public readonly imageQuality: number = -1;
  public readonly livenessError: string | undefined = undefined;

  constructor(private readonly id: number, private readonly tracker: Tracker) {

    tracker.lockID(id);
    this._name = tracker.getName(id);
    tracker.unlockID(id);

    //** Get a bounding box for the id */
    if (USE_NEW_FACE_DETECTION) {
      const face = tracker.getFace(id);
      this.bbox = new BoundingBox(face.bbox.p0.x, face.bbox.p0.y, face.bbox.p1.x, face.bbox.p1.y);
    } else {
      const facePosition = tracker.getFacePosition(id);
      const w = facePosition.w / 2;

      this.bbox = new BoundingBox(
        facePosition.xc - w,
        facePosition.yc - w * 1.2,
        facePosition.xc + w,
        facePosition.yc + w * 1.2
      );
    }

    //** Get liveness info */
    if (FacesProcessor.livenessEnabled) {

      try {
        ({ Liveness: this.liveness } = tracker.getFacialAttribute(id, 'Liveness'));
      } catch(error) {
        this.liveness = 0.0;
      }
      
      if (USE_IBETA_LIVENESS_ADDON) {

        try {
          ({ LivenessError: this.livenessError } = tracker.getFacialAttribute(id, 'LivenessError'));
        } catch(error) {
          this.livenessError = undefined;
        }

        try {
          ({ ImageQuality: this.imageQuality } = tracker.getFacialAttribute(id, 'ImageQuality'));
        } catch(error) {
          this.imageQuality = -1;
        }
      }
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


  //** Set face id */
  public set name(value: string) {
    this._name = value;
    this.tracker.setName(this.id, value);
  }
}


/** Contains defenitions for handling faces using FaceSDK library */
export default class FacesProcessor {

  private static _tracker: Tracker;
  private static _frameProcessor: ReadonlyFrameProcessor;
  private static _onFaceIDsReady: ((ids: number[]) => void) | undefined;
  private static _livenessEnabled: boolean = false;
  private static _initializeAlreadyRequested: boolean = false;


  /** FaceSDK library is activated and initialized here */
  public static async initialize(): Promise<void> {
    if (this._initializeAlreadyRequested)
      return;

    this._initializeAlreadyRequested = true;

    FSDK.ActivateLibrary('INSERT YOUR LICENSE KEY HERE');
    FSDK.Initialize();

    
    /** Try to load tracker memory from the saved file */
    try {
      this._tracker = Tracker.FromFile(this.trackerFilename);

      const version = this._tracker.getParameter('DetectionVersion');

      /** Show an alert if the detection version of loaded tracker memory doesn't match.
        * Using tracker with a wrong detection version is not allowed and leads to incorrect results. */
      if (USE_NEW_FACE_DETECTION && version !== 2 || !USE_NEW_FACE_DETECTION && version !== 1)
        Alert.alert('FSDK', 'Mismatched face detection version in tracker');

    } catch (error) {
      /** If there were any errors, create an empty tracker instead */
      if (error instanceof FSDKError) {
        this._tracker = Tracker.Create();

        if (USE_NEW_FACE_DETECTION)
          this._tracker.setParameter('DetectionVersion', 2);
      }
      else
        throw error;
    }

    this.setTrackerParameters();

    if (USE_IBETA_LIVENESS_ADDON)
      await FSDK.InitializeIBeta();
    
    this._frameProcessor = this.createFrameProcessor();
  }


  /** Get the path to tracker memory file */
  private static get trackerFilename(): string {
    return `${RNFS.DocumentDirectoryPath}/tracker70`;
  }


  /** Create a frame processor to detect faces on the camera image */
  private static createFrameProcessor(): ReadonlyFrameProcessor {
    const tracker = this._tracker.handle;

    const onFaceIDsReady = Worklets.createRunOnJS((ids: number[]) => {
      if (this._onFaceIDsReady !== undefined)
        this._onFaceIDsReady(ids);
    });    

    return createFrameProcessor(frame => {
      'worklet'

      /** Using runAsync allows the camera preview to run at more FPS than face detection */
      runAsync(frame, () => {
        'worklet'

        /** Due to the limitations of using worklets, use FSDK library functions from Worklets namespace */
        const image = FSDK.Worklets.LoadImageFromFrame(frame);
        const result = FSDK.Worklets.FeedFrame(tracker, image, MAX_FACES);
        onFaceIDsReady(result);
        FSDK.Worklets.FreeImage(image);
      });
      
    });
  }


  /** Set tracker parameters */
  private static setTrackerParameters(): void {

    USE_NEW_FACE_DETECTION
      /** FaceDetection2PatchSize sets the image size used for face detection. Lower values increase performance, but decrease accuracy
      * Threshold and Threshold2 control face matching, new recognition uses lower threshold (values as low as 0.7 work well), compared to the default one. */
      ? this._tracker.setMultipleParameters({ FaceDetection2PatchSize: IMAGE_SIZE, Threshold: 0.8, Threshold2: 0.9 })
      : this._tracker.setMultipleParameters({ HandleArbitraryRotations: false, DetermineFaceRotationAngle: false, InternalResizeWidth: IMAGE_SIZE, FaceDetectionThreshold: 5 });

    if (this._livenessEnabled)
      this._tracker.setParameter('DetectLiveness', true);

    if (USE_IBETA_LIVENESS_ADDON)
      /* Disabling liveness smoothing when using iBeta plugin.
      * This way tracker reports liveness score as soon as it's available. */
      this._tracker.setMultipleParameters({
        SmoothAttributeLiveness: false,
        LivenessFramesCount: 1
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


  //** Check if IBeta liveness is enabled */
  public static get useIBetaLivenessAddon(): boolean {
    return USE_IBETA_LIVENESS_ADDON;
  }


  //** Check if new face detection is used */
  public static get useNewFaceDetection(): boolean {
    return USE_NEW_FACE_DETECTION;
  }


  //** Save tracker memory to a file */
  public static saveTrackerMemory(): void {
    if (this._tracker)
      this._tracker.saveToFile(this.trackerFilename);
  }


  //** Obtain a frame processor for face detection */
  public static get frameProcessor(): ReadonlyFrameProcessor {
    return this._frameProcessor;
  }


  //** Set callback function for detected ids */
  public static onFaceIDsReady(func: ((ids: number[]) => void) | undefined): void {
    this._onFaceIDsReady = func;
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
