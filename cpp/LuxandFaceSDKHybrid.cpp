#include "LuxandFaceSDKHybrid.hpp"

#include <algorithm>
#include <cstring>
#include <vector>

#include "Constants.hpp"

namespace margelo::nitro::luxandfacesdk {

namespace {

VoidResult none(int errorCode) {
  return VoidResult(constants::errorName(errorCode), errorCode);
}

template <typename Result, typename Value>
Result some(int errorCode, Value value) {
  return Result(constants::errorName(errorCode), errorCode, std::move(value));
}

// `TFace` stores integer points, `FSDK_Features` floating point ones, so both layouts have to
// be converted separately even though they land in the same `Point` on the JS side.

Point toPoint(const TPoint& point) {
  return Point(point.x, point.y);
}

Point toPoint(const TPointf& point) {
  return Point(point.x, point.y);
}

TPoint fromPoint(const Point& point) {
  return TPoint{static_cast<int>(point.x), static_cast<int>(point.y)};
}

TPointf fromPointf(const Point& point) {
  return TPointf{static_cast<float>(point.x), static_cast<float>(point.y)};
}

template <typename T>
std::vector<Point> toPoints(const T* points, size_t count) {
  std::vector<Point> result;
  result.reserve(count);

  for (size_t i = 0; i < count; ++i) {
    result.push_back(toPoint(points[i]));
  }

  return result;
}

Face toFace(const TFace& face) {
  return Face(face.score, face.angle,
              FaceBBox(toPoint(face.bbox.p0), toPoint(face.bbox.p1)),
              toPoints(face.features, 5));
}

TFace fromFace(const Face& face) {
  TFace result{};

  result.score = static_cast<float>(face.score);
  result.angle = static_cast<float>(face.angle);
  result.bbox.p0 = fromPoint(face.bbox.p0);
  result.bbox.p1 = fromPoint(face.bbox.p1);

  for (size_t i = 0; i < 5; ++i) {
    result.features[i] =
        i < face.features.size() ? fromPoint(face.features[i]) : TPoint{0, 0};
  }

  return result;
}

void fromPoints(const std::vector<Point>& points, FSDK_Features& features) {
  for (size_t i = 0; i < FSDK_FACIAL_FEATURE_COUNT; ++i) {
    features[i] = i < points.size() ? fromPointf(points[i]) : TPointf{0, 0};
  }
}

FSDK_FaceTemplate toFaceTemplate(const std::shared_ptr<ArrayBuffer>& buffer) {
  FSDK_FaceTemplate result{};
  std::memset(result.ftemplate, 0, sizeof(result.ftemplate));

  if (buffer != nullptr && buffer->data() != nullptr) {
    std::memcpy(result.ftemplate, buffer->data(),
                std::min(buffer->size(), sizeof(result.ftemplate)));
  }

  return result;
}

std::shared_ptr<ArrayBuffer> fromFaceTemplate(const FSDK_FaceTemplate& value) {
  return ArrayBuffer::copy(
      reinterpret_cast<const uint8_t*>(value.ftemplate),
      sizeof(value.ftemplate));
}

template <typename Function>
BufferResult withByteBuffer(size_t size, Function&& function) {
  std::vector<uint8_t> buffer(size, 0);
  const int errorCode = function(buffer.data());

  return some<BufferResult>(errorCode,
                            ArrayBuffer::copy(buffer.data(), buffer.size()));
}

template <typename Function>
StringResult withCharBuffer(size_t size, Function&& function) {
  std::vector<char> buffer(size + 1, 0);
  const int errorCode = function(buffer.data());

  return some<StringResult>(
      errorCode, errorCode == FSDKE_OK ? std::string(buffer.data()) : std::string());
}

template <typename Function>
NumbersResult withIDBuffer(size_t count, Function&& function) {
  std::vector<long long> ids(count, -1);
  const int errorCode = function(ids.data(), count * sizeof(long long));

  std::vector<double> value;
  value.reserve(count);

  for (const long long id : ids) {
    value.push_back(static_cast<double>(id));
  }

  return some<NumbersResult>(errorCode, std::move(value));
}

uint8_t clampByte(int value) {
  return static_cast<uint8_t>(std::clamp(value, 0, 255));
}

struct PlaneView {
  const uint8_t* data;
  size_t size;
  int bytesPerRow;
  int pixelStride;

