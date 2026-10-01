#pragma once

#include <string>

#include "HybridLuxandFaceSDKSpec.hpp"

namespace margelo::nitro::luxandfacesdk {

// Not named FaceSDK: that is also the name of this pod's Swift/clang module, and the generated
// autolinking code opens the luxandfacesdk namespace before referring to FaceSDK::..., which then
// resolves to this class instead of the module.
class LuxandFaceSDKHybrid : public HybridLuxandFaceSDKSpec {
public:
  LuxandFaceSDKHybrid() : HybridObject(TAG) {}

  std::unordered_map<std::string, double> getERROR() override;
  std::unordered_map<std::string, double> getIMAGEMODE() override;
  std::unordered_map<std::string, double> getVIDEOCOMPRESSIONTYPE() override;
  std::unordered_map<std::string, double> getFEATURE() override;
  VoidResult ActivateLibrary(const std::string& key) override;
  VoidResult Initialize() override;
  VoidResult Finalize() override;
  StringResult GetLicenseInfo() override;
  StringResult GetVersionInfo() override;
  VoidResult SetNumThreads(double count) override;
  NumberResult GetNumThreads() override;
  NumberResult CreateEmptyImage() override;
  VoidResult FreeImage(double image) override;
  NumberResult LoadImageFromFile(const std::string& filename) override;
  NumberResult LoadImageFromFileWithAlpha(const std::string& filename) override;
  VoidResult SaveImageToFile(const std::string& filename, double image) override;
  VoidResult SetJpegCompressionQuality(double quality) override;
  NumberResult GetImageWidth(double image) override;
  NumberResult GetImageHeight(double image) override;
  NumberResult LoadImageFromBuffer(const std::shared_ptr<ArrayBuffer>& buffer, double width, double height, double scanLine, double imageMode) override;
  NumberResult GetImageBufferSize(double image, double imageMode) override;
  BufferResult SaveImageToBuffer(double image, double imageMode, double bufferSize) override;
  NumberResult LoadImageFromFrame(const std::vector<FramePlane>& planes, const std::string& pixelFormat, double width, double height) override;
  NumberResult LoadImageFromJpegBuffer(const std::shared_ptr<ArrayBuffer>& buffer) override;
  NumberResult LoadImageFromPngBuffer(const std::shared_ptr<ArrayBuffer>& buffer) override;
  NumberResult LoadImageFromPngBufferWithAlpha(const std::shared_ptr<ArrayBuffer>& buffer) override;
  NumberResult CopyImage(double image) override;
  NumberResult ResizeImage(double image, double ratio) override;
  NumberResult RotateImage90(double image, double multiplier) override;
  NumberResult RotateImage(double image, double angle) override;
  NumberResult RotateImageCenter(double image, double angle, double x, double y) override;
  NumberResult CopyRect(double image, double x1, double y1, double x2, double y2) override;
  NumberResult CopyRectReplicateBorder(double image, double x1, double y1, double x2, double y2) override;
  VoidResult MirrorImage(double image, bool vertical) override;
  FaceImageResult ExtractFaceImage(double image, const std::vector<Point>& features, double width, double height) override;
  FaceResult DetectFace(double image) override;
  FacesResult DetectMultipleFaces(double image, double maxFaces) override;
  FeaturesResult DetectFacialFeatures(double image) override;
  FeaturesResult DetectFacialFeaturesInRegion(double image, const Face& face) override;
  BufferResult GetFaceTemplate(double image) override;
  BufferResult GetFaceTemplateInRegion(double image, const Face& face) override;
  NumberResult MatchFaces(const std::shared_ptr<ArrayBuffer>& template1, const std::shared_ptr<ArrayBuffer>& template2) override;
  NumberResult CreateTracker() override;
  NumberResult LoadTrackerMemoryFromFile(const std::string& filename) override;
  NumberResult LoadTrackerMemoryFromBuffer(const std::shared_ptr<ArrayBuffer>& buffer) override;
  VoidResult FreeTracker(double tracker) override;
  VoidResult ClearTracker(double tracker) override;
  VoidResult SaveTrackerMemoryToFile(double tracker, const std::string& filename) override;
  NumberResult GetTrackerMemoryBufferSize(double tracker) override;
  BufferResult SaveTrackerMemoryToBuffer(double tracker, double bufferSize) override;
  VoidResult SetTrackerParameter(double tracker, const std::string& name, const std::string& value) override;
  NumberResult SetTrackerMultipleParameters(double tracker, const std::string& parameters) override;
  StringResult GetTrackerParameter(double tracker, const std::string& name, double maxSize) override;
  NumbersResult FeedFrame(double tracker, double index, double image, double maxFaces) override;
  FeaturesResult GetTrackerFacialFeatures(double tracker, double index, double id) override;
  FeaturesResult GetTrackerEyes(double tracker, double index, double id) override;
  FaceResult GetTrackerFace(double tracker, double index, double id) override;
  VoidResult LockID(double tracker, double id) override;
  VoidResult UnlockID(double tracker, double id) override;
  VoidResult PurgeID(double tracker, double id) override;
  VoidResult SetName(double tracker, double id, const std::string& name) override;
  StringResult GetName(double tracker, double id, double maxSize) override;
  StringResult GetAllNames(double tracker, double id, double maxSize) override;
  NumberResult GetIDReassignment(double tracker, double id) override;
  NumberResult GetSimilarIDCount(double tracker, double id) override;
  NumbersResult GetSimilarIDList(double tracker, double id, double count) override;
  NumberResult GetTrackerIDsCount(double tracker) override;
  NumbersResult GetTrackerAllIDs(double tracker, double count) override;
  NumberResult GetTrackerFaceIDsCountForID(double tracker, double id) override;
  NumbersResult GetTrackerFaceIDsForID(double tracker, double id, double count) override;
  NumberResult GetTrackerIDByFaceID(double tracker, double faceID) override;
  BufferResult GetTrackerFaceTemplate(double tracker, double faceID) override;
  NumberResult GetTrackerFaceImage(double tracker, double faceID) override;
  VoidResult SetTrackerFaceImage(double tracker, double faceID, double image) override;
  VoidResult DeleteTrackerFaceImage(double tracker, double faceID) override;
  TrackerIDResult TrackerCreateID(double tracker, const std::shared_ptr<ArrayBuffer>& faceTemplate) override;
  NumberResult AddTrackerFaceTemplate(double tracker, double id, const std::shared_ptr<ArrayBuffer>& faceTemplate) override;
  VoidResult DeleteTrackerFace(double tracker, double faceID) override;
  IDSimilaritiesResult TrackerMatchFaces(double tracker, const std::shared_ptr<ArrayBuffer>& faceTemplate, double threshold, double maxSize) override;
  StringResult GetTrackerFacialAttribute(double tracker, double index, double id, const std::string& name, double maxSize) override;
  StringResult DetectFacialAttributeUsingFeatures(double image, const std::vector<Point>& features, const std::string& name, double maxSize) override;
  StringResult DetectFacialAttributeUsingFace(double image, const Face& face, const std::string& name, double maxSize) override;
  NumberResult GetValueConfidence(const std::string& values, const std::string& value) override;
  VoidResult SetHTTPProxy(const std::string& address, double port, const std::string& username, const std::string& password) override;
  NumberResult OpenIPVideoCamera(double compression, const std::string& url, const std::string& username, const std::string& password, double timeout) override;
  VoidResult CloseVideoCamera(double camera) override;
  NumberResult GrabFrame(double camera) override;
  VoidResult InitializeCapturing() override;
  VoidResult FinalizeCapturing() override;
  VoidResult SetParameter(const std::string& name, const std::string& value) override;
  NumberResult SetParameters(const std::string& parameters) override;
};

} // namespace margelo::nitro::luxandfacesdk
