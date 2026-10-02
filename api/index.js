const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* =========================
   BASIC SETTINGS
========================= */

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = "/tmp/goldai";
const UPLOAD_DIR = path.join(DATA_DIR, "receipts");
const DB_FILE = path.join(DATA_DIR, "db.json");

try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.error("Directory error:", err);
}

/* =========================
   DATABASE
========================= */

function createEmptyDB() {
  return {
    users: [],
    payments: [],
    signals: [],
    support: []
  };
}

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const db = createEmptyDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      return db;
    }

    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (err) {
    console.error("DB load error:", err);
    return createEmptyDB();
  }
}

let db = loadDB();

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return true;
  } catch (err) {
    console.error("DB save error:", err);
    return false;
  }
}

/* =========================
   HELPERS
========================= */

function createId() {
  return crypto.randomUUID();
}

const SESSION_SECRET =
  process.env.SESSION_SECRET || "goldai-change-this-secret";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "change-admin-password";

function hashPassword(password, salt) {
  const realSalt =
    salt || crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, realSalt, 64)
    .toString("hex");

  return {
    salt: realSalt,
    hash
  };
}

function checkPassword(password, stored) {
  try {
    const hash = crypto
      .scryptSync(password, stored.salt, 64)
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(stored.hash)
    );
  } catch {
    return false;
  }
}

function createToken(userId, role) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function getCookieToken(req) {
  const cookieHeader = req.headers.cookie || "";

  const cookie = cookieHeader
    .split(";")
    .map(x => x.trim())
    .find(x => x.startsWith("goldai_session="));

  if (!cookie) return null;

  return decodeURIComponent(
    cookie.substring("goldai_session=".length)
  );
}

