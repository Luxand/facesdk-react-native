// Copyright 2023 ID R&D Inc. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#define IDFACE_API __attribute__((visibility("default")))

NS_ASSUME_NONNULL_BEGIN

/*!
 @brief An enumeration for SDK error codes
 */
typedef NS_ENUM(NSUInteger, IDFaceErrorEnum) {
    IDFaceErrorFaceTooClose,      /**< A distance between face and image border is too small for preprocessing issues */
    IDFaceErrorFaceCloseToBorder, /**< Face is too close to one or more borders. May reduce the accuracy of spoofing detection because edges of face may not be seen */
    IDFaceErrorFaceCropped, /**< Face is cropped. May reduce the accuracy of spoofing detection because edges of face may not be seen */
    IDFaceErrorFaceNotFound,                        /**< Face detector can't find face on image */
    IDFaceErrorTooManyFaces,                        /**< Face detector found more than one face on image */
    IDFaceErrorFaceTooSmall,                        /**< Facial area is not big enough for analysis */
    IDFaceErrorFaceAngleTooLarge,                   /**< Facial out-of-plane rotation angle is extremely large */
    IDFaceErrorFailedToReadImage,                   /**< File decoding error */
    IDFaceErrorFailedToWriteImage,                  /**< File encoding error */
    IDFaceErrorFailedToReadModel,                   /**< Model deserializing error */
    IDFaceErrorFailedToBuildInterpreter,            /**< tflite::Interpreter building error */
    IDFaceErrorFailedToInvokeInterpreter,           /**< tflite::Interpreter invoking error */
    IDFaceErrorFailedToAllocate,                    /**< Allocation error */
    IDFaceErrorInvalidConfig,                       /**< Config deserializing error */
    IDFaceErrorNoSuchObjectInBuild,                 /**< Engine or backend is not supported by the build */
    IDFaceErrorFailedToPreprocessImageWhilePredict, /**< Liveness prediction error */
    IDFaceErrorFailedToPreprocessImageWhileDetect,  /**< Face detection error */
    IDFaceErrorFailedToPredictLandmarks,            /**< Landmarks prediction error */
    IDFaceErrorInvalidFuseMode,                     /**< Invalid fuse mode provided*/
    IDFaceErrorNullptr,                             /**< Nullptr provided */
    IDFaceErrorLicenseError,                        /**< Some error occurred during license checking */
    IDFaceErrorInvalidMeta,                         /**< Invalid Meta value */
    IDFaceErrorUnknown,                             /**< Unhandled exception in the code */
    IDFaceErrorOK,                                  /**< No errors */
    IDFaceErrorFaceIsOccluded, /**< The biggest face on the input image is occluded, so liveness check is not possible */
    IDFaceErrorFailedToFetchCoreMLDecryptionKey, /**< Failed to fetch CoreML model decryption key from Apple servers */
    IDFaceErrorEyesClosed                        /**< Eyes are closed */
};

/*!
 @brief An enumeration for SDK threading levels
 */
typedef NS_ENUM(NSUInteger, IDFaceThreadingLevel) {
    IDFaceThreadingLevelPipeline, /**< Pipeline threading level, corresponding environment variable: FACESDK_NUM_THREADS_PIPELINE */
    IDFaceThreadingLevelEngine, /**< Single engine (e.g. Pipeline, QualityEngine) threading level, corresponding environment variable: FACESDK_NUM_THREADS_ENGINE */
    IDFaceThreadingLevelOperator /**< Single internal engine operator threading level, * corresponding environment variable: FACESDK_NUM_THREADS_OPERATOR */
};

/**
 * @brief OS type for calibration
 */
typedef NS_ENUM(NSUInteger, IDFaceMetaOS) {
    IDFaceMetaOSAndroid,
    IDFaceMetaOSiOS,
    IDFaceMetaOSDesktop,
    IDFaceMetaOSUnknown
};

/**
 * @brief Device manufacture
 */
typedef NS_ENUM(NSUInteger, IDFaceMetaManufacture) {
    IDFaceMetaManufactureUnknown,
};

/**
 * @brief Device model
 */
typedef NS_ENUM(NSUInteger, IDFaceMetaModel) {
    IDFaceMetaModelUnknown,
};

/**
 * @brief Liveness checking threshold calibration type
 */
