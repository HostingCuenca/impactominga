import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleDbTest } from "./routes/db-test";
import { handleRegister, handleLogin, handleGetProfile, verifyToken } from "./routes/auth";
import { getRaffles, getRaffleById, getRafflePackages, getRafflePrizes } from "./routes/raffles";
import { createRaffle, createPackages, createPrizes, updateRaffle, updateRaffleStatus, deleteRaffle, updatePackage, deletePackage, updatePrize, deletePrize, generateTickets, assignWinnersToPrizes } from "./routes/raffles-write";
import { smartCheckout, completeCheckoutWithPassword, completeCheckoutWithLogin, getOrders, getOrderById, updateOrderStatus, updateOrder, deleteOrder, uploadReceipt, uploadReceiptMiddleware, getMyOrders } from "./routes/orders";
import { requestPasswordReset, resetPassword } from "./routes/password-reset";
import { requireAdmin } from "./middleware/requireAdmin";
import { getTickets } from "./routes/tickets";
import { getRevealedPrizes, getMyPrizes } from "./routes/prizes";
import { getUsers, getUserById, updateUser, updateUserStatus, updateUserRole, deleteUser, getUserStats } from "./routes/users";
import { getSettings, updateSetting, createSetting, deleteSetting } from "./routes/settings";
import { getDashboardStats, getRecentActivity, getSalesChart } from "./routes/dashboard";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files (uploads)
  app.use("/uploads", express.static("uploads"));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/db/test", handleDbTest);

  // Auth routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/profile", verifyToken, handleGetProfile);

  // Password reset routes (públicas)
  app.post("/api/auth/forgot-password", requestPasswordReset);
  app.post("/api/auth/reset-password", resetPassword);

  // Raffles routes (GET - públicas)
  app.get("/api/raffles", getRaffles);
  app.get("/api/raffles/:id", getRaffleById);
  app.get("/api/raffles/:id/packages", getRafflePackages);
  app.get("/api/raffles/:id/prizes", getRafflePrizes);

  // Raffles routes (POST - admin only)
  app.post("/api/raffles", verifyToken, requireAdmin, createRaffle);
  app.post("/api/raffles/:id/packages", verifyToken, requireAdmin, createPackages);
  app.post("/api/raffles/:id/prizes", verifyToken, requireAdmin, createPrizes);
  app.post("/api/raffles/:id/generate-tickets", verifyToken, requireAdmin, generateTickets);

  // Raffles routes (PUT, PATCH, DELETE - admin only)
  app.put("/api/raffles/:id", verifyToken, requireAdmin, updateRaffle);
  app.patch("/api/raffles/:id/status", verifyToken, requireAdmin, updateRaffleStatus);
  app.delete("/api/raffles/:id", verifyToken, requireAdmin, deleteRaffle);

  // Packages routes (PUT, DELETE - admin only)
  app.put("/api/raffles/:raffleId/packages/:packageId", verifyToken, requireAdmin, updatePackage);
  app.delete("/api/raffles/:raffleId/packages/:packageId", verifyToken, requireAdmin, deletePackage);

  // Prizes routes (PUT, DELETE - admin only)
  app.put("/api/raffles/:raffleId/prizes/:prizeId", verifyToken, requireAdmin, updatePrize);
  app.delete("/api/raffles/:raffleId/prizes/:prizeId", verifyToken, requireAdmin, deletePrize);

  // Checkout routes (Smart checkout flow)
  app.post("/api/checkout", (req, res, next) => {
    // Middleware opcional: verifica token si existe, pero no lo requiere
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      verifyToken(req, res, (err?: any) => {
        if (!err) next(); else next(); // Continúa aunque falle
      });
    } else {
      next();
    }
  }, smartCheckout);
  app.post("/api/checkout/with-password", completeCheckoutWithPassword); // Usuario nuevo
  app.post("/api/checkout/with-login", completeCheckoutWithLogin); // Usuario existente

  // Orders routes (GET - admin/contadora and customers can see their own)
  app.get("/api/orders/my-orders", verifyToken, getMyOrders);
  app.get("/api/orders", verifyToken, getOrders);
  app.get("/api/orders/:id", verifyToken, getOrderById);

  // Orders routes (POST - upload receipt for customers)
  app.post("/api/orders/:id/upload-receipt", verifyToken, uploadReceiptMiddleware, uploadReceipt);

  // Orders routes (PATCH, PUT, DELETE - admin only)
  app.patch("/api/orders/:id/status", verifyToken, requireAdmin, updateOrderStatus);
  app.put("/api/orders/:id", verifyToken, requireAdmin, updateOrder);
  app.delete("/api/orders/:id", verifyToken, requireAdmin, deleteOrder);

  // Tickets routes (GET - admin/contadora)
  app.get("/api/tickets", verifyToken, requireAdmin, getTickets);

  // Prizes routes
  app.get("/api/raffles/:id/revealed-prizes", getRevealedPrizes); // Público
  app.get("/api/orders/:orderId/my-prizes", verifyToken, getMyPrizes); // Privado

  // Users routes (GET - admin only)
  app.get("/api/users/stats", verifyToken, requireAdmin, getUserStats);
  app.get("/api/users", verifyToken, requireAdmin, getUsers);
  app.get("/api/users/:id", verifyToken, requireAdmin, getUserById);

  // Users routes (PUT, PATCH, DELETE - admin only)
  app.put("/api/users/:id", verifyToken, requireAdmin, updateUser);
  app.patch("/api/users/:id/status", verifyToken, requireAdmin, updateUserStatus);
  app.patch("/api/users/:id/role", verifyToken, requireAdmin, updateUserRole);
  app.delete("/api/users/:id", verifyToken, requireAdmin, deleteUser);

  // Settings routes (GET, PUT, POST, DELETE - admin only)
  app.get("/api/settings", verifyToken, requireAdmin, getSettings);
  app.put("/api/settings/:key", verifyToken, requireAdmin, updateSetting);
  app.post("/api/settings", verifyToken, requireAdmin, createSetting);
  app.delete("/api/settings/:key", verifyToken, requireAdmin, deleteSetting);

  // Dashboard routes (GET - admin/contadora only)
  app.get("/api/dashboard/stats", verifyToken, requireAdmin, getDashboardStats);
  app.get("/api/dashboard/recent-activity", verifyToken, requireAdmin, getRecentActivity);
  app.get("/api/dashboard/sales-chart", verifyToken, requireAdmin, getSalesChart);

  return app;
}
