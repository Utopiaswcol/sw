import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import {
  initWebSocketServer,
  runWebSocketTestSuite,
  generateWSTicket
} from "./src/services/webSocketService.js";
import {
  saveOnboardingProfile,
  findVectorCandidates,
  runSupabaseIntegrationTests
} from "./src/services/supabaseService.js";
import { sanitizeAndProcessImage } from "./src/services/mediaSanitizer.js";
import {
  generateSecureMediaToken,
  verifySecureMediaToken
} from "./src/services/secureMediaService.js";
import {
  validateMediaAccess,
  grantVaultAccess,
  registerMediaAsset
} from "./src/services/mediaAccessEngine.js";
import { runMediaSecurityTestSuite } from "./src/services/mediaTestRunner.js";
import {
  createWompiCheckoutSession,
  processWompiWebhookEvent,
  getSubscriptionStatus
} from "./src/services/billingService.js";
import {
  sendEphemeralMessage,
  getActiveMessages,
  grantReciprocalVaultConsent,
  getReciprocalVaultStatus,
  purgeAllExpiredMessages
} from "./src/services/ephemeralChatService.js";
import { isEncryptedPayload } from "./src/services/cryptoEngine.js";
import { runCryptoSecurityTestSuite } from "./src/services/cryptoTestRunner.js";
import {
  calculateHybridAffinity,
  COLOMBIA_QUADRANTS,
  runAntiTrilaterationTestSuite
} from "./src/services/discreteGeoService.js";
import {
  initiateMemberAVerification,
  validateMemberB,
  getCoupleKycStatus,
  runKycAntiFraudTestSuite
} from "./src/services/asyncKycService.js";
import {
  syncKeyPackageToServer,
  getKeyPackageFromServer,
  runZeroKnowledgeTestSuite
} from "./src/services/zeroKnowledgeVaultService.js";
import {
  getDensityRadarMetrics,
  hasActiveAccessPass,
  grantSingleConnectionPass,
  runDensityRadarTestSuite
} from "./src/services/densityRadarService.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware de Hardening y Cabeceras HTTP Estrictas de Seguridad AppSec
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' https: data: blob: 'unsafe-inline'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'self' https://*.google.com https://*.run.app https://*.cloudshell.dev;"
    );
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  app.use(express.json({ limit: "20mb" }));

  // API Route: Upload and Sanitize Media (EXIF Purge + WebP + SHA-256)
  app.post("/api/media/upload", async (req, res) => {
    try {
      const { imageBase64, ownerUserId, visibility = "vault_private", allowedRoles = [] } = req.body;
      if (!imageBase64 || !ownerUserId) {
        return res.status(400).json({ error: "Parámetros `imageBase64` y `ownerUserId` son obligatorios." });
      }

      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const sanitized = await sanitizeAndProcessImage(buffer, ownerUserId);

      const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      registerMediaAsset({
        id: mediaId,
        ownerUserId,
        visibility,
        allowedRoles,
        storagePath: `vault/${ownerUserId}/${mediaId}.webp`,
        forensicHash: sanitized.forensicHash,
        createdAt: new Date().toISOString()
      });

      res.json({
        success: true,
        mediaId,
        forensicHash: sanitized.forensicHash,
        originalSizeBytes: sanitized.originalSizeBytes,
        cleanedSizeBytes: sanitized.cleanedSizeBytes,
        format: sanitized.format,
        exifStripped: sanitized.exifStripped,
        message: "Imagen sanitizada exitosamente. Metadatos EXIF purgados."
      });
    } catch (err: any) {
      res.status(500).json({ error: "Error procesando imagen", details: err.message });
    }
  });

  // API Route: View Media Resource with Security Rules & Signed URLs
  app.get("/api/media/view/:mediaId", async (req, res) => {
    try {
      const { mediaId } = req.params;
      const viewerUserId = (req.query.viewerUserId as string) || "usr_anonymous";
      const viewerRole = ((req.query.viewerRole as string) || "solo_female") as any;
      const token = req.query.token as string;

      // Si se provee token, verificar firma HMAC primero
      if (token) {
        const tokenCheck = verifySecureMediaToken(token, viewerUserId);
        if (!tokenCheck.valid) {
          return res.status(403).json({ allowed: false, error: tokenCheck.error });
        }
      }

      // Validar políticas de acceso por rol, suscripción y bóveda privada
      const accessCheck = await validateMediaAccess(viewerUserId, viewerRole, mediaId);
      if (!accessCheck.allowed) {
        return res.status(accessCheck.statusCode).json({
          allowed: false,
          statusCode: accessCheck.statusCode,
          error: accessCheck.reason
        });
      }

      // Generar URL firmada con TTL de 60 segundos si el acceso fue concedido
      const signedToken = generateSecureMediaToken(mediaId, viewerUserId, "ip_hash_01", 60);

      res.json({
        allowed: true,
        statusCode: 200,
        mediaId,
        signedUrl: signedToken.signedUrl,
        expiresInSeconds: 60,
        expiresAt: signedToken.expiresAt,
        forensicHash: accessCheck.media?.forensicHash,
        message: accessCheck.reason
      });
    } catch (err: any) {
      res.status(500).json({ error: "Error evaluando permisos de visualización", details: err.message });
    }
  });

  // API Route: Grant Vault Access
  app.post("/api/media/grant-vault-access", async (req, res) => {
    try {
      const { ownerUserId, mediaId, grantedToUserId, ttlHours = 24 } = req.body;
      if (!ownerUserId || !mediaId || !grantedToUserId) {
        return res.status(400).json({ error: "Faltan parámetros obligatorios (`ownerUserId`, `mediaId`, `grantedToUserId`)." });
      }

      const result = await grantVaultAccess(ownerUserId, mediaId, grantedToUserId, ttlHours);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Error concediendo acceso a bóveda", details: err.message });
    }
  });

  // API Route: Run Media Security Test Suite
  app.get("/api/media/run-security-tests", async (req, res) => {
    try {
      const result = await runMediaSecurityTestSuite();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando suite de seguridad multimedia", details: err.message });
    }
  });

  // =========================================================================
  // API BILLING (WOMPI COLOMBIA INTEGRATION)
  // =========================================================================

  // POST /api/billing/create-checkout-session
  app.post("/api/billing/create-checkout-session", async (req, res) => {
    try {
      const { userId = "usr_male_unpaid_11", planId = "monthly_solo_male" } = req.body;
      const session = createWompiCheckoutSession(userId, planId);
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: "Error creando sesión de checkout Wompi", details: err.message });
    }
  });

  // POST /api/billing/wompi-webhook y alias /api/webhooks/wompi
  const wompiWebhookHandler = async (req: express.Request, res: express.Response) => {
    try {
      const result = await processWompiWebhookEvent(req.body, req.headers);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: "Error procesando webhook Wompi", details: err.message });
    }
  };

  app.post("/api/billing/wompi-webhook", wompiWebhookHandler);
  app.post("/api/webhooks/wompi", wompiWebhookHandler);

  // GET /api/billing/subscription-status/:userId
  app.get("/api/billing/subscription-status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const status = await getSubscriptionStatus(userId);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: "Error consultando estado de suscripción", details: err.message });
    }
  });

  // =========================================================================
  // API EPHEMERAL SECURE CHAT & RECIPROCAL VAULT REVEAL (AES-256-GCM E2EE)
  // =========================================================================

  // POST /api/chat/send-message
  app.post("/api/chat/send-message", async (req, res) => {
    try {
      const { conversationId, senderId, senderRole, senderAlias, encryptedPayload, content, type, mediaId, ttlSeconds } = req.body;
      
      const payloadToSave = encryptedPayload || content;

      if (!conversationId || !senderId || !payloadToSave) {
        return res.status(400).json({ error: "Faltan parámetros obligatorios (`conversationId`, `senderId`, `encryptedPayload`)." });
      }

      // Verificación estricta de cifrado AES-256-GCM
      if (!isEncryptedPayload(payloadToSave)) {
        return res.status(400).json({
          success: false,
          error: "UNENCRYPTED_PLAINTEXT_REJECTED",
          message: "Todos los mensajes deben estar cifrados con AES-256-GCM en el cliente. El servidor no acepta texto plano."
        });
      }

      const result = sendEphemeralMessage(
        conversationId,
        senderId,
        senderRole || "solo_female",
        senderAlias || "Usuario",
        payloadToSave,
        type || "text",
        mediaId,
        ttlSeconds || 86400
      );

      if (!result.success) {
        return res.status(403).json(result);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Error enviando mensaje efímero cifrado", details: err.message });
    }
  });

  // GET /api/chat/messages/:conversationId
  app.get("/api/chat/messages/:conversationId", (req, res) => {
    try {
      const { conversationId } = req.params;
      const viewerUserId = (req.query.viewerUserId as string) || "usr_anonymous";
      const messages = getActiveMessages(conversationId, viewerUserId);
      res.json({ conversationId, count: messages.length, messages });
    } catch (err: any) {
      res.status(500).json({ error: "Error obteniendo mensajes efímeros", details: err.message });
    }
  });

  // POST /api/chat/purge-expired (Crypto-Shredding physical purge)
  app.post("/api/chat/purge-expired", (req, res) => {
    try {
      const result = purgeAllExpiredMessages();
      res.json({
        success: true,
        message: "Crypto-Shredding completado. Mensajes expirados eliminados físicamente de la memoria.",
        ...result
      });
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando purga destructiva de mensajes", details: err.message });
    }
  });

  // GET /api/chat/run-security-tests
  app.get("/api/chat/run-security-tests", async (req, res) => {
    try {
      const report = await runCryptoSecurityTestSuite();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando suite de pruebas criptográficas", details: err.message });
    }
  });

  // GET /api/security/audit-headers (Suite de Verificación de Hardening)
  app.get("/api/security/audit-headers", (req, res) => {
    try {
      const requiredHeaders = [
        "content-security-policy",
        "x-frame-options",
        "x-content-type-options",
        "referrer-policy",
        "permissions-policy",
        "cross-origin-opener-policy",
        "x-xss-protection"
      ];

      const headerAuditResults: Record<string, { present: boolean; value: string }> = {};
      let allPresent = true;

      for (const h of requiredHeaders) {
        const val = res.getHeader(h) as string;
        const isPresent = !!val;
        if (!isPresent) allPresent = false;
        headerAuditResults[h] = {
          present: isPresent,
          value: val || "No configurado"
        };
      }

      res.json({
        status: allPresent ? "PASSED_HARDENED" : "AUDIT_WARNING",
        timestamp: new Date().toISOString(),
        allHeadersPresent: allPresent,
        auditedHeadersCount: requiredHeaders.length,
        details: headerAuditResults
      });
    } catch (err: any) {
      res.status(500).json({ error: "Error auditando cabeceras HTTP de seguridad", details: err.message });
    }
  });

  // POST /api/chat/request-reciprocal-vault
  app.post("/api/chat/request-reciprocal-vault", (req, res) => {
    try {
      const { conversationId, grantorUserId, targetUserId } = req.body;
      if (!conversationId || !grantorUserId || !targetUserId) {
        return res.status(400).json({ error: "Parámetros `conversationId`, `grantorUserId` y `targetUserId` requeridos." });
      }

      const vaultStatus = grantReciprocalVaultConsent(conversationId, grantorUserId, targetUserId);
      res.json({ success: true, vaultStatus });
    } catch (err: any) {
      res.status(500).json({ error: "Error procesando consentimiento recíproco", details: err.message });
    }
  });

  // GET /api/chat/reciprocal-vault-status
  app.get("/api/chat/reciprocal-vault-status", (req, res) => {
    try {
      const conversationId = (req.query.conversationId as string) || "conv_cpl_vs_bull_01";
      const userA = (req.query.userA as string) || "usr_male_unpaid_11";
      const userB = (req.query.userB as string) || "cpl_medellin_bi_01";
      const status = getReciprocalVaultStatus(conversationId, userA, userB);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: "Error obteniendo estado de bóveda recíproca", details: err.message });
    }
  });

  // =========================================================================
  // API ASYNC KYC COUPLE VERIFICATION & ANTI-FRAUD (+18 VOLATILE OCR)
  // =========================================================================

  // POST /api/kyc/initiate-partner-invite
  app.post("/api/kyc/initiate-partner-invite", (req, res) => {
    try {
      const { coupleId = "cpl_medellin_bi_01", memberAUserId = "usr_member_a_vip", cedulaNumber = "1018223940", selfieBase64 = "base64_data", customVector } = req.body;
      const result = initiateMemberAVerification(coupleId, memberAUserId, cedulaNumber, selfieBase64, customVector);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Error iniciando verificación de pareja Miembro A", details: err.message });
    }
  });

  // POST /api/kyc/validate-partner
  app.post("/api/kyc/validate-partner", (req, res) => {
    try {
      const { coupleId = "cpl_medellin_bi_01", inviteToken, memberBUserId = "usr_member_b_vip", cedulaNumber = "1020448112", selfieBase64 = "base64_data", customVector } = req.body;
      const result = validateMemberB(coupleId, inviteToken, memberBUserId, cedulaNumber, selfieBase64, customVector);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Error validando co-titularidad de Miembro B", details: err.message });
    }
  });

  // GET /api/kyc/couple-status/:coupleId
  app.get("/api/kyc/couple-status/:coupleId", (req, res) => {
    try {
      const { coupleId } = req.params;
      const status = getCoupleKycStatus(coupleId);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: "Error consultando estado KYC de pareja", details: err.message });
    }
  });

  // GET /api/kyc/run-security-tests
  app.get("/api/kyc/run-security-tests", (req, res) => {
    try {
      const report = runKycAntiFraudTestSuite();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando pruebas anti-fraude KYC", details: err.message });
    }
  });

  // =========================================================================
  // API ZERO-KNOWLEDGE E2EE VAULT KEY CUSTODY & RESTORE
  // =========================================================================

  // POST /api/zk/sync-key-package
  app.post("/api/zk/sync-key-package", async (req, res) => {
    try {
      const { userId, keyPackage } = req.body;
      if (!userId || !keyPackage) {
        return res.status(400).json({ error: "Parámetros `userId` y `keyPackage` obligatorios." });
      }
      const result = await syncKeyPackageToServer(userId, keyPackage);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Error guardando paquete cifrado Zero-Knowledge", details: err.message });
    }
  });

  // GET /api/zk/get-key-package/:userId
  app.get("/api/zk/get-key-package/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const pkg = await getKeyPackageFromServer(userId);
      if (!pkg) {
        return res.status(404).json({ error: "Paquete de custodia no encontrado para este usuario." });
      }
      res.json(pkg);
    } catch (err: any) {
      res.status(500).json({ error: "Error obteniendo paquete cifrado Zero-Knowledge", details: err.message });
    }
  });

  // GET /api/zk/run-security-tests
  app.get("/api/zk/run-security-tests", async (req, res) => {
    try {
      const report = await runZeroKnowledgeTestSuite();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando suite de pruebas Zero-Knowledge", details: err.message });
    }
  });

  // =========================================================================
  // API DENSITY RADAR ENGINE & FREEMIUM CHECKOUT
  // =========================================================================

  // POST /api/density-radar/metrics
  app.post("/api/density-radar/metrics", (req, res) => {
    try {
      const { userZones, userVector5D } = req.body;
      const metrics = getDensityRadarMetrics(userZones, userVector5D);
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: "Error calculando métricas de radar de densidad", details: err.message });
    }
  });

  // POST /api/density-radar/check-access
  app.post("/api/density-radar/check-access", async (req, res) => {
    try {
      const { userId = "usr_male_unpaid_11", targetCandidateId, isSoloMale = true } = req.body;
      const accessStatus = await hasActiveAccessPass(userId, targetCandidateId, isSoloMale);
      res.json(accessStatus);
    } catch (err: any) {
      res.status(500).json({ error: "Error verificando acceso de usuario", details: err.message });
    }
  });

  // POST /api/density-radar/grant-single-pass
  app.post("/api/density-radar/grant-single-pass", (req, res) => {
    try {
      const { userId = "usr_male_unpaid_11", targetCandidateId } = req.body;
      if (!targetCandidateId) {
        return res.status(400).json({ error: "Parámetro `targetCandidateId` requerido." });
      }
      const pass = grantSingleConnectionPass(userId, targetCandidateId);
      res.json({ success: true, pass });
    } catch (err: any) {
      res.status(500).json({ error: "Error otorgando pase de conexión individual", details: err.message });
    }
  });

  // GET /api/density-radar/run-tests
  app.get("/api/density-radar/run-tests", (req, res) => {
    try {
      const report = runDensityRadarTestSuite();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando pruebas unitarias de radar de densidad", details: err.message });
    }
  });

  // API Route: Save profile and vector to Supabase
  app.post("/api/supabase/save-profile", async (req, res) => {
    try {
      const payload = req.body;
      const result = await saveOnboardingProfile(payload);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save profile", details: err.message });
    }
  });

  // API Route: Real-time Hybrid Matching (Vectorial 5D + Discrete Quadrants)
  app.post("/api/matching/find-candidates", async (req, res) => {
    try {
      const {
        queryVector = [0, 0, 0, 0, 0],
        callerVetoes = {},
        userQuadrantId = "bog_poblado_rosa",
        geoScope = "all", // 'sector' | 'city' | 'all'
        matchLimit = 20
      } = req.body;

      // 1. Obtener candidatos vectoriales desde Supabase
      const result = await findVectorCandidates(queryVector, callerVetoes, matchLimit);

      if (!result.candidates) {
        return res.json(result);
      }

      // Asignación determinista de cuadrantes simulada para candidatos de prueba
      const sampleQuadrants = [
        "bog_poblado_rosa",
        "bog_chapinero",
        "bog_usaquen",
        "med_poblado",
        "med_laureles",
        "cal_ciudad_jardin"
      ];

      // 2. Calcular scoring híbrido con zonificación discreta
      const enrichedCandidates = result.candidates.map((cand: any, idx: number) => {
        // Si el candidato no tiene cuadrante, asignarle uno predefinido según su id o índice
        const candQuadrantId =
          cand.quadrantId ||
          (cand.id?.includes("med")
            ? "med_poblado"
            : cand.id?.includes("cal")
            ? "cal_ciudad_jardin"
            : sampleQuadrants[idx % sampleQuadrants.length]);

        const candQuadrantDef = COLOMBIA_QUADRANTS[candQuadrantId] || COLOMBIA_QUADRANTS["bog_poblado_rosa"];
        const hasPassedVeto = !cand.isVetoed;

        const rawVectorScore = cand.affinityScore || cand.matchScore || 85;
        const hybrid = calculateHybridAffinity(rawVectorScore, userQuadrantId, candQuadrantId, hasPassedVeto);

        return {
          ...cand,
          quadrantId: candQuadrantId,
          zoneLabel: candQuadrantDef.zoneLabel,
          cityName: candQuadrantDef.city,
          geoScore: hybrid.geoScore,
          proximityLabel: hybrid.proximityLabel,
          hybridTotalScore: hybrid.totalScore,
          affinityScore: hybrid.totalScore
        };
      });

      // 3. Filtrar según el radio de búsqueda discreto (geoScope)
      const userQDef = COLOMBIA_QUADRANTS[userQuadrantId] || COLOMBIA_QUADRANTS["bog_poblado_rosa"];

      let filtered = enrichedCandidates;
      if (geoScope === "sector") {
        filtered = enrichedCandidates.filter((c: any) => c.quadrantId === userQuadrantId);
      } else if (geoScope === "city") {
        filtered = enrichedCandidates.filter((c: any) => c.cityName === userQDef.city);
      }

      // 4. Ordenar por hybridTotalScore descendente
      filtered.sort((a: any, b: any) => b.hybridTotalScore - a.hybridTotalScore);

      res.json({
        ...result,
        userQuadrantId,
        userZoneLabel: userQDef.zoneLabel,
        geoScopeFilter: geoScope,
        candidatesCount: filtered.length,
        candidates: filtered
      });
    } catch (err: any) {
      res.status(500).json({ error: "Error en cálculo de candidatos híbridos", details: err.message });
    }
  });

  // GET /api/geo/run-security-tests (Suite Anti-Trilateración)
  app.get("/api/geo/run-security-tests", (req, res) => {
    try {
      const report = runAntiTrilaterationTestSuite();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando pruebas anti-trilateración", details: err.message });
    }
  });

  // API Route: Run Supabase End-to-End Integration Tests
  app.get("/api/supabase/test-integration", async (req, res) => {
    try {
      const result = await runSupabaseIntegrationTests();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "Failed integration test execution", details: err.message });
    }
  });

  // API Route: Run the Python Unit Tests file and return raw stdout/stderr
  app.get("/api/compatibility/run-python-tests", (req, res) => {
    const pythonScriptPath = path.join(process.cwd(), "relational_compatibility.py");
    exec(`python3 "${pythonScriptPath}"`, { cwd: process.cwd() }, (error, stdout, stderr) => {
      res.json({
        success: !error,
        stdout: stdout || "",
        stderr: stderr || "",
        error: error ? error.message : null,
      });
    });
  });

  // API Route: Get the complete raw python code
  app.get("/api/compatibility/python-code", (req, res) => {
    try {
      const codePath = path.join(process.cwd(), "relational_compatibility.py");
      const code = fs.readFileSync(codePath, "utf-8");
      res.json({ code });
    } catch (err) {
      res.status(500).json({ error: "Could not read Python file." });
    }
  });

  // API Route: Get the complete Supabase SQL Schema
  app.get("/api/supabase/schema-sql", (req, res) => {
    try {
      const sqlPath = path.join(process.cwd(), "schema_supabase_pgvector.sql");
      const sql = fs.readFileSync(sqlPath, "utf-8");
      res.json({ sql });
    } catch (err) {
      res.status(500).json({ error: "Could not read Supabase SQL schema file." });
    }
  });

  // API Route: Evaluate compatibility using Python script in backend
  app.post("/api/compatibility/evaluate", (req, res) => {
    const payload = req.body;
    const pythonCode = `
import json, sys
import numpy as np
from relational_compatibility import (
    RelationalVector,
    evaluate_relational_compatibility
)

try:
    data = json.loads('''${JSON.stringify(payload).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}''')
    
    p1 = RelationalVector(*data['profile_a_m1'])
    p2 = RelationalVector(*data['profile_a_m2']) if data.get('profile_a_m2') else None
    
    tb1 = RelationalVector(*data['profile_b_m1'])
    tb2 = RelationalVector(*data['profile_b_m2']) if data.get('profile_b_m2') else None
    
    result = evaluate_relational_compatibility(
        profile_a_member_1=p1,
        profile_a_member_2=p2,
        profile_b_member_1=tb1,
        profile_b_member_2=tb2,
        vetoes_a=data.get('vetoes_a', {}),
        practices_b=data.get('practices_b', {}),
        vetoes_b=data.get('vetoes_b', {}),
        practices_a=data.get('practices_a', {}),
        risk_aversion=float(data.get('risk_aversion', 0.65)),
        dimension_weights=data.get('weights', [1.0, 1.0, 1.0, 1.0, 1.0])
    )
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    exec(`python3 -c "${pythonCode.replace(/"/g, '\\"')}"`, (error, stdout) => {
      try {
        const parsed = JSON.parse(stdout.trim());
        res.json(parsed);
      } catch (e) {
        res.status(500).json({ error: "Python execution error", details: stdout || error?.message });
      }
    });
  });

  // GET /api/ws/generate-ticket (Token efímero para WS)
  app.get("/api/ws/generate-ticket", (req, res) => {
    try {
      const userId = (req.query.userId as string) || "usr_anonymous";
      const ticket = generateWSTicket(userId);
      res.json(ticket);
    } catch (err: any) {
      res.status(500).json({ error: "Error generando ticket de WebSocket", details: err.message });
    }
  });

  // GET /api/ws/run-tests (Suite de Pruebas de Latencia y Desconexión WS)
  app.get("/api/ws/run-tests", async (req, res) => {
    try {
      const report = await runWebSocketTestSuite();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: "Error ejecutando pruebas de WebSocket", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  initWebSocketServer(server);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server and WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
