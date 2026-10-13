import SwiftUI

@main
struct TVRemoteApp: App {
    @StateObject private var model = TVModel()
    @StateObject private var music = MusicController()

    var body: some Scene {
        WindowGroup("Sony TV Remote") {
            ContentView().environmentObject(model).environmentObject(music)
        }
        .windowResizability(.contentSize)

        MenuBarExtra("TV", systemImage: "tv") {
            ContentView().environmentObject(model).environmentObject(music)
        }
        .menuBarExtraStyle(.window)
    }
}

@MainActor
final class TVModel: ObservableObject {
    @AppStorage("tvHost") var host = ""
    @AppStorage("tvPSK") var psk = ""
    @Published var status = ""
    @Published var volume = 0
    private let client = BraviaClient(host: "", psk: "")

    func apply() async { await client.update(host: host, psk: psk) }

    private func attempt(_ work: @escaping (BraviaClient) async throws -> Void) {
        Task {
            await apply()
            do { try await work(client); status = "" } catch { status = error.localizedDescription }
        }
    }

    func press(_ name: String) { attempt { try await $0.press(name) } }
    func power(_ on: Bool) { attempt { try await $0.setPower(on) } }
    func refreshVolume() {
        attempt { [weak self] c in
            let v = try await c.volume()
            await MainActor.run { self?.volume = v.level }
        }
    }
    func setVolume(_ v: Int) { attempt { try await $0.setVolume(v) } }
}