typedef NS_ENUM(NSUInteger, IDFaceMetaCalibration) {
    IDFaceMetaCalibrationRegular, /**< Regular calibration, targets low APCER */
    IDFaceMetaCalibrationSoft,    /**< Soft calibration, achieves lower BPCER while still having acceptable APCER */
    IDFaceMetaCalibrationHardened /**< Hardened calibration, targets extra low APCER with higher BPCER */
};

/*!
 * @brief Color encoding enum
 */
typedef NS_ENUM(NSUInteger, IDFaceColorFormat) {
    IDFaceColorFormatRGB888, /**< Bytes in RGB format */
    IDFaceColorFormatBGR888  /**< Bytes in BGR format */
};

/*!
 * @brief IDLive Face license features
 */
typedef NS_ENUM(NSUInteger, IDFaceLicenseFeature) {
    IDFaceLicenseFeaturePad = 12, /**< Presentation attack detection functionality */
    IDFaceLicenseFeatureDfd = 13  /**< Deepfake detection functionality */
};

/*!
 * @brief IDLive Face license feature info.
 */
IDFACE_API
@interface IDFaceLicenseFeatureInfo : NSObject

/*!
 * @brief License feature.
 */
@property(assign) IDFaceLicenseFeature feature;

/*!
 * @brief The license expiration date.
 *        The format is the ISO-8601 instant, such as 2023-12-03T23:59:59Z.
 */
@property(strong) NSString* expirationDate;

@end

/*!
 * @brief FaceSDK error class. Available NSError properties: domain, code, localizedDescription
 */
IDFACE_API
@interface IDFaceError : NSError

/*!
 * @brief Enum value matching internal FaceSDK exception
 */
@property(readonly) IDFaceErrorEnum errorEnum;

/*!
 * @brief String describing the errorEnum property
 */
@property(readonly) NSString* errorName;

@end

@interface NSError (IDFaceError)

@property(readonly) IDFaceErrorEnum errorEnum;

@end

/*!
 * @brief FaceSDK Config class, used to initialize engines.
 */
IDFACE_API
@interface IDFaceConfig : NSObject

- (instancetype)init NS_UNAVAILABLE;

/*!
 * @brief Configuration object creator, from full config path.
 *
 * @param path Full path to directory with configuration files
 * @param configName Configuration file name (e.g. @"ssd.conf")
 * @param error Pointer to NSError, if error has happened
 * @return Configuration object instance
 */
- (instancetype _Nullable)initWithPath:(NSString*)path
                            configName:(NSString*)configName
                                 error:(NSError**)error NS_DESIGNATED_INITIALIZER;

/*!
 * @brief Configuration object creator, from config path relative to `init_data` path.
 *
 * @param dataPath Path to FaceSDK `init_data` directory
 * @param relPath Path, within `init_data` directory, to directory with configuration files (e.g. @"pipelines", @"detection/ssd", @"quality/ExpositionQualityEngine")
 * @param configName Configuration file name (e.g. @"ssd.conf")
 * @param error Pointer to NSError, if error has happened
 * @return Configuration object instance
 */
- (instancetype _Nullable)initWithDataPath:(NSString*)dataPath
                              relativePath:(NSString*)relPath
                                configName:(NSString*)configName
                                     error:(NSError**)error;

/*!
 * @brief Configuration object creator, from config path relative to default `init_data` path (recommended).
 *
 * @param relPath Path, within `init_data` directory, to directory with configuration files (e.g. @"pipelines", @"detection/ssd", @"quality/ExpositionQualityEngine"). Default location of `init_data` is assumed (see `defaultDataPath` method).
 * @param configName Configuration file name (e.g. @"ssd.conf")
 * @param error Pointer to NSError, if error has happened
 * @return Configuration object instance
 */
- (instancetype _Nullable)initWithRelativePath:(NSString*)relPath
                                    configName:(NSString*)configName
                                         error:(NSError**)error;

/*!
 * @brief Path to the default init_data directory, if exists.
 *
 * This method checks for existence of directories
 * `facesdk_init_data` in app bundle (e.g. .../YourApp.app/facesdk_init_data/),
 * `Data` folder in framework bundle (e.g. .../YourApp.app/Frameworks/FaceSdk.framework/Data)
 * and returns the first found.
 */
+ (NSString* _Nullable)defaultDataPath;

@end

/*!
 * @brief FaceSDK Engine base class, providing initialization method.
 */
IDFACE_API
@interface IDFaceEngine : NSObject

