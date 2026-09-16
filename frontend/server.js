import fs from 'fs';
import path from 'path';
import http from 'http';
import esbuild from 'esbuild';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

  console.log('Building React app with esbuild...');
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src/main.tsx')],
    bundle: true,
    outfile: path.join(__dirname, 'dist/bundle.js'),
    format: 'esm',
    jsx: 'automatic',
    loader: { '.css': 'empty', '.svg': 'dataurl' },
    define: {
      'process.env.NODE_ENV': '"development"',
      'import.meta.env.VITE_API_URL': '""'
    }
  });
  console.log('Build complete! Size:', fs.statSync(path.join(__dirname, 'dist/bundle.js')).size);

  if (fs.existsSync(path.join(__dirname, 'public/favicon.svg'))) {
    fs.copyFileSync(path.join(__dirname, 'public/favicon.svg'), path.join(__dirname, 'dist/favicon.svg'));
  }

  const htmlContent = `<!doctype html>
<html lang="en" class="dark" style="background-color: #0D0E12; color: #F1F3F9;">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pinecone &bull; Multi-Vendor Compliance & Security Auditor</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              pinecone: {
                bg: '#0D0E12',
                canvas: '#111319',
                surface: '#151821',
                'surface-hover': '#1B1E2B',
                card: '#161924',
                'card-elevated': '#1D2130',
                border: '#232736',
                'border-light': '#2D3245',
                brand: '#4F46E5',
                electric: '#2563EB',
                cyan: '#06B6D4',
                emerald: '#10B981',
                amber: '#F59E0B',
                rose: '#EF4444',
                text: '#F1F3F9',
                muted: '#8D95AB',
                subtle: '#586076',
              },
              dark: {
                900: '#0D0E12',
                800: '#151821',
                700: '#1D2130',
                600: '#2A2F42',
                500: '#3D445D',
              }
            }
          }
        }
      }
    </script>
    <style>
      html, body, #root {
        background-color: #0D0E12 !important;
        color: #F1F3F9 !important;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: #0D0E12; }
      ::-webkit-scrollbar-thumb { background: #232736; border-radius: 9999px; }
      ::-webkit-scrollbar-thumb:hover { background: #3D445D; }
    </style>
  </head>
  <body class="bg-[#0D0E12] text-[#F1F3F9] min-h-screen antialiased selection:bg-blue-600/30 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/bundle.js"></script>
  </body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'dist/index.html'), htmlContent);

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
  };

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.url.startsWith('/api')) {
      const proxyReq = http.request(
        `http://127.0.0.1:8000${req.url}`,
        {
          method: req.method,
          headers: { ...req.headers, host: '127.0.0.1:8000' },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        }
      );
      proxyReq.on('error', (e) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend unreachable', details: e.message }));
      });
      req.pipe(proxyReq, { end: true });
      return;
    }

    let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'dist/index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Pinecone Compliance UI Server running at: http://localhost:${PORT}\n`);
  });
}

start().catch(console.error);
