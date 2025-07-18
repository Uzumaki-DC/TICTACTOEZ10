// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
var MemStorage = class {
  users;
  gameSessions;
  currentUserId;
  currentSessionId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.gameSessions = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createGameSession(insertSession) {
    try {
      console.log("MemStorage createGameSession called with:", insertSession);
      const id = this.currentSessionId++;
      const now = /* @__PURE__ */ new Date();
      const session = {
        id,
        sessionCode: insertSession.sessionCode,
        hostPlayerId: insertSession.hostPlayerId,
        guestPlayerId: insertSession.guestPlayerId || null,
        gameBoard: insertSession.gameBoard || "null,null,null,null,null,null,null,null,null",
        currentPlayer: insertSession.currentPlayer || "X",
        gameStatus: insertSession.gameStatus || "waiting",
        winner: insertSession.winner || null,
        hostScore: insertSession.hostScore || 0,
        guestScore: insertSession.guestScore || 0,
        draws: insertSession.draws || 0,
        createdAt: now,
        updatedAt: now
      };
      console.log("Created session object:", session);
      this.gameSessions.set(insertSession.sessionCode, session);
      console.log("Session stored in memory");
      return session;
    } catch (error) {
      console.error("Error in createGameSession:", error);
      throw error;
    }
  }
  async getGameSession(sessionCode) {
    return this.gameSessions.get(sessionCode);
  }
  async updateGameSession(sessionCode, updates) {
    const session = this.gameSessions.get(sessionCode);
    if (!session) return void 0;
    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.gameSessions.set(sessionCode, updatedSession);
    return updatedSession;
  }
  async deleteGameSession(sessionCode) {
    return this.gameSessions.delete(sessionCode);
  }
  async getActiveSessions() {
    return Array.from(this.gameSessions.values()).filter(
      (session) => session.gameStatus !== "finished"
    );
  }
};
var storage = new MemStorage();

