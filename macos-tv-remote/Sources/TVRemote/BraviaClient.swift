import Foundation

/// Talks to a Sony Bravia TV over its local IP Control API.
/// TV setup: Settings > Network > Home Network > IP Control > Authentication = "Normal and Pre-Shared Key",
/// set a Pre-Shared Key, and enable "Simple IP Control". For power-on from standby, enable
/// Remote Start under Settings > Network > Home Network.
actor BraviaClient {
    struct BraviaError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    private var host: String
    private var psk: String
    private var codes: [String: String] = [:]

    init(host: String, psk: String) {
        self.host = host
        self.psk = psk
    }

    func update(host: String, psk: String) {
        self.host = host
        self.psk = psk
        codes = [:]
    }

    // MARK: JSON-RPC

    private func rpc(_ service: String, method: String, params: [Any] = [], version: String = "1.0") async throws -> [Any] {
        guard let url = URL(string: "http://\(host)/sony/\(service)") else { throw BraviaError(message: "Bad TV address") }
        var req = URLRequest(url: url, timeoutInterval: 5)
        req.httpMethod = "POST"
        req.setValue(psk, forHTTPHeaderField: "X-Auth-PSK")
        let body: [String: Any] = ["method": method, "id": 1, "params": params, "version": version]
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, resp) = try await URLSession.shared.data(for: req)
        if let http = resp as? HTTPURLResponse, http.statusCode == 403 {
            throw BraviaError(message: "TV rejected the pre-shared key")
        }
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw BraviaError(message: "Unexpected response from TV")
        }
        if let err = json["error"] as? [Any] {
            throw BraviaError(message: "TV error: \(err)")
        }
        return json["result"] as? [Any] ?? []
    }

    // MARK: Power

    func isAwake() async throws -> Bool {
        let result = try await rpc("system", method: "getPowerStatus")
        return (result.first as? [String: Any])?["status"] as? String == "active"
    }

    func setPower(_ on: Bool) async throws {
        _ = try await rpc("system", method: "setPowerStatus", params: [["status": on]])
    }

    // MARK: Remote buttons (IRCC)

    /// The TV tells us which IRCC codes it accepts, so we don't hardcode them.
    private func loadCodes() async throws {
        let result = try await rpc("system", method: "getRemoteControllerInfo")
        guard result.count > 1, let list = result[1] as? [[String: Any]] else {
            throw BraviaError(message: "Couldn't read remote codes from TV")
        }
        var map: [String: String] = [:]
        for item in list {
            if let name = item["name"] as? String, let value = item["value"] as? String { map[name] = value }
        }
        codes = map
    }

    func press(_ name: String) async throws {
        if codes.isEmpty { try await loadCodes() }
        guard let code = codes[name] else { throw BraviaError(message: "TV has no button named \(name)") }
        guard let url = URL(string: "http://\(host)/sony/IRCC") else { throw BraviaError(message: "Bad TV address") }
        var req = URLRequest(url: url, timeoutInterval: 5)
        req.httpMethod = "POST"
        req.setValue(psk, forHTTPHeaderField: "X-Auth-PSK")
        req.setValue("text/xml; charset=UTF-8", forHTTPHeaderField: "Content-Type")
        req.setValue("\"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC\"", forHTTPHeaderField: "SOAPACTION")
        req.httpBody = """
        <?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1"><IRCCCode>\(code)</IRCCCode></u:X_SendIRCC></s:Body></s:Envelope>
        """.data(using: .utf8)
        _ = try await URLSession.shared.data(for: req)
    }

    func buttonNames() async throws -> [String] {
        if codes.isEmpty { try await loadCodes() }
        return codes.keys.sorted()
    }

    // MARK: Volume

    struct Volume { var level: Int; var muted: Bool }

    func volume() async throws -> Volume {
        let result = try await rpc("audio", method: "getVolumeInformation")
        let items = (result.first as? [[String: Any]]) ?? []
        let speaker = items.first { $0["target"] as? String == "speaker" } ?? items.first
        return Volume(level: speaker?["volume"] as? Int ?? 0, muted: speaker?["mute"] as? Bool ?? false)
    }

    func setVolume(_ level: Int) async throws {
        _ = try await rpc("audio", method: "setAudioVolume",
                          params: [["target": "speaker", "volume": String(max(0, min(100, level)))]])
    }
}
