#!/usr/bin/env python3
"""
21N2 Billiards Scoreboard - Local Development Server
Features:
- Port Scanning: Inspects listening ports, detects running servers & process info (PID, process name).
- Smart 21N2 Detection: Probes ports to see if an instance of 21N2 Scoreboard is already running.
- Dynamic Port Selection: Never gets stuck if port 8000 is occupied; automatically binds to next free port.
- LAN IP Detection: Displays local network IP for mobile testing over Wi-Fi.
- Development Optimized: Serves proper MIME types (.webmanifest, .js, .woff2) with no-cache headers.
- Auto Browser Launch: Opens the scoreboard in your default browser automatically.
"""

import os
import sys
import csv
import socket
import urllib.request
import webbrowser
import subprocess
import argparse
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# Force unbuffered stdout/stderr with utf-8
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(line_buffering=True, encoding="utf-8")
        sys.stderr.reconfigure(line_buffering=True, encoding="utf-8")
    except Exception:
        pass

# Workspace root directory (one level up from tools/)
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Register critical MIME types for PWA and web development
mimetypes.init()
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/ttf", ".ttf")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("audio/mpeg", ".mp3")
mimetypes.add_type("audio/wav", ".wav")

COMMON_DEV_PORTS = [8000, 8001, 8002, 8080, 8888, 3000, 5000, 5173, 5500, 80]


def get_process_map():
    """Returns mapping of PID -> process name on Windows."""
    p_map = {}
    if sys.platform == "win32":
        try:
            out = subprocess.check_output(
                ["tasklist", "/FO", "CSV", "/NH"],
                text=True,
                errors="ignore",
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            reader = csv.reader(out.strip().splitlines())
            for row in reader:
                if len(row) >= 2:
                    try:
                        p_map[int(row[1])] = row[0]
                    except ValueError:
                        pass
        except Exception:
            pass
    return p_map


def get_listening_ports():
    """Scans and returns all currently listening TCP ports on the system."""
    p_map = get_process_map()
    listeners = []

    if sys.platform == "win32":
        try:
            out = subprocess.check_output(
                ["netstat", "-ano", "-p", "tcp"],
                text=True,
                errors="ignore",
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            seen = set()
            for line in out.splitlines():
                if "LISTENING" in line:
                    parts = line.strip().split()
                    if len(parts) >= 4:
                        local_addr = parts[1]
                        try:
                            pid = int(parts[-1])
                        except ValueError:
                            pid = 0
                        pname = p_map.get(pid, "Unknown")
                        if ":" in local_addr:
                            ip, port_str = local_addr.rsplit(":", 1)
                            try:
                                port = int(port_str)
                                key = (ip, port)
                                if key not in seen:
                                    seen.add(key)
                                    listeners.append({
                                        "ip": ip,
                                        "port": port,
                                        "pid": pid,
                                        "process": pname,
                                    })
                            except ValueError:
                                pass
        except Exception:
            pass
    else:
        for port in COMMON_DEV_PORTS:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.05)
                if s.connect_ex(("127.0.0.1", port)) == 0:
                    listeners.append({"ip": "127.0.0.1", "port": port, "pid": 0, "process": "Active"})

    return sorted(listeners, key=lambda x: (x["port"], x["ip"]))


def probe_http_app(port):
    """
    Sends a fast lightweight GET request to check what is running on the port.
    Returns: (is_http, is_21n2, title_or_info)
    """
    url = f"http://127.0.0.1:{port}/"
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "21N2-PortScanner/1.0", "Accept": "text/html"},
        )
        with urllib.request.urlopen(req, timeout=0.3) as resp:
            content = resp.read(2048).decode("utf-8", errors="ignore")
            server_header = resp.headers.get("Server", "")
            title = ""
            if "<title>" in content:
                start = content.find("<title>") + 7
                end = content.find("</title>", start)
                if end != -1:
                    title = content[start:end].strip()

            is_21n2 = "21N2 Billiards Scoreboard" in content or "21N2" in title
            info = title or server_header or "HTTP Server"
            return True, is_21n2, info
    except Exception:
        return False, False, ""


def is_port_free(port, host="0.0.0.0"):
    """
    Tests if a port can be bound to and is not actively listening.
    Does NOT use SO_REUSEADDR on Windows so that busy ports are accurately detected.
    """
    # 1. Active connection probe
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.05)
        if s.connect_ex(("127.0.0.1", port)) == 0:
            return False

    # 2. Bind test without SO_REUSEADDR
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((host, port))
            return True
        except OSError:
            return False


