# Bulk-IOC-Scanner

A web tool for SOC analysts to bulk-scan Indicators of Compromise (file hashes, IPs, domains, URLs, and more) against threat intelligence providers.

![Bulk-IOC-Scanner screenshot](docs/screenshot.png)

## Features

- **Bulk scanning.** Paste many IOCs at once, separated by newlines or commas.
- **File scanning.** Files are hashed locally (MD5, SHA1, SHA256) and only the hash is sent out.
- **Auto type detection.** Recognizes hashes, IPs, CIDRs, domains, URLs, emails, CVEs, ASNs, and crypto addresses. Handles defanged IOCs too.
- **Multiple providers.** VirusTotal, AbuseIPDB, GreyNoise, ThreatFox, URLScan.io, IPify geolocation, and keyless RDAP/WHOIS.
- **Risk scoring.** A 0 to 100 score, color coded Low, Medium, or High.
- **History, tagging, and notes** for every scan.
- **Flexible export.** CSV or JSON with a field picker, optional defanging, and copy-ready investigation reports.
- **In-app settings.** Add API keys and toggle providers on or off from the UI. No file editing needed.

## Tech Stack

FastAPI, SQLite, React, Tailwind CSS.

## Running

You need `python3`, `npm`, and `bash`.

```bash
git clone https://github.com/HashemSalhi/Bulk-IOC-Scanner.git
cd Bulk-IOC-Scanner
./run.sh
```

`run.sh` installs everything on first run and starts both servers:

- **App:** http://localhost:5173
- **API:** http://localhost:8000 (docs at `/docs`)

Press **Ctrl+C** to stop.

### With Docker

```bash
docker compose up --build
# App: http://localhost
# API: http://localhost:8000
```

## API Keys

RDAP/WHOIS works with no key. The other providers need free API keys, which you add in the **Settings** page or in `backend/.env` (see `.env.example`). Any provider without a key is simply skipped.

## License

Released under the [MIT License](LICENSE).
