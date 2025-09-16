#import "FaceSDK.h"

#import <Foundation/Foundation.h>

#include <cmath>
#include <algorithm>

#include "LuxandFaceSDK.h"

@implementation LuxandFaceSDK
RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeFaceSDKSpecJSI>(params);
}

static const NSDictionary<NSString*, NSNumber*> *ERROR = @{
    @"OK":                                @(FSDKE_OK),
    @"FAILED":                            @(FSDKE_FAILED),
    @"NOT_ACTIVATED":                     @(FSDKE_NOT_ACTIVATED),
    @"OUT_OF_MEMORY":                     @(FSDKE_OUT_OF_MEMORY),
    @"INVALID_ARGUMENT":                  @(FSDKE_INVALID_ARGUMENT),
    @"IO_ERROR":                          @(FSDKE_IO_ERROR),
    @"IMAGE_TOO_SMALL":                   @(FSDKE_IMAGE_TOO_SMALL),
    @"FACE_NOT_FOUND":                    @(FSDKE_FACE_NOT_FOUND),
    @"INSUFFICIENT_BUFFER_SIZE":          @(FSDKE_INSUFFICIENT_BUFFER_SIZE),
    @"UNSUPPORTED_IMAGE_EXTENSION":       @(FSDKE_UNSUPPORTED_IMAGE_EXTENSION),
    @"CANNOT_OPEN_FILE":                  @(FSDKE_CANNOT_OPEN_FILE),
    @"CANNOT_CREATE_FILE":                @(FSDKE_CANNOT_CREATE_FILE),
    @"BAD_FILE_FORMAT":                   @(FSDKE_BAD_FILE_FORMAT),
    @"FILE_NOT_FOUND":                    @(FSDKE_FILE_NOT_FOUND),
    @"CONNECTION_CLOSED":                 @(FSDKE_CONNECTION_CLOSED),
    @"CONNECTION_FAILED":                 @(FSDKE_CONNECTION_FAILED),
    @"IP_INIT_FAILED":                    @(FSDKE_IP_INIT_FAILED),
    @"NEED_SERVER_ACTIVATION":            @(FSDKE_NEED_SERVER_ACTIVATION),
    @"ID_NOT_FOUND":                      @(FSDKE_ID_NOT_FOUND),
    @"ATTRIBUTE_NOT_DETECTED":            @(FSDKE_ATTRIBUTE_NOT_DETECTED),
    @"INSUFFICIENT_TRACKER_MEMORY_LIMIT": @(FSDKE_INSUFFICIENT_TRACKER_MEMORY_LIMIT),
    @"UNKNOWN_ATTRIBUTE":                 @(FSDKE_UNKNOWN_ATTRIBUTE),
    @"UNSUPPORTED_FILE_VERSION":          @(FSDKE_UNSUPPORTED_FILE_VERSION),
    @"SYNTAX_ERROR":                      @(FSDKE_SYNTAX_ERROR),
    @"PARAMETER_NOT_FOUND":               @(FSDKE_PARAMETER_NOT_FOUND),
    @"INVALID_TEMPLATE":                  @(FSDKE_INVALID_TEMPLATE),
    @"UNSUPPORTED_TEMPLATE_VERSION":      @(FSDKE_UNSUPPORTED_TEMPLATE_VERSION),
    @"CAMERA_INDEX_DOES_NOT_EXIST":       @(FSDKE_CAMERA_INDEX_DOES_NOT_EXIST),
    @"PLATFORM_NOT_LICENSED":             @(FSDKE_PLATFORM_NOT_LICENSED),
    @"TENSORFLOW_NOT_INITIALIZED":        @(FSDKE_TENSORFLOW_NOT_INITIALIZED),
    @"PLUGIN_NOT_LOADED":                 @(FSDKE_PLUGIN_NOT_LOADED),
    @"PLUGIN_NO_PERMISSION":              @(FSDKE_PLUGIN_NO_PERMISSION),
    @"FACEID_NOT_FOUND":                  @(FSDKE_FACEID_NOT_FOUND),
    @"FACEIMAGE_NOT_FOUND":               @(FSDKE_FACEIMAGE_NOT_FOUND)
};

static const NSDictionary<NSNumber*, NSString*> *ERROR_NAME = @{
    @(FSDKE_OK):                                @"OK",
    @(FSDKE_FAILED):                            @"FAILED",
    @(FSDKE_NOT_ACTIVATED):                     @"NOT_ACTIVATED",
    @(FSDKE_OUT_OF_MEMORY):                     @"OUT_OF_MEMORY",
    @(FSDKE_INVALID_ARGUMENT):                  @"INVALID_ARGUMENT",
    @(FSDKE_IO_ERROR):                          @"IO_ERROR",
    @(FSDKE_IMAGE_TOO_SMALL):                   @"IMAGE_TOO_SMALL",
    @(FSDKE_FACE_NOT_FOUND):                    @"FACE_NOT_FOUND",
    @(FSDKE_INSUFFICIENT_BUFFER_SIZE):          @"INSUFFICIENT_BUFFER_SIZE",
    @(FSDKE_UNSUPPORTED_IMAGE_EXTENSION):       @"UNSUPPORTED_IMAGE_EXTENSION",
    @(FSDKE_CANNOT_OPEN_FILE):                  @"CANNOT_OPEN_FILE",
    @(FSDKE_CANNOT_CREATE_FILE):                @"CANNOT_CREATE_FILE",
    @(FSDKE_BAD_FILE_FORMAT):                   @"BAD_FILE_FORMAT",
    @(FSDKE_FILE_NOT_FOUND):                    @"FILE_NOT_FOUND",
    @(FSDKE_CONNECTION_CLOSED):                 @"CONNECTION_CLOSED",
    @(FSDKE_CONNECTION_FAILED):                 @"CONNECTION_FAILED",
    @(FSDKE_IP_INIT_FAILED):                    @"IP_INIT_FAILED",
    @(FSDKE_NEED_SERVER_ACTIVATION):            @"NEED_SERVER_ACTIVATION",
    @(FSDKE_ID_NOT_FOUND):                      @"ID_NOT_FOUND",
    @(FSDKE_ATTRIBUTE_NOT_DETECTED):            @"ATTRIBUTE_NOT_DETECTED",
    @(FSDKE_INSUFFICIENT_TRACKER_MEMORY_LIMIT): @"INSUFFICIENT_TRACKER_MEMORY_LIMIT",
    @(FSDKE_UNKNOWN_ATTRIBUTE):                 @"UNKNOWN_ATTRIBUTE",
    @(FSDKE_UNSUPPORTED_FILE_VERSION):          @"UNSUPPORTED_FILE_VERSION",
    @(FSDKE_SYNTAX_ERROR):                      @"SYNTAX_ERROR",
    @(FSDKE_PARAMETER_NOT_FOUND):               @"PARAMETER_NOT_FOUND",
    @(FSDKE_INVALID_TEMPLATE):                  @"INVALID_TEMPLATE",
    @(FSDKE_UNSUPPORTED_TEMPLATE_VERSION):      @"UNSUPPORTED_TEMPLATE_VERSION",
    @(FSDKE_CAMERA_INDEX_DOES_NOT_EXIST):       @"CAMERA_INDEX_DOES_NOT_EXIST",
    @(FSDKE_PLATFORM_NOT_LICENSED):             @"PLATFORM_NOT_LICENSED",
    @(FSDKE_TENSORFLOW_NOT_INITIALIZED):        @"TENSORFLOW_NOT_INITIALIZED",
    @(FSDKE_PLUGIN_NOT_LOADED):                 @"PLUGIN_NOT_LOADED",
    @(FSDKE_PLUGIN_NO_PERMISSION):              @"PLUGIN_NO_PERMISSION",
    @(FSDKE_FACEID_NOT_FOUND):                  @"FACEID_NOT_FOUND",
    @(FSDKE_FACEIMAGE_NOT_FOUND):               @"FACEIMAGE_NOT_FOUND",
};