def find_free_port(start_port=8000, max_tries=100):
    """Finds the next free port starting from start_port."""
    for p in range(start_port, start_port + max_tries):
        if is_port_free(p):
            return p
    return None


def get_lan_ips():
    """Gets local LAN IPv4 addresses suitable for mobile testing."""
    ips = []
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and ":" not in ip:
                ips.append(ip)
    except Exception:
        pass
    if not ips:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                ip = s.getsockname()[0]
                if ip and not ip.startswith("127."):
                    ips.append(ip)
        except Exception:
            pass
    return ips


def print_banner(title):
    print("=" * 72, flush=True)
    print(f" {title}".center(72), flush=True)
    print("=" * 72, flush=True)


def scan_and_report_ports(full_scan=False):
    """
    Scans ports and reports running servers.
    Returns: list of 21N2 instances found [{"port": p, "pid": pid, "process": name}]
    """
    listeners = get_listening_ports()
    running_21n2 = []

    print("[*] Checking system ports for running servers...", flush=True)

    # Filter to interesting ports (dev ports, standard ports, or full list if requested)
    target_listeners = []
    for item in listeners:
        p = item["port"]
        is_dev = (
            (8000 <= p <= 8099)
            or (3000 <= p <= 3010)
            or (5000 <= p <= 5010)
            or p in (80, 443, 5173, 5500, 8888, 9000)
        )
        if full_scan or is_dev:
            target_listeners.append(item)

    if not target_listeners and not full_scan:
        for p in COMMON_DEV_PORTS:
            if not is_port_free(p, "127.0.0.1"):
                target_listeners.append({
                    "ip": "127.0.0.1",
                    "port": p,
                    "pid": 0,
                    "process": "Active",
                })

    active_servers = []
    for item in target_listeners:
        p = item["port"]
        is_http, is_21n2, info = probe_http_app(p)
        item_copy = dict(item)
        item_copy["is_http"] = is_http
        item_copy["is_21n2"] = is_21n2
        item_copy["info"] = info
        active_servers.append(item_copy)
        if is_21n2:
            running_21n2.append(item_copy)

    if active_servers:
        print(f"\n[+] Active listening services detected ({len(active_servers)}):", flush=True)
        print(f"  {'PORT':<7} | {'PID':<7} | {'PROCESS':<18} | {'STATUS / APP'}", flush=True)
        print("  " + "-" * 66, flush=True)
        for s in active_servers:
            badge = ""
            if s["is_21n2"]:
                badge = "[* 21N2 SCOREBOARD ACTIVE *]"
            elif s["info"]:
                badge = f"HTTP: {s['info']}"
            else:
                badge = "TCP Service"
            pname = s["process"] if s["process"] != "Unknown" else "System/Other"
            print(f"  {s['port']:<7} | {s['pid']:<7} | {pname:<18} | {badge}", flush=True)
        print(flush=True)
    else:
        print("[i] No other development servers currently detected on common ports.", flush=True)

    return running_21n2


