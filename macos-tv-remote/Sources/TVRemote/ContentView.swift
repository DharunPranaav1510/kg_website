import SwiftUI

struct ContentView: View {
    @EnvironmentObject var tv: TVModel
    @EnvironmentObject var music: MusicController
    @State private var playlist = ""

    var body: some View {
        VStack(spacing: 14) {
            setup
            Divider()
            remote
            Divider()
            musicSection
            if !tv.status.isEmpty { Text(tv.status).foregroundStyle(.red).font(.caption) }
            if let e = music.error { Text(e).foregroundStyle(.red).font(.caption) }
        }
        .padding(16)
        .frame(width: 320)
        .onAppear { music.refresh(); music.loadDevices(); tv.refreshVolume() }
    }

    private var setup: some View {
        DisclosureGroup("TV setup") {
            VStack(alignment: .leading) {
                TextField("TV IP (e.g. 192.168.1.50)", text: tv.$host)
                SecureField("Pre-shared key", text: tv.$psk)
            }.textFieldStyle(.roundedBorder)
        }
    }

    private func key(_ label: String, _ icon: String, _ code: String) -> some View {
        Button { tv.press(code) } label: { Image(systemName: icon).frame(width: 34, height: 26) }
            .help(label)
    }

    private var remote: some View {
        VStack(spacing: 8) {
            HStack {
                Button("Power On") { tv.power(true) }
                Button("Standby") { tv.power(false) }
            }
            key("Up", "chevron.up", "Up")
            HStack {
                key("Left", "chevron.left", "Left")
                key("OK", "circle.fill", "Confirm")
                key("Right", "chevron.right", "Right")
            }
            key("Down", "chevron.down", "Down")
            HStack {
                key("Back", "arrow.uturn.backward", "Return")
                key("Home", "house", "Home")
                key("Input", "rectangle.badge.plus", "Input")
                key("Mute", "speaker.slash", "Mute")
            }
            HStack {
                key("Vol −", "speaker.minus", "VolumeDown")
                key("Vol +", "speaker.plus", "VolumeUp")
            }
        }
    }

    private var musicSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Apple Music").font(.headline)
            Text(music.nowPlaying).font(.caption).lineLimit(2)
            HStack {
                Button { music.previous() } label: { Image(systemName: "backward.fill") }
                Button { music.playPause() } label: { Image(systemName: "playpause.fill") }
                Button { music.next() } label: { Image(systemName: "forward.fill") }
            }
            Picker("Output", selection: Binding(get: { music.selectedDevice }, set: { music.selectDevice($0) })) {
                Text("—").tag("")
                ForEach(music.airplayDevices, id: \.self) { Text($0).tag($0) }
            }
            HStack {
                TextField("Playlist name", text: $playlist).textFieldStyle(.roundedBorder)
                Button("Play") { music.playPlaylist(playlist) }
            }
        }
    }
}
