import Foundation

/// Drives Music.app via AppleScript (first run triggers a macOS Automation permission prompt).
/// Audio reaches the TV by pointing Music.app's AirPlay output at it.
@MainActor
final class MusicController: ObservableObject {
    @Published var nowPlaying = "Nothing playing"
    @Published var airplayDevices: [String] = []
    @Published var selectedDevice = ""
    @Published var error: String?

    @discardableResult
    private func run(_ source: String) -> String? {
        var err: NSDictionary?
        let result = NSAppleScript(source: source)?.executeAndReturnError(&err)
        if let err {
            error = err[NSAppleScript.errorMessage] as? String ?? "AppleScript error"
            return nil
        }
        error = nil
        return result?.stringValue
    }

    private func escape(_ s: String) -> String {
        s.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
    }

    func playPause() { run(#"tell application "Music" to playpause"#); refresh() }
    func next() { run(#"tell application "Music" to next track"#); refresh() }
    func previous() { run(#"tell application "Music" to previous track"#); refresh() }

    func playPlaylist(_ name: String) {
        run(#"tell application "Music" to play playlist "\#(escape(name))""#)
        refresh()
    }

    func refresh() {
        let info = run("""
        tell application "Music"
            if player state is stopped then return "Nothing playing"
            return (name of current track) & " — " & (artist of current track)
        end tell
        """)
        nowPlaying = info ?? "Nothing playing"
    }

    func loadDevices() {
        guard let joined = run("""
        tell application "Music"
            set AppleScript's text item delimiters to "|"
            set n to (name of every AirPlay device) as text
            set AppleScript's text item delimiters to ""
            return n
        end tell
        """) else { return }
        airplayDevices = joined.split(separator: "|").map(String.init)
        let current = run(#"tell application "Music" to return name of current AirPlay devices as text"#) ?? ""
        selectedDevice = airplayDevices.first { current.contains($0) } ?? ""
    }

    func selectDevice(_ name: String) {
        run(#"tell application "Music" to set current AirPlay devices to {AirPlay device "\#(escape(name))"}"#)
        selectedDevice = name
    }
}
