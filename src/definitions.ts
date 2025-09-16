import LuxandFaceSDK from './NativeFaceSDK';

export enum ERROR {
  OK                                =  0,
  FAILED                            = -1,
  NOT_ACTIVATED                     = -2,
  OUT_OF_MEMORY                     = -3,
  INVALID_ARGUMENT                  = -4,
  IO_ERROR                          = -5,
  IMAGE_TOO_SMALL                   = -6,
  FACE_NOT_FOUND                    = -7,
  INSUFFICIENT_BUFFER_SIZE          = -8,
  UNSUPPORTED_IMAGE_EXTENSION       = -9,
  CANNOT_OPEN_FILE                  = -10,
  CANNOT_CREATE_FILE                = -11,
  BAD_FILE_FORMAT                   = -12,
  FILE_NOT_FOUND                    = -13,
  CONNECTION_CLOSED                 = -14,
  CONNECTION_FAILED                 = -15,
  IP_INIT_FAILED                    = -16,
  NEED_SERVER_ACTIVATION            = -17,
  ID_NOT_FOUND                      = -18,
  ATTRIBUTE_NOT_DETECTED            = -19,
  INSUFFICIENT_TRACKER_MEMORY_LIMIT = -20,
  UNKNOWN_ATTRIBUTE                 = -21,
  UNSUPPORTED_FILE_VERSION          = -22,
  SYNTAX_ERROR                      = -23,
  PARAMETER_NOT_FOUND               = -24,
  INVALID_TEMPLATE                  = -25,
  UNSUPPORTED_TEMPLATE_VERSION      = -26,
  CAMERA_INDEX_DOES_NOT_EXIST       = -27,
  PLATFORM_NOT_LICENSED             = -28,
  TENSORFLOW_NOT_INITIALIZED        = -29,
  PLUGIN_NOT_LOADED                 = -30,
  PLUGIN_NO_PERMISSION              = -31,
  FACEID_NOT_FOUND                  = -32,
  FACEIMAGE_NOT_FOUND               = -33
}

export enum IMAGEMODE {
  IMAGE_GRAYSCALE_8BIT = 0,
  IMAGE_COLOR_24BIT    = 1,
  IMAGE_COLOR_32BIT    = 2
}

export enum VIDEOCOMPRESSIONTYPE {
  MJPEG = 0
}

export enum FEATURE {
  LEFT_EYE                    = 0,
  RIGHT_EYE                   = 1,
  LEFT_EYE_INNER_CORNER       = 24,
  LEFT_EYE_OUTER_CORNER       = 23,
  LEFT_EYE_LOWER_LINE1        = 38,
  LEFT_EYE_LOWER_LINE2        = 27,
  LEFT_EYE_LOWER_LINE3        = 37,
  LEFT_EYE_UPPER_LINE1        = 35,
  LEFT_EYE_UPPER_LINE2        = 28,
  LEFT_EYE_UPPER_LINE3        = 36,
  LEFT_EYE_LEFT_IRIS_CORNER   = 29,
  LEFT_EYE_RIGHT_IRIS_CORNER  = 30,
  RIGHT_EYE_INNER_CORNER      = 25,
  RIGHT_EYE_OUTER_CORNER      = 26,
  RIGHT_EYE_LOWER_LINE1       = 41,
  RIGHT_EYE_LOWER_LINE2       = 31,
  RIGHT_EYE_LOWER_LINE3       = 42,
  RIGHT_EYE_UPPER_LINE1       = 40,
  RIGHT_EYE_UPPER_LINE2       = 32,
  RIGHT_EYE_UPPER_LINE3       = 39,
  RIGHT_EYE_LEFT_IRIS_CORNER  = 33,
  RIGHT_EYE_RIGHT_IRIS_CORNER = 34,
  LEFT_EYEBROW_INNER_CORNER   = 13,
  LEFT_EYEBROW_MIDDLE         = 16,
  LEFT_EYEBROW_MIDDLE_LEFT    = 18,
  LEFT_EYEBROW_MIDDLE_RIGHT   = 19,
  LEFT_EYEBROW_OUTER_CORNER   = 12,
  RIGHT_EYEBROW_INNER_CORNER  = 14,
  RIGHT_EYEBROW_MIDDLE        = 17,
  RIGHT_EYEBROW_MIDDLE_LEFT   = 20,
  RIGHT_EYEBROW_MIDDLE_RIGHT  = 21,
  RIGHT_EYEBROW_OUTER_CORNER  = 15,
  NOSE_TIP                    = 2,
  NOSE_BOTTOM                 = 49,
  NOSE_BRIDGE                 = 22,
  NOSE_LEFT_WING              = 43,
  NOSE_LEFT_WING_OUTER        = 45,
  NOSE_LEFT_WING_LOWER        = 47,
  NOSE_RIGHT_WING             = 44,
  NOSE_RIGHT_WING_OUTER       = 46,
  NOSE_RIGHT_WING_LOWER       = 48,
  MOUTH_RIGHT_CORNER          = 3,
  MOUTH_LEFT_CORNER           = 4,
  MOUTH_TOP                   = 54,
  MOUTH_TOP_INNER             = 61,
  MOUTH_BOTTOM                = 55,
  MOUTH_BOTTOM_INNER          = 64,
  MOUTH_LEFT_TOP              = 56,
  MOUTH_LEFT_TOP_INNER        = 60,
  MOUTH_RIGHT_TOP             = 57,
  MOUTH_RIGHT_TOP_INNER       = 62,
  MOUTH_LEFT_BOTTOM           = 58,
  MOUTH_LEFT_BOTTOM_INNER     = 63,
  MOUTH_RIGHT_BOTTOM          = 59,
  MOUTH_RIGHT_BOTTOM_INNER    = 65,
  NASOLABIAL_FOLD_LEFT_UPPER  = 50,
  NASOLABIAL_FOLD_LEFT_LOWER  = 52,
  NASOLABIAL_FOLD_RIGHT_UPPER = 51,
  NASOLABIAL_FOLD_RIGHT_LOWER = 53,
  CHIN_BOTTOM                 = 11,
  CHIN_LEFT                   = 9,
  CHIN_RIGHT                  = 10,
  FACE_CONTOUR1               = 7,
  FACE_CONTOUR2               = 5,
  FACE_CONTOUR12              = 6,
  FACE_CONTOUR13              = 8,
  FACE_CONTOUR14              = 66,
  FACE_CONTOUR15              = 67,
  FACE_CONTOUR16              = 68,
  FACE_CONTOUR17              = 69,
}