  const uint8_t* at(int x, int y) const {
    const size_t offset =
        static_cast<size_t>(y) * static_cast<size_t>(bytesPerRow) +
        static_cast<size_t>(x) * static_cast<size_t>(pixelStride);

    return offset < size ? data + offset : nullptr;
  }
};

PlaneView viewOf(const FramePlane& plane) {
  return PlaneView{plane.buffer->data(), plane.buffer->size(),
                   static_cast<int>(plane.bytesPerRow),
                   static_cast<int>(plane.pixelStride)};
}

void yuvToRgb(int y, int u, int v, uint8_t* rgb) {
  const int cu = u - 128;
  const int cv = v - 128;

  rgb[0] = clampByte(y + ((91881 * cv) >> 16));
  rgb[1] = clampByte(y - ((22544 * cu + 46793 * cv) >> 16));
  rgb[2] = clampByte(y + ((116129 * cu) >> 16));
}

bool chromaShiftFor(const std::string& pixelFormat, int& shiftX, int& shiftY) {
  if (pixelFormat.rfind("yuv-420", 0) == 0) {
    shiftX = 1;
    shiftY = 1;
    return true;
  }

  if (pixelFormat.rfind("yuv-422", 0) == 0) {
    shiftX = 1;
    shiftY = 0;
    return true;
  }

  if (pixelFormat.rfind("yuv-444", 0) == 0) {
    shiftX = 0;
    shiftY = 0;
    return true;
  }

  return false;
}

int planarYuvToRgb(const std::vector<FramePlane>& planes,
                   const std::string& pixelFormat, int width, int height,
                   std::vector<uint8_t>& rgb) {
  int shiftX = 0;
  int shiftY = 0;

  if (!chromaShiftFor(pixelFormat, shiftX, shiftY) || planes.size() < 2) {
    return FSDKE_INVALID_ARGUMENT;
  }

  const PlaneView y = viewOf(planes[0]);
  const PlaneView u = viewOf(planes[1]);

  const bool semiPlanar = planes.size() < 3;
  const PlaneView v = semiPlanar ? u : viewOf(planes[2]);
  const int vOffset = semiPlanar ? 1 : 0;

  rgb.assign(static_cast<size_t>(width) * static_cast<size_t>(height) * 3, 0);

  for (int row = 0; row < height; ++row) {
    uint8_t* out =
        rgb.data() + static_cast<size_t>(row) * static_cast<size_t>(width) * 3;

    for (int col = 0; col < width; ++col, out += 3) {
      const uint8_t* yp = y.at(col, row);
      const uint8_t* up = u.at(col >> shiftX, row >> shiftY);
      const uint8_t* vp = v.at(col >> shiftX, row >> shiftY);

      if (yp == nullptr || up == nullptr || vp == nullptr ||
          static_cast<size_t>(vp - v.data + vOffset) >= v.size) {
        return FSDKE_INVALID_ARGUMENT;
      }

      yuvToRgb(*yp, *up, *(vp + vOffset), out);
    }
  }

  return FSDKE_OK;
}

int interleavedToRgb(const FramePlane& plane, int width, int height,
                     int bytesPerPixel, int redOffset, int blueOffset,
                     std::vector<uint8_t>& rgb) {
  const PlaneView source = viewOf(plane);
  rgb.assign(static_cast<size_t>(width) * static_cast<size_t>(height) * 3, 0);

  for (int row = 0; row < height; ++row) {
    uint8_t* out =
        rgb.data() + static_cast<size_t>(row) * static_cast<size_t>(width) * 3;

    for (int col = 0; col < width; ++col, out += 3) {
      const uint8_t* pixel = source.at(col, row);

      if (pixel == nullptr ||
          static_cast<size_t>(pixel - source.data) + bytesPerPixel >
              source.size) {
        return FSDKE_INVALID_ARGUMENT;
      }

      out[0] = pixel[redOffset];
      out[1] = pixel[1];
      out[2] = pixel[blueOffset];
    }
  }

  return FSDKE_OK;
}

template <typename Function>
NumberResult intoNewImage(Function&& function) {
  HImage image = static_cast<HImage>(-1);
  int errorCode = FSDK_CreateEmptyImage(&image);

  if (errorCode == FSDKE_OK) {
    errorCode = function(image);
  }

  return some<NumberResult>(errorCode, static_cast<double>(image));
}

template <typename Handle, typename Function>
NumberResult createHandle(Function&& function) {
  Handle handle = static_cast<Handle>(-1);
  const int errorCode = function(&handle);

  return some<NumberResult>(errorCode, static_cast<double>(handle));
}

template <typename Function>
NumberResult withInt(Function&& function) {
  int value = -1;
  const int errorCode = function(&value);

  return some<NumberResult>(errorCode, static_cast<double>(value));
}

template <typename Function>
NumberResult withLong(Function&& function) {
  long long value = -1;
  const int errorCode = function(&value);

  return some<NumberResult>(errorCode, static_cast<double>(value));
}

template <typename Function>
NumberResult withFloat(Function&& function) {
  float value = -1;
  const int errorCode = function(&value);

  return some<NumberResult>(errorCode, static_cast<double>(value));
}

template <typename Function>
FeaturesResult withFeatures(size_t count, Function&& function) {
  FSDK_Features features{};
  const int errorCode = function(&features);

  return some<FeaturesResult>(errorCode, toPoints(features, count));
}

template <typename Function>
FaceResult withFace(Function&& function) {
  TFace face{};
  const int errorCode = function(&face);

  return some<FaceResult>(errorCode, toFace(face));
}

template <typename Function>
BufferResult withFaceTemplate(Function&& function) {
  FSDK_FaceTemplate value{};
  const int errorCode = function(&value);

  return some<BufferResult>(errorCode, fromFaceTemplate(value));
}

} // namespace

// Constants

std::unordered_map<std::string, double> LuxandFaceSDKHybrid::getERROR() {
  return constants::error();
}

std::unordered_map<std::string, double> LuxandFaceSDKHybrid::getIMAGEMODE() {
  return constants::imageMode();
}

std::unordered_map<std::string, double> LuxandFaceSDKHybrid::getVIDEOCOMPRESSIONTYPE() {
  return constants::videoCompressionType();
}

std::unordered_map<std::string, double> LuxandFaceSDKHybrid::getFEATURE() {
  return constants::feature();
}

// Initialization

VoidResult LuxandFaceSDKHybrid::ActivateLibrary(const std::string& key) {
  return none(FSDK_ActivateLibrary(key.c_str()));
}

VoidResult LuxandFaceSDKHybrid::Initialize() {
  return none(FSDK_Initialize(nullptr));
}

VoidResult LuxandFaceSDKHybrid::Finalize() {
  return none(FSDK_Finalize());
}

StringResult LuxandFaceSDKHybrid::GetLicenseInfo() {
  return withCharBuffer(1024, [](char* value) {
    return FSDK_GetLicenseInfo(value);
  });
}

StringResult LuxandFaceSDKHybrid::GetVersionInfo() {
  const char* value = nullptr;
  const int errorCode = FSDK_GetVersionInfo(&value);

  return some<StringResult>(errorCode,
                            errorCode == FSDKE_OK && value != nullptr
                                ? std::string(value)
                                : std::string());
}

VoidResult LuxandFaceSDKHybrid::SetNumThreads(double count) {
  return none(FSDK_SetNumThreads(static_cast<int>(count)));
}

NumberResult LuxandFaceSDKHybrid::GetNumThreads() {
  return withInt([](int* value) { return FSDK_GetNumThreads(value); });
}

// Images

NumberResult LuxandFaceSDKHybrid::CreateEmptyImage() {
  return createHandle<HImage>(
      [](HImage* image) { return FSDK_CreateEmptyImage(image); });
}

VoidResult LuxandFaceSDKHybrid::FreeImage(double image) {
  return none(FSDK_FreeImage(static_cast<HImage>(image)));
}

NumberResult LuxandFaceSDKHybrid::LoadImageFromFile(const std::string& filename) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_LoadImageFromFile(image, filename.c_str());
  });
}

