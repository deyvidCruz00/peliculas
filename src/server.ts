import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import https from 'node:https';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const cspHeader = "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'strict-dynamic' 'sha256-qOzNEiG4PyqYBKbleA3Dtj6sbBDAlSBPDcy80p0RLrI='; style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.omdbapi.com https://cdn.jsdelivr.net; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests;";

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', cspHeader);
  next();
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  const sslKeyPath = process.env['SSL_KEY_PATH'];
  const sslCertPath = process.env['SSL_CERT_PATH'];

  if (sslKeyPath && sslCertPath && existsSync(sslKeyPath) && existsSync(sslCertPath)) {
    const options = {
      key: readFileSync(sslKeyPath),
      cert: readFileSync(sslCertPath)
    };

    const server = https.createServer(options, app);
    server.on('error', (error) => {
      throw error;
    });
    server.listen(port, () => {
      console.log(`Node Express server listening on https://localhost:${port}`);
    });
  } else {
    const server = app.listen(port, () => {
      console.log(`Node Express server listening on http://localhost:${port}`);
    });
    server.on('error', (error) => {
      throw error;
    });
  }
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
