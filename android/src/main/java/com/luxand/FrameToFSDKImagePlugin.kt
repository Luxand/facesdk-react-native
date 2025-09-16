package com.luxand

import com.luxand.FaceSDKModule

import android.graphics.ImageFormat
import androidx.camera.core.ImageProxy

import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin

import android.util.Log

class FrameToFSDKImagePlugin(@Suppress("UNUSED_PARAMETER") proxy: VisionCameraProxy, @Suppress("UNUSED_PARAMETER") options: Map<String, Any>?): FrameProcessorPlugin() {

  private var width  = -1
  private var height = -1

  private var imageFormat = -1

  private var chromaHeight   = -1
  private var chromaWidth    = -1
  private var yRowStride     = -1
  private var uRowStride     = -1
  private var vRowStride     = -1
  private var uPixelStride   = -1
  private var vPixelStride   = -1
  private var ySize          = -1
  private var outOffset      = -1
  private var outRowStride   = -1
  private var outPixelStride = -1
  private var outWidth       = -1
  private var outHeight      = -1

  private var rgb         = ByteArray(0) { 0 }
  private var nv21        = ByteArray(0) { 0 }
  private var uLineBuffer = ByteArray(0) { 0 }
  private var vLineBuffer = ByteArray(0) { 0 }

  private fun determineOutPrameters(image: ImageProxy) {
    when (image.imageInfo.rotationDegrees) {
      0 -> {
        outOffset = 0
        outRowStride = 3 * width
        outPixelStride = 3
        outWidth = width
        outHeight = height
      }
      90 -> {
        outOffset = 3 * (height - 1)
        outRowStride = -3
        outPixelStride = 3 * height
        outWidth = height
        outHeight = width
      }
      180 -> {
        outOffset = 3 * (width * height - 1)
        outRowStride = -3 * width
        outPixelStride = -3
        outWidth = width
        outHeight = height
      }
      270 -> {
        outOffset = 3 * height * (width - 1)
        outRowStride = 3
        outPixelStride = -3 * height
        outWidth = height
        outHeight = width
      }
    }
  }

  private fun checkYUVBuffers(image: ImageProxy) {
    val width = image.width
    val height = image.height
    var imageFormat = image.format

    if (this.width == width && this.height == height && this.imageFormat == imageFormat) {
      return
    }

    val yPlane = image.planes[0]
    val uPlane = image.planes[1]
    val vPlane = image.planes[2]

    val yBuffer = yPlane.buffer
    yBuffer.rewind()

    this.width  = width
    this.height = height

    chromaHeight = image.height / 2
    chromaWidth  = image.width  / 2

    yRowStride = yPlane.rowStride
    uRowStride = uPlane.rowStride
    vRowStride = vPlane.rowStride

    uPixelStride = uPlane.pixelStride
    vPixelStride = vPlane.pixelStride

    outRowStride = 3 * width
    ySize = yBuffer.remaining()

    rgb = ByteArray(width * height * 3) { 0 }
    nv21 = ByteArray(ySize + width * height / 2) { 0 }

    uLineBuffer = ByteArray(uRowStride) { 0 }
    vLineBuffer = ByteArray(vRowStride) { 0 }

    determineOutPrameters(image)
  }

  private fun checkRGBBuffers(image: ImageProxy) {
    val width = image.width
    val height = image.height
    var imageFormat = image.format

    if (this.width == width && this.height == height && this.imageFormat == imageFormat) {
      return
    }

    this.width = width
    this.height = height
    this.imageFormat = imageFormat

    rgb = ByteArray(width * height * 3) { 0 }
    uRowStride = image.planes[0].rowStride
    uPixelStride = image.planes[0].pixelStride

    determineOutPrameters(image)
  }

  private fun toByte(value: Int): Byte {
    return Math.min(255, Math.max(0, value)).toByte()
  }

  private fun toUnsigned(value: Int): Int {
    return (value + 256) % 256;
  }

  private fun fillRGBBytes(rgb: ByteArray, r: Int, g: Int, b: Int, y: Int, index: Int) {
    rgb[index + 2] = toByte(y + r)
    rgb[index + 1] = toByte(y - g)
    rgb[index    ] = toByte(y + b)
  }