NumberResult LuxandFaceSDKHybrid::LoadImageFromFileWithAlpha(const std::string& filename) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_LoadImageFromFileWithAlpha(image, filename.c_str());
  });
}

VoidResult LuxandFaceSDKHybrid::SaveImageToFile(const std::string& filename, double image) {
  return none(
      FSDK_SaveImageToFile(static_cast<HImage>(image), filename.c_str()));
}

VoidResult LuxandFaceSDKHybrid::SetJpegCompressionQuality(double quality) {
  return none(FSDK_SetJpegCompressionQuality(static_cast<int>(quality)));
}

NumberResult LuxandFaceSDKHybrid::GetImageWidth(double image) {
  return withInt([&](int* value) {
    return FSDK_GetImageWidth(static_cast<HImage>(image), value);
  });
}

NumberResult LuxandFaceSDKHybrid::GetImageHeight(double image) {
  return withInt([&](int* value) {
    return FSDK_GetImageHeight(static_cast<HImage>(image), value);
  });
}

NumberResult LuxandFaceSDKHybrid::LoadImageFromBuffer(
    const std::shared_ptr<ArrayBuffer>& buffer, double width, double height,
    double scanLine, double imageMode) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_LoadImageFromBuffer(
        image, buffer->data(), static_cast<int>(width),
        static_cast<int>(height), static_cast<int>(scanLine),
        static_cast<FSDK_IMAGEMODE>(static_cast<int>(imageMode)));
  });
}

NumberResult LuxandFaceSDKHybrid::GetImageBufferSize(double image, double imageMode) {
  return withInt([&](int* value) {
    return FSDK_GetImageBufferSize(
        static_cast<HImage>(image), value,
        static_cast<FSDK_IMAGEMODE>(static_cast<int>(imageMode)));
  });
}

BufferResult LuxandFaceSDKHybrid::SaveImageToBuffer(double image, double imageMode,
                                        double bufferSize) {
  return withByteBuffer(static_cast<size_t>(bufferSize), [&](uint8_t* value) {
    return FSDK_SaveImageToBuffer(
        static_cast<HImage>(image), value,
        static_cast<FSDK_IMAGEMODE>(static_cast<int>(imageMode)));
  });
}