static const NSDictionary<NSString*, NSNumber*> *FEATURE = @{
    @"LEFT_EYE":                    @(FSDKP_LEFT_EYE),
    @"RIGHT_EYE":                   @(FSDKP_RIGHT_EYE),
    @"LEFT_EYE_INNER_CORNER":       @(FSDKP_LEFT_EYE_INNER_CORNER),
    @"LEFT_EYE_OUTER_CORNER":       @(FSDKP_LEFT_EYE_OUTER_CORNER),
    @"LEFT_EYE_LOWER_LINE1":        @(FSDKP_LEFT_EYE_LOWER_LINE1),
    @"LEFT_EYE_LOWER_LINE2":        @(FSDKP_LEFT_EYE_LOWER_LINE2),
    @"LEFT_EYE_LOWER_LINE3":        @(FSDKP_LEFT_EYE_LOWER_LINE3),
    @"LEFT_EYE_UPPER_LINE1":        @(FSDKP_LEFT_EYE_UPPER_LINE1),
    @"LEFT_EYE_UPPER_LINE2":        @(FSDKP_LEFT_EYE_UPPER_LINE2),
    @"LEFT_EYE_UPPER_LINE3":        @(FSDKP_LEFT_EYE_UPPER_LINE3),
    @"LEFT_EYE_LEFT_IRIS_CORNER":   @(FSDKP_LEFT_EYE_LEFT_IRIS_CORNER),
    @"LEFT_EYE_RIGHT_IRIS_CORNER":  @(FSDKP_LEFT_EYE_RIGHT_IRIS_CORNER),
    @"RIGHT_EYE_INNER_CORNER":      @(FSDKP_RIGHT_EYE_INNER_CORNER),
    @"RIGHT_EYE_OUTER_CORNER":      @(FSDKP_RIGHT_EYE_OUTER_CORNER),
    @"RIGHT_EYE_LOWER_LINE1":       @(FSDKP_RIGHT_EYE_LOWER_LINE1),
    @"RIGHT_EYE_LOWER_LINE2":       @(FSDKP_RIGHT_EYE_LOWER_LINE2),
    @"RIGHT_EYE_LOWER_LINE3":       @(FSDKP_RIGHT_EYE_LOWER_LINE3),
    @"RIGHT_EYE_UPPER_LINE1":       @(FSDKP_RIGHT_EYE_UPPER_LINE1),
    @"RIGHT_EYE_UPPER_LINE2":       @(FSDKP_RIGHT_EYE_UPPER_LINE2),
    @"RIGHT_EYE_UPPER_LINE3":       @(FSDKP_RIGHT_EYE_UPPER_LINE3),
    @"RIGHT_EYE_LEFT_IRIS_CORNER":  @(FSDKP_RIGHT_EYE_LEFT_IRIS_CORNER),
    @"RIGHT_EYE_RIGHT_IRIS_CORNER": @(FSDKP_RIGHT_EYE_RIGHT_IRIS_CORNER),
    @"LEFT_EYEBROW_INNER_CORNER":   @(FSDKP_LEFT_EYEBROW_INNER_CORNER),
    @"LEFT_EYEBROW_MIDDLE":         @(FSDKP_LEFT_EYEBROW_MIDDLE),
    @"LEFT_EYEBROW_MIDDLE_LEFT":    @(FSDKP_LEFT_EYEBROW_MIDDLE_LEFT),
    @"LEFT_EYEBROW_MIDDLE_RIGHT":   @(FSDKP_LEFT_EYEBROW_MIDDLE_RIGHT),
    @"LEFT_EYEBROW_OUTER_CORNER":   @(FSDKP_LEFT_EYEBROW_OUTER_CORNER),
    @"RIGHT_EYEBROW_INNER_CORNER":  @(FSDKP_RIGHT_EYEBROW_INNER_CORNER),
    @"RIGHT_EYEBROW_MIDDLE":        @(FSDKP_RIGHT_EYEBROW_MIDDLE),
    @"RIGHT_EYEBROW_MIDDLE_LEFT":   @(FSDKP_RIGHT_EYEBROW_MIDDLE_LEFT),
    @"RIGHT_EYEBROW_MIDDLE_RIGHT":  @(FSDKP_RIGHT_EYEBROW_MIDDLE_RIGHT),
    @"RIGHT_EYEBROW_OUTER_CORNER":  @(FSDKP_RIGHT_EYEBROW_OUTER_CORNER),
    @"NOSE_TIP":                    @(FSDKP_NOSE_TIP),
    @"NOSE_BOTTOM":                 @(FSDKP_NOSE_BOTTOM),
    @"NOSE_BRIDGE":                 @(FSDKP_NOSE_BRIDGE),
    @"NOSE_LEFT_WING":              @(FSDKP_NOSE_LEFT_WING),
    @"NOSE_LEFT_WING_OUTER":        @(FSDKP_NOSE_LEFT_WING_OUTER),
    @"NOSE_LEFT_WING_LOWER":        @(FSDKP_NOSE_LEFT_WING_LOWER),
    @"NOSE_RIGHT_WING":             @(FSDKP_NOSE_RIGHT_WING),
    @"NOSE_RIGHT_WING_OUTER":       @(FSDKP_NOSE_RIGHT_WING_OUTER),
    @"NOSE_RIGHT_WING_LOWER":       @(FSDKP_NOSE_RIGHT_WING_LOWER),
    @"MOUTH_LEFT_CORNER":           @(FSDKP_MOUTH_LEFT_CORNER),
    @"MOUTH_RIGHT_CORNER":          @(FSDKP_MOUTH_RIGHT_CORNER),
    @"MOUTH_TOP":                   @(FSDKP_MOUTH_TOP),
    @"MOUTH_TOP_INNER":             @(FSDKP_MOUTH_TOP_INNER),
    @"MOUTH_BOTTOM":                @(FSDKP_MOUTH_BOTTOM),
    @"MOUTH_BOTTOM_INNER":          @(FSDKP_MOUTH_BOTTOM_INNER),
    @"MOUTH_LEFT_TOP":              @(FSDKP_MOUTH_LEFT_TOP),
    @"MOUTH_LEFT_TOP_INNER":        @(FSDKP_MOUTH_LEFT_TOP_INNER),
    @"MOUTH_RIGHT_TOP":             @(FSDKP_MOUTH_RIGHT_TOP),
    @"MOUTH_RIGHT_TOP_INNER":       @(FSDKP_MOUTH_RIGHT_TOP_INNER),
    @"MOUTH_LEFT_BOTTOM":           @(FSDKP_MOUTH_LEFT_BOTTOM),
    @"MOUTH_LEFT_BOTTOM_INNER":     @(FSDKP_MOUTH_LEFT_BOTTOM_INNER),
    @"MOUTH_RIGHT_BOTTOM":          @(FSDKP_MOUTH_RIGHT_BOTTOM),
    @"MOUTH_RIGHT_BOTTOM_INNER":    @(FSDKP_MOUTH_RIGHT_BOTTOM_INNER),
    @"NASOLABIAL_FOLD_LEFT_UPPER":  @(FSDKP_NASOLABIAL_FOLD_LEFT_UPPER),
    @"NASOLABIAL_FOLD_LEFT_LOWER":  @(FSDKP_NASOLABIAL_FOLD_LEFT_LOWER),
    @"NASOLABIAL_FOLD_RIGHT_UPPER": @(FSDKP_NASOLABIAL_FOLD_RIGHT_UPPER),
    @"NASOLABIAL_FOLD_RIGHT_LOWER": @(FSDKP_NASOLABIAL_FOLD_RIGHT_LOWER),
    @"CHIN_BOTTOM":                 @(FSDKP_CHIN_BOTTOM),
    @"CHIN_LEFT":                   @(FSDKP_CHIN_LEFT),
    @"CHIN_RIGHT":                  @(FSDKP_CHIN_RIGHT),
    @"FACE_CONTOUR1":               @(FSDKP_FACE_CONTOUR1),
    @"FACE_CONTOUR2":               @(FSDKP_FACE_CONTOUR2),
    @"FACE_CONTOUR12":              @(FSDKP_FACE_CONTOUR12),
    @"FACE_CONTOUR13":              @(FSDKP_FACE_CONTOUR13),
    @"FACE_CONTOUR14":              @(FSDKP_FACE_CONTOUR14),
    @"FACE_CONTOUR15":              @(FSDKP_FACE_CONTOUR15),
    @"FACE_CONTOUR16":              @(FSDKP_FACE_CONTOUR16),
    @"FACE_CONTOUR17":              @(FSDKP_FACE_CONTOUR17)
};