def kill_process(pid):
    """Terminates a process by PID on Windows."""
    if pid <= 0:
        return False
    try:
        subprocess.check_call(
            ["taskkill", "/F", "/PID", str(pid)],
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        return True
    except Exception as e:
        print(f"[!] Failed to kill process {pid}: {e}", flush=True)
        return False


class DevScoreboardHandler(SimpleHTTPRequestHandler):
    """HTTP Request Handler tailored for 21N2 Billiards Scoreboard PWA."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        # Prevent browser caching during local development
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def run_server(port, open_browser=True):
    """Starts the Threading HTTP Server on the specified port."""
    lan_ips = get_lan_ips()
    primary_lan = lan_ips[0] if lan_ips else "127.0.0.1"

    local_url = f"http://localhost:{port}/"
    network_url = f"http://{primary_lan}:{port}/"

    server_address = ("0.0.0.0", port)
    try:
        httpd = ThreadingHTTPServer(server_address, DevScoreboardHandler)
    except Exception as e:
        print(f"[!] Error binding to 0.0.0.0:{port}: {e}", flush=True)
        return

    print_banner("21N2 BILLIARDS SCOREBOARD LOCAL SERVER")
    print(f"  Root Directory : {ROOT_DIR}", flush=True)
    print(f"  Status         : RUNNING on port {port}", flush=True)
    print(f"  Local Access   : {local_url}", flush=True)
    if lan_ips:
        print(f"  Mobile / LAN   : {network_url}  <-- Open on phone Wi-Fi!", flush=True)
    print("  " + "-" * 66, flush=True)
    print("  MIME Support   : .webmanifest, .js, .json, .woff2, .mp3 enabled", flush=True)
    print("  Live Dev Mode  : Cache-Control disabled for instant updates", flush=True)
    print("  To Stop Server : Press Ctrl+C in this console window", flush=True)
    print("=" * 72, flush=True)
    print(flush=True)

    if open_browser:
        try:
            print(f"[*] Opening browser: {local_url}", flush=True)
            webbrowser.open(local_url)
        except Exception:
            pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping server...", flush=True)
    finally:
        httpd.server_close()
        print("[+] Server stopped cleanly.", flush=True)


def main():
    parser = argparse.ArgumentParser(
        description="21N2 Billiards Scoreboard - Local Server & Port Inspector"
    )
    parser.add_argument(
        "port",
        nargs="?",
        type=int,
        default=None,
        help="Optional specific port number to use (default: dynamic search from 8000)",
    )
    parser.add_argument(
        "-p", "--port-opt",
        type=int,
        dest="port_flag",
        help="Port number to use",
    )
    parser.add_argument(
        "-s", "--scan",
        action="store_true",
        help="Check all listening ports on the system and exit",
    )
    parser.add_argument(
        "--full-scan",
        action="store_true",
        help="Inspect all active TCP ports, including OS/system services",
    )
    parser.add_argument(
        "--kill",
        action="store_true",
        help="Terminate any currently running 21N2 Scoreboard server instances",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open browser automatically upon starting",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force start a new server instance without prompting even if one is running",
    )

    args = parser.parse_args()

    # Determine requested start port
    requested_port = args.port or args.port_flag

    # Step 1: Scan and report ports
    running_21n2 = scan_and_report_ports(full_scan=args.full_scan or args.scan)

    if args.scan:
        print("[+] Port check complete.", flush=True)
        return

    # Step 2: Handle --kill flag
    if args.kill:
        if running_21n2:
            for inst in running_21n2:
                pid = inst["pid"]
                p = inst["port"]
                print(f"[*] Killing 21N2 instance on port {p} (PID {pid})...", flush=True)
                kill_process(pid)
            print("[+] Terminated running 21N2 instance(s).", flush=True)
        else:
            print("[i] No running 21N2 instance found to terminate.", flush=True)
        return

    # Step 3: Check if 21N2 is already running
    if running_21n2 and not args.force:
        inst = running_21n2[0]
        existing_port = inst["port"]
        existing_pid = inst["pid"]
        print("!" * 72, flush=True)
        print(f" [!] Notice: 21N2 Scoreboard is ALREADY running on port {existing_port} (PID: {existing_pid})", flush=True)
        print(f"     URL: http://localhost:{existing_port}/", flush=True)
        print("!" * 72, flush=True)

        # If running interactively in terminal, prompt for decision
        if sys.stdin.isatty():
            print("\nOptions:", flush=True)
            print(f"  [1] Open existing instance in browser (http://localhost:{existing_port}/)", flush=True)
            print(f"  [2] Stop existing instance (PID {existing_pid}) and start fresh here", flush=True)
            print(f"  [3] Start a new instance on another free port", flush=True)
            try:
                choice = input("\nEnter choice [1/2/3] (default: 1): ").strip()
            except (EOFError, KeyboardInterrupt):
                print(flush=True)
                return

            if choice in ("", "1"):
                webbrowser.open(f"http://localhost:{existing_port}/")
                print(f"[+] Opened http://localhost:{existing_port}/ in browser.", flush=True)
                return
            elif choice == "2":
                print(f"[*] Stopping instance PID {existing_pid}...", flush=True)
                kill_process(existing_pid)
                import time
                time.sleep(0.5)
                requested_port = existing_port
            elif choice == "3":
                requested_port = None
        else:
            print("[i] Non-interactive mode: Finding another free port to run alongside...", flush=True)
            requested_port = None

    # Step 4: Determine port to bind (Dynamic port allocation)
    base_port = requested_port if requested_port else 8000
    chosen_port = base_port

    if not is_port_free(chosen_port):
        print(f"[!] Port {chosen_port} is already in use by another service.", flush=True)
        free_port = find_free_port(chosen_port + 1)
        if not free_port:
            print(f"[ERROR] Could not find any free port in range {chosen_port+1}..{chosen_port+100}.", flush=True)
            sys.exit(1)
        print(f"[+] Dynamically selected next available free port: {free_port}", flush=True)
        chosen_port = free_port
    else:
        print(f"[+] Port {chosen_port} is available.", flush=True)

    # Step 5: Start the server
    run_server(chosen_port, open_browser=not args.no_browser)


if __name__ == "__main__":
    main()