NumberResult LuxandFaceSDKHybrid::LoadImageFromFrame(const std::vector<FramePlane>& planes,
                                         const std::string& pixelFormat,
                                         double width, double height) {
  const int w = static_cast<int>(width);
  const int h = static_cast<int>(height);

  if (planes.empty() || w <= 0 || h <= 0) {
    return some<NumberResult>(FSDKE_INVALID_ARGUMENT, -1.0);
  }

  const FramePlane& first = planes[0];

  if (pixelFormat == "rgb-rgb-8-bit" || pixelFormat == "rgb-rgba-8-bit") {
    const FSDK_IMAGEMODE mode = pixelFormat == "rgb-rgb-8-bit"
                                    ? FSDK_IMAGE_COLOR_24BIT
                                    : FSDK_IMAGE_COLOR_32BIT;

    return createHandle<HImage>([&](HImage* image) {
      return FSDK_LoadImageFromBuffer(image, first.buffer->data(), w, h,
                                      static_cast<int>(first.bytesPerRow),
                                      mode);
    });
  }

  std::vector<uint8_t> rgb;
  int errorCode = FSDKE_INVALID_ARGUMENT;

  if (pixelFormat == "rgb-bgra-8-bit") {
    errorCode = interleavedToRgb(first, w, h, 4, 2, 0, rgb);
  } else if (pixelFormat.rfind("yuv-", 0) == 0) {
    errorCode = planarYuvToRgb(planes, pixelFormat, w, h, rgb);
  }

  if (errorCode != FSDKE_OK) {
    return some<NumberResult>(errorCode, -1.0);
  }

  return createHandle<HImage>([&](HImage* image) {
    return FSDK_LoadImageFromBuffer(image, rgb.data(), w, h, w * 3,
                                    FSDK_IMAGE_COLOR_24BIT);
  });
}

NumberResult LuxandFaceSDKHybrid::LoadImageFromJpegBuffer(
    const std::shared_ptr<ArrayBuffer>& buffer) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_LoadImageFromJpegBuffer(image, buffer->data(),
                                        static_cast<int>(buffer->size()));
  });
}

NumberResult LuxandFaceSDKHybrid::LoadImageFromPngBuffer(
    const std::shared_ptr<ArrayBuffer>& buffer) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_LoadImageFromPngBuffer(image, buffer->data(),
                                       static_cast<int>(buffer->size()));
  });
}

NumberResult LuxandFaceSDKHybrid::LoadImageFromPngBufferWithAlpha(
    const std::shared_ptr<ArrayBuffer>& buffer) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_LoadImageFromPngBufferWithAlpha(
        image, buffer->data(), static_cast<int>(buffer->size()));
  });
}

NumberResult LuxandFaceSDKHybrid::CopyImage(double image) {
  return intoNewImage([&](HImage target) {
    return FSDK_CopyImage(static_cast<HImage>(image), target);
  });
}

NumberResult LuxandFaceSDKHybrid::ResizeImage(double image, double ratio) {
  return intoNewImage([&](HImage target) {
    return FSDK_ResizeImage(static_cast<HImage>(image), ratio, target);
  });
}

NumberResult LuxandFaceSDKHybrid::RotateImage90(double image, double multiplier) {
  return intoNewImage([&](HImage target) {
    return FSDK_RotateImage90(static_cast<HImage>(image),
                              static_cast<int>(multiplier), target);
  });
}

NumberResult LuxandFaceSDKHybrid::RotateImage(double image, double angle) {
  return intoNewImage([&](HImage target) {
    return FSDK_RotateImage(static_cast<HImage>(image), angle, target);
  });
}

NumberResult LuxandFaceSDKHybrid::RotateImageCenter(double image, double angle, double x,
                                        double y) {
  return intoNewImage([&](HImage target) {
    return FSDK_RotateImageCenter(static_cast<HImage>(image), angle, x, y,
                                  target);
  });
}

NumberResult LuxandFaceSDKHybrid::CopyRect(double image, double x1, double y1, double x2,
                               double y2) {
  return intoNewImage([&](HImage target) {
    return FSDK_CopyRect(static_cast<HImage>(image), static_cast<int>(x1),
                         static_cast<int>(y1), static_cast<int>(x2),
                         static_cast<int>(y2), target);
  });
}

NumberResult LuxandFaceSDKHybrid::CopyRectReplicateBorder(double image, double x1,
                                              double y1, double x2, double y2) {
  return intoNewImage([&](HImage target) {
    return FSDK_CopyRectReplicateBorder(
        static_cast<HImage>(image), static_cast<int>(x1), static_cast<int>(y1),
        static_cast<int>(x2), static_cast<int>(y2), target);
  });
}

VoidResult LuxandFaceSDKHybrid::MirrorImage(double image, bool vertical) {
  return none(FSDK_MirrorImage(static_cast<HImage>(image), vertical));
}

FaceImageResult LuxandFaceSDKHybrid::ExtractFaceImage(double image,
                                          const std::vector<Point>& features,
                                          double width, double height) {
  FSDK_Features source{};
  FSDK_Features resized{};
  HImage extracted = static_cast<HImage>(-1);

  fromPoints(features, source);

  const int errorCode = FSDK_ExtractFaceImage(
      static_cast<HImage>(image), &source, static_cast<int>(width),
      static_cast<int>(height), &extracted, &resized);

  return some<FaceImageResult>(
      errorCode, FaceImage(static_cast<double>(extracted),
                           toPoints(resized, FSDK_FACIAL_FEATURE_COUNT)));
}