static const NSDictionary<NSString*, NSNumber*> *IMAGEMODE = @{
    @"IMAGE_GRAYSCALE_8BIT": @(FSDK_IMAGE_GRAYSCALE_8BIT),
    @"IMAGE_COLOR_24BIT":    @(FSDK_IMAGE_COLOR_24BIT),
    @"IMAGE_COLOR_32BIT":    @(FSDK_IMAGE_COLOR_32BIT)
};

static const NSDictionary<NSString*, NSNumber*> *VIDEOCOMPRESSIONTYPE = @{
    @"MJPEG": @(FSDK_MJPEG)
};

- (NSDictionary *)getConstants {
    NSMutableDictionary *constants = [NSMutableDictionary new];
    constants[@"ERROR"] = ERROR;
    constants[@"IMAGEMODE"] = IMAGEMODE;
    constants[@"VIDEOCOMPRESSIONTYPE"] = VIDEOCOMPRESSIONTYPE;
    constants[@"FEATURE"] = FEATURE;
    return constants;
}

NSString *getError(const int error) {
    return ERROR_NAME[@(error)];
}

void NSArrayToFeatures(NSArray *array, FSDK_Features features) {
    for (int i = 0; i < std::min((int)array.count, FSDK_FACIAL_FEATURE_COUNT); ++i) {
        NSDictionary* dict = array[i];
        features[i].x = [dict[@"x"] intValue];
        features[i].y = [dict[@"y"] intValue];
    }
}

NSArray *FeaturesToNSArray(FSDK_Features features, const int count) {
    NSMutableArray *array = [NSMutableArray arrayWithCapacity:count];

    for (int i = 0; i < count; ++i)
        [array addObject:@{ @"x": @(features[i].x), @"y": @(features[i].y) }];

    return array;
}

NSArray *FeaturesToNSArray(FSDK_Features features) {
    return FeaturesToNSArray(features, FSDK_FACIAL_FEATURE_COUNT);
}

NSDictionary *FacePositionToNSDictionary(const TFacePosition& position) {
    NSMutableDictionary *result = [NSMutableDictionary new];
    result[@"xc"]    = @(position.xc);
    result[@"yc"]    = @(position.yc);
    result[@"w"]     = @(position.w);
    result[@"angle"] = @(position.angle);
    return result;
}

TFacePosition NSDictionaryToFacePosition(NSDictionary *map) {
    return {
        [map[@"xc"] intValue],
        [map[@"yc"] intValue],
        [map[@"w"] intValue],
        0, // padding
        [map[@"angle"] doubleValue]
    };
}

NSDictionary *FaceToNSDictionary(TFace face) {
    NSMutableDictionary *result = [NSMutableDictionary new];
    NSMutableDictionary *bbox = [NSMutableDictionary new];

    bbox[@"p0"] = PointToNSDictionary(face.bbox.p0);
    bbox[@"p1"] = PointToNSDictionary(face.bbox.p1);

    NSMutableArray *features = [NSMutableArray arrayWithCapacity:5];

    for (int i = 0; i < 5; ++i)
        [features addObject:PointToNSDictionary(face.features[i])];

    result[@"bbox"] = bbox;
    result[@"features"] = features;

    return result;
}

TFace NSDictionaryToFace(NSDictionary *map) {
    TFace result;

    NSDictionary *bbox = map[@"bbox"];
    result.bbox.p0 = NSDictionaryToPoint(bbox[@"p0"]);
    result.bbox.p1 = NSDictionaryToPoint(bbox[@"p1"]);

    NSArray *features = map[@"features"];
    for (NSUInteger i = 0; i < 5; ++i)
        result.features[i] = NSDictionaryToPoint(features[i]);

    return result;
}

NSDictionary *PointToNSDictionary(const TPoint& point) {
    NSMutableDictionary *result = [NSMutableDictionary new];
    result[@"x"] = @(point.x);
    result[@"y"] = @(point.y);
    return result;
}

TPoint NSDictionaryToPoint(const NSDictionary *map) {
    return {
        [map[@"x"] intValue],
        [map[@"y"] intValue]
    };
}

NSString *FaceTemplateToBase64(const FSDK_FaceTemplate& faceTemplate) {
    return [[NSData dataWithBytes:faceTemplate.ftemplate length:sizeof(faceTemplate.ftemplate)] base64EncodedStringWithOptions:0];
}

FSDK_FaceTemplate Base64ToFaceTemplate(NSString* base64) {
    FSDK_FaceTemplate result;
    memset(result.ftemplate, 0, sizeof(result.ftemplate));

    const NSData *data = [[NSData alloc] initWithBase64EncodedString:base64 options:0];

    if (data.length > sizeof(result.ftemplate))
        return result;

    memcpy(result.ftemplate, data.bytes, data.length);
    return result;
}

TFacePosition JSFacePositionToFacePosition(const JS::NativeFaceSDK::FacePosition &facePosition) {
    return {
        (int)facePosition.xc(),
        (int)facePosition.yc(),
        (int)facePosition.w(),
        0, // padding
        facePosition.angle()
    };
}

TFace JSFaceToFace(const JS::NativeFaceSDK::Face &face) {
    TFace result;

    result.bbox.p0.x = face.bbox().p0().x();
    result.bbox.p0.y = face.bbox().p0().y();

    result.bbox.p1.x = face.bbox().p1().x();
    result.bbox.p1.y = face.bbox().p1().y();

    for (int i = 0; i < 5; ++i) {
        result.features[i].x = face.features()[i].x();
        result.features[i].y = face.features()[i].y();
    }

    return result;
}

