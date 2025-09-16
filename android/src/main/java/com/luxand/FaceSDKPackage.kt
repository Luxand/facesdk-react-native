package com.luxand

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import java.util.HashMap

class FaceSDKPackage : BaseReactPackage() {
  companion object {
    init {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("frameToFSDKImage", ::FrameToFSDKImagePlugin)
    }
  }

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == FaceSDKModule.NAME) {
      FaceSDKModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[FaceSDKModule.NAME] = ReactModuleInfo(
        FaceSDKModule.NAME,
        FaceSDKModule.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true // isTurboModule
      )
      moduleInfos
    }
  }
}