// Detection

FaceResult LuxandFaceSDKHybrid::DetectFace(double image) {
  return withFace([&](TFace* face) {
    return FSDK_DetectFace(static_cast<HImage>(image), face);
  });
}

FacesResult LuxandFaceSDKHybrid::DetectMultipleFaces(double image, double maxFaces) {
  const int maxCount = std::max(0, static_cast<int>(maxFaces));
  std::vector<TFace> faces(static_cast<size_t>(maxCount));

  int count = 0;
  const int errorCode = FSDK_DetectMultipleFaces(
      static_cast<HImage>(image), &count, faces.data(), maxCount);

  std::vector<Face> value;
  const int detected = std::clamp(count, 0, maxCount);
  value.reserve(static_cast<size_t>(detected));

  for (int i = 0; i < detected; ++i) {
    value.push_back(toFace(faces[static_cast<size_t>(i)]));
  }

  return some<FacesResult>(errorCode, std::move(value));
}

FeaturesResult LuxandFaceSDKHybrid::DetectFacialFeatures(double image) {
  return withFeatures(FSDK_FACIAL_FEATURE_COUNT, [&](FSDK_Features* features) {
    return FSDK_DetectFacialFeatures(static_cast<HImage>(image), features);
  });
}

FeaturesResult LuxandFaceSDKHybrid::DetectFacialFeaturesInRegion(double image,
                                                     const Face& face) {
  const TFace region = fromFace(face);

  return withFeatures(FSDK_FACIAL_FEATURE_COUNT, [&](FSDK_Features* features) {
    return FSDK_DetectFacialFeaturesInRegion(static_cast<HImage>(image),
                                             &region, features);
  });
}

// Templates and matching

BufferResult LuxandFaceSDKHybrid::GetFaceTemplate(double image) {
  return withFaceTemplate([&](FSDK_FaceTemplate* value) {
    return FSDK_GetFaceTemplate(static_cast<HImage>(image), value);
  });
}

BufferResult LuxandFaceSDKHybrid::GetFaceTemplateInRegion(double image, const Face& face) {
  const TFace region = fromFace(face);

  return withFaceTemplate([&](FSDK_FaceTemplate* value) {
    return FSDK_GetFaceTemplateInRegion(static_cast<HImage>(image), &region,
                                        value);
  });
}

NumberResult LuxandFaceSDKHybrid::MatchFaces(const std::shared_ptr<ArrayBuffer>& template1,
                                 const std::shared_ptr<ArrayBuffer>& template2) {
  FSDK_FaceTemplate first = toFaceTemplate(template1);
  FSDK_FaceTemplate second = toFaceTemplate(template2);

  return withFloat(
      [&](float* value) { return FSDK_MatchFaces(&first, &second, value); });
}

// Tracker

NumberResult LuxandFaceSDKHybrid::CreateTracker() {
  return createHandle<HTracker>(
      [](HTracker* tracker) { return FSDK_CreateTracker(tracker); });
}

NumberResult LuxandFaceSDKHybrid::LoadTrackerMemoryFromFile(const std::string& filename) {
  return createHandle<HTracker>([&](HTracker* tracker) {
    return FSDK_LoadTrackerMemoryFromFile(tracker, filename.c_str());
  });
}

NumberResult LuxandFaceSDKHybrid::LoadTrackerMemoryFromBuffer(
    const std::shared_ptr<ArrayBuffer>& buffer) {
  return createHandle<HTracker>([&](HTracker* tracker) {
    return FSDK_LoadTrackerMemoryFromBuffer(tracker, buffer->data());
  });
}

VoidResult LuxandFaceSDKHybrid::FreeTracker(double tracker) {
  return none(FSDK_FreeTracker(static_cast<HTracker>(tracker)));
}

VoidResult LuxandFaceSDKHybrid::ClearTracker(double tracker) {
  return none(FSDK_ClearTracker(static_cast<HTracker>(tracker)));
}

VoidResult LuxandFaceSDKHybrid::SaveTrackerMemoryToFile(double tracker,
                                            const std::string& filename) {
  return none(FSDK_SaveTrackerMemoryToFile(static_cast<HTracker>(tracker),
                                           filename.c_str()));
}

NumberResult LuxandFaceSDKHybrid::GetTrackerMemoryBufferSize(double tracker) {
  return withLong([&](long long* value) {
    return FSDK_GetTrackerMemoryBufferSize(static_cast<HTracker>(tracker),
                                           value);
  });
}

BufferResult LuxandFaceSDKHybrid::SaveTrackerMemoryToBuffer(double tracker,
                                                double bufferSize) {
  const size_t size = static_cast<size_t>(bufferSize);

  return withByteBuffer(size, [&](uint8_t* value) {
    return FSDK_SaveTrackerMemoryToBuffer(static_cast<HTracker>(tracker), value,
                                          static_cast<long long>(size));
  });
}

