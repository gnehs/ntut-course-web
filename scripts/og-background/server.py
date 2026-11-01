# Serves this folder and saves POSTed render output next to it as out-<name>.
import http.server, os, sys, json
ROOT = sys.argv[1]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_POST(self):
        n = int(self.headers['Content-Length'])
        name = os.path.basename(self.path)
        with open(os.path.join(ROOT, 'out-' + name), 'wb') as f: f.write(self.rfile.read(n))
        self.send_response(200); self.send_header('Access-Control-Allow-Origin', '*'); self.end_headers(); self.wfile.write(b'ok')
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