/**
 * Error handling behavior.
 * @enum {number}
 */
export enum ON_ERROR {
  /** Return an "invalid" value on error (i.e. invalid Image if image creation is failed). */
  SILENT,
  /** Like SILENT, but also show a React Native alert window. */
  ALERT,
  /** Raise an FSDKEroor on error. */
  THROW
}

export class FSDKError extends Error {  

  constructor(message: string, public readonly errorCode: number, public readonly: Record<string, any>) { super(message); }

}

const CONSTANTS = LuxandFaceSDK.getConstants();
export const FACIAL_FEATURE_COUNT = Object.keys(CONSTANTS.FEATURE).length;

function checkMatchingEnums<T extends Record<string, number | string>>(enum_: T, values: Record<string, number>) {
  const enumKeys = Object.keys(enum_).filter(key => isNaN(Number(key)));
  const keys = Object.keys(values);

  const missingKeys = keys.filter(item => !enumKeys.includes(item));
  const extraKeys = enumKeys.filter(item => !keys.includes(item));

  if (missingKeys.length > 0 || extraKeys.length > 0) {
    console.warn(`FSDK: items missmatch in ${enum_.name}. Missing keys: ${JSON.stringify(missingKeys)}. Extra keys: ${JSON.stringify(extraKeys)}`);
    return;
  }

  for (const key of enumKeys)
    if (enum_[key] !== values[key])
      console.warn(`FSDK: items missmatch in ${enum_.name}. ${enum_[key]} != ${values[key]} for ${key}.`);
}

checkMatchingEnums(ERROR, CONSTANTS.ERROR);
checkMatchingEnums(IMAGEMODE, CONSTANTS.IMAGEMODE);
checkMatchingEnums(VIDEOCOMPRESSIONTYPE, CONSTANTS.VIDEOCOMPRESSIONTYPE);
checkMatchingEnums(FEATURE, CONSTANTS.FEATURE);

export type FacialAttribute = 
  'Age'         |
  'AgeGroups'   |
  'Gender'      |
  'Expression'  |
  'Angles'      |
  'Liveness'    ;

export type TrackerFacialAttribute =
  FacialAttribute |
  'LivenessError' |
  'ImageQuality' |
  'Confidence';

export type Parameter = 
  'FaceDetectionModel'                   |
  'FaceDetection2Model'                  |
  'FaceRecognition2Model'                |
  'FaceDetection2Threshold'              |
  'FaceDetection2BatchSize'              |
  'FaceRecognition2BatchSize'            |
  'FaceDetection2PatchSize'              |
  'FaceDetection2PatchMode'              |
  'FaceDetection2BigFaceSize'            |
  'FaceRecognition2UseFlipTest'          |
  'LivenessModel'                        |
  'TrimOutOfScreenFaces'                 |
  'TrimFacesWithUncertainFacialFeatures' |
  'ComputationDelegate'                  |
  'PassiveLivenessComputationDelegate'   |
  'FaceDetection2ComputationDelegate'    |
  'FaceRecognition2ComputationDelegate';

