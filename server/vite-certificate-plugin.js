import {
  listCertificates,
  issueCertificate,
  verifyCertificateToken,
  revokeCertificate,
  requestChanges,
  resubmitApplication,
  reopenApplication,
} from './certificate-controller.js';

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function certificateApiPlugin() {
  return {
    name: 'certificate-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const method = req.method;

        try {
          // 1. List certificates: GET /api/certificates
          if (url === '/api/certificates' && method === 'GET') {
            const certs = await listCertificates();
            return sendJson(res, 200, certs);
          }

          // 2. Issue certificate: POST /api/certificates/issue
          if (url === '/api/certificates/issue' && method === 'POST') {
            const body = await parseBody(req);
            const result = await issueCertificate(body);
            return sendJson(res, 201, result);
          }

          // 3. Revoke certificate: POST /api/certificates/:id/revoke
          const revokeMatch = url.match(/^\/api\/certificates\/(\d+)\/revoke$/);
          if (revokeMatch && method === 'POST') {
            const certId = parseInt(revokeMatch[1], 10);
            const body = await parseBody(req);
            const result = await revokeCertificate(certId, body);
            return sendJson(res, 200, result);
          }

          // 4. Verify certificate token: GET /api/verify/:token
          const verifyMatch = url.match(/^\/api\/verify\/([a-zA-Z0-9_-]+)$/);
          if (verifyMatch && method === 'GET') {
            const token = verifyMatch[1];
            const result = await verifyCertificateToken(token);
            return sendJson(res, 200, result);
          }

          // 5. Request changes: POST /api/applications/:id/request-changes
          const reqChangesMatch = url.match(/^\/api\/applications\/(\w+)\/request-changes$/);
          if (reqChangesMatch && method === 'POST') {
            const appId = reqChangesMatch[1];
            const body = await parseBody(req);
            const result = await requestChanges(appId, body);
            return sendJson(res, 200, result);
          }

          // 6. Resubmit application: POST /api/applications/:id/resubmit
          const resubmitMatch = url.match(/^\/api\/applications\/(\w+)\/resubmit$/);
          if (resubmitMatch && method === 'POST') {
            const appId = resubmitMatch[1];
            const body = await parseBody(req);
            const result = await resubmitApplication(appId, body);
            return sendJson(res, 200, result);
          }

          // 7. Reopen application: POST /api/applications/:id/reopen
          const reopenMatch = url.match(/^\/api\/applications\/(\w+)\/reopen$/);
          if (reopenMatch && method === 'POST') {
            const appId = reopenMatch[1];
            const body = await parseBody(req);
            const result = await reopenApplication(appId, body);
            return sendJson(res, 200, result);
          }

          next();
        } catch (err) {
          console.error('Certificate API Plugin Error:', err);
          return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
        }
      });
    },
  };
}