typedef int (^SDKFunction)(NSMutableDictionary*);
typedef int (^StringResultSDKFunction)(char*);
typedef int (^IntegerResultSDKFunction)(int*);
typedef int (^LongResultSDKFunction)(long long*);
typedef int (^FloatResultSDKFunction)(float*);
typedef int (^CreateImageResultSDKFunction)(HImage*);
typedef int (^CreateTrackerResultSDKFunction)(HTracker*);
typedef int (^ByteBufferResultSDKFunction)(unsigned char*);
typedef int (^ImageResultSDKFunction)(HImage);
typedef int (^FacePositionResultSDKFunction)(TFacePosition*);
typedef int (^FaceResultSDKFunction)(TFace*);
typedef int (^FacialFeaturesResultSDKFunction)(FSDK_Features*);
typedef int (^FaceTemplateResultSDKFunction)(FSDK_FaceTemplate*);
typedef int (^LongArrayResultSDKFunction)(long long*);
typedef int (^TrackerIDResultSDKFunction)(long long*, long long*);
typedef int (^IDSimilaritiesResultSDKFunction)(IDSimilarity*, long long*);
typedef int (^CameraResultSDKFunction)(int*);

NSDictionary *ExecuteSDKFunction(SDKFunction function) {
    NSMutableDictionary *map = [NSMutableDictionary new];
    NSMutableDictionary *result = [NSMutableDictionary new];
    const int errorCode = function(result);

    map[@"error"] = getError(errorCode);
    map[@"errorCode"] = @(errorCode);
    map[@"result"] = result;

    return map;
}

NSDictionary *ExecuteStringResultSDKFunction(StringResultSDKFunction function, const int maxSize, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        char *value = new char[maxSize];
        const int errorCode = function(value);

        map[name] = errorCode == FSDKE_OK ? [[NSString new] initWithUTF8String:value] : @"";

        delete[] value;

        return errorCode;
    });
}

NSDictionary *ExecuteStringResultSDKFunction(StringResultSDKFunction function, const int maxSize) {
    return ExecuteStringResultSDKFunction(function, maxSize, @"value");
}

NSDictionary *ExecuteIntegerResultSDKFunction(IntegerResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        int value = -1;
        const int errorCode = function(&value);

        map[name] = @(value);        

        return errorCode;
    });
}

NSDictionary *ExecuteIntegerResultSDKFunction(IntegerResultSDKFunction function) {
    return ExecuteIntegerResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteLongResultSDKFunction(LongResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        long long value = -1;
        const int errorCode = function(&value);

        map[name] = @(value);        

        return errorCode;
    });
}

NSDictionary *ExecuteLongResultSDKFunction(LongResultSDKFunction function) {
    return ExecuteLongResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteFloatResultSDKFunction(FloatResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        float value = -1;
        const int errorCode = function(&value);

        map[name] = @(value);        

        return errorCode;
    });
}

NSDictionary *ExecuteFloatResultSDKFunction(FloatResultSDKFunction function) {
    return ExecuteFloatResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteCreateImageSDKFunction(CreateImageResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        HImage value;
        const int errorCode = function(&value);

        map[name] = @(value);

        return errorCode;
    });
}

NSDictionary *ExecuteCreateImageSDKFunction(CreateImageResultSDKFunction function) {
    return ExecuteCreateImageSDKFunction(function, @"value");
}

NSDictionary *ExecuteCreateTrackerSDKFunction(CreateTrackerResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        HTracker value;
        const int errorCode = function(&value);

        map[name] = @(value);

        return errorCode;
    });
}

NSDictionary *ExecuteCreateTrackerSDKFunction(CreateTrackerResultSDKFunction function) {
    return ExecuteCreateTrackerSDKFunction(function, @"value");
}

NSDictionary *ExecuteByteBufferResultSDKFunction(ByteBufferResultSDKFunction function, const int size, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary* map) {
        unsigned char* value = new unsigned char[size];
        const int errorCode = function(value);

        map[name] = [[NSData dataWithBytes:value length:size] base64EncodedStringWithOptions:0];

        return errorCode;
    });
}

NSDictionary *ExecuteByteBufferResultSDKFunction(ByteBufferResultSDKFunction function, const int size) {
    return ExecuteByteBufferResultSDKFunction(function, size, @"value");
}

NSDictionary *ExecuteImageResultSDKFunction(ImageResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        HImage value = -1;
        int errorCode = FSDK_CreateEmptyImage(&value);

        if (errorCode == FSDKE_OK)
            errorCode = function(value);

        map[name] = @(value);

        return errorCode;
    });
}

NSDictionary *ExecuteImageResultSDKFunction(ImageResultSDKFunction function) {
    return ExecuteImageResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteFacePositionResultSDKFunction(FacePositionResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        TFacePosition value;
        const int errorCode = function(&value);

        map[name] = FacePositionToNSDictionary(value);

        return errorCode;
    });
}

NSDictionary *ExecuteFacePositionResultSDKFunction(FacePositionResultSDKFunction function) {
    return ExecuteFacePositionResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteFaceResultSDKFunction(FaceResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        TFace value;
        const int errorCode = function(&value);

        map[name] = FaceToNSDictionary(value);

        return errorCode;
    });
}

NSDictionary *ExecuteFaceResultSDKFunction(FaceResultSDKFunction function) {
    return ExecuteFaceResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteFeaturesResultSDKFunction(FacialFeaturesResultSDKFunction function, const int size, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        FSDK_Features features;
        const int errorCode = function(&features);

        map[name] = FeaturesToNSArray(features, size);

        return errorCode;
    });
}

NSDictionary *ExecuteFeaturesResultSDKFunction(FacialFeaturesResultSDKFunction function, const NSString *name) {
    return ExecuteFeaturesResultSDKFunction(function, FSDK_FACIAL_FEATURE_COUNT, name);
}

NSDictionary *ExecuteFeaturesResultSDKFunction(FacialFeaturesResultSDKFunction function, const int size) {
    return ExecuteFeaturesResultSDKFunction(function, size, @"value");
}

NSDictionary *ExecuteFeaturesResultSDKFunction(FacialFeaturesResultSDKFunction function) {
    return ExecuteFeaturesResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteFaceTemplateResultSDKFunction(FaceTemplateResultSDKFunction function, const NSString *name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        FSDK_FaceTemplate faceTemplate;
        const int errorCode = function(&faceTemplate);

        map[name] = FaceTemplateToBase64(faceTemplate);

        return errorCode;
    });
}

NSDictionary *ExecuteFaceTemplateResultSDKFunction(FaceTemplateResultSDKFunction function) {
    return ExecuteFaceTemplateResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteLongArrayResultSDKFunction(LongArrayResultSDKFunction function, const int maxSize, const NSString* name) {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        long long* value = new long long[maxSize];
        memset(value, 0, sizeof(long long) * maxSize);
        const int errorCode = function(value);

        NSMutableArray *result = [[NSMutableArray alloc] initWithCapacity: maxSize];
        for (int i = 0; i < maxSize; ++i)
            [result addObject:@(value[i])];

        map[@"value"] = result;

        delete[] value;

        return errorCode;
    });
}

