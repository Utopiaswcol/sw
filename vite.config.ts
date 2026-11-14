import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function cryptoShimPlugin(): Plugin {
  const appShim = path.resolve(__dirname, 'src/shims/cryptoBrowser.ts');
  const nativeShim = path.resolve(__dirname, 'src/shims/cryptoNative.ts');
  return {
    name: 'crypto-shim-for-app',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source !== 'crypto' && source !== 'node:crypto') return null;
      const fromLibrary = Boolean(importer && importer.replace(/\\/g, '/').includes('/node_modules/'));
      return fromLibrary ? nativeShim : appShim;
    },
  };
}

function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      aistudioMediaPlugin(),
      cryptoShimPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'Aethel Vault',
          short_name: 'Vault',
          description: 'Plataforma privada de compatibilidad relacional, bóveda cifrada y comunicación segura.',
          theme_color: '#070709',
          background_color: '#070709',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    define: {
      'process.env.WOMPI_INTEGRITY_SECRET': 'undefined',
      'process.env.WOMPI_EVENT_SECRET': 'undefined',
      'process.env.WOMPI_PUBLIC_KEY': 'undefined',
      'process.env.SUPABASE_URL': 'undefined',
      'process.env.SUPABASE_SERVICE_ROLE_KEY': 'undefined',
      'process.env.SUPABASE_ANON_KEY': 'undefined',
      'process.env.SUPABASE_PUBLISHABLE_KEY': 'undefined',
      'process.env.VITE_SUPABASE_URL': 'undefined',
      'process.env.VITE_SUPABASE_ANON_KEY': 'undefined',
      'process.env.VITE_SUPABASE_PUBLISHABLE_KEY': 'undefined',
      'process.env.MEDIA_SECRET_KEY': 'undefined',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
