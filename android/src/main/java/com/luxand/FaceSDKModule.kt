package com.luxand

import android.util.Base64
import android.media.Image
import android.app.Application


import android.util.Log;

import kotlin.collections.getOrNull

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactApplicationContext

import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = FaceSDKModule.NAME)
class FaceSDKModule(reactContext: ReactApplicationContext) : NativeFaceSDKSpec(reactContext) {

  private val reactContext = reactContext;

  private class Image : FSDK.HImage {

    constructor() {
      himage = -1
    }

    constructor(himage: Int) {
      this.himage = himage
    }

  }

  private class Tracker : FSDK.HTracker {

    constructor() {
      this.htracker = -1
    }

    constructor(htracker: Int) {
      this.htracker = htracker
    }

  }

  private class Camera : FSDK.HCamera {

    constructor() {
      this.hcamera = -1
    }

    constructor(hcamera: Int) {
      this.hcamera = hcamera
    }

  }

  private class ImageMode : FSDK.FSDK_IMAGEMODE {

    constructor(mode: Int) {
      this.mode = mode
    } 

  }

  private class VideoCompressionType : FSDK.FSDK_VIDEOCOMPRESSIONTYPE {

      constructor(type: Int) {
        this.type = type
      }

  }

  companion object {
    const val NAME = "LuxandFaceSDK"
    
    val ERROR = mapOf(
      "OK"                                to FSDK.FSDKE_OK,
      "FAILED"                            to FSDK.FSDKE_FAILED,
      "NOT_ACTIVATED"                     to FSDK.FSDKE_NOT_ACTIVATED,
      "OUT_OF_MEMORY"                     to FSDK.FSDKE_OUT_OF_MEMORY,
      "INVALID_ARGUMENT"                  to FSDK.FSDKE_INVALID_ARGUMENT,
      "IO_ERROR"                          to FSDK.FSDKE_IO_ERROR,
      "IMAGE_TOO_SMALL"                   to FSDK.FSDKE_IMAGE_TOO_SMALL,
      "FACE_NOT_FOUND"                    to FSDK.FSDKE_FACE_NOT_FOUND,
      "INSUFFICIENT_BUFFER_SIZE"          to FSDK.FSDKE_INSUFFICIENT_BUFFER_SIZE,
      "UNSUPPORTED_IMAGE_EXTENSION"       to FSDK.FSDKE_UNSUPPORTED_IMAGE_EXTENSION,
      "CANNOT_OPEN_FILE"                  to FSDK.FSDKE_CANNOT_OPEN_FILE,
      "CANNOT_CREATE_FILE"                to FSDK.FSDKE_CANNOT_CREATE_FILE,
      "BAD_FILE_FORMAT"                   to FSDK.FSDKE_BAD_FILE_FORMAT,
      "FILE_NOT_FOUND"                    to FSDK.FSDKE_FILE_NOT_FOUND,
      "CONNECTION_CLOSED"                 to FSDK.FSDKE_CONNECTION_CLOSED,
      "CONNECTION_FAILED"                 to FSDK.FSDKE_CONNECTION_FAILED,
      "IP_INIT_FAILED"                    to FSDK.FSDKE_IP_INIT_FAILED,
      "NEED_SERVER_ACTIVATION"            to FSDK.FSDKE_NEED_SERVER_ACTIVATION,
      "ID_NOT_FOUND"                      to FSDK.FSDKE_ID_NOT_FOUND,
      "ATTRIBUTE_NOT_DETECTED"            to FSDK.FSDKE_ATTRIBUTE_NOT_DETECTED,
      "INSUFFICIENT_TRACKER_MEMORY_LIMIT" to FSDK.FSDKE_INSUFFICIENT_TRACKER_MEMORY_LIMIT,
      "UNKNOWN_ATTRIBUTE"                 to FSDK.FSDKE_UNKNOWN_ATTRIBUTE,
      "UNSUPPORTED_FILE_VERSION"          to FSDK.FSDKE_UNSUPPORTED_FILE_VERSION,
      "SYNTAX_ERROR"                      to FSDK.FSDKE_SYNTAX_ERROR,
      "PARAMETER_NOT_FOUND"               to FSDK.FSDKE_PARAMETER_NOT_FOUND,
      "INVALID_TEMPLATE"                  to FSDK.FSDKE_INVALID_TEMPLATE,
      "UNSUPPORTED_TEMPLATE_VERSION"      to FSDK.FSDKE_UNSUPPORTED_TEMPLATE_VERSION,
      "CAMERA_INDEX_DOES_NOT_EXIST"       to FSDK.FSDKE_CAMERA_INDEX_DOES_NOT_EXIST,
      "PLATFORM_NOT_LICENSED"             to FSDK.FSDKE_PLATFORM_NOT_LICENSED,
      "TENSORFLOW_NOT_INITIALIZED"        to FSDK.FSDKE_TENSORFLOW_NOT_INITIALIZED,
      "PLUGIN_NOT_LOADED"                 to FSDK.FSDKE_PLUGIN_NOT_LOADED,
      "PLUGIN_NO_PERMISSION"              to FSDK.FSDKE_PLUGIN_NO_PERMISSION,
      "FACEID_NOT_FOUND"                  to FSDK.FSDKE_FACEID_NOT_FOUND,
      "FACEIMAGE_NOT_FOUND"               to FSDK.FSDKE_FACEIMAGE_NOT_FOUND
    )

    val ERROR_NAME = ERROR.entries.associate { (key, value) -> value to key };

    val FEATURE = mapOf(
      "LEFT_EYE"                    to FSDK.FSDKP_LEFT_EYE,
      "RIGHT_EYE"                   to FSDK.FSDKP_RIGHT_EYE,
      "LEFT_EYE_INNER_CORNER"       to FSDK.FSDKP_LEFT_EYE_INNER_CORNER,
      "LEFT_EYE_OUTER_CORNER"       to FSDK.FSDKP_LEFT_EYE_OUTER_CORNER,
      "LEFT_EYE_LOWER_LINE1"        to FSDK.FSDKP_LEFT_EYE_LOWER_LINE1,
      "LEFT_EYE_LOWER_LINE2"        to FSDK.FSDKP_LEFT_EYE_LOWER_LINE2,
      "LEFT_EYE_LOWER_LINE3"        to FSDK.FSDKP_LEFT_EYE_LOWER_LINE3,
      "LEFT_EYE_UPPER_LINE1"        to FSDK.FSDKP_LEFT_EYE_UPPER_LINE1,
      "LEFT_EYE_UPPER_LINE2"        to FSDK.FSDKP_LEFT_EYE_UPPER_LINE2,
      "LEFT_EYE_UPPER_LINE3"        to FSDK.FSDKP_LEFT_EYE_UPPER_LINE3,
      "LEFT_EYE_LEFT_IRIS_CORNER"   to FSDK.FSDKP_LEFT_EYE_LEFT_IRIS_CORNER,
      "LEFT_EYE_RIGHT_IRIS_CORNER"  to FSDK.FSDKP_LEFT_EYE_RIGHT_IRIS_CORNER,
      "RIGHT_EYE_INNER_CORNER"      to FSDK.FSDKP_RIGHT_EYE_INNER_CORNER,
      "RIGHT_EYE_OUTER_CORNER"      to FSDK.FSDKP_RIGHT_EYE_OUTER_CORNER,
      "RIGHT_EYE_LOWER_LINE1"       to FSDK.FSDKP_RIGHT_EYE_LOWER_LINE1,
      "RIGHT_EYE_LOWER_LINE2"       to FSDK.FSDKP_RIGHT_EYE_LOWER_LINE2,
      "RIGHT_EYE_LOWER_LINE3"       to FSDK.FSDKP_RIGHT_EYE_LOWER_LINE3,
      "RIGHT_EYE_UPPER_LINE1"       to FSDK.FSDKP_RIGHT_EYE_UPPER_LINE1,
      "RIGHT_EYE_UPPER_LINE2"       to FSDK.FSDKP_RIGHT_EYE_UPPER_LINE2,
      "RIGHT_EYE_UPPER_LINE3"       to FSDK.FSDKP_RIGHT_EYE_UPPER_LINE3,
      "RIGHT_EYE_LEFT_IRIS_CORNER"  to FSDK.FSDKP_RIGHT_EYE_LEFT_IRIS_CORNER,
      "RIGHT_EYE_RIGHT_IRIS_CORNER" to FSDK.FSDKP_RIGHT_EYE_RIGHT_IRIS_CORNER,
      "LEFT_EYEBROW_INNER_CORNER"   to FSDK.FSDKP_LEFT_EYEBROW_INNER_CORNER,
      "LEFT_EYEBROW_MIDDLE"         to FSDK.FSDKP_LEFT_EYEBROW_MIDDLE,
      "LEFT_EYEBROW_MIDDLE_LEFT"    to FSDK.FSDKP_LEFT_EYEBROW_MIDDLE_LEFT,
      "LEFT_EYEBROW_MIDDLE_RIGHT"   to FSDK.FSDKP_LEFT_EYEBROW_MIDDLE_RIGHT,
      "LEFT_EYEBROW_OUTER_CORNER"   to FSDK.FSDKP_LEFT_EYEBROW_OUTER_CORNER,
      "RIGHT_EYEBROW_INNER_CORNER"  to FSDK.FSDKP_RIGHT_EYEBROW_INNER_CORNER,
      "RIGHT_EYEBROW_MIDDLE"        to FSDK.FSDKP_RIGHT_EYEBROW_MIDDLE,
      "RIGHT_EYEBROW_MIDDLE_LEFT"   to FSDK.FSDKP_RIGHT_EYEBROW_MIDDLE_LEFT,
      "RIGHT_EYEBROW_MIDDLE_RIGHT"  to FSDK.FSDKP_RIGHT_EYEBROW_MIDDLE_RIGHT,
      "RIGHT_EYEBROW_OUTER_CORNER"  to FSDK.FSDKP_RIGHT_EYEBROW_OUTER_CORNER,
      "NOSE_TIP"                    to FSDK.FSDKP_NOSE_TIP,
      "NOSE_BOTTOM"                 to FSDK.FSDKP_NOSE_BOTTOM,
      "NOSE_BRIDGE"                 to FSDK.FSDKP_NOSE_BRIDGE,
      "NOSE_LEFT_WING"              to FSDK.FSDKP_NOSE_LEFT_WING,
      "NOSE_LEFT_WING_OUTER"        to FSDK.FSDKP_NOSE_LEFT_WING_OUTER,
      "NOSE_LEFT_WING_LOWER"        to FSDK.FSDKP_NOSE_LEFT_WING_LOWER,
      "NOSE_RIGHT_WING"             to FSDK.FSDKP_NOSE_RIGHT_WING,
      "NOSE_RIGHT_WING_OUTER"       to FSDK.FSDKP_NOSE_RIGHT_WING_OUTER,
      "NOSE_RIGHT_WING_LOWER"       to FSDK.FSDKP_NOSE_RIGHT_WING_LOWER,
      "MOUTH_LEFT_CORNER"           to FSDK.FSDKP_MOUTH_LEFT_CORNER,
      "MOUTH_RIGHT_CORNER"          to FSDK.FSDKP_MOUTH_RIGHT_CORNER,
      "MOUTH_TOP"                   to FSDK.FSDKP_MOUTH_TOP,
      "MOUTH_TOP_INNER"             to FSDK.FSDKP_MOUTH_TOP_INNER,
      "MOUTH_BOTTOM"                to FSDK.FSDKP_MOUTH_BOTTOM,
      "MOUTH_BOTTOM_INNER"          to FSDK.FSDKP_MOUTH_BOTTOM_INNER,
      "MOUTH_LEFT_TOP"              to FSDK.FSDKP_MOUTH_LEFT_TOP,
      "MOUTH_LEFT_TOP_INNER"        to FSDK.FSDKP_MOUTH_LEFT_TOP_INNER,
      "MOUTH_RIGHT_TOP"             to FSDK.FSDKP_MOUTH_RIGHT_TOP,
      "MOUTH_RIGHT_TOP_INNER"       to FSDK.FSDKP_MOUTH_RIGHT_TOP_INNER,
      "MOUTH_LEFT_BOTTOM"           to FSDK.FSDKP_MOUTH_LEFT_BOTTOM,
      "MOUTH_LEFT_BOTTOM_INNER"     to FSDK.FSDKP_MOUTH_LEFT_BOTTOM_INNER,
      "MOUTH_RIGHT_BOTTOM"          to FSDK.FSDKP_MOUTH_RIGHT_BOTTOM,
      "MOUTH_RIGHT_BOTTOM_INNER"    to FSDK.FSDKP_MOUTH_RIGHT_BOTTOM_INNER,
      "NASOLABIAL_FOLD_LEFT_UPPER"  to FSDK.FSDKP_NASOLABIAL_FOLD_LEFT_UPPER,
      "NASOLABIAL_FOLD_LEFT_LOWER"  to FSDK.FSDKP_NASOLABIAL_FOLD_LEFT_LOWER,
      "NASOLABIAL_FOLD_RIGHT_UPPER" to FSDK.FSDKP_NASOLABIAL_FOLD_RIGHT_UPPER,
      "NASOLABIAL_FOLD_RIGHT_LOWER" to FSDK.FSDKP_NASOLABIAL_FOLD_RIGHT_LOWER,
      "CHIN_BOTTOM"                 to FSDK.FSDKP_CHIN_BOTTOM,
      "CHIN_LEFT"                   to FSDK.FSDKP_CHIN_LEFT,
      "CHIN_RIGHT"                  to FSDK.FSDKP_CHIN_RIGHT,
      "FACE_CONTOUR1"               to FSDK.FSDKP_FACE_CONTOUR1,
      "FACE_CONTOUR2"               to FSDK.FSDKP_FACE_CONTOUR2,
      "FACE_CONTOUR12"              to FSDK.FSDKP_FACE_CONTOUR12,
      "FACE_CONTOUR13"              to FSDK.FSDKP_FACE_CONTOUR13,
      "FACE_CONTOUR14"              to FSDK.FSDKP_FACE_CONTOUR14,
      "FACE_CONTOUR15"              to FSDK.FSDKP_FACE_CONTOUR15,
      "FACE_CONTOUR16"              to FSDK.FSDKP_FACE_CONTOUR16,
      "FACE_CONTOUR17"              to FSDK.FSDKP_FACE_CONTOUR17
    )

    val IMAGEMODE = mapOf(
      "IMAGE_GRAYSCALE_8BIT" to FSDK.FSDK_IMAGEMODE.FSDK_IMAGE_GRAYSCALE_8BIT,
      "IMAGE_COLOR_24BIT"    to FSDK.FSDK_IMAGEMODE.FSDK_IMAGE_COLOR_24BIT,
      "IMAGE_COLOR_32BIT"    to FSDK.FSDK_IMAGEMODE.FSDK_IMAGE_COLOR_32BIT
    )

    val VIDEOCOMPRESSIONTYPE = mapOf(
      "MJPEG" to FSDK.FSDK_VIDEOCOMPRESSIONTYPE.FSDK_MJPEG
    )

    fun getError(errorCode: Int): String? {
      if (ERROR_NAME.containsKey(errorCode)) {
        return ERROR_NAME[errorCode]
      }

      return "Unknown error"
    }
  }