NSDictionary *ExecuteLongArrayResultSDKFunction(LongArrayResultSDKFunction function, const int maxSize) {
    return ExecuteLongArrayResultSDKFunction(function, maxSize, @"value");
}

NSDictionary *ExecuteTrackerIDResultSDKFunction(TrackerIDResultSDKFunction function, const NSString* name) {
    return ExecuteSDKFunction(^(NSMutableDictionary* map) {
        long long id = -1;
        long long faceID = -1;
        const int errorCode = function(&id, &faceID);

        NSMutableDictionary *result = [NSMutableDictionary new];
        result[@"id"] = @(id);
        result[@"faceID"] = @(faceID);

        map[name] = result;

        return errorCode;
    });
}

NSDictionary *ExecuteTrackerIDResultSDKFunction(TrackerIDResultSDKFunction function) {
    return ExecuteTrackerIDResultSDKFunction(function, @"value");
}

NSDictionary *ExecuteIDSimilaritiesSDKFunction(IDSimilaritiesResultSDKFunction function, const int maxSize, const NSString* name) {
    return ExecuteSDKFunction(^(NSMutableDictionary* map) {
        IDSimilarity* value = new IDSimilarity[maxSize] {{ -1, 0 }};
        long long count = 0;
        const int errorCode = function(value, &count);

        NSMutableArray *result = [[NSMutableArray alloc] initWithCapacity: count];
        for (int i = 0; i < count; ++i) {
            NSMutableDictionary *idSimilarity = [NSMutableDictionary new];
            idSimilarity[@"ID"] = @(value[i].ID);
            idSimilarity[@"similarity"] = @(value[i].similarity);
            [result addObject:idSimilarity];
        }

        map[name] = result;

        delete[] value;

        return errorCode;

    });
}

NSDictionary *ExecuteIDSimilaritiesSDKFunction(IDSimilaritiesResultSDKFunction function, const int maxSize) {
    return ExecuteIDSimilaritiesSDKFunction(function, maxSize, @"value");
}

NSDictionary *ExecuteCreateCameraSDKFunction(CameraResultSDKFunction function, const NSString* name) {
    return ExecuteSDKFunction(^(NSMutableDictionary* map) {
        int value = -1;
        const int errorCode = function(&value);

        map[name] = @(value);

        return errorCode;
    });
}

NSDictionary *ExecuteCreateCameraSDKFunction(CameraResultSDKFunction function) {
    return ExecuteCreateCameraSDKFunction(function, @"value");
}

- (NSDictionary *)ActivateLibrary:(NSString *)key {
    return ExecuteSDKFunction(^(NSMutableDictionary *) {
        return FSDK_ActivateLibrary([key UTF8String]);
    });
}

- (NSDictionary *)Initialize {
    return ExecuteSDKFunction(^(NSMutableDictionary *) {
        return FSDK_Initialize(nullptr);
    });
}

- (NSDictionary *)Finalize {
    return ExecuteSDKFunction(^(NSMutableDictionary *) {
        return FSDK_Finalize();
    });
}

- (NSDictionary *)GetLicenseInfo {
    return ExecuteStringResultSDKFunction(^(char *value) {
        return FSDK_GetLicenseInfo(value);
    }, 1024);
}

- (NSDictionary *)CreateEmptyImage {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        return FSDK_CreateEmptyImage(value);
    });
}

- (NSDictionary *)FreeImage:(double)image {
    return ExecuteSDKFunction(^(NSMutableDictionary *) {
        return FSDK_FreeImage(image);
    });
}

- (NSDictionary *)LoadImageFromFile:(NSString *)filename {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        return FSDK_LoadImageFromFile(value, [filename UTF8String]);
    });
}

- (NSDictionary *)LoadImageFromFileWithAlpha:(NSString *)filename {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        return FSDK_LoadImageFromFileWithAlpha(value, [filename UTF8String]);
    });
}

- (NSDictionary *)SaveImageToFile:(NSString *)filename image:(double)image {
    return ExecuteSDKFunction(^(NSMutableDictionary *) {
        return FSDK_SaveImageToFile(image, [filename UTF8String]);
    });
}

- (NSDictionary *)SetJpegCompressionQuality:(double)quality {
    return ExecuteSDKFunction(^(NSMutableDictionary *) {
        return FSDK_SetJpegCompressionQuality(quality);
    });
}

- (NSDictionary *)GetImageWidth:(double)image {
    return ExecuteIntegerResultSDKFunction(^(int *value) {
        return FSDK_GetImageWidth(image, value);
    });
}

- (NSDictionary *)GetImageHeight:(double)image {
    return ExecuteIntegerResultSDKFunction(^(int *value) {
        return FSDK_GetImageHeight(image, value);
    });
}

- (NSDictionary *)LoadImageFromBuffer:(NSString *)buffer width:(double)width height:(double)height scanLine:(double)scanLine imageMode:(double)imageMode {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        const NSData *data = [[NSData alloc] initWithBase64EncodedString:buffer options:0];
        return FSDK_LoadImageFromBuffer(value, (const unsigned char*)data.bytes, width, height, scanLine, (FSDK_IMAGEMODE)imageMode);
    });
}

- (NSDictionary *)GetImageBufferSize:(double)image imageMode:(double)imageMode {
    return ExecuteIntegerResultSDKFunction(^(int *value) {
        return FSDK_GetImageBufferSize(image, value, (FSDK_IMAGEMODE)imageMode);
    });
}

- (NSDictionary *)SaveImageToBuffer:(double)image
                          imageMode:(double)imageMode
                         bufferSize:(double)bufferSize {
    return ExecuteByteBufferResultSDKFunction(^(unsigned char *value) {
        return FSDK_SaveImageToBuffer(image, value, (FSDK_IMAGEMODE)imageMode);
    }, bufferSize);
}

- (NSDictionary *)LoadImageFromJpegBuffer:(NSString *)buffer {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        const NSData *data = [[NSData alloc] initWithBase64EncodedString:buffer options:0];
        return FSDK_LoadImageFromJpegBuffer(value, (const unsigned char*)data.bytes, data.length);
    });
}

- (NSDictionary *)LoadImageFromPngBuffer:(NSString *)buffer {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        const NSData *data = [[NSData alloc] initWithBase64EncodedString:buffer options:0];
        return FSDK_LoadImageFromPngBuffer(value, (const unsigned char*)data.bytes, data.length);
    });
}

- (NSDictionary *)LoadImageFromPngBufferWithAlpha:(NSString *)buffer {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        const NSData *data = [[NSData alloc] initWithBase64EncodedString:buffer options:0];
        return FSDK_LoadImageFromPngBufferWithAlpha(value, (const unsigned char*)data.bytes, data.length);
    });
}

- (NSDictionary *)CopyImage:(double)image {
    return ExecuteImageResultSDKFunction(^(HImage value) {
        return FSDK_CopyImage(image, value);
    });
}

- (NSDictionary *)ResizeImage:(double)image ratio:(double)ratio {
    return ExecuteImageResultSDKFunction(^(HImage value) {
        return FSDK_ResizeImage(image, ratio, value);
    });
}

- (NSDictionary *)RotateImage90:(double)image multiplier:(double)multiplier {
    return ExecuteImageResultSDKFunction(^(HImage value) {
        return FSDK_RotateImage90(image, multiplier, value);
    });
}