VoidResult LuxandFaceSDKHybrid::SetTrackerParameter(double tracker, const std::string& name,
                                        const std::string& value) {
  return none(FSDK_SetTrackerParameter(static_cast<HTracker>(tracker),
                                       name.c_str(), value.c_str()));
}

NumberResult LuxandFaceSDKHybrid::SetTrackerMultipleParameters(
    double tracker, const std::string& parameters) {
  return withInt([&](int* value) {
    return FSDK_SetTrackerMultipleParameters(static_cast<HTracker>(tracker),
                                             parameters.c_str(), value);
  });
}

StringResult LuxandFaceSDKHybrid::GetTrackerParameter(double tracker,
                                          const std::string& name,
                                          double maxSize) {
  const size_t size = static_cast<size_t>(maxSize);

  return withCharBuffer(size, [&](char* value) {
    return FSDK_GetTrackerParameter(static_cast<HTracker>(tracker),
                                    name.c_str(), value,
                                    static_cast<long long>(size));
  });
}

NumbersResult LuxandFaceSDKHybrid::FeedFrame(double tracker, double index, double image,
                                 double maxFaces) {
  const size_t maxCount = static_cast<size_t>(std::max(0.0, maxFaces));
  std::vector<long long> ids(maxCount, -1);

  long long count = 0;
  const int errorCode = FSDK_FeedFrame(
      static_cast<HTracker>(tracker), static_cast<long long>(index),
      static_cast<HImage>(image), &count, ids.data(),
      static_cast<long long>(maxCount * sizeof(long long)));

  const size_t detected =
      std::min(maxCount, static_cast<size_t>(std::max(0LL, count)));

  std::vector<double> value;
  value.reserve(detected);

  for (size_t i = 0; i < detected; ++i) {
    value.push_back(static_cast<double>(ids[i]));
  }

  return some<NumbersResult>(errorCode, std::move(value));
}

FeaturesResult LuxandFaceSDKHybrid::GetTrackerFacialFeatures(double tracker, double index,
                                                 double id) {
  return withFeatures(FSDK_FACIAL_FEATURE_COUNT, [&](FSDK_Features* features) {
    return FSDK_GetTrackerFacialFeatures(
        static_cast<HTracker>(tracker), static_cast<long long>(index),
        static_cast<long long>(id), features);
  });
}

FeaturesResult LuxandFaceSDKHybrid::GetTrackerEyes(double tracker, double index,
                                       double id) {
  return withFeatures(2, [&](FSDK_Features* features) {
    return FSDK_GetTrackerEyes(static_cast<HTracker>(tracker),
                               static_cast<long long>(index),
                               static_cast<long long>(id), features);
  });
}

FaceResult LuxandFaceSDKHybrid::GetTrackerFace(double tracker, double index, double id) {
  return withFace([&](TFace* face) {
    return FSDK_GetTrackerFace(static_cast<HTracker>(tracker),
                               static_cast<long long>(index),
                               static_cast<long long>(id), face);
  });
}

VoidResult LuxandFaceSDKHybrid::LockID(double tracker, double id) {
  return none(FSDK_LockID(static_cast<HTracker>(tracker),
                          static_cast<long long>(id)));
}

VoidResult LuxandFaceSDKHybrid::UnlockID(double tracker, double id) {
  return none(FSDK_UnlockID(static_cast<HTracker>(tracker),
                            static_cast<long long>(id)));
}

VoidResult LuxandFaceSDKHybrid::PurgeID(double tracker, double id) {
  return none(FSDK_PurgeID(static_cast<HTracker>(tracker),
                           static_cast<long long>(id)));
}

VoidResult LuxandFaceSDKHybrid::SetName(double tracker, double id,
                            const std::string& name) {
  return none(FSDK_SetName(static_cast<HTracker>(tracker),
                           static_cast<long long>(id), name.c_str()));
}

StringResult LuxandFaceSDKHybrid::GetName(double tracker, double id, double maxSize) {
  const size_t size = static_cast<size_t>(maxSize);

  return withCharBuffer(size, [&](char* value) {
    return FSDK_GetName(static_cast<HTracker>(tracker),
                        static_cast<long long>(id), value,
                        static_cast<long long>(size));
  });
}

StringResult LuxandFaceSDKHybrid::GetAllNames(double tracker, double id, double maxSize) {
  const size_t size = static_cast<size_t>(maxSize);

  return withCharBuffer(size, [&](char* value) {
    return FSDK_GetAllNames(static_cast<HTracker>(tracker),
                            static_cast<long long>(id), value,
                            static_cast<long long>(size));
  });
}

NumberResult LuxandFaceSDKHybrid::GetIDReassignment(double tracker, double id) {
  return withLong([&](long long* value) {
    return FSDK_GetIDReassignment(static_cast<HTracker>(tracker),
                                  static_cast<long long>(id), value);
  });
}