  override fun getName(): String {
    return NAME
  }

  override fun getTypedExportedConstants(): Map<String, Any> {
    val constants = HashMap<String, Any>();
    constants.put("ERROR", ERROR);
    constants.put("IMAGEMODE", IMAGEMODE);
    constants.put("VIDEOCOMPRESSIONTYPE", VIDEOCOMPRESSIONTYPE);
    constants.put("FEATURE", FEATURE);
    return constants;
  }

  private fun FacePostionToWritableMap(position: FSDK.TFacePosition): WritableMap {
    val map = Arguments.createMap()
    map.putInt("xc", position.xc)
    map.putInt("yc", position.yc)
    map.putInt("w",  position.w)
    map.putDouble("angle", position.angle)
    return map
  }

  private fun ReadableMapToFacePosition(map: ReadableMap?): FSDK.TFacePosition {
    return FSDK.TFacePosition().apply {
      xc = map?.getInt("xc") ?: 0
      yc = map?.getInt("yc") ?: 0
      w  = map?.getInt("w") ?: 0
      angle = map?.getDouble("angle") ?: 0.0
    }
  }

  private fun PointToWritableMap(point: FSDK.TPoint?): WritableMap {
    val map = Arguments.createMap()
    map.putInt("x", point?.x ?: 0)
    map.putInt("y", point?.y ?: 0)

    return map
  }

