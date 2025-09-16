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
  s.source       = { :git => "https://www.luxand.com/.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp}"
  s.private_header_files = "ios/**/*.h"

  s.preserve_paths = 'ios/Frameworks/**/*'
  s.vendored_frameworks = 'ios/Frameworks/FaceSdk.framework', 'ios/Frameworks/fsdk.framework', 'ios/Frameworks/IBetaPlugin.framework'
  s.pod_target_xcconfig = { 
    "OTHER_LDFLAGS" => "-framework FaceSdk -framework fsdk"
  }

  install_modules_dependencies(s)
end
