const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const UPLOADS = path.join(DATA, "receipts");

fs.mkdirSync(UPLOADS, { recursive: true });

const DB = path.join(DATA, "db.json");

const SESSION_SECRET =
  process.env.SESSION_SECRET || "goldai-local-session-secret";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "CHANGE_THIS_ADMIN_PASSWORD";

function load() {
  if (!fs.existsSync(DB)) {
    const initial = {
      users: [],
      payments: [],
      signals: [],
      support: []
    };

    fs.writeFileSync(DB, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch {
    return {
      users: [],
      payments: [],
      signals: [],
      support: []
    };
  }
}

let db = load();

function save() {
  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function makeId() {
  return crypto.randomUUID();
}

function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString("hex")
) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return {
    salt,
    hash
  };
}

function checkPassword(password, obj) {
  try {
    const hash = crypto
      .scryptSync(password, obj.salt, 64)
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(obj.hash)
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

function readToken(req) {
  const cookies = req.headers.cookie || "";

  const item = cookies
    .split(";")
    .map(x => x.trim())
    .find(x => x.startsWith("goldai_session="));

  if (!item) return null;

  return decodeURIComponent(item.split("=")[1]);
}

function getSession(req) {
  const token = readToken(req);

  if (!token) return null;

  const [payload, signature] = token.split(".");

  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    );

    return session.exp > Date.now() ? session : null;
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

function requireUser(req, res, next) {
  const session = getSession(req);

  if (!session || session.role !== "user") {
    return res.status(401).json({
      error: "LOGIN_REQUIRED"
    });
  }

  const user = db.users.find(
    x => x.id === session.userId
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

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  dest: UPLOADS,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    cb(
      null,
      /^image\/(png|jpe?g|webp|gif)$/.test(
        file.mimetype
      )
    );
  }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI"
  });
});

app.post("/api/register", (req, res) => {
  const {
    name,
    email,
    password
  } = req.body || {};

  if (
    !name ||
    !email ||
    !password ||
    password.length < 6
  ) {
    return res.status(400).json({
      error:
        "Enter name, valid email and password (6+ characters)."
    });
  }

  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  if (
    db.users.some(
      user => user.email === normalizedEmail
    )
  ) {
    return res.status(409).json({
      error:
        "An account with this email already exists."
    });
  }

  const passwordData = hashPassword(password);

  const user = {
    id: makeId(),
    name: String(name).trim().slice(0, 80),
    email: normalizedEmail,
    password: passwordData,
    approved: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);

  save();

  setSessionCookie(
    res,
    createToken(user.id, "user")
  );

  res.json({
    ok: true,
    user: {
      name: user.name,
      email: user.email,
      approved: user.approved
    }
  });
});

app.post("/api/login", (req, res) => {
  const {
    email,
    password
  } = req.body || {};

  const user = db.users.find(
    x =>
      x.email ===
      String(email || "").trim().toLowerCase()
  );

  if (
    !user ||
    !checkPassword(password || "", user.password)
  ) {
    return res.status(401).json({
      error: "Invalid email or password."
    });
  }

  setSessionCookie(
    res,
    createToken(user.id, "user")
  );

  res.json({
    ok: true,
    user: {
      name: user.name,
      email: user.email,
      approved: user.approved
    }
  });
});

app.post("/api/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    "goldai_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
  );

  res.json({
    ok: true
  });
});

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
    x => x.id === session.userId
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

app.post(
  "/api/payments",
  requireUser,
  upload.single("receipt"),
  (req, res) => {
    const method = req.body.method;

    if (!["hesabpay", "binance"].includes(method)) {
      return res.status(400).json({
        error: "Invalid payment method."
      });
    }

    if (!req.body.reference) {
      return res.status(400).json({
        error: "Payment reference is required."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Receipt image is required."
      });
    }

    const existing = db.payments.find(
      p =>
        p.userId === req.user.id &&
        p.status === "pending"
    );

    if (existing) {
      return res.status(409).json({
        error:
          "You already have a payment waiting for review."
      });
    }

    const payment = {
      id: makeId(),
      userId: req.user.id,
      method,
      amount:
        method === "hesabpay"
          ? "240 AFN"
          : "4 USD / USDT",
      reference: String(req.body.reference)
        .trim()
        .slice(0, 120),
      receipt:
        "/receipts/" +
        path.basename(req.file.path),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    db.payments.push(payment);

    save();

    res.json({
      ok: true
    });
  }
);

app.get(
  "/api/access",
  requireUser,
  (req, res) => {
    const payments = db.payments
      .filter(
        p => p.userId === req.user.id
      )
      .sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );

    const latest = payments[0];

    const approved =
      req.user.approved === true;

    const signals = approved
      ? [...db.signals].sort((a, b) =>
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

app.post(
  "/api/support",
  requireUser,
  (req, res) => {
    const {
      message
    } = req.body || {};

    if (
      !message ||
      String(message).trim().length < 2
    ) {
      return res.status(400).json({
        error: "Message required."
      });
    }

    db.support.push({
      id: makeId(),
      userId: req.user.id,
      message: String(message)
        .trim()
        .slice(0, 2000),
      createdAt: new Date().toISOString()
    });

    save();

    res.json({
      ok: true
    });
  }
);

app.post(
  "/api/admin/login",
  (req, res) => {
    if (
      String(req.body.password || "") !==
      ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error: "Invalid admin password."
      });
    }

    setSessionCookie(
      res,
      createToken("admin", "admin")
    );

    res.json({
      ok: true
    });
  }
);

app.get(
  "/api/admin/data",
  requireAdmin,
  (req, res) => {
    res.json({
      users: db.users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        approved: user.approved,
        createdAt: user.createdAt
      })),

      payments: db.payments.map(payment => ({
        ...payment,
        userEmail:
          db.users.find(
            user =>
              user.id === payment.userId
          )?.email || "Unknown",
        userName:
          db.users.find(
            user =>
              user.id === payment.userId
          )?.name || "Unknown"
      })),

      signals: db.signals,

      support: db.support.map(item => ({
        ...item,
        userEmail:
          db.users.find(
            user =>
              user.id === item.userId
          )?.email || "Unknown"
      }))
    });
  }
);

app.post(
  "/api/admin/payments/:paymentId/approve",
  requireAdmin,
  (req, res) => {
    const payment = db.payments.find(
      x =>
        x.id === req.params.paymentId
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
      x => x.id === payment.userId
    );

    if (user) {
      user.approved = true;
    }

    save();

    res.json({
      ok: true
    });
  }
);

app.post(
  "/api/admin/payments/:paymentId/reject",
  requireAdmin,
  (req, res) => {
    const payment = db.payments.find(
      x =>
        x.id === req.params.paymentId
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
      x => x.id === payment.userId
    );

    if (user) {
      user.approved = false;
    }

    save();

    res.json({
      ok: true
    });
  }
);

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
        error: "Signal body required."
      });
    }

    db.signals.push({
      id: makeId(),
      title: String(
        title || "XAUUSD Signal"
      ).slice(0, 120),
      body: String(body).slice(0, 5000),
      createdAt: new Date().toISOString()
    });

    save();

    res.json({
      ok: true
    });
  }
);

app.delete(
  "/api/admin/signals/:id",
  requireAdmin,
  (req, res) => {
    db.signals = db.signals.filter(
      x => x.id !== req.params.id
    );

    save();

    res.json({
      ok: true
    });
  }
);

module.exports = app;