- (instancetype)init NS_UNAVAILABLE;

/*!
 * @brief Configuration object creator, from full config path.
 *
 * @param name Name of the engine to initialize (e.g. @"ConfigurablePipeline", @"BaseNnetEngine", @"BaseNnetDetector", @"ExpositionQualityEngine")
 * @param config Configuration object.
 * @param error Pointer to NSError, if error has happened
 * @return Engine object instance
 */
- (instancetype _Nullable)initWithName:(NSString*)name
                                config:(IDFaceConfig*)config
                                 error:(NSError**)error NS_DESIGNATED_INITIALIZER;

/*!
 * @brief Configuration object used to initialize the engine.
 */
@property(strong) IDFaceConfig* config;

@end

/*!
 * @brief FaceSDK Result base class.
 */
IDFACE_API
@interface IDFaceResult : NSObject
@end

@class UIImage;

/*!
 * @brief FaceSDK Image class.
 */
IDFACE_API
@interface IDFaceImage : NSObject

/*!
 * @brief Constructor from UIImage
 * @param image Image Path
 * @param error Pointer to NSError, if error has happened
 * @return FaceSDK Image instance
 */
- (instancetype _Nullable)initWithImage:(UIImage*)image error:(NSError**)error;

/*!
 * @brief Constructor from image data
 * @param imageData Image byte representation
 * @param error Pointer to NSError, if error has happened
 * @return FaceSDK Image instance
 */
- (instancetype _Nullable)initWithData:(NSData*)imageData error:(NSError**)error;

/*!
 * @brief Constructor from image path
 * @param path Image Path
 * @param error Pointer to NSError, if error has happened
 * @return FaceSDK Image instance
 */
- (instancetype _Nullable)initWithPath:(NSString*)path error:(NSError**)error;

/*!
 * @brief Constructor from pixels
 * @param data Image bytes
 * @param rows Number of rows
 * @param cols Number of cols
 * @param order Colors order
 * @param error Pointer to NSError, if error has happened
 * @return FaceSDK Image instance
 */
- (instancetype _Nullable)initWithBuffer:(const uint8_t*)data
                                    rows:(size_t)rows
                                    cols:(size_t)cols
                                   order:(IDFaceColorFormat)order
                                   error:(NSError**)error;

@end

/*!
 * @brief Interface for storing of Image batch (a sequence of photos)
 */
IDFACE_API
@interface IDFaceImageBatch : NSObject

/*!
 * @brief Create Image batch from Image array with timestamps
 *
 * @param images An IDFaceImage array
 * @param timestamps Timestamps, which are corresponded to Image objects from array (An array of numbers with `unsigned long long` precision)
 */
- (instancetype)initWithImages:(NSArray<IDFaceImage*>*)images timestamps:(NSArray<NSNumber*>* _Nullable)timestamps;

/*!
 * @brief Array of images
 */
@property(readonly) NSArray<IDFaceImage*>* images;

/*!
 * @brief Array of numbers with `unsigned long long` precision
 */
@property(readonly) NSArray<NSNumber*>* timestamps;

@end

/*!
 * @brief Interface for liveness detection result
 */
IDFACE_API
@interface IDFaceLivenessResult : IDFaceResult

/*!
 * @brief Classifiers RAW output
 */
@property(assign) float score;

/*!
 * @brief Probability of liveness in range=[0, 1]
 */
@property(assign) float probability;

@end

/*!
 * @brief Interface of quality estimation engine (method)
 */
IDFACE_API
@interface IDFaceQualityResult : IDFaceResult

/*!
 * @brief Quality RAW output
 */
@property(assign) float score;

/*!
 * @brief Class, 0 - bad image, 1 - good image
 */
@property(assign) BOOL class_;

@end

/*!
 * @brief Interface for liveness detection result
 */
IDFACE_API
@interface IDFacePipelineResult : IDFaceResult

/*!
 * @brief Liveness result
 */
@property(strong) IDFaceQualityResult* qualityResult;

/*!
 * @brief Quality result
 */
@property(strong) IDFaceLivenessResult* livenessResult;

@end

/**
 * @brief Meta information provided for calibration
 */
IDFACE_API
@interface IDFaceMeta : NSObject <NSCopying>

@property(strong) NSString* osVersion;               /**< OS version */
@property(assign) IDFaceMetaOS os;                   /**< Device OS type */
@property(assign) IDFaceMetaManufacture manufacture; /**< Device manufacture type */
@property(assign) IDFaceMetaModel model;             /**< Device model type */
@property(assign) IDFaceMetaCalibration calibration; /**< Liveness checking threshold calibration type to use */