// server/routes.ts
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  if (process.env.NODE_ENV === "development") {
    let broadcastToSession2 = function(sessionCode, message, excludeClient) {
      const clients = connections.get(sessionCode) || [];
      clients.forEach((client) => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    };
    var broadcastToSession = broadcastToSession2;
    console.log("Setting up WebSocket server for development...");
    const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
    const connections = /* @__PURE__ */ new Map();
    wss.on("connection", (ws) => {
      console.log("New WebSocket connection");
      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());
          switch (message.type) {
            case "join_session":
              const { sessionCode, playerId } = message;
              ws.sessionCode = sessionCode;
              ws.playerId = playerId;
              if (!connections.has(sessionCode)) {
                connections.set(sessionCode, []);
              }
              connections.get(sessionCode)?.push(ws);
              const session = await storage.getGameSession(sessionCode);
              if (session) {
                ws.send(JSON.stringify({
                  type: "session_state",
                  session
                }));
                broadcastToSession2(sessionCode, {
                  type: "player_joined",
                  playerId
                }, ws);
              }
              break;
            case "make_move":
              const { position } = message;
              const currentSession = await storage.getGameSession(ws.sessionCode);
              if (currentSession) {
                const gameBoard = currentSession.gameBoard.split(",");
                if (gameBoard[position] === "null") {
                  gameBoard[position] = currentSession.currentPlayer;
                  const winner = checkWinner(gameBoard);
                  const isDraw = !winner && gameBoard.every((cell) => cell !== "null");
                  const updates = {
                    gameBoard: gameBoard.join(","),
                    currentPlayer: currentSession.currentPlayer === "X" ? "O" : "X"
                  };
                  if (winner || isDraw) {
                    updates.gameStatus = "finished";
                    updates.winner = winner || "draw";
                    if (winner === "X") {
                      updates.hostScore = currentSession.hostScore + 1;
                    } else if (winner === "O") {
                      updates.guestScore = currentSession.guestScore + 1;
                    } else {
                      updates.draws = currentSession.draws + 1;
                    }
                  }
                  const updatedSession = await storage.updateGameSession(ws.sessionCode, updates);
                  broadcastToSession2(ws.sessionCode, {
                    type: "game_update",
                    session: updatedSession
                  });
                }
              }
              break;
            case "reset_game":
              const resetSession = await storage.updateGameSession(ws.sessionCode, {
                gameBoard: "null,null,null,null,null,null,null,null,null",
                currentPlayer: "X",
                gameStatus: "playing",
                winner: null
              });
              broadcastToSession2(ws.sessionCode, {
                type: "game_update",
                session: resetSession
              });
              break;
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });
      ws.on("close", () => {
        if (ws.sessionCode) {
          const clients = connections.get(ws.sessionCode);
          if (clients) {
            const index = clients.indexOf(ws);
            if (index !== -1) {
              clients.splice(index, 1);
            }
            broadcastToSession2(ws.sessionCode, {
              type: "player_left",
              playerId: ws.playerId
            }, ws);
          }
        }
      });
    });
  } else {
    console.log("WebSocket disabled in production environment");
  }
  function checkWinner(board) {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      // columns
      [0, 4, 8],
      [2, 4, 6]
      // diagonals
    ];
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] !== "null" && board[a] === board[b] && board[b] === board[c]) {
        return board[a];
      }
    }
    return null;
  }
  function generateSessionCode() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    result += "-";
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/sessions", async (req, res) => {
    try {
      console.log("Creating session with body:", req.body);
      const { hostPlayerId } = req.body;
      if (!hostPlayerId) {
        console.error("No hostPlayerId provided");
        return res.status(400).json({ message: "Host player ID is required" });
      }
      const sessionCode = generateSessionCode();
      console.log("Generated session code:", sessionCode);
      const sessionData = {
        sessionCode,
        hostPlayerId,
        gameBoard: "null,null,null,null,null,null,null,null,null",
        currentPlayer: "X",
        gameStatus: "waiting",
        hostScore: 0,
        guestScore: 0,
        draws: 0
      };
      console.log("Session data to create:", sessionData);
      const session = await storage.createGameSession(sessionData);
      console.log("Created session:", session);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        message: "Failed to create session",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.post("/api/sessions/:sessionCode/join", async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const { guestPlayerId } = req.body;
      if (!guestPlayerId) {
        return res.status(400).json({ message: "Guest player ID is required" });
      }
      const session = await storage.getGameSession(sessionCode);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (session.guestPlayerId) {
        return res.status(400).json({ message: "Session is full" });
      }
      const currentSession = await storage.getGameSession(sessionCode);
      if (currentSession) {
        currentSession.guestPlayerId = guestPlayerId;
        currentSession.gameStatus = "playing";
        const updatedSession = await storage.updateGameSession(sessionCode, currentSession);
        res.json(updatedSession);
      } else {
        return res.status(404).json({ message: "Session not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to join session" });
    }
  });
  app2.get("/api/sessions/:sessionCode", async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const session = await storage.getGameSession(sessionCode);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({ message: "Failed to get session" });
    }
  });
  app2.post("/api/sessions/:sessionCode/move", async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const { position, playerId } = req.body;
      const session = await storage.getGameSession(sessionCode);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      const isHost = session.hostPlayerId === playerId;
      const isGuest = session.guestPlayerId === playerId;
      if (!isHost && !isGuest) {
        return res.status(403).json({ message: "Not a player in this session" });
      }
      const expectedPlayer = session.currentPlayer;
      const actualPlayer = isHost ? "X" : "O";
      if (expectedPlayer !== actualPlayer) {
        return res.status(400).json({ message: "Not your turn" });
      }
      const gameBoard = session.gameBoard.split(",");
      if (gameBoard[position] !== "null") {
        return res.status(400).json({ message: "Position already taken" });
      }
      gameBoard[position] = expectedPlayer;
      const winner = checkWinner(gameBoard);
      const isDraw = !winner && gameBoard.every((cell) => cell !== "null");
      const updates = {
        gameBoard: gameBoard.join(","),
        currentPlayer: expectedPlayer === "X" ? "O" : "X"
      };
      if (winner || isDraw) {
        updates.gameStatus = "finished";
        updates.winner = winner || "draw";
        if (winner === "X") {
          updates.hostScore = session.hostScore + 1;
        } else if (winner === "O") {
          updates.guestScore = session.guestScore + 1;
        } else {
          updates.draws = session.draws + 1;
        }
      }
      const updatedSession = await storage.updateGameSession(sessionCode, updates);
      res.json(updatedSession);
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });
  app2.post("/api/sessions/:sessionCode/reset", async (req, res) => {
    try {
      const { sessionCode } = req.params;
      const resetSession = await storage.updateGameSession(sessionCode, {
        gameBoard: "null,null,null,null,null,null,null,null,null",
        currentPlayer: "X",
        gameStatus: "playing",
        winner: null
      });
      if (!resetSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(resetSession);
    } catch (error) {
      console.error("Error resetting game:", error);
      res.status(500).json({ message: "Failed to reset game" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