export type TrackerParameter =
  Parameter |
  'TrimFacesWithUncertainFacialFeatures'         |
  'VideoFeedDiscontinuity'                       |
  'DetectionVersion'                             |
  'ComputationDelegate'                          |
  'PassiveLivenessComputationDelegate'           |
  'FaceDetection2ComputationDelegate'            |
  'FaceRecognition2ComputationDelegate'          |
  'HandleArbitraryRotations'                     |
  'DetermineFaceRotationAngle'                   |
  'InternalResizeWidth'                          |
  'FaceDetectionThreshold'                       |
  'DetectFaceOnceEvery'                          |
  'FacialFeatureJitterSuppression'               |
  'RecognizeFaces'                               |
  'DetectEyes'                                   |
  'DetectFacialFeatures'                         |
  'RecognitionPrecision'                         |
  'DetectGender'                                 |
  'DetectExpression'                             |
  'DetectAge'                                    |
  'DetectAngles'                                 |
  'DetectLiveness'                               |
  'SuppressMisdetectedFaces'                     |
  'FacialFeatureDeviationThreshold'              |
  'KeepFaceImages'                               |
  'FaceTrackingDistance'                         |
  'Threshold'                                    |
  'Threshold2'                                   |
  'MemoryLimit'                                  |
  'Learning'                                     |
  'SmoothFacialFeatures'                         |
  'FacialFeatureSmoothingSpatial'                |
  'FacialFeatureSmoothingTemporal'               |
  'SmoothAttributeExpressionSmile'               |
  'AttributeExpressionSmileSmoothingSpatial'     |
  'AttributeExpressionSmileSmoothingTemporal'    |
  'SmoothAttributeExpressionEyesOpen'            |
  'AttributeExpressionEyesOpenSmoothingSpatial'  |
  'AttributeExpressionEyesOpenSmoothingTemporal' |
  'SmoothAttributeAge'                           |
  'AttributeAgeSmoothingSpatial'                 |
  'AttributeAgeSmoothingTemporal'                |
  'SmoothAttributeLiveness'                      |
  'LivenessFramesCount'                          |
  'AttributeLivenessSmoothingAlpha'              |
  'PurgeIDReassignment'                          |
  'ContinuousVideoFeed'                          |
  'PrevFrameCount'                               |
  'DeleteCameras';

export type ParameterValue = string | number | boolean;
export type Parameters<T extends Parameter> = Record<T, ParameterValue>;
export type TrackerParameters<P extends TrackerParameter> = { [K in P]: ParameterValueType<K> };

export type FlatType<T> = { [K in keyof T]: T[K] } & {};

export type ParameterValueType<P extends TrackerParameter> = {
  FaceDetectionModel: string,
  TrimOutOfScreenFaces: boolean,
  TrimFacesWithUncertainFacialFeatures: boolean,
  VideoFeedDiscontinuity: boolean,
  DetectionVersion: number,
  FaceDetection2Model: string,
  FaceRecognition2Model: string,
  FaceDetection2Threshold: number,
  FaceDetection2BatchSize: number,
  FaceDetection2PatchSize: number,
  FaceDetection2PatchMode: 'fast' | 'mixed' | 'full',
  FaceDetection2BigFaceSize: number,
  FaceRecognition2UseFlipTest: boolean,
  FaceRecognition2BatchSize: number,
  ComputationDelegate:  'none' | 'cpu' | 'gpu' | 'nnapi',
  PassiveLivenessComputationDelegate:  'none' | 'cpu' | 'gpu' | 'nnapi',
  FaceDetection2ComputationDelegate:  'none' | 'cpu' | 'gpu' | 'nnapi',
  FaceRecognition2ComputationDelegate:  'none' | 'cpu' | 'gpu' | 'nnapi',
  HandleArbitraryRotations: boolean,
  DetermineFaceRotationAngle: boolean,
  InternalResizeWidth: number,
  FaceDetectionThreshold: number,
  DetectFaceOnceEvery: number,
  FacialFeatureJitterSuppression: number,
  RecognizeFaces: boolean,
  DetectEyes: boolean,
  DetectFacialFeatures: boolean,
  RecognitionPrecision: number,
  DetectGender: boolean,
  DetectExpression: boolean,
  DetectAge: boolean,
  DetectAngles: boolean,
  DetectLiveness: boolean,
  SuppressMisdetectedFaces: boolean,
  FacialFeatureDeviationThreshold: number,
  KeepFaceImages: boolean,
  FaceTrackingDistance: number,
  Threshold: number,
  Threshold2: number,
  MemoryLimit: number,
  Learning: boolean,
  SmoothFacialFeatures: boolean,
  FacialFeatureSmoothingSpatial: number,
  FacialFeatureSmoothingTemporal: number,
  SmoothAttributeExpressionSmile: boolean,
  AttributeExpressionSmileSmoothingSpatial: number,
  AttributeExpressionSmileSmoothingTemporal: number,
  SmoothAttributeExpressionEyesOpen: boolean,
  AttributeExpressionEyesOpenSmoothingSpatial: number,
  AttributeExpressionEyesOpenSmoothingTemporal: number,
  SmoothAttributeAge: boolean,
  AttributeAgeSmoothingSpatial: number,
  AttributeAgeSmoothingTemporal: number,
  SmoothAttributeLiveness: boolean,
  LivenessFramesCount: number,
  AttributeLivenessSmoothingAlpha: number,
  PurgeIDReassignment: boolean,
  ContinuousVideoFeed: boolean,
  PrevFrameCount: number,
  DeleteCameras: number[],
  LivenessModel: string,
}[P];