- (NSDictionary *)RotateImage:(double)image angle:(double)angle {
    return ExecuteImageResultSDKFunction(^(HImage value) {
        return FSDK_RotateImage(image, angle, value);
    });
}

- (NSDictionary *)RotateImageCenter:(double)image angle:(double)angle x:(double)x y:(double)y {
    return ExecuteImageResultSDKFunction(^(HImage value) {
        return FSDK_RotateImageCenter(image, angle, x, y, value);
    });
}

- (NSDictionary *)CopyRect:(double)image x1:(double)x1 y1:(double)y1 x2:(double)x2 y2:(double)y2 {
    return ExecuteImageResultSDKFunction(^(HImage value) {
        return FSDK_CopyRect(image, x1, y1, x2, y2, value);
    });
}

- (NSDictionary *)CopyRectReplicateBorder:(double)image x1:(double)x1 y1:(double)y1 x2:(double)x2 y2:(double)y2 {
    return ExecuteImageResultSDKFunction(^(HImage value) {
        return FSDK_CopyRectReplicateBorder(image, x1, y1, x2, y2, value);
    });
}

- (NSDictionary *)MirrorImage:(double)image vertical:(BOOL)vertical {
    return ExecuteSDKFunction(^(NSMutableDictionary *) {
        return FSDK_MirrorImage(image, vertical);
    });
}

- (NSDictionary *)ExtractFaceImage:(double)image features:(NSArray *)features width:(double)width height:(double)height {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        HImage resultImage = -1;

        FSDK_Features inputFeatures;
        FSDK_Features resultFeatures;
        
        NSArrayToFeatures(features, inputFeatures);

        const int errorCode = FSDK_ExtractFaceImage(image, &inputFeatures, width, height, &resultImage, &resultFeatures);

        NSMutableDictionary *faceImage = [NSMutableDictionary new];
        faceImage[@"image"] = @(resultImage);
        faceImage[@"features"] = FeaturesToNSArray(resultFeatures);

        map[@"value"] = faceImage;

        return errorCode;
    });
}

- (NSDictionary *)DetectFace:(double)image {
    return ExecuteFacePositionResultSDKFunction(^(TFacePosition *value) {
        return FSDK_DetectFace(image, value);
    });
}

- (NSDictionary *)DetectFace2:(double)image {
    return ExecuteFaceResultSDKFunction(^(TFace *value) {
        return FSDK_DetectFace2(image, value);
    });
}

- (NSDictionary *)DetectMultipleFaces:(double)image maxFaces:(double)maxFaces {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        int count = 0;
        TFacePosition* faces = new TFacePosition[maxFaces];
        const int errorCode = FSDK_DetectMultipleFaces(image, &count, faces, sizeof(TFacePosition) * maxFaces);

        NSMutableArray *value = [NSMutableArray arrayWithCapacity:count];
        for (int i = 0; i < count; ++i)
            [value addObject:FacePositionToNSDictionary(faces[i])];

        map[@"value"] = value;

        delete[] faces;

        return errorCode;
    });
}

- (NSDictionary *)DetectMultipleFaces2:(double)image maxFaces:(double)maxFaces {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        int count = 0;
        TFace* faces = new TFace[maxFaces];
        const int errorCode = FSDK_DetectMultipleFaces2(image, &count, faces, sizeof(TFace) * maxFaces);

        NSMutableArray *value = [NSMutableArray arrayWithCapacity:count];
        for (int i = 0; i < count; ++i)
            [value addObject:FaceToNSDictionary(faces[i])];

        map[@"value"] = value;

        delete[] faces;

        return errorCode;
    });
}

- (NSDictionary *)SetFaceDetectionParameters:(BOOL)handleArbitraryRotations
                  determineFaceRotationAngle:(BOOL)determineFaceRotationAngle
                         internalResizeWidth:(double)internalResizeWidth {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        return FSDK_SetFaceDetectionParameters(handleArbitraryRotations, determineFaceRotationAngle, internalResizeWidth);
    });
}

- (NSDictionary *)SetFaceDetectionThreshold:(double)threshold {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        return FSDK_SetFaceDetectionThreshold(threshold);
    }); 
}

- (NSDictionary *)GetDetectedFaceConfidence {
    return ExecuteIntegerResultSDKFunction(^(int* value) {
        return FSDK_GetDetectedFaceConfidence(value);
    });
}

- (NSDictionary *)DetectFacialFeatures:(double)image {
    return ExecuteFeaturesResultSDKFunction(^(FSDK_Features* features) {
        return FSDK_DetectFacialFeatures(image, features);
    });
}

- (NSDictionary *)DetectFacialFeaturesInRegion:(double)image
                                      position:(JS::NativeFaceSDK::FacePosition &)position {
    return ExecuteFeaturesResultSDKFunction(^(FSDK_Features* features) {
        const TFacePosition facePosition = JSFacePositionToFacePosition(position);
        return FSDK_DetectFacialFeaturesInRegion(image, &facePosition, features);
    });
}

- (NSDictionary *)DetectEyes:(double)image {
    return ExecuteFeaturesResultSDKFunction(^(FSDK_Features* features) {
        return FSDK_DetectEyes(image, features);
    }, 2);
}

- (NSDictionary *)DetectEyesInRegion:(double)image
                            position:(JS::NativeFaceSDK::FacePosition &)position {
    return ExecuteFeaturesResultSDKFunction(^(FSDK_Features* features) {
        const TFacePosition facePosition = JSFacePositionToFacePosition(position);
        return FSDK_DetectEyesInRegion(image, &facePosition, features);
    }, 2);
}

- (NSDictionary *)GetFaceTemplate:(double)image {
    return ExecuteFaceTemplateResultSDKFunction(^(FSDK_FaceTemplate* value) {
        return FSDK_GetFaceTemplate(image, value);
    });
}

- (NSDictionary *)GetFaceTemplate2:(double)image {
    return ExecuteFaceTemplateResultSDKFunction(^(FSDK_FaceTemplate* value) {
        return FSDK_GetFaceTemplate2(image, value);
    });
}

- (NSDictionary *)GetFaceTemplateInRegion:(double)image
                                 position:(JS::NativeFaceSDK::FacePosition &)position {
    return ExecuteFaceTemplateResultSDKFunction(^(FSDK_FaceTemplate* value) {
        const TFacePosition facePosition = JSFacePositionToFacePosition(position);
        return FSDK_GetFaceTemplateInRegion(image, &facePosition, value);
    });
}

- (NSDictionary *)GetFaceTemplateInRegion2:(double)image
                                      face:(JS::NativeFaceSDK::Face &)face {
    return ExecuteFaceTemplateResultSDKFunction(^(FSDK_FaceTemplate* value) {
        const TFace facePosition = JSFaceToFace(face);
        return FSDK_GetFaceTemplateInRegion2(image, &facePosition, value);
    });                                        
}

- (NSDictionary *)GetFaceTemplateUsingFeatures:(double)image
                                      features:(NSArray *)features {
    return ExecuteFaceTemplateResultSDKFunction(^(FSDK_FaceTemplate* value) {
        FSDK_Features fsdkFeatures;
        NSArrayToFeatures(features, fsdkFeatures);
        return FSDK_GetFaceTemplateUsingFeatures(image, &fsdkFeatures, value);
    });                                        
}