function getSession(req) {
  const token = getCookieToken(req);

  if (!token) return null;

  const parts = token.split(".");

  if (parts.length !== 2) return null;

  const payload = parts[0];
  const signature = parts[1];

  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    if (!data.exp || data.exp < Date.now()) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `goldai_session=${encodeURIComponent(
      token
    )}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
  );
}

/* =========================
   AUTH MIDDLEWARE
========================= */

function requireUser(req, res, next) {
  const session = getSession(req);

  if (!session || session.role !== "user") {
    return res.status(401).json({
      error: "LOGIN_REQUIRED"
    });
  }

  const user = db.users.find(
    u => u.id === session.userId
  );

  if (!user) {
    return res.status(401).json({
      error: "LOGIN_REQUIRED"
    });
  }

  req.user = user;

  next();
}

function requireAdmin(req, res, next) {
  const session = getSession(req);

  if (!session || session.role !== "admin") {
    return res.status(401).json({
      error: "ADMIN_REQUIRED"
    });
  }

  next();
}

/* =========================
   UPLOAD
========================= */

const upload = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed =
      /^image\/(png|jpe?g|webp|gif)$/i.test(
        file.mimetype
      );

    cb(null, allowed);
  }
});

/* =========================
   HEALTH / TEST
========================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online"
  });
});

app.get("/api", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online"
  });
});

/* =========================
   REGISTER
========================= */

app.post("/api/register", (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required."
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters."
      });
    }

    const cleanEmail =
      String(email).trim().toLowerCase();

    const existing = db.users.find(
      u => u.email === cleanEmail
    );

    if (existing) {
      return res.status(409).json({
        error:
          "An account with this email already exists."
      });
    }

    const passwordData = hashPassword(
      String(password)
    );

    const user = {
      id: createId(),
      name: String(name)
        .trim()
        .slice(0, 80),

      email: cleanEmail,

      password: passwordData,

      approved: false,

      createdAt:
        new Date().toISOString()
    };

    db.users.push(user);

    if (!saveDB()) {
      return res.status(500).json({
        error: "Could not save account."
      });
    }

    setSessionCookie(
      res,
      createToken(user.id, "user")
    );

    return res.json({
      ok: true,
      user: {
        name: user.name,
        email: user.email,
        approved: user.approved
      }
    });

  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      error: "Registration failed."
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {
  try {
    const {
      email,
      password
    } = req.body || {};

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const user = db.users.find(
      u => u.email === cleanEmail
    );

    if (
      !user ||
      !checkPassword(
        String(password || ""),
        user.password
      )
    ) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    setSessionCookie(
      res,
      createToken(user.id, "user")
    );

    return res.json({
      ok: true,
      user: {
        name: user.name,
        email: user.email,
        approved: user.approved
      }
    });

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      error: "Login failed."
    });
  }
});

/* =========================
   LOGOUT
========================= */

app.post("/api/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    "goldai_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
  );

  res.json({
    ok: true
  });
});

/* =========================
   CURRENT USER
========================= */

app.get("/api/me", (req, res) => {
  const session = getSession(req);

  if (!session) {
    return res.json({
      loggedIn: false
    });
  }

  if (session.role === "admin") {
    return res.json({
      loggedIn: true,
      role: "admin"
    });
  }

  const user = db.users.find(
    u => u.id === session.userId
  );

  if (!user) {
    return res.json({
      loggedIn: false
    });
  }

  res.json({
    loggedIn: true,
    role: "user",
    user: {
      name: user.name,
      email: user.email,
      approved: user.approved
    }
  });
});

/* =========================
   PAYMENTS
========================= */

app.post(
  "/api/payments",
  requireUser,
  upload.single("receipt"),
  (req, res) => {
    try {
      const method = req.body.method;

      if (
        !["hesabpay", "binance"].includes(
          method
        )
      ) {
        return res.status(400).json({
          error: "Invalid payment method."
        });
      }

      if (!req.body.reference) {
        return res.status(400).json({
          error:
            "Payment reference is required."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error:
            "Receipt image is required."
        });
      }

      const pending = db.payments.find(
        p =>
          p.userId === req.user.id &&
          p.status === "pending"
      );

      if (pending) {
        return res.status(409).json({
          error:
            "You already have a payment waiting for review."
        });
      }

      const payment = {
        id: createId(),

        userId: req.user.id,

        method,

        amount:
          method === "hesabpay"
            ? "240 AFN"
            : "4 USD / USDT",

        reference: String(
          req.body.reference
        )
          .trim()
          .slice(0, 120),

        receipt:
          "/receipts/" +
          path.basename(req.file.path),

        status: "pending",

        createdAt:
          new Date().toISOString()
      };

      db.payments.push(payment);

      saveDB();

      res.json({
        ok: true
      });

    } catch (error) {
      console.error(
        "PAYMENT ERROR:",
        error
      );

      res.status(500).json({
        error: "Payment submission failed."
      });
    }
  }
);

/* =========================
   USER ACCESS
========================= */

app.get(
  "/api/access",
  requireUser,
  (req, res) => {
    const payments =
      db.payments
        .filter(
          p => p.userId === req.user.id
        )
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(
              a.createdAt
            )
        );

    const latest = payments[0];

    const approved =
      req.user.approved === true;

    const signals = approved
      ? [...db.signals].sort(
          (a, b) =>
            b.createdAt.localeCompare(
              a.createdAt
            )
        )
      : [];

    res.json({
      approved,

      paymentStatus:
        latest?.status || "none",

      signals
    });
  }
);

/* =========================
   SUPPORT
========================= */

app.post(
  "/api/support",
  requireUser,
  (req, res) => {
    const message = req.body?.message;

    if (
      !message ||
      String(message).trim().length < 2
    ) {
      return res.status(400).json({
        error: "Message required."
      });
    }

    db.support.push({
      id: createId(),

      userId: req.user.id,

      message: String(message)
        .trim()
        .slice(0, 2000),

      createdAt:
        new Date().toISOString()
    });

    saveDB();

    res.json({
      ok: true
    });
  }
);

/* =========================
   ADMIN LOGIN
========================= */

app.post(
  "/api/admin/login",
  (req, res) => {
    const password =
      String(
        req.body?.password || ""
      );

    if (
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error:
          "Invalid admin password."
      });
    }

    setSessionCookie(
      res,
      createToken(
        "admin",
        "admin"
      )
    );

    res.json({
      ok: true
    });
  }
);

/* =========================
   ADMIN DATA
========================= */

app.get(
  "/api/admin/data",
  requireAdmin,
  (req, res) => {
    res.json({
      users: db.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        approved: u.approved,
        createdAt: u.createdAt
      })),

      payments: db.payments.map(p => ({
        ...p,

        userEmail:
          db.users.find(
            u => u.id === p.userId
          )?.email || "Unknown",

        userName:
          db.users.find(
            u => u.id === p.userId
          )?.name || "Unknown"
      })),

      signals: db.signals,

      support: db.support.map(s => ({
        ...s,

        userEmail:
          db.users.find(
            u => u.id === s.userId
          )?.email || "Unknown"
      }))
    });
  }
);

/* =========================
   ADMIN PAYMENT APPROVE
========================= */

app.post(
  "/api/admin/payments/:paymentId/approve",
  requireAdmin,
  (req, res) => {
    const payment =
      db.payments.find(
        p =>
          p.id ===
          req.params.paymentId
      );

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found."
      });
    }

    payment.status = "approved";

    payment.reviewedAt =
      new Date().toISOString();

    const user = db.users.find(
      u => u.id === payment.userId
    );

    if (user) {
      user.approved = true;
    }

    saveDB();

    res.json({
      ok: true
    });
  }
);

/* =========================
   ADMIN PAYMENT REJECT
========================= */

app.post(
  "/api/admin/payments/:paymentId/reject",
  requireAdmin,
  (req, res) => {
    const payment =
      db.payments.find(
        p =>
          p.id ===
          req.params.paymentId
      );

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found."
      });
    }

    payment.status = "rejected";

    payment.reviewedAt =
      new Date().toISOString();

    const user = db.users.find(
      u => u.id === payment.userId
    );

    if (user) {
      user.approved = false;
    }

    saveDB();

    res.json({
      ok: true
    });
  }
);

/* =========================
   ADMIN SIGNALS
========================= */

app.post(
  "/api/admin/signals",
  requireAdmin,
  (req, res) => {
    const {
      title,
      body
    } = req.body || {};

    if (!body) {
      return res.status(400).json({
        error:
          "Signal body required."
      });
    }

    db.signals.push({
      id: createId(),

      title: String(
        title ||
          "XAUUSD Signal"
      ).slice(0, 120),

      body: String(body)
        .slice(0, 5000),

      createdAt:
        new Date().toISOString()
    });

    saveDB();

    res.json({
      ok: true
    });
  }
);

/* =========================
   DELETE SIGNAL
========================= */

app.delete(
  "/api/admin/signals/:id",
  requireAdmin,
  (req, res) => {
    db.signals =
      db.signals.filter(
        x =>
          x.id !==
          req.params.id
      );

    saveDB();

    res.json({
      ok: true
    });
  }
);

/* =========================
   EXPORT FOR VERCEL
========================= */

module.exports = app;