@end

/*!
 * @brief  FaceSDK Quality engine, used to run a single quality model.
 */
IDFACE_API
@interface IDFaceQualityEngine : IDFaceEngine

/*!
 * @brief Check quality of face from input image
 *
 * @param image Input image
 * @param error Pointer to NSError, if error has happened
 * @return Result of quality estimation
 */
- (IDFaceQualityResult* _Nullable)checkQuality:(IDFaceImage*)image error:(NSError**)error;

@end

/*!
 * @brief Interface of liveness detection pipeline (tree of methods)
 */
IDFACE_API
@interface IDFacePipeline : IDFaceEngine

/*!
 * @brief Check liveness of face from input image
 *
 * @param image Input image
 * @param error Pointer to NSError, if error has happened
 * @return Result of liveness detection
 */
- (IDFacePipelineResult* _Nullable)checkLiveness:(IDFaceImage*)image error:(NSError**)error;

/*!
 * @brief Perform liveness check on a sequence of photos (image batch).
 * A single results corresponding to the whole image batch will be produced.
 *
 * @param batch Input batch of images (a sequence of photos)
 * @param error Pointer to NSError, if error has happened
 * @return A single liveness result for a given sequence of photos
 */
- (IDFacePipelineResult* _Nullable)checkLivenessForBatch:(IDFaceImageBatch*)batch error:(NSError**)error;

/*!
 * @brief Check liveness of face from input image
 *
 * @param image Input image
 * @param meta Meta information about device
 * @param error Pointer to NSError, if error has happened
 * @return Result of liveness detection
 */
- (IDFacePipelineResult* _Nullable)checkLiveness:(IDFaceImage*)image
                                            meta:(IDFaceMeta* _Nullable)meta
                                           error:(NSError**)error;

/*!
 * @brief Perform liveness check on a sequence of photos (image batch).
 * A single results corresponding to the whole image batch will be produced.
 *
 * @param batch Input batch of images (a sequence of photos)
 * @param meta Meta information about device
 * @param error Pointer to NSError, if error has happened
 * @return A single liveness result for a given sequence of photos
 */
- (IDFacePipelineResult* _Nullable)checkLivenessForBatch:(IDFaceImageBatch*)batch
                                                    meta:(IDFaceMeta* _Nullable)meta
                                                   error:(NSError**)error;

@end

/*!
 * @brief Set of yaw, pith, and roll angles (in degrees)
 */
IDFACE_API
@interface IDFaceHeadPose : NSObject

/*!
 * @brief Pitch angle in degrees
 */
@property(assign) float pitch;

/*!
 * @brief Yaw angle in degrees
 */
@property(assign) float yaw;

/*!
 * @brief  Roll angle in degrees
 */
@property(assign) float roll;

@end

/*!
 * @brief Keypoints structure which is returned by IDFaceDetectorEngine
 */
IDFACE_API
@interface IDFaceKeypoints : NSObject

/*!
 * @brief Coordinates of 68 facial landmarks (CGPoint wrapped in NSValue)
 */
@property(strong) NSArray<NSValue*>* landmarks68;

@end

/*!
 * @brief Face rectangle bounding box
 */
IDFACE_API
@interface IDFaceBoundingBox : NSObject

/*!
 * @brief Detected face rect in image coordinates
 */
@property(assign) CGRect rect;

@end

/**
* @brief Interface for storing of facial parameters
*/
IDFACE_API
@interface IDFaceParameters : NSObject

/*!
 * @brief Facial keypoints
 */
@property(strong) IDFaceKeypoints* keypoints;

/*!
 * @brief Facial bounding box
 */
@property(strong) IDFaceBoundingBox* boundingBox;

/*!
 * @brief Facial head pose (yaw, pitch, roll)
 */
@property(strong) IDFaceHeadPose* headPose;

/*!
 * @brief Distance between pupils
 */
@property(assign) float interpupillaryDistance;

/*!
 * @brief Face occlusion probability from 0 to 1
 */
@property(assign) float occlusionProbability;

/*!
 * @brief Closed eyes probability from 0 to 1
 */
@property(assign) float closedEyesProbability;

@end

/**
 * @brief Result of IDFaceDetectorEngine
 */