NumberResult LuxandFaceSDKHybrid::GetSimilarIDCount(double tracker, double id) {
  return withLong([&](long long* value) {
    return FSDK_GetSimilarIDCount(static_cast<HTracker>(tracker),
                                  static_cast<long long>(id), value);
  });
}

NumbersResult LuxandFaceSDKHybrid::GetSimilarIDList(double tracker, double id,
                                        double count) {
  return withIDBuffer(
      static_cast<size_t>(std::max(0.0, count)),
      [&](long long* ids, size_t bytes) {
        return FSDK_GetSimilarIDList(static_cast<HTracker>(tracker),
                                     static_cast<long long>(id), ids,
                                     static_cast<long long>(bytes));
      });
}

NumberResult LuxandFaceSDKHybrid::GetTrackerIDsCount(double tracker) {
  return withLong([&](long long* value) {
    return FSDK_GetTrackerIDsCount(static_cast<HTracker>(tracker), value);
  });
}

NumbersResult LuxandFaceSDKHybrid::GetTrackerAllIDs(double tracker, double count) {
  return withIDBuffer(static_cast<size_t>(std::max(0.0, count)),
                      [&](long long* ids, size_t bytes) {
                        return FSDK_GetTrackerAllIDs(
                            static_cast<HTracker>(tracker), ids,
                            static_cast<long long>(bytes));
                      });
}

NumberResult LuxandFaceSDKHybrid::GetTrackerFaceIDsCountForID(double tracker, double id) {
  return withLong([&](long long* value) {
    return FSDK_GetTrackerFaceIDsCountForID(static_cast<HTracker>(tracker),
                                            static_cast<long long>(id), value);
  });
}

NumbersResult LuxandFaceSDKHybrid::GetTrackerFaceIDsForID(double tracker, double id,
                                              double count) {
  return withIDBuffer(
      static_cast<size_t>(std::max(0.0, count)),
      [&](long long* ids, size_t bytes) {
        return FSDK_GetTrackerFaceIDsForID(static_cast<HTracker>(tracker),
                                           static_cast<long long>(id), ids,
                                           static_cast<long long>(bytes));
      });
}

NumberResult LuxandFaceSDKHybrid::GetTrackerIDByFaceID(double tracker, double faceID) {
  return withLong([&](long long* value) {
    return FSDK_GetTrackerIDByFaceID(static_cast<HTracker>(tracker),
                                     static_cast<long long>(faceID), value);
  });
}

BufferResult LuxandFaceSDKHybrid::GetTrackerFaceTemplate(double tracker, double faceID) {
  return withFaceTemplate([&](FSDK_FaceTemplate* value) {
    return FSDK_GetTrackerFaceTemplate(static_cast<HTracker>(tracker),
                                       static_cast<long long>(faceID), value);
  });
}

NumberResult LuxandFaceSDKHybrid::GetTrackerFaceImage(double tracker, double faceID) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_GetTrackerFaceImage(static_cast<HTracker>(tracker),
                                    static_cast<long long>(faceID), image);
  });
}

VoidResult LuxandFaceSDKHybrid::SetTrackerFaceImage(double tracker, double faceID,
                                        double image) {
  return none(FSDK_SetTrackerFaceImage(static_cast<HTracker>(tracker),
                                       static_cast<long long>(faceID),
                                       static_cast<HImage>(image)));
}

VoidResult LuxandFaceSDKHybrid::DeleteTrackerFaceImage(double tracker, double faceID) {
  return none(FSDK_DeleteTrackerFaceImage(static_cast<HTracker>(tracker),
                                          static_cast<long long>(faceID)));
}

TrackerIDResult LuxandFaceSDKHybrid::TrackerCreateID(
    double tracker, const std::shared_ptr<ArrayBuffer>& faceTemplate) {
  FSDK_FaceTemplate value = toFaceTemplate(faceTemplate);

  long long id = -1;
  long long faceID = -1;

  const int errorCode = FSDK_TrackerCreateID(static_cast<HTracker>(tracker),
                                             &value, &id, &faceID);

  return some<TrackerIDResult>(
      errorCode,
      TrackerID(static_cast<double>(id), static_cast<double>(faceID)));
}

NumberResult LuxandFaceSDKHybrid::AddTrackerFaceTemplate(
    double tracker, double id,
    const std::shared_ptr<ArrayBuffer>& faceTemplate) {
  FSDK_FaceTemplate value = toFaceTemplate(faceTemplate);

  return withLong([&](long long* faceID) {
    return FSDK_AddTrackerFaceTemplate(static_cast<HTracker>(tracker),
                                       static_cast<long long>(id), &value,
                                       faceID);
  });
}

VoidResult LuxandFaceSDKHybrid::DeleteTrackerFace(double tracker, double faceID) {
  return none(FSDK_DeleteTrackerFace(static_cast<HTracker>(tracker),
                                     static_cast<long long>(faceID)));
}

