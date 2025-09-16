import { type Parameter, type ParameterValueType, type TrackerParameter } from "./definitions";

export function getParametersString(parameters: string | { [key: string]: any }): string {
  if (typeof parameters === 'string')
    return parameters;

  return (Object.keys(parameters) as Array<string>).map(e => `${e.toString()}=${parameters[e]}`).join(';');
}

export function getParameterValue<P extends Parameter | TrackerParameter>(value: string, parameter: P): ParameterValueType<P> {
  value = value.trim();

  switch (parameter) {
    // string
    case 'FaceDetection2Model':
    case 'FaceDetectionModel':
    case 'FaceRecognition2Model':
    case 'LivenessModel':

    // 'fast' | 'mixed' | 'full'
    case 'FaceDetection2PatchMode':

    // Delegate
    case 'ComputationDelegate':
    case 'FaceDetection2ComputationDelegate':
    case 'FaceRecognition2ComputationDelegate':
    case 'PassiveLivenessComputationDelegate':
      return value as any;

    case 'ContinuousVideoFeed':
    case 'DetectAge':
    case 'DetectAngles':
    case 'DetectExpression':
    case 'DetectEyes':
    case 'DetectFacialFeatures':
    case 'DetectGender':
    case 'DetectLiveness':
    case 'DetermineFaceRotationAngle':
    case 'FaceRecognition2UseFlipTest':
    case 'HandleArbitraryRotations':
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
    case 'TrimFacesWithUncertainFacialFeatures':
    case 'TrimOutOfScreenFaces':
    case 'VideoFeedDiscontinuity':
      return (value.toLowerCase() === 'true') as any;

    case 'AttributeAgeSmoothingSpatial':
    case 'AttributeAgeSmoothingTemporal':
    case 'AttributeExpressionEyesOpenSmoothingSpatial':
    case 'AttributeExpressionEyesOpenSmoothingTemporal':
    case 'AttributeExpressionSmileSmoothingSpatial':
    case 'AttributeExpressionSmileSmoothingTemporal':
    case 'AttributeLivenessSmoothingAlpha':
    case 'DetectFaceOnceEvery':
    case 'DetectionVersion':
    case 'FaceDetection2BatchSize':
    case 'FaceDetection2BigFaceSize':
    case 'FaceDetection2PatchSize':
    case 'FaceDetection2Threshold':
    case 'FaceDetectionThreshold':
    case 'FaceRecognition2BatchSize':
    case 'FaceTrackingDistance':
    case 'FacialFeatureDeviationThreshold':
    case 'FacialFeatureJitterSuppression':
    case 'FacialFeatureSmoothingSpatial':
    case 'FacialFeatureSmoothingTemporal':
    case 'InternalResizeWidth':
    case 'LivenessFramesCount':
    case 'MemoryLimit':
    case 'PrevFrameCount':
    case 'RecognitionPrecision':
    case 'Threshold':
    case 'Threshold2':
      return (value === '' ? 0 : Number.parseFloat(value)) as any;

    case 'DeleteCameras':
      return value.split(',').map(e => Number.parseInt(e.trim())) as any;
  }
}
