#import <VisionCamera/Frame.h>
#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#include <cstddef>
#include <cstdint>
#include <CoreVideo/CoreVideo.h>

#include "LuxandFaceSDK.h"

@interface FrameToFSDKImagePlugin : FrameProcessorPlugin
@end

unsigned char *frameToRGBBuffer(Frame *frame, NSString **error, size_t *outWidth, size_t *outHeight) {
    if (!frame || ![frame isValid]) {
        *error = @"Invalid frame";
        return nullptr;
    }

    CVPixelBufferRef imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);

    if (CVPixelBufferLockBaseAddress(imageBuffer, 0) != kCVReturnSuccess)
        return nullptr;

    const size_t width = CVPixelBufferGetWidth(imageBuffer);
    const size_t height = CVPixelBufferGetHeight(imageBuffer);
    unsigned char *rgbBuffer = new unsigned char[width * height * 3];

    ptrdiff_t outOffset, outRowStride, outPixelStride;

    switch (frame.orientation) {
        case UIImageOrientationUp:
            outOffset = 0;
            outRowStride = 3 * width;
            outPixelStride = 3;
            *outWidth = width;
            *outHeight = height;
            break;
        case UIImageOrientationDown:
            outOffset = 3 * (width * height - 1);
            outRowStride = -3 * width;
            outPixelStride = -3;
            *outWidth = width;
            *outHeight = height;
            break;
        case UIImageOrientationLeft:
            outOffset = 3 * (height - 1);
            outRowStride = -3;
            outPixelStride = 3 * height;
            *outWidth = height;
            *outHeight = width;
            break;            
        case UIImageOrientationRight:
            outOffset = 3 * height * (width - 1);
            outRowStride = 3;
            outPixelStride = -3 * height;
            *outWidth = height;
            *outHeight = width;
            break;
        case UIImageOrientationUpMirrored:
            outOffset = 3 * (width - 1);
            outRowStride = 3 * width;
            outPixelStride = -3;
            *outWidth = width;
            *outHeight = height;
            break;
        case UIImageOrientationDownMirrored:
            outOffset = 3 * width * (height - 1);
            outRowStride = -3 * width;
            outPixelStride = 3;
            *outWidth = width;
            *outHeight = height;
            break;
        case UIImageOrientationLeftMirrored:
            outOffset = 0;
            outRowStride = 3;
            outPixelStride = 3 * height;
            *outWidth = height;
            *outHeight = width;
            break;
        case UIImageOrientationRightMirrored:
            outOffset = 3 * (width * height - 1);
            outRowStride = -3;
            outPixelStride = -3 * height;
            *outWidth = height;
            *outHeight = width;
            break;
    }

    const unsigned int format = CVPixelBufferGetPixelFormatType(imageBuffer);
    switch (format) {
        case kCVPixelFormatType_32BGRA:
        case kCVPixelFormatType_Lossy_32BGRA: {
            const unsigned char *baseAddr = reinterpret_cast<unsigned char*>(CVPixelBufferGetBaseAddress(imageBuffer));
            const size_t bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);

            for (size_t y = 0; y < height; ++y) {
                      unsigned char *rgbPtr = rgbBuffer + outOffset + outRowStride * y;
                const unsigned char *rowPtr = baseAddr + bytesPerRow * y;

                for (size_t x = 0; x < width; ++x, rgbPtr += outPixelStride, rowPtr += 4)
                    memcpy(rgbPtr, rowPtr, 3);
            }
            break;
        }
        case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
        case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
        case kCVPixelFormatType_420YpCbCr10BiPlanarFullRange:
        case kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange:
        case kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarFullRange:
        case kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarVideoRange:
        case kCVPixelFormatType_Lossy_420YpCbCr10PackedBiPlanarVideoRange: {
            const unsigned char *yPlane  = reinterpret_cast<unsigned char*>(CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 0));
            const unsigned char *uvPlane = reinterpret_cast<unsigned char*>(CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 1));

            const size_t yBytesPerRow  = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 0);
            const size_t uvBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 1);

            for (size_t y = 0; y < height; ++y) {
                      unsigned char *rgbPtr = rgbBuffer + outOffset + outRowStride * y;
                const unsigned char *yRow   = yPlane + yBytesPerRow * y;
                const unsigned char *uvRow  = uvPlane + uvBytesPerRow * (y / 2);

                for (size_t x = 0; x < width; uvRow += 2 * (x % 2), ++yRow, rgbPtr += outPixelStride, ++x) {
                    const unsigned int Y = *yRow;
                    const unsigned int U = uvRow[0];
                    const unsigned int V = uvRow[1];

                    const unsigned int R = Y + (91881 * V >> 16) - 179;
                    const unsigned int G = Y - ((22544 * U + 46793 * V) >> 16) + 135;
                    const unsigned int B = Y + (116129 * U >> 16) - 226;

                    rgbPtr[0] = std::clamp(R, 0u, 255u);
                    rgbPtr[1] = std::clamp(G, 0u, 255u);
                    rgbPtr[2] = std::clamp(B, 0u, 255u);
                }
            }
            break;
        }
        default: {
            delete[] rgbBuffer;
            rgbBuffer = nullptr;

            *error = [NSString stringWithFormat:@"Unknown image format: %u", format];

            break;
        }
    }

    CVPixelBufferUnlockBaseAddress(imageBuffer, 0);

    return rgbBuffer;
}

@implementation FrameToFSDKImagePlugin

- (instancetype) initWithProxy:(VisionCameraProxyHolder*)proxy
                   withOptions:(NSDictionary* _Nullable)options {
    self = [super initWithProxy:proxy withOptions:options];
    return self;
}

- (id)callback:(Frame*)frame withArguments:(NSDictionary*)arguments {
    NSString* error = @"";
    size_t width = 0, height = 0;
    const unsigned char *buffer = frameToRGBBuffer(frame, &error, &width, &height);
    
    NSMutableDictionary *result = [NSMutableDictionary new];
    
    HImage image = -1;
    int errorCode = FSDKE_FAILED;
    
    if (buffer)
        errorCode = FSDK_LoadImageFromBuffer(&image, buffer, width, height, width * 3, FSDK_IMAGE_COLOR_24BIT);
    
    result[@"errorCode"] = @(errorCode);
    result[@"error"] = error;
    result[@"handle"] = @(image);

    delete[] buffer;
    
    return result;
}

VISION_EXPORT_FRAME_PROCESSOR(FrameToFSDKImagePlugin, frameToFSDKImage)
@end