- (NSDictionary *)GetFaceTemplateUsingEyes:(double)image
                                  features:(NSArray *)features {
    return ExecuteFaceTemplateResultSDKFunction(^(FSDK_FaceTemplate* value) {
        FSDK_Features fsdkFeatures;
        NSArrayToFeatures(features, fsdkFeatures);
        return FSDK_GetFaceTemplateUsingEyes(image, &fsdkFeatures, value);
    });
}

- (NSDictionary *)MatchFaces:(NSString *)template1
                   template2:(NSString *)template2 {
    return ExecuteFloatResultSDKFunction(^(float* value) {
        const FSDK_FaceTemplate t1 = Base64ToFaceTemplate(template1);
        const FSDK_FaceTemplate t2 = Base64ToFaceTemplate(template2);
        return FSDK_MatchFaces(&t1, &t2, value);
    });
}

- (NSDictionary *)GetMatchingThresholdAtFAR:(double)value {
    return ExecuteFloatResultSDKFunction(^(float* result) {
        return FSDK_GetMatchingThresholdAtFAR(value, result);
    });
}

- (NSDictionary *)GetMatchingThresholdAtFRR:(double)value {
    return ExecuteFloatResultSDKFunction(^(float* result) {
        return FSDK_GetMatchingThresholdAtFRR(value, result);
    });
}

- (NSDictionary *)CreateTracker {
    return ExecuteCreateTrackerSDKFunction(^(HTracker *tracker) {
        return FSDK_CreateTracker(tracker);
    });
}

- (NSDictionary *)LoadTrackerMemoryFromFile:(NSString *)filename {
    return ExecuteCreateTrackerSDKFunction(^(HTracker *tracker) {
        return FSDK_LoadTrackerMemoryFromFile(tracker, [filename UTF8String]);
    });
}

- (NSDictionary *)LoadTrackerMemoryFromBuffer:(NSString *)buffer {
    return ExecuteCreateTrackerSDKFunction(^(HTracker *tracker) {
        const NSData *data = [[NSData alloc] initWithBase64EncodedString:buffer options:0];
        return FSDK_LoadTrackerMemoryFromBuffer(tracker, (const unsigned char*)data.bytes);
    });
}

- (NSDictionary *)FreeTracker:(double)tracker {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_FreeTracker(tracker);
    });
}

- (NSDictionary *)ClearTracker:(double)tracker {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_ClearTracker(tracker);
    });
}

- (NSDictionary *)SaveTrackerMemoryToFile:(double)tracker
                                 filename:(NSString *)filename {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_SaveTrackerMemoryToFile(tracker, [filename UTF8String]);
    });
}

- (NSDictionary *)GetTrackerMemoryBufferSize:(double)tracker {
    return ExecuteLongResultSDKFunction(^(long long* value) {
        return FSDK_GetTrackerMemoryBufferSize(tracker, value);
    });
}

- (NSDictionary *)SaveTrackerMemoryToBuffer:(double)tracker
                                 bufferSize:(double)bufferSize {
    return ExecuteByteBufferResultSDKFunction(^(unsigned char *value) {
        return FSDK_SaveTrackerMemoryToBuffer(tracker, value, bufferSize);
    }, bufferSize);
}

- (NSDictionary *)SetTrackerParameter:(double)tracker
                                 name:(NSString *)name
                                value:(NSString *)value {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_SetTrackerParameter(tracker, [name UTF8String], [value UTF8String]);
    });
}

- (NSDictionary *)SetTrackerMultipleParameters:(double)tracker
                                    parameters:(NSString *)parameters {
    return ExecuteIntegerResultSDKFunction(^(int* value) {
        return FSDK_SetTrackerMultipleParameters(tracker, [parameters UTF8String], value);
    });
}

- (NSDictionary *)GetTrackerParameter:(double)tracker
                                 name:(NSString *)name
                              maxSize:(double)maxSize {
    return ExecuteStringResultSDKFunction(^(char* value) {
        return FSDK_GetTrackerParameter(tracker, [name UTF8String], value, maxSize);
    }, maxSize);
}

- (NSDictionary *)FeedFrame:(double)tracker
                      index:(double)index
                      image:(double)image
                   maxFaces:(double)maxFaces {
    return ExecuteSDKFunction(^(NSMutableDictionary *map) {
        long long *ids = new long long[(int)maxFaces];
        long long count = 0;
        const int errorCode = FSDK_FeedFrame(tracker, index, image, &count, ids, maxFaces * sizeof(long long));

        NSMutableArray *result = [NSMutableArray arrayWithCapacity:count];
        for (int i = 0; i < count; ++i)
            [result addObject:@(ids[i])];

        map[@"value"] = result;
        
        delete[] ids;
        
        return errorCode;
    });
}

- (NSDictionary *)GetTrackerEyes:(double)tracker
                           index:(double)index
                              id:(double)id {
    return ExecuteFeaturesResultSDKFunction(^(FSDK_Features* value) {
        return FSDK_GetTrackerEyes(tracker, index, id, value);
    }, 2);
}

- (NSDictionary *)GetTrackerFacialFeatures:(double)tracker
                                     index:(double)index
                                        id:(double)id {
    return ExecuteFeaturesResultSDKFunction(^(FSDK_Features* value) {
        return FSDK_GetTrackerFacialFeatures(tracker, index, id, value);
    }, 2);
}

- (NSDictionary *)GetTrackerFacePosition:(double)tracker
                                   index:(double)index
                                      id:(double)id {
    return ExecuteFacePositionResultSDKFunction(^(TFacePosition *value) {
        return FSDK_GetTrackerFacePosition(tracker, index, id, value);
    });
}

- (NSDictionary *)GetTrackerFace:(double)tracker
                           index:(double)index
                              id:(double)id {
    return ExecuteFaceResultSDKFunction(^(TFace *value) {
        return FSDK_GetTrackerFace(tracker, index, id, value);
    });
}

- (NSDictionary *)LockID:(double)tracker
                      id:(double)id {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_LockID(tracker, id);
    });
}

- (NSDictionary *)UnlockID:(double)tracker
                      id:(double)id {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_UnlockID(tracker, id);
    });
}

- (NSDictionary *)PurgeID:(double)tracker
                      id:(double)id {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_PurgeID(tracker, id);
    });
}

- (NSDictionary *)SetName:(double)tracker
                       id:(double)id
                     name:(NSString *)name {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_SetName(tracker, id, [name UTF8String]);
    });
}

- (NSDictionary *)GetName:(double)tracker
                       id:(double)id
                  maxSize:(double)maxSize {
    return ExecuteStringResultSDKFunction(^(char *value) {
        return FSDK_GetName(tracker, id, value, maxSize);
    }, maxSize);
}

- (NSDictionary *)GetAllNames:(double)tracker
                           id:(double)id
                      maxSize:(double)maxSize {
    return ExecuteStringResultSDKFunction(^(char *value) {
        return FSDK_GetAllNames(tracker, id, value, maxSize);
    }, maxSize);
}

- (NSDictionary *)GetIDReassignment:(double)tracker
                                 id:(double)id {
    return ExecuteLongResultSDKFunction(^(long long *value) {
        return FSDK_GetIDReassignment(tracker, id, value);
    });
}

- (NSDictionary *)GetSimilarIDCount:(double)tracker
                                 id:(double)id {
    return ExecuteLongResultSDKFunction(^(long long *value) {
        return FSDK_GetSimilarIDCount(tracker, id, value);
    });
}