IDFACE_API
@interface IDFaceDetectionResult : IDFaceResult

/*!
 * @brief FaceParameters array corresponding to detected faces
 */
@property(strong) NSArray<IDFaceParameters*>* faces;

/*!
 * @brief Approximated image or face orientation in degrees
 */
@property(assign) int orientation;

@end

/**
 * @brief Interface of facial keypoint detector
 */
IDFACE_API
@interface IDFaceDetectorEngine : IDFaceEngine

/**
 * @brief Facial keypoints and bbox detecting method
 *
 * @param image Reference to Image object
 * @param error Pointer to NSError, if error has happened
 * @return Detection result
 */
- (IDFaceDetectionResult* _Nullable)detect:(IDFaceImage*)image error:(NSError**)error;

/**
 * @brief Facial bbox detecting method
 *
 * @param image Reference to Image object
 * @param error Pointer to NSError, if error has happened
 * @return Facial bbox
 */
- (NSArray<IDFaceBoundingBox*>* _Nullable)detectOnlyBoundingBox:(IDFaceImage*)image error:(NSError**)error;

@end

/*!
  * @brief Interface FaceSDK framework.
  */
IDFACE_API
@interface FaceSDK : NSObject

/*!
 * @brief Bundle of the framework
 */
+ (NSBundle*)bundle;

/*!
 * @brief Version of the framework (CFBundleVersion)
 */
+ (NSString*)frameworkVersion;

/*!
 * @brief Short version of the framework (CFBundleShortVersionString)
 */
+ (NSString*)frameworkShortVersion;

/*!
  * @brief Sets the maximum number of threads available for FaceSDK at the specified level.
  * If 0 is passed, then the optimal number of threads is detected automatically
  * (the same effect is achieved if setNumThreads is not called).
  *
  * @param numThreads Maximum number of threads available for FaceSDK at the specified level
  * @param threadingLevel Threading level to apply setting
  * @discussion Function call is equivalent to setting FACESDK_NUM_THREADS_PIPELINE, FACESDK_NUM_THREADS_ENGINE
  * or FACESDK_NUM_THREADS_OPERATOR environment variable before loading FaceSDK library.
  * Function call takes precedence over environment variables.
  */
+ (void)setNumThreads:(unsigned int)numThreads threadingLevel:(enum IDFaceThreadingLevel)threadingLevel;

/*!
  * @brief Sets whether to enable FaceSDK logging. Logging is enabled by default.
  *
  * @param enableLogging Whether to enable logging or not
  * @discussion Function call is equivalent to setting FACESDK_ENABLE_LOGGING environment variable
  * before loading FaceSDK library.
  * Function call takes precedence over environment variables.
  */
+ (void)setEnableLogging:(bool)enableLogging;

/*!
  * @brief Toggles face occlusion detection. When enabled the occluded faces will be rejected.
  *
  * @param enabled Whether to enable the detection or not
  * @discussion Function call is equivalent to setting FACESDK_ENABLE_FACE_OCCLUSION_DETECTION environment variable
  * before loading FaceSDK library.
  * Function call takes precedence over environment variables.
  */
+ (void)setEnableFaceOcclusionDetection:(bool)enabled;

/*!
  * @brief Toggles closed eyes detection. When enabled the faces with closed eyes will be rejected.
  *
  * @param enabled Whether to enable the detection or not
  * @discussion Function call is equivalent to setting FACESDK_ENABLE_CLOSED_EYES_DETECTION environment variable
  * before loading FaceSDK library.
  * Function call takes precedence over environment variables.
  */
+ (void)setEnableClosedEyesDetection:(bool)enabled;

/*!
 * @brief Returns information about all available licensed features.
 *
 * @return Array containing information about all available licensed features.
 */
+ (NSArray<IDFaceLicenseFeatureInfo*>*)getLicenseFeaturesInfo:(NSError**)error;

/*!
 * @deprecated Use getLicenseFeaturesInfo
 * @brief Returns information about a license if available.
 *
 * @return String containing license information
 */
+ (NSString*)getLicenseInfo:(NSError**)error;

/*!
 * @brief Sets the license. Setting license is only needed once per application lifetime.
 * @param license License string.
 * @param error Pointer to NSError for error reporting.
 * @return YES on success, NO otherwise.
 */
+ (BOOL)setLicense:(NSString*)license error:(NSError**)error;

@end

NS_ASSUME_NONNULL_END
