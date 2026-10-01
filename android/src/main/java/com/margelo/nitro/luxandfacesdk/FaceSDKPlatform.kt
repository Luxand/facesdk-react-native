package com.margelo.nitro.luxandfacesdk

import android.content.Context
import android.content.res.AssetManager
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import java.io.File

private const val DATA_DIRECTORY = "data"

@DoNotStrip
class FaceSDKPlatform : HybridFaceSDKPlatformSpec() {
  private fun path(directory: (Context) -> File): String {
    val context =
      NitroModules.applicationContext
        ?: throw IllegalStateException(
          "FaceSDKPlatform: no ReactApplicationContext available."
        )

    return directory(context).absolutePath
  }

  override val documentsDirectory: String
    get() = path { it.filesDir }

  override val cachesDirectory: String
    get() = path { it.cacheDir }

  override fun prepareIBetaData() {
    val assets =
      NitroModules.applicationContext?.assets
        ?: throw IllegalStateException(
          "FaceSDKPlatform: no ReactApplicationContext available."
        )

    copyAssets(assets, DATA_DIRECTORY, File(cachesDirectory, DATA_DIRECTORY))
  }

  private fun copyAssets(assets: AssetManager, source: String, destination: File) {
    val entries = assets.list(source) ?: return

    if (entries.isEmpty()) {
      if (destination.exists()) return

      destination.parentFile?.mkdirs()
      assets.open(source).use { input ->
        destination.outputStream().use { output -> input.copyTo(output) }
      }

      return
    }

    destination.mkdirs()

    for (entry in entries) {
      copyAssets(assets, "$source/$entry", File(destination, entry))
    }
  }
}
