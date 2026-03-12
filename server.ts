import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";

const app = express();
const httpServer = createServer(app);

async function startServer() {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = parseInt(process.env.PORT || "3000", 10);

  // OBS WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, request) => {
    console.log("OBS WebSocket client connected");

    ws.on("message", (message) => {
      console.log("Received from OBS:", message.toString());
      try {
        const data = JSON.parse(message.toString());
        // Handle OBS messages here
        // For example, broadcasting to socket.io clients:
        // io.emit("obs-message", data);
      } catch (e) {
        console.error("Error parsing OBS message:", e);
      }
    });

    ws.on("close", () => {
      console.log("OBS WebSocket client disconnected");
    });

    ws.send(JSON.stringify({ type: "connection_established", message: "Connected to Generation System" }));
  });

  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : "";

    if (pathname === "/obs") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  // Titler State
  let titlerState = {
    presets: [
      {
        id: "1",
        label: "Zócalo Invitado",
        type: "static",
        name: "NOMBRE DEL INVITADO",
        role: "Cargo o descripción aquí",
        primaryColor: "#10b981",
        secondaryColor: "#18181b",
        textColor: "#ffffff",
        fontFamily: "Inter",
        animationType: "slide",
        position: "bottom-left",
        width: 600,
        height: 180,
        backgroundImage: "",
        crawlSpeed: 10,
      },
      {
        id: "2",
        label: "Tira de Noticias (Crawl)",
        type: "crawl",
        name: "ÚLTIMO MOMENTO: El sistema de titulación ya soporta tiras de noticias en tiempo real con velocidad ajustable... ",
        role: "",
        primaryColor: "#ef4444",
        secondaryColor: "#000000",
        textColor: "#ffffff",
        fontFamily: "Inter",
        animationType: "slide",
        position: "full-bottom",
        width: 1920,
        height: 60,
        backgroundImage: "",
        crawlSpeed: 15,
      },
      {
        id: "3",
        label: "Identificador de Sección",
        type: "section",
        name: "DEPORTES",
        role: "",
        primaryColor: "#3b82f6",
        secondaryColor: "#1e3a8a",
        textColor: "#ffffff",
        fontFamily: "Anton",
        animationType: "scale",
        position: "top-left",
        width: 250,
        height: 50,
        backgroundImage: "",
        crawlSpeed: 10,
      }
    ],
    activePresetId: "1",
    visible: false,
  };

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.emit("titler-update", titlerState);

    socket.on("update-state", (newState) => {
      titlerState = newState;
      io.emit("titler-update", titlerState);
    });

    socket.on("toggle-visibility", (visible) => {
      titlerState.visible = visible;
      io.emit("titler-update", titlerState);
    });

    socket.on("set-active-preset", (id) => {
      titlerState.activePresetId = id;
      io.emit("titler-update", titlerState);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