  private fun ReadableMapToPoint(map: ReadableMap?): FSDK.TPoint {
    return FSDK.TPoint().apply { 
      x = map?.getInt("x") ?: 0
      y = map?.getInt("y") ?: 0
    }
  }

  private fun FaceToWritableMap(face: FSDK.TFace?): WritableMap {
    val map = Arguments.createMap()
    val bbox = Arguments.createMap()
    val features = Arguments.createArray()

    bbox.putMap("p0", PointToWritableMap(face?.bbox?.p0))
    bbox.putMap("p1", PointToWritableMap(face?.bbox?.p1))

    for (i in 1..FSDK.FSDK_FACE_FEATURES_COUNT) {
      features.pushMap(PointToWritableMap(face?.features?.getOrNull(i - 1)))
    }

    map.putMap("bbox", bbox)
    map.putArray("features", features)

    return map
  }

  private fun ReadableMapToFace(map: ReadableMap): FSDK.TFace {
    val bbox = map.getMap("bbox")
    val features = map.getArray("features")

    return FSDK.TFace().apply { 
      this.bbox.p0 = ReadableMapToPoint(bbox?.getMap("p0"))
      this.bbox.p1 = ReadableMapToPoint(bbox?.getMap("p1"))
      
      for (i in 0..FSDK.FSDK_FACE_FEATURES_COUNT - 1) {
        this.features[i] = ReadableMapToPoint(features?.getMap(i))
      }
    }
  }

