import {
  type Parameter,
  type ParameterValueType,
  type TrackerParameter,
} from './definitions';

export function getParametersString(
  parameters: string | { [key: string]: any }
): string {
  if (typeof parameters === 'string') return parameters;

  return (Object.keys(parameters) as Array<string>)
    .map((e) => `${e.toString()}=${parameters[e]}`)
    .join(';');
}

export function getParameterValue<P extends Parameter | TrackerParameter>(
  value: string,
  parameter: P
): ParameterValueType<P> {
  value = value.trim();

  switch (parameter) {
    // string
    case 'FaceDetectionModel':
    case 'FaceRecognitionModel':
    case 'FacialFeaturesModel':
    case 'LivenessModel':

    // 'fast' | 'mixed' | 'full'
    case 'FaceDetectionPatchMode':

    // Delegate
    case 'ComputationDelegate':
    case 'PassiveLivenessComputationDelegate':
    case 'FaceDetectionComputationDelegate':
    case 'FaceRecognitionComputationDelegate':
    case 'FacialFeaturesComputationDelegate':
      return value as any;

    case 'ContinuousVideoFeed':
    case 'DetectAge':
    case 'DetectAngles':
    case 'DetectExpression':
    case 'DetectFacialFeatures':
    case 'DetectGender':
    case 'DetectLiveness':
    case 'FaceRecognitionUseFlipTest':
    case 'KeepFaceImages':
    case 'Learning':
    case 'PurgeIDReassignment':
    case 'RecognizeFaces':
    case 'SmoothAttributeAge':
    case 'SmoothAttributeExpressionEyesOpen':
    case 'SmoothAttributeExpressionSmile':
    case 'SmoothAttributeLiveness':
    case 'SmoothFacialFeatures':
    case 'SuppressMisdetectedFaces':
    case 'TrimOutOfScreenFaces':
      return (value.toLowerCase() === 'true') as any;

    case 'AttributeAgeSmoothingSpatial':
    case 'AttributeAgeSmoothingTemporal':
    case 'AttributeExpressionEyesOpenSmoothingSpatial':
    case 'AttributeExpressionEyesOpenSmoothingTemporal':
    case 'AttributeExpressionSmileSmoothingSpatial':
    case 'AttributeExpressionSmileSmoothingTemporal':
    case 'AttributeLivenessSmoothingAlpha':
    case 'DetectFaceOnceEvery':
    case 'FaceDetectionBatchSize':
    case 'FaceDetectionBigFaceSize':
    case 'FaceDetectionNumThreads':
    case 'FaceDetectionPatchSize':
    case 'FaceDetectionThreshold':
    case 'FaceRecognitionBatchSize':
    case 'FaceRecognitionNumThreads':
    case 'FaceTrackingDistance':
    case 'FacialFeatureDeviationThreshold':
    case 'FacialFeatureJitterSuppression':
    case 'FacialFeatureSmoothingSpatial':
    case 'FacialFeatureSmoothingTemporal':
    case 'FacialFeaturesNumThreads':
    case 'LivenessFramesCount':
    case 'MemoryLimit':
    case 'ModelNumThreads':
    case 'PassiveLivenessNumThreads':
    case 'PrevFrameCount':
    case 'Threshold':
    case 'Threshold2':
      return (value === '' ? 0 : Number.parseFloat(value)) as any;

    case 'DeleteCameras':
    case 'VideoFeedDiscontinuity':
      return value
        .split(',')
        .map((e) => Number.parseInt(e.trim(), 10)) as any;
  }
}
