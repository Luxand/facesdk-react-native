require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "FaceSDK"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/Luxand/facesdk-react-native.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{h,hpp}",
    "ios/**/*.{m,mm}",
    # FaceSDKPlatform is implemented in Swift; without this the class autolinking looks for
    # never gets compiled and the pod fails with "cannot find 'FaceSDKPlatform' in scope".
    "ios/**/*.swift",
    "cpp/**/*.{hpp,cpp}",
  ]

  s.preserve_paths      = 'ios/Frameworks/**/*'
  # The iBeta liveness models, copied into the app bundle so InitializeIBeta can extract them
  # into the caches directory at runtime. Android ships the same tree under android assets.
  s.resources           = 'ios/data'
  # IBetaPlugin is dlopened by LuxandFaceSDK at runtime and links against IDRnD's FaceSdk, so all three
  # have to ship even though only LuxandFaceSDK is linked at build time.
  s.vendored_frameworks = 'ios/Frameworks/LuxandFaceSDK.framework',
                          'ios/Frameworks/IBetaPlugin.framework',
                          'ios/Frameworks/FaceSdk.framework'
  s.pod_target_xcconfig = {
    "OTHER_LDFLAGS" => "-framework LuxandFaceSDK"
  }

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'

  load 'nitrogen/generated/ios/FaceSDK+autolinking.rb'
  add_nitrogen_files(s)

  install_modules_dependencies(s)
end