  private fun FeaturesToWritableArray(features: FSDK.FSDK_Features): WritableArray {
    val array = Arguments.createArray()
    for (p in features.features) {
      array.pushMap(PointToWritableMap(p))
    }

    return array
  }

  private fun ReadableArrayToFeatures(array: ReadableArray): FSDK.FSDK_Features {
    val features = FSDK.FSDK_Features()
    for (i in 0..array.size() - 1) {
      features.features[i] = ReadableMapToPoint(array.getMap(i))
    }

    return features
  }

  private fun Base64ToTemplate(base64: String): FSDK.FSDK_FaceTemplate {
    return FSDK.FSDK_FaceTemplate().apply { 
      template = Base64.decode(base64, Base64.DEFAULT)
    }
  }

  private fun IDSimilarityToWritableMap(similarity: FSDK.IDSimilarity): WritableMap {
    val map = Arguments.createMap()
    map.putInt("id", similarity.ID.toInt())
    map.putDouble("similarity", similarity.similarity.toDouble())
    return map
  }

  private fun ExecuteSDKFunction(function: (WritableMap) -> Int): WritableMap {
    val map = Arguments.createMap()
    val result = Arguments.createMap()
    val errorCode = function(result)

    map.putString("error", getError(errorCode))
    map.putInt("errorCode", errorCode)
    map.putMap("result", result)

    return map
  }

  private fun ExecuteStringResultSDKFunction(function: (Array<String>) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction {
      map ->
        val value = Array<String>(1) { "" }
        val errorCode = function(value)

        map.putString(name, value[0])
        
        errorCode
    }
  }