  private fun createFromRGB(image: ImageProxy) {
    checkRGBBuffers(image)
    var rgbIndex: Int
    var planeIndex: Int

    val rPlane = image.planes[0].buffer
    val gPlane = image.planes[1].buffer
    val bPlane = image.planes[2].buffer

    rPlane.rewind()
    gPlane.rewind()
    bPlane.rewind()

    for (i in 0..height - 1) {
      planeIndex = i * uRowStride
      rgbIndex = outOffset + i * outRowStride

      for (j in 0..width - 1) {
        rgb[rgbIndex    ] = rPlane[planeIndex]
        rgb[rgbIndex + 1] = gPlane[planeIndex]
        rgb[rgbIndex + 2] = bPlane[planeIndex]

        rgbIndex += outPixelStride
        planeIndex += uPixelStride
      }
    }
  }

  private fun createFromYUV(image: ImageProxy) {
    checkYUVBuffers(image)
    
    val yPlane  = image.planes[0]
    val uPlane  = image.planes[1]
    val vPlane  = image.planes[2]

    val yBuffer = yPlane.buffer
    val uBuffer = uPlane.buffer
    val vBuffer = vPlane.buffer

    yBuffer.rewind()
    uBuffer.rewind()
    vBuffer.rewind()

    var position = 0;
    for (i in 0..height - 1) {
        yBuffer[nv21, position, width]
        position += width
        yBuffer.position(Math.min(ySize, yBuffer.position() - width + yRowStride))
    }

    for (row in 0..chromaHeight - 1) {
      vBuffer[vLineBuffer, 0, Math.min(vRowStride, vBuffer.remaining())]
      uBuffer[uLineBuffer, 0, Math.min(uRowStride, uBuffer.remaining())]

      var vLineBufferPosition = 0
      var uLineBufferPosition = 0

      for (col in 0..chromaWidth - 1) {
        nv21[position++] = vLineBuffer[vLineBufferPosition]
        nv21[position++] = uLineBuffer[uLineBufferPosition]

        vLineBufferPosition += vPixelStride
        uLineBufferPosition += uPixelStride
      }
    }

    var yIndex: Int
    var outIndex: Int
    var cIndex: Int = height * width

    for (i in 0..height / 2 - 1) {
      yIndex = 2 * i * width
      outIndex = outOffset + 2 * i * outRowStride

      // Log.d("FSDK", "i: ${i}; width: ${width}; height: ${height}; outOffset: ${outOffset}; outIndex: ${outIndex}; outRowStride: ${outRowStride}; outPixelStride: ${outPixelStride}");

      for (j in 0..width / 2 - 1) {
        val u = toUnsigned(nv21[cIndex].toInt())
        val v = toUnsigned(nv21[cIndex + 1].toInt())

        val r = (91881 * v shr 16) - 179
        val g = ((22544 * u + 46793 * v) shr 16) - 135
        val b = (116129 * u shr 16) - 226

        fillRGBBytes(rgb, r, g, b, toUnsigned(nv21[yIndex].toInt()), outIndex)
        fillRGBBytes(rgb, r, g, b, toUnsigned(nv21[yIndex + 1].toInt()), outIndex + outPixelStride)

        fillRGBBytes(rgb, r, g, b, toUnsigned(nv21[yIndex + width].toInt()), outIndex + outRowStride)
        fillRGBBytes(rgb, r, g, b, toUnsigned(nv21[yIndex + width + 1].toInt()), outIndex + outRowStride + outPixelStride)

        yIndex += 2
        cIndex += 2
        outIndex += 2 * outPixelStride
      }
    }
  }

  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
    val image = frame.imageProxy

    when (image.format) {
      ImageFormat.FLEX_RGB_888 ->
        createFromRGB(image)
      ImageFormat.FLEX_RGBA_8888 ->
        createFromRGB(image)
      ImageFormat.YUV_420_888 ->
        createFromYUV(image)
      else ->
        return mapOf(
          "errorCode" to -1,
          "error" to "Unknown image format: ${image.format}",
          "handle" to -1
        )
    }

    val fsdkImage = FSDK.HImage()

    val errorCode = FSDK.LoadImageFromBuffer(fsdkImage, rgb, outWidth, outHeight, outWidth * 3, FSDK.FSDK_IMAGEMODE().apply { mode = FSDK.FSDK_IMAGEMODE.FSDK_IMAGE_COLOR_24BIT })

    return mapOf(
      "errorCode" to errorCode,
      "error" to FaceSDKModule.getError(errorCode),
      "handle" to fsdkImage.himage
    )
  }
}