- (NSDictionary *)GetSimilarIDList:(double)tracker
                                id:(double)id
                             count:(double)count {
    return ExecuteLongArrayResultSDKFunction(^(long long *value) {
        return FSDK_GetSimilarIDList(tracker, id, value, count);
    }, count);
}

- (NSDictionary *)GetTrackerIDsCount:(double)tracker {
    return ExecuteLongResultSDKFunction(^(long long *value) {
        return FSDK_GetTrackerIDsCount(tracker, value);
    });
}

- (NSDictionary *)GetTrackerAllIDs:(double)tracker
                             count:(double)count {
    return ExecuteLongArrayResultSDKFunction(^(long long *value) {
        return FSDK_GetTrackerAllIDs(tracker, value, count);
    }, count);
}

- (NSDictionary *)GetTrackerFaceIDsCountForID:(double)tracker
                                           id:(double)id {
    return ExecuteLongResultSDKFunction(^(long long *value) {
        return FSDK_GetTrackerFaceIDsCountForID(tracker, id, value);
    });
}

- (NSDictionary *)GetTrackerFaceIDsForID:(double)tracker
                                      id:(double)id
                                   count:(double)count {
    return ExecuteLongArrayResultSDKFunction(^(long long *value) {
        return FSDK_GetTrackerAllIDs(tracker, value, count);
    }, count);
}

- (NSDictionary *)GetTrackerIDByFaceID:(double)tracker
                                faceID:(double)faceID {
    return ExecuteLongResultSDKFunction(^(long long* value) {
        return FSDK_GetTrackerIDByFaceID(tracker, faceID, value);
    });
}

- (NSDictionary *)GetTrackerFaceTemplate:(double)tracker
                                  faceID:(double)faceID {
    return ExecuteFaceTemplateResultSDKFunction(^(FSDK_FaceTemplate *value) {
        return FSDK_GetTrackerFaceTemplate(tracker, faceID, value);
    });
};

- (NSDictionary *)GetTrackerFaceImage:(double)tracker
                               faceID:(double)faceID {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        return FSDK_GetTrackerFaceImage(tracker, faceID, value);
    });
}

- (NSDictionary *)SetTrackerFaceImage:(double)tracker
                               faceID:(double)faceID
                                image:(double)image {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_SetTrackerFaceImage(tracker, faceID, image);
    });
}

- (NSDictionary *)DeleteTrackerFaceImage:(double)tracker
                                  faceID:(double)faceID {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_DeleteTrackerFaceImage(tracker, faceID);
    });
}

- (NSDictionary *)TrackerCreateID:(double)tracker
                     faceTemplate:(NSString *)faceTemplate {
    return ExecuteTrackerIDResultSDKFunction(^(long long* id, long long *faceID) {
        const FSDK_FaceTemplate value = Base64ToFaceTemplate(faceTemplate);
        return FSDK_TrackerCreateID(tracker, &value, id, faceID);
    });
}

- (NSDictionary *)AddTrackerFaceTemplate:(double)tracker
                                      id:(double)id
                            faceTemplate:(NSString *)faceTemplate {
    return ExecuteLongResultSDKFunction(^(long long* value) {
        const FSDK_FaceTemplate tmplt = Base64ToFaceTemplate(faceTemplate);
        return FSDK_AddTrackerFaceTemplate(tracker, id, &tmplt, value);
    });
}

- (NSDictionary *)DeleteTrackerFace:(double)tracker
                             faceID:(double)faceID {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_DeleteTrackerFace(tracker, faceID);
    });
}

- (NSDictionary *)TrackerMatchFaces:(double)tracker
                       faceTemplate:(NSString *)faceTemplate
                          threshold:(double)threshold
                            maxSize:(double)maxSize {
    return ExecuteIDSimilaritiesSDKFunction(^(IDSimilarity *similarities, long long *count) {
        const FSDK_FaceTemplate tmplt = Base64ToFaceTemplate(faceTemplate);
        return FSDK_TrackerMatchFaces(tracker, &tmplt, threshold, similarities, count, maxSize * sizeof(IDSimilarity));
    }, maxSize);
}

- (NSDictionary *)GetTrackerFacialAttribute:(double)tracker
                                      index:(double)index
                                         id:(double)id
                                       name:(NSString *)name
                                    maxSize:(double)maxSize {
    return ExecuteStringResultSDKFunction(^(char *value) {
        return FSDK_GetTrackerFacialAttribute(tracker, index, id, [name UTF8String], value, maxSize);
    }, maxSize);
}

- (NSDictionary *)DetectFacialAttributeUsingFeatures:(double)image
                                            features:(NSArray *)features
                                                name:(NSString *)name
                                             maxSize:(double)maxSize {
    return ExecuteStringResultSDKFunction(^(char *value) {
        FSDK_Features fsdkFeatures;
        NSArrayToFeatures(features, fsdkFeatures);
        return FSDK_DetectFacialAttributeUsingFeatures(image, &fsdkFeatures, [name UTF8String], value, maxSize);
    }, maxSize);
}

- (NSDictionary *)GetValueConfidence:(NSString *)values
                               value:(NSString *)value {
    return ExecuteFloatResultSDKFunction(^(float *result) {
        return FSDK_GetValueConfidence([values UTF8String], [value UTF8String], result);
    });
}

- (NSDictionary *)SetHTTPProxy:(NSString *)address
                          port:(double)port
                      username:(NSString *)username
                      password:(NSString *)password {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_SetHTTPProxy([address UTF8String], port, [username UTF8String], [password UTF8String]);
    });
}

- (NSDictionary *)OpenIPVideoCamera:(double)compression
                                url:(NSString *)url
                           username:(NSString *)username
                           password:(NSString *)password
                            timeout:(double)timeout {
    return ExecuteCreateCameraSDKFunction(^(int *value) {
        return FSDK_OpenIPVideoCamera((FSDK_VIDEOCOMPRESSIONTYPE)compression, [url UTF8String], [username UTF8String], [password UTF8String], timeout, value);
    });
}

- (NSDictionary *)CloseVideoCamera:(double)camera {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_CloseVideoCamera(camera);
    });
}

- (NSDictionary *)GrabFrame:(double)camera {
    return ExecuteCreateImageSDKFunction(^(HImage *value) {
        return FSDK_GrabFrame(camera, value);
    });
}

- (NSDictionary *)InitializeCapturing {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_InitializeCapturing();
    });
}

- (NSDictionary *)FinalizeCapturing {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_FinalizeCapturing();
    });
}

- (NSDictionary *)SetParameter:(NSString *)name
                         value:(NSString *)value {
    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_SetParameter([name UTF8String], [value UTF8String]);
    });
}

- (NSDictionary *)SetParameters:(NSString *)parameters {
    return ExecuteIntegerResultSDKFunction(^(int* value) {
        return FSDK_SetParameters([parameters UTF8String], value);
    });
}

- (NSDictionary *)InitializeIBeta {
    NSString *dataDir = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
    NSString *dataDirPath = [@"external:dataDir=" stringByAppendingPathComponent:dataDir];

    return ExecuteSDKFunction(^(NSMutableDictionary*) {
        return FSDK_SetParameter("LivenessModel", [dataDirPath UTF8String]);
    });
}

@end