  private fun ExecuteIntegerResultSDKFunction(function: (IntArray) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = IntArray(1) { 0 }
        val errorCode = function(value)

        map.putInt(name, value[0])

        errorCode
    }
  }

  private fun ExecuteLongResultSDKFunction(function: (LongArray) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = LongArray(1) { -1L }
        val errorCode = function(value)

        map.putLong(name, value[0])

        errorCode
    }
  }

  private fun ExecuteFloatResultSDKFunction(function: (FloatArray) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = FloatArray(1) { -1.0F }
        val errorCode = function(value)

        map.putDouble(name, value[0].toDouble())

        errorCode
    }
  }

  private fun ExecuteDoubleResultSDKFunction(function: (DoubleArray) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = DoubleArray(1) { -1.0 }
        val errorCode = function(value)

        map.putDouble(name, value[0])

        errorCode
    }
  }

  private fun ExecuteCreateImageSDKFunction(function: (Image) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = Image()
        val errorCode = function(value)

        map.putInt(name, value.himage)

        errorCode
     }
  }

  private fun ExecuteCreateTrackerSDKFunction(function: (Tracker) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = Tracker()
        val errorCode = function(value)

        map.putInt(name, value.htracker)

        errorCode
     }
  }

  private fun ExecuteCreateCameraSDKFunction(function: (Camera) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = Camera()
        val errorCode = function(value)

        map.putInt(name, value.hcamera)

        errorCode
     }
  }

  private fun ExecuteImageResultSDKFunction(function: (Image) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = Image()
        var errorCode = FSDK.CreateEmptyImage(value)
        if (errorCode == FSDK.FSDKE_OK) {
          errorCode = function(value)
        }

        map.putInt(name, value.himage)

        errorCode
     }
  }

  private fun ExecuteByteBufferResultSDKFunction(function: (ByteArray) -> Int, size: Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map -> 
        val value = ByteArray(size)
        val errorCode = function(value)

        map.putString(name, Base64.encodeToString(value, Base64.NO_WRAP))

        errorCode
     }
  }

  private fun ExecuteFacePositionResultSDKFunction(function: (FSDK.TFacePosition) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = FSDK.TFacePosition()
        val errorCode = function(value)

        map.putMap(name, FacePostionToWritableMap(value))

        errorCode
    }
  }

  private fun ExecuteTFaceResultSDKFunction(function: (FSDK.TFace) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = FSDK.TFace()  
        val errorCode = function(value)

        map.putMap(name, FaceToWritableMap(value))

        errorCode
    }
  }

  private fun ExecuteTFacesResultSDKFunction(function: (FSDK.TFaces) -> Int, max: Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = FSDK.TFaces(max)
        val errorCode = function(value)

        val array = Arguments.createArray()
        if (value.faces != null) {
          for (face in value.faces) {
            array.pushMap(FacePostionToWritableMap(face))
          }
        }

        map.putArray(name, array)

        errorCode
    }
  }

  private fun ExecuteTFaces2ResultSDKFunction(function: (FSDK.TFaces2) -> Int, max: Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = FSDK.TFaces2(max)
        val errorCode = function(value)

        val array = Arguments.createArray()
        if (value.faces != null) {
          for (face in value.faces) {
            array.pushMap(FaceToWritableMap(face))
          }
        }

        map.putArray(name, array)
        
        errorCode
    }
  }

  private fun ExecuteFeaturesResultSDKFunction(function: (FSDK.FSDK_Features) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val value = FSDK.FSDK_Features()
        val errorCode = function(value)

        map.putArray(name, FeaturesToWritableArray(value))

        errorCode
    }
  }

  private fun ExecuteFaceTemplateResultSDKFunction(function: (FSDK.FSDK_FaceTemplate) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction {
      map ->
        val value = FSDK.FSDK_FaceTemplate()
        val errorCode = function(value)

        map.putString(name, Base64.encodeToString(value.template, Base64.NO_WRAP))

        errorCode
    }
  }

  private fun ExecuteLongArrayResultSDKFunction(function: (LongArray) -> Int, maxSize: Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction {
      map ->
        val value = LongArray(maxSize) { -1L }
        val errorCode = function(value)

        val result = Arguments.createArray()
        for (a in value) {
          result.pushInt(a.toInt())
        }

        map.putArray(name, result)

        errorCode
    }
  }

  private fun ExecuteTrackerIDResultSDKFunction(function: (LongArray, LongArray) -> Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction {
      map ->
        val id = LongArray(1) { -1L }
        val faceID = LongArray(1) { -1L }
        val errorCode = function(id, faceID)

        val trackerID = Arguments.createMap()
        trackerID.putInt("id", id[0].toInt())
        trackerID.putInt("faceID", faceID[0].toInt())

        map.putMap(name, trackerID)
        
        errorCode
    }
  }

  private fun ExecuteIDSimilaritiesSDKFunction(function: (Array<FSDK.IDSimilarity>, LongArray) -> Int, maxSize: Int, name: String = "value"): WritableMap {
    return ExecuteSDKFunction {
      map ->
        val value = Array<FSDK.IDSimilarity>(maxSize) { FSDK.IDSimilarity().apply { ID = -1; similarity = 0.0F } }
        val count = LongArray(1) { 0 }
        val errorCode = function(value, count)

        val result = Arguments.createArray()
        for (i in 0..count[0].toInt() - 1) {
          result.pushMap(IDSimilarityToWritableMap(value[i]))
        }

        map.putArray(name, result)

        errorCode
    }
  }

  override fun ActivateLibrary(key: String): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.ActivateLibrary(key) }
  }

  override fun Initialize(): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.Initialize() }
  }  

  override fun Finalize(): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.Finalize() }
  }

  override fun GetLicenseInfo(): WritableMap {
    return ExecuteStringResultSDKFunction({ value -> FSDK.GetLicenseInfo(value) })
  }

  override fun CreateEmptyImage(): WritableMap {
    return ExecuteCreateImageSDKFunction({ image -> FSDK.CreateEmptyImage(image) })
  }

  override fun FreeImage(image: Double): WritableMap {
    return ExecuteSDKFunction { FSDK.FreeImage(Image(image.toInt())) }
  }

  override fun LoadImageFromFile(filename: String): WritableMap {
    return ExecuteCreateImageSDKFunction({ image -> FSDK.LoadImageFromFile(image, filename) })
  }

  override fun LoadImageFromFileWithAlpha(filename: String): WritableMap {
    return ExecuteCreateImageSDKFunction({ image -> FSDK.LoadImageFromFileWithAlpha(image, filename) })
  }

  override fun SaveImageToFile(filename: String, image: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SaveImageToFile(Image(image.toInt()), filename) }
  }

  override fun SetJpegCompressionQuality(quality: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SetJpegCompressionQuality(quality.toInt()) }
  }

  override fun GetImageWidth(image: Double): WritableMap {
    return ExecuteIntegerResultSDKFunction({ value -> FSDK.GetImageWidth(Image(image.toInt()), value) })
  }

  override fun GetImageHeight(image: Double): WritableMap {
    return ExecuteIntegerResultSDKFunction({ value -> FSDK.GetImageHeight(Image(image.toInt()), value) })
  }

  override fun LoadImageFromBuffer(base64: String, width: Double, height: Double, scanLine: Double, imageMode: Double): WritableMap {
    val buffer = Base64.decode(base64, Base64.DEFAULT)
    return ExecuteCreateImageSDKFunction({ image -> FSDK.LoadImageFromBuffer(image, buffer, width.toInt(), height.toInt(), scanLine.toInt(), ImageMode(imageMode.toInt())) })
  }

  override fun GetImageBufferSize(image: Double, imageMode: Double): WritableMap {
    return ExecuteIntegerResultSDKFunction({ value -> FSDK.GetImageBufferSize(Image(image.toInt()), value, ImageMode(imageMode.toInt())) })
  }

  override fun SaveImageToBuffer(image: Double, imageMode: Double, bufferSize: Double): WritableMap {
    return ExecuteByteBufferResultSDKFunction({ buffer -> FSDK.SaveImageToBuffer(Image(image.toInt()), buffer, ImageMode(imageMode.toInt())) }, bufferSize.toInt())
  }

  override fun LoadImageFromJpegBuffer(base64: String): WritableMap {
    val buffer = Base64.decode(base64, Base64.DEFAULT)
    return ExecuteCreateImageSDKFunction({ image -> FSDK.LoadImageFromJpegBuffer(image, buffer, buffer.size) })
  }

  override fun LoadImageFromPngBuffer(base64: String): WritableMap {
    val buffer = Base64.decode(base64, Base64.DEFAULT)
    return ExecuteCreateImageSDKFunction({ image -> FSDK.LoadImageFromPngBuffer(image, buffer, buffer.size) })
  }

  override fun LoadImageFromPngBufferWithAlpha(base64: String): WritableMap {
    val buffer = Base64.decode(base64, Base64.DEFAULT)
    return ExecuteCreateImageSDKFunction({ image -> FSDK.LoadImageFromPngBufferWithAlpha(image, buffer, buffer.size) })
  }

  override fun CopyImage(image: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ result -> FSDK.CopyImage(Image(image.toInt()), result) })
  }

  override fun ResizeImage(image: Double, ratio: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ result -> FSDK.ResizeImage(Image(image.toInt()), ratio, result) })
  }

  override fun RotateImage90(image: Double, multiplier: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ result -> FSDK.RotateImage90(Image(image.toInt()), multiplier.toInt(), result) })
  }

  override fun RotateImage(image: Double, angle: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ result -> FSDK.RotateImage(Image(image.toInt()), angle, result) })
  }

  override fun RotateImageCenter(image: Double, angle: Double, x: Double, y: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ result -> FSDK.RotateImageCenter(Image(image.toInt()), angle, x, y, result) })
  }

  override fun CopyRect(image: Double, x1: Double, y1: Double, x2: Double, y2: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ result -> FSDK.CopyRect(Image(image.toInt()), x1.toInt(), y1.toInt(), x2.toInt(), y2.toInt(), result) })
  }

  override fun CopyRectReplicateBorder(image: Double, x1: Double, y1: Double, x2: Double, y2: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ result -> FSDK.CopyRectReplicateBorder(Image(image.toInt()), x1.toInt(), y1.toInt(), x2.toInt(), y2.toInt(), result) })
  }

  override fun MirrorImage(image: Double, vertical: Boolean): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.MirrorImage(Image(image.toInt()), vertical) }
  }

  override fun ExtractFaceImage(image: Double, features: ReadableArray, width: Double, height: Double): WritableMap {
    return ExecuteSDKFunction {
      map ->
        val resultImage = FSDK.HImage()
        val resultFeatures = FSDK.FSDK_Features()
        val errorCode = FSDK.ExtractFaceImage(Image(image.toInt()), ReadableArrayToFeatures(features), width.toInt(), height.toInt(), resultImage, resultFeatures)

        val faceImage = Arguments.createMap()
        faceImage.putInt("image", resultImage.himage)
        faceImage.putArray("features", FeaturesToWritableArray(resultFeatures))

        map.putMap("value", faceImage)

        errorCode;
    }
  }

  override fun DetectFace(image: Double): WritableMap {
    return ExecuteFacePositionResultSDKFunction({ face -> FSDK.DetectFace(Image(image.toInt()), face) })
  }

  override fun DetectFace2(image: Double): WritableMap {
    return ExecuteTFaceResultSDKFunction({ face -> FSDK.DetectFace2(Image(image.toInt()), face) })
  }

  override fun DetectMultipleFaces(image: Double, maxFaces: Double): WritableMap {
    return ExecuteTFacesResultSDKFunction({ faces -> FSDK.DetectMultipleFaces(Image(image.toInt()), faces) }, maxFaces.toInt())
  }

  override fun DetectMultipleFaces2(image: Double, maxFaces: Double): WritableMap {
    return ExecuteTFaces2ResultSDKFunction({ faces -> FSDK.DetectMultipleFaces2(Image(image.toInt()), faces) }, maxFaces.toInt())
  }

  override fun SetFaceDetectionParameters(handleArbitraryRotations: Boolean, determineFaceRotationAngle: Boolean, internalResizeWidth: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SetFaceDetectionParameters(handleArbitraryRotations, determineFaceRotationAngle, internalResizeWidth.toInt()) }
  }

  override fun SetFaceDetectionThreshold(threshold: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SetFaceDetectionThreshold(threshold.toInt()) }
  }

  override fun GetDetectedFaceConfidence(): WritableMap {
    return ExecuteIntegerResultSDKFunction({ value -> FSDK.GetDetectedFaceConfidence(value) }, "value")
  }

  override fun DetectFacialFeatures(image: Double): WritableMap {
    return ExecuteFeaturesResultSDKFunction({ features -> FSDK.DetectFacialFeatures(Image(image.toInt()), features) })
  }

  override fun DetectFacialFeaturesInRegion(image: Double, position: ReadableMap): WritableMap {
    return ExecuteFeaturesResultSDKFunction({ features -> FSDK.DetectFacialFeaturesInRegion(Image(image.toInt()), ReadableMapToFacePosition(position), features) })
  }

  override fun DetectEyes(image: Double): WritableMap {
    return ExecuteFeaturesResultSDKFunction({ features -> FSDK.DetectEyes(Image(image.toInt()), features) })
  }

  override fun DetectEyesInRegion(image: Double, position: ReadableMap): WritableMap {
    return ExecuteFeaturesResultSDKFunction({ features -> FSDK.DetectEyesInRegion(Image(image.toInt()), ReadableMapToFacePosition(position), features) })
  }

  override fun GetFaceTemplate(image: Double): WritableMap {
    return ExecuteFaceTemplateResultSDKFunction({ template -> FSDK.GetFaceTemplate(Image(image.toInt()), template) })
  }

  override fun GetFaceTemplate2(image: Double): WritableMap {
    return ExecuteFaceTemplateResultSDKFunction({ template -> FSDK.GetFaceTemplate2(Image(image.toInt()), template) })
  }

  override fun GetFaceTemplateInRegion(image: Double, position: ReadableMap): WritableMap {
    return ExecuteFaceTemplateResultSDKFunction({ template -> FSDK.GetFaceTemplateInRegion(Image(image.toInt()), ReadableMapToFacePosition(position), template) })
  }

  override fun GetFaceTemplateInRegion2(image: Double, face: ReadableMap): WritableMap {
    return ExecuteFaceTemplateResultSDKFunction({ template -> FSDK.GetFaceTemplateInRegion2(Image(image.toInt()), ReadableMapToFace(face), template) })
  }

  override fun GetFaceTemplateUsingFeatures(image: Double, features: ReadableArray): WritableMap {
    return ExecuteFaceTemplateResultSDKFunction({ template -> FSDK.GetFaceTemplateUsingFeatures(Image(image.toInt()), ReadableArrayToFeatures(features), template) })
  }

  override fun GetFaceTemplateUsingEyes(image: Double, eyes: ReadableArray): WritableMap {
    return ExecuteFaceTemplateResultSDKFunction({ template -> FSDK.GetFaceTemplateUsingFeatures(Image(image.toInt()), ReadableArrayToFeatures(eyes), template) })
  }

  override fun MatchFaces(base1: String, base2: String): WritableMap {
    val template1 = Base64ToTemplate(base1)
    val template2 = Base64ToTemplate(base2)
    return ExecuteFloatResultSDKFunction({ value -> FSDK.MatchFaces(template1, template2, value) })
  }

  override fun GetMatchingThresholdAtFAR(far: Double): WritableMap {
    return ExecuteFloatResultSDKFunction({ value -> FSDK.GetMatchingThresholdAtFAR(far.toFloat(), value) })
  }

  override fun GetMatchingThresholdAtFRR(frr: Double): WritableMap {
    return ExecuteFloatResultSDKFunction({ value -> FSDK.GetMatchingThresholdAtFRR(frr.toFloat(), value) })
  }

  override fun CreateTracker(): WritableMap {
    return ExecuteCreateTrackerSDKFunction({ value -> FSDK.CreateTracker(value) })
  }

  override fun LoadTrackerMemoryFromFile(filename: String): WritableMap {
    return ExecuteCreateTrackerSDKFunction({ value -> FSDK.LoadTrackerMemoryFromFile(value, filename) })
  }

  override fun LoadTrackerMemoryFromBuffer(base64: String): WritableMap {
    val buffer = Base64.decode(base64, Base64.DEFAULT)
    return ExecuteCreateTrackerSDKFunction({ value -> FSDK.LoadTrackerMemoryFromBuffer(value, buffer) })
  }

  override fun FreeTracker(tracker: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.FreeTracker(Tracker(tracker.toInt())) }
  }

  override fun ClearTracker(tracker: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.ClearTracker(Tracker(tracker.toInt())) }
  }

  override fun SaveTrackerMemoryToFile(tracker: Double, filename: String): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SaveTrackerMemoryToFile(Tracker(tracker.toInt()), filename) }
  }

  override fun GetTrackerMemoryBufferSize(tracker: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetTrackerMemoryBufferSize(Tracker(tracker.toInt()), value) })
  }

  override fun SaveTrackerMemoryToBuffer(tracker: Double, bufferSize: Double): WritableMap {
    return ExecuteByteBufferResultSDKFunction({ value -> FSDK.SaveTrackerMemoryToBuffer(Tracker(tracker.toInt()), value) }, bufferSize.toInt())
  }

  override fun SetTrackerParameter(tracker: Double, name: String, value: String): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SetTrackerParameter(Tracker(tracker.toInt()), name, value) }
  }

  override fun SetTrackerMultipleParameters(tracker: Double, values: String): WritableMap {
    return ExecuteIntegerResultSDKFunction({ value -> FSDK.SetTrackerMultipleParameters(Tracker(tracker.toInt()), values, value) })
  }

  override fun GetTrackerParameter(tracker: Double, parameter: String, maxSize: Double): WritableMap {
    return ExecuteStringResultSDKFunction({ value -> FSDK.GetTrackerParameter(Tracker(tracker.toInt()), parameter, value, maxSize.toInt()) })
  }

  override fun FeedFrame(tracker: Double, index: Double, image: Double, maxFaces: Double): WritableMap {
    return ExecuteSDKFunction { 
      map ->
        val ids = LongArray(maxFaces.toInt()) { -1L }
        val count = LongArray(1) { 0L }
        val errorCode = FSDK.FeedFrame(Tracker(tracker.toInt()), index.toLong(), Image(image.toInt()), count, ids)

        val result = Arguments.createArray()
        for (i in 0..count[0].toInt() - 1) {
          result.pushInt(ids[i].toInt())
        }

        map.putArray("value", result)

        errorCode
    }
  }

  override fun GetTrackerEyes(tracker: Double, index: Double, id: Double): WritableMap {
    return ExecuteFeaturesResultSDKFunction({ value -> FSDK.GetTrackerEyes(Tracker(tracker.toInt()), index.toLong(), id.toLong(), value) })
  }

  override fun GetTrackerFacialFeatures(tracker: Double, index: Double, id: Double): WritableMap {
    return ExecuteFeaturesResultSDKFunction({ value -> FSDK.GetTrackerFacialFeatures(Tracker(tracker.toInt()), index.toLong(), id.toLong(), value) })
  }

  override fun GetTrackerFacePosition(tracker: Double, index: Double, id: Double): WritableMap {
    return ExecuteFacePositionResultSDKFunction({ value -> FSDK.GetTrackerFacePosition(Tracker(tracker.toInt()), index.toLong(), id.toLong(), value) })
  }

  override fun GetTrackerFace(tracker: Double, index: Double, id: Double): WritableMap {
    return ExecuteTFaceResultSDKFunction({ value -> FSDK.GetTrackerFace(Tracker(tracker.toInt()), index.toLong(), id.toLong(), value) })
  }

  override fun LockID(tracker: Double, id: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.LockID(Tracker(tracker.toInt()), id.toLong()) }
  }

  override fun UnlockID(tracker: Double, id: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.UnlockID(Tracker(tracker.toInt()), id.toLong()) }
  }

  override fun PurgeID(tracker: Double, id: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.PurgeID(Tracker(tracker.toInt()), id.toLong()) }
  }

  override fun SetName(tracker: Double, id: Double, name: String): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SetName(Tracker(tracker.toInt()), id.toLong(), name) }
  }

  override fun GetName(tracker: Double, id: Double, maxLength: Double): WritableMap {
    return ExecuteStringResultSDKFunction({ value -> FSDK.GetName(Tracker(tracker.toInt()), id.toLong(), value, maxLength.toLong()) })
  }

  override fun GetAllNames(tracker: Double, id: Double, maxLength: Double): WritableMap {
    return ExecuteStringResultSDKFunction({ value -> FSDK.GetAllNames(Tracker(tracker.toInt()), id.toLong(), value, maxLength.toLong()) })
  }

  override fun GetIDReassignment(tracker: Double, id: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetIDReassignment(Tracker(tracker.toInt()), id.toLong(), value) })
  }

  override fun GetSimilarIDCount(tracker: Double, id: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetSimilarIDCount(Tracker(tracker.toInt()), id.toLong(), value) })
  }

  override fun GetSimilarIDList(tracker: Double, id: Double, count: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetSimilarIDCount(Tracker(tracker.toInt()), id.toLong(), value) })
  }

  override fun GetTrackerIDsCount(tracker: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetTrackerIDsCount(Tracker(tracker.toInt()), value) })
  }

  override fun GetTrackerAllIDs(tracker: Double, count: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetTrackerAllIDs(Tracker(tracker.toInt()), value) })
  }

  override fun GetTrackerFaceIDsCountForID(tracker: Double, id: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetTrackerFaceIDsCountForID(Tracker(tracker.toInt()), id.toLong(), value) })
  }

  override fun GetTrackerFaceIDsForID(tracker: Double, id: Double, count: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetTrackerFaceIDsForID(Tracker(tracker.toInt()), id.toLong(), value) })
  }

  override fun GetTrackerIDByFaceID(tracker: Double, faceID: Double): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.GetTrackerIDByFaceID(Tracker(tracker.toInt()), faceID.toLong(), value) })
  }

  override fun GetTrackerFaceTemplate(tracker: Double, faceID: Double): WritableMap {
    return ExecuteFaceTemplateResultSDKFunction({ value -> FSDK.GetTrackerFaceTemplate(Tracker(tracker.toInt()), faceID.toLong(), value) })
  }

  override fun GetTrackerFaceImage(tracker: Double, faceID: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ value -> FSDK.GetTrackerFaceImage(Tracker(tracker.toInt()), faceID.toLong(), value) })
  }

  override fun SetTrackerFaceImage(tracker: Double, faceID: Double, image: Double): WritableMap {
    return ExecuteSDKFunction{ _ -> FSDK.GetTrackerFaceImage(Tracker(tracker.toInt()), faceID.toLong(), Image(image.toInt())) }
  }

  override fun DeleteTrackerFaceImage(tracker: Double, faceID: Double): WritableMap {
    return ExecuteSDKFunction{ _ -> FSDK.DeleteTrackerFaceImage(Tracker(tracker.toInt()), faceID.toLong()) }
  }

  override fun TrackerCreateID(tracker: Double, faceTemplate: String): WritableMap {
    return ExecuteTrackerIDResultSDKFunction({ id, faceID -> FSDK.TrackerCreateID(Tracker(tracker.toInt()), Base64ToTemplate(faceTemplate), id, faceID) })
  }

  override fun AddTrackerFaceTemplate(tracker: Double, id: Double, faceTemplate: String): WritableMap {
    return ExecuteLongResultSDKFunction({ value -> FSDK.AddTrackerFaceTemplate(Tracker(tracker.toInt()), id.toLong(), Base64ToTemplate(faceTemplate), value) })
  }

  override fun DeleteTrackerFace(tracker: Double, faceID: Double): WritableMap {
    return ExecuteSDKFunction{ _ -> FSDK.DeleteTrackerFace(Tracker(tracker.toInt()), faceID.toLong()) }
  }

  override fun TrackerMatchFaces(tracker: Double, faceTemplate: String, threshold: Double, maxSize: Double): WritableMap {
    return ExecuteIDSimilaritiesSDKFunction({ value, count -> FSDK.TrackerMatchFaces(Tracker(tracker.toInt()), Base64ToTemplate(faceTemplate), threshold.toFloat(), value, count) }, maxSize.toInt())
  }

  override fun GetTrackerFacialAttribute(tracker: Double, index: Double, id: Double, name: String, maxSize: Double): WritableMap {
    return ExecuteStringResultSDKFunction({ value -> FSDK.GetTrackerFacialAttribute(Tracker(tracker.toInt()), index.toLong(), id.toLong(), name, value, maxSize.toLong()) })
  }

  override fun DetectFacialAttributeUsingFeatures(image: Double, features: ReadableArray, name: String, maxSize: Double): WritableMap {
    return ExecuteStringResultSDKFunction({ value -> FSDK.DetectFacialAttributeUsingFeatures(Image(image.toInt()), ReadableArrayToFeatures(features), name, value, maxSize.toLong()) })
  }

  override fun GetValueConfidence(values: String, name: String): WritableMap {
    return ExecuteFloatResultSDKFunction({ value -> FSDK.GetValueConfidence(values, name, value) })
  }

  override fun SetHTTPProxy(address: String, port: Double, username: String, password: String): WritableMap {
    return ExecuteSDKFunction { _ ->  FSDK.SetHTTPProxy(address, port.toInt().toShort(), username, password) }
  }

  override fun OpenIPVideoCamera(compression: Double, url: String, username: String, password: String, timeout: Double): WritableMap {
    return ExecuteCreateCameraSDKFunction({ value -> FSDK.OpenIPVideoCamera(VideoCompressionType(compression.toInt()), url, username, password, timeout.toInt(), value) })
  }

  override fun CloseVideoCamera(camera: Double): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.CloseVideoCamera(Camera(camera.toInt())) }
  }

  override fun GrabFrame(camera: Double): WritableMap {
    return ExecuteImageResultSDKFunction({ value -> FSDK.GrabFrame(Camera(camera.toInt()), value) })
  }

  override fun InitializeCapturing(): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.InitializeCapturing() }
  }

  override fun FinalizeCapturing(): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.FinalizeCapturing() }
  }

  override fun SetParameter(name: String, value: String): WritableMap {
    return ExecuteSDKFunction { _ -> FSDK.SetParameter(name, value) }
  }

  override fun SetParameters(parameters: String): WritableMap {
    return ExecuteIntegerResultSDKFunction({ value -> FSDK.SetParameters(parameters, value) })
  }

  override fun InitializeIBeta(): WritableMap {
    val app = reactContext.applicationContext as Application;
    val dataDir = app.cacheDir.absolutePath;

    Log.i("FSDK", dataDir);
    return ExecuteSDKFunction { _ -> 
      val res = FSDK.SetParameter("LivenessModel", "external:dataDir=" + dataDir)
      Log.i("FSDK", res.toString())
      res
    }
  }
}
