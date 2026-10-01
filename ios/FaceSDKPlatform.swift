import Foundation
import NitroModules

private let dataDirectory = "data"

class FaceSDKPlatform: HybridFaceSDKPlatformSpec {
  private func path(for searchPath: FileManager.SearchPathDirectory) -> String {
    guard
      let path = NSSearchPathForDirectoriesInDomains(searchPath, .userDomainMask, true).first
    else {
      fatalError("FaceSDKPlatform: no directory available for \(searchPath).")
    }

    return path
  }

  var documentsDirectory: String {
    return path(for: .documentDirectory)
  }

  var cachesDirectory: String {
    return path(for: .cachesDirectory)
  }

  func prepareIBetaData() throws {
    guard let bundled = Bundle.main.resourceURL?.appendingPathComponent(dataDirectory) else {
      throw RuntimeError.error(withMessage: "FaceSDKPlatform: no bundle resource directory.")
    }

    let destination = URL(fileURLWithPath: cachesDirectory).appendingPathComponent(dataDirectory)

    try copy(from: bundled, to: destination)
  }

  private func copy(from source: URL, to destination: URL) throws {
    let manager = FileManager.default

    var isDirectory: ObjCBool = false
    guard manager.fileExists(atPath: source.path, isDirectory: &isDirectory) else { return }

    if !isDirectory.boolValue {
      if manager.fileExists(atPath: destination.path) { return }

      try manager.createDirectory(
        at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
      try manager.copyItem(at: source, to: destination)

      return
    }

    try manager.createDirectory(at: destination, withIntermediateDirectories: true)

    for entry in try manager.contentsOfDirectory(atPath: source.path) {
      try copy(
        from: source.appendingPathComponent(entry),
        to: destination.appendingPathComponent(entry))
    }
  }
}
