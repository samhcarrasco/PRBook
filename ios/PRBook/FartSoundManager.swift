import AVFoundation

/// Synthesises a fart-like sound at runtime using AVAudioEngine.
/// No audio file is required; the waveform is generated from noise,
/// a pitch-gliding tone, and a flutter modulator.
class FartSoundManager: NSObject {
    static let shared = FartSoundManager()

    private var engine: AVAudioEngine?

    private override init() {
        super.init()
    }

    func play() {
        // Stop any currently playing instance
        engine?.stop()
        engine = nil

        // Use .playback so sound plays even when the ringer switch is off
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            NSLog("FartSoundManager: AVAudioSession error: %@", error.localizedDescription)
        }

        let newEngine = AVAudioEngine()
        let playerNode = AVAudioPlayerNode()
        newEngine.attach(playerNode)

        let sampleRate: Double = 44100
        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1) else { return }
        newEngine.connect(playerNode, to: newEngine.mainMixerNode, format: format)

        let durationSeconds: Double = 0.65
        let frameCount = AVAudioFrameCount(durationSeconds * sampleRate)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount

        guard let channelData = buffer.floatChannelData?[0] else { return }

        // Build the fart waveform sample-by-sample
        for i in 0..<Int(frameCount) {
            let t = Double(i) / sampleRate
            // Envelope: fast attack (~30 ms), exponential decay over ~600 ms
            let envelope = (1.0 - exp(-t * 30.0)) * exp(-t * 5.5)
            // White-noise burst (sputter texture)
            let noise = Double.random(in: -1.0...1.0)
            // Low-frequency tone with a downward pitch glide (80 → 50 Hz)
            let freq = max(50.0, 80.0 - t * 46.0)
            let tone = sin(2.0 * .pi * freq * t)
            // Lip-flutter modulator (~22 Hz)
            let flutter = sin(2.0 * .pi * 22.0 * t)
            let sample = envelope * (noise * 0.50 + tone * 0.30 + flutter * 0.20)
            channelData[i] = Float(min(max(sample, -1.0), 1.0))
        }

        do {
            try newEngine.start()
        } catch {
            NSLog("FartSoundManager: AVAudioEngine start error: %@", error.localizedDescription)
            return
        }

        playerNode.scheduleBuffer(buffer, at: nil, options: [], completionHandler: { [weak newEngine] in
            newEngine?.stop()
        })
        playerNode.play()

        self.engine = newEngine
    }
}