IDSimilaritiesResult LuxandFaceSDKHybrid::TrackerMatchFaces(
    double tracker, const std::shared_ptr<ArrayBuffer>& faceTemplate,
    double threshold, double maxSize) {
  FSDK_FaceTemplate value = toFaceTemplate(faceTemplate);

  const size_t maxCount = static_cast<size_t>(std::max(0.0, maxSize));

  std::vector<::IDSimilarity> similarities(maxCount, ::IDSimilarity{-1, 0});

  long long count = 0;
  const int errorCode = FSDK_TrackerMatchFaces(
      static_cast<HTracker>(tracker), &value, static_cast<float>(threshold),
      similarities.data(), &count,
      static_cast<long long>(maxCount * sizeof(::IDSimilarity)));

  const size_t matched =
      std::min(maxCount, static_cast<size_t>(std::max(0LL, count)));

  std::vector<IDSimilarity> result;
  result.reserve(matched);

  for (size_t i = 0; i < matched; ++i) {
    result.emplace_back(static_cast<double>(similarities[i].ID),
                        static_cast<double>(similarities[i].similarity));
  }

  return some<IDSimilaritiesResult>(errorCode, std::move(result));
}

// Attributes

StringResult LuxandFaceSDKHybrid::GetTrackerFacialAttribute(double tracker, double index,
                                                double id,
                                                const std::string& name,
                                                double maxSize) {
  const size_t size = static_cast<size_t>(maxSize);

  return withCharBuffer(size, [&](char* value) {
    return FSDK_GetTrackerFacialAttribute(
        static_cast<HTracker>(tracker), static_cast<long long>(index),
        static_cast<long long>(id), name.c_str(), value,
        static_cast<long long>(size));
  });
}

StringResult LuxandFaceSDKHybrid::DetectFacialAttributeUsingFeatures(
    double image, const std::vector<Point>& features, const std::string& name,
    double maxSize) {
  FSDK_Features source{};
  fromPoints(features, source);

  const size_t size = static_cast<size_t>(maxSize);

  return withCharBuffer(size, [&](char* value) {
    return FSDK_DetectFacialAttributeUsingFeatures(
        static_cast<HImage>(image), &source, name.c_str(), value,
        static_cast<long long>(size));
  });
}

StringResult LuxandFaceSDKHybrid::DetectFacialAttributeUsingFace(double image,
                                                     const Face& face,
                                                     const std::string& name,
                                                     double maxSize) {
  const TFace region = fromFace(face);
  const size_t size = static_cast<size_t>(maxSize);

  return withCharBuffer(size, [&](char* value) {
    return FSDK_DetectFacialAttributeUsingFace(
        static_cast<HImage>(image), &region, name.c_str(), value,
        static_cast<long long>(size));
  });
}

NumberResult LuxandFaceSDKHybrid::GetValueConfidence(const std::string& values,
                                         const std::string& value) {
  return withFloat([&](float* confidence) {
    return FSDK_GetValueConfidence(values.c_str(), value.c_str(), confidence);
  });
}

// Camera

VoidResult LuxandFaceSDKHybrid::SetHTTPProxy(const std::string& address, double port,
                                 const std::string& username,
                                 const std::string& password) {
  return none(FSDK_SetHTTPProxy(address.c_str(),
                                static_cast<unsigned short>(port),
                                username.c_str(), password.c_str()));
}

NumberResult LuxandFaceSDKHybrid::OpenIPVideoCamera(double compression,
                                        const std::string& url,
                                        const std::string& username,
                                        const std::string& password,
                                        double timeout) {
  return withInt([&](int* camera) {
    return FSDK_OpenIPVideoCamera(
        static_cast<FSDK_VIDEOCOMPRESSIONTYPE>(static_cast<int>(compression)),
        url.c_str(), username.c_str(), password.c_str(),
        static_cast<int>(timeout), camera);
  });
}

VoidResult LuxandFaceSDKHybrid::CloseVideoCamera(double camera) {
  return none(FSDK_CloseVideoCamera(static_cast<int>(camera)));
}

NumberResult LuxandFaceSDKHybrid::GrabFrame(double camera) {
  return createHandle<HImage>([&](HImage* image) {
    return FSDK_GrabFrame(static_cast<int>(camera), image);
  });
}

VoidResult LuxandFaceSDKHybrid::InitializeCapturing() {
  return none(FSDK_InitializeCapturing());
}

VoidResult LuxandFaceSDKHybrid::FinalizeCapturing() {
  return none(FSDK_FinalizeCapturing());
}

// Parameters

VoidResult LuxandFaceSDKHybrid::SetParameter(const std::string& name,
                                 const std::string& value) {
  return none(FSDK_SetParameter(name.c_str(), value.c_str()));
}

NumberResult LuxandFaceSDKHybrid::SetParameters(const std::string& parameters) {
  return withInt([&](int* value) {
    return FSDK_SetParameters(parameters.c_str(), value);
  });
}

} // namespace margelo::nitro::luxandfacesdk
