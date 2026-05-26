import Foundation

/// React Native native module that exposes FartSoundManager to JavaScript.
@objc(FartSoundModule)
class FartSoundModule: NSObject {

    @objc
    func playFart() {
        DispatchQueue.main.async {
            FartSoundManager.shared.play()
        }
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
