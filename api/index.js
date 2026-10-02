const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* =====================================================
   ENVIRONMENT
===================================================== */

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || "";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "goldai-change-this-secret";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  "change-admin-password";

const AI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-6-luna";

const sql = DATABASE_URL
  ? neon(DATABASE_URL)
  : null;

let dbReadyPromise = null;

/* =====================================================
   DATABASE
===================================================== */

async function ensureDatabase() {
  if (!sql) {
    throw new Error(
      "No database connection string was found."
    );
  }

  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      await sql`
        SELECT 1 AS ok
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          approved BOOLEAN DEFAULT FALSE,
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          method TEXT NOT NULL,
          amount NUMERIC,
          reference TEXT,
          receipt_data TEXT,
          receipt_mime TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          reviewed_at TIMESTAMP
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS signals (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS support (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS analyses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          symbol TEXT,
          timeframe TEXT,
          direction TEXT,
          entry TEXT,
          tp1 TEXT,
          tp2 TEXT,
          tp3 TEXT,
          tp4 TEXT,
          tp5 TEXT,
          sl TEXT,
          confidence TEXT,
          analysis TEXT,
          warning TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await sql`
        ALTER TABLE analyses
        ADD COLUMN IF NOT EXISTS signal_probability TEXT
      `;
    })().catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }

  return dbReadyPromise;
}

/* =====================================================
   BASIC ROUTES
===================================================== */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "GoldAI API",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "online"
  });
});

app.get("/api", async (req, res) => {
  if (!sql) {
    return res.status(500).json({
      ok: false,
      database: "missing",
      ai: OPENAI_API_KEY
        ? "configured"
        : "missing"
    });
  }

  try {
    await sql`
      SELECT 1 AS ok
    `;

    res.json({
      ok: true,
      service: "GoldAI API",
      status: "online",
      database: "connected",
      ai: OPENAI_API_KEY
        ? "configured"
        : "missing"
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: "error",
      ai: OPENAI_API_KEY
        ? "configured"
        : "missing",
      error:
        error?.message ||
        "Database connection failed."
    });
  }
});

app.get("/api/health", async (req, res) => {
  if (!sql) {
    return res.status(500).json({
      ok: false,
      database: "missing",
      error:
        "Database connection string is not available."
    });
  }

  try {
    await sql`
      SELECT 1 AS ok
    `;

    res.json({
      ok: true,
      service: "GoldAI API",
      status: "online",
      database: "connected",
      ai: OPENAI_API_KEY
        ? "configured"
        : "missing"
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: "error",
      ai: OPENAI_API_KEY
        ? "configured"
        : "missing",
      error:
        error?.message ||
        "Database connection failed."
    });
  }
});

/* =====================================================
   DATABASE MIDDLEWARE
===================================================== */

app.use(async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error(
      "DATABASE INITIALIZATION ERROR:",
      error
    );

    res.status(500).json({
      error:
        error?.message ||
        "Database initialization failed."
    });
  }
});

/* =====================================================
   PASSWORD
===================================================== */

function hashPassword(password) {
  const salt =
    crypto.randomBytes(16).toString("hex");

  const hash =
    crypto
      .scryptSync(
        password,
        salt,
        64
      )
      .toString("hex");

  return {
    salt,
    hash
  };
}

function checkPassword(password, stored) {
  try {
    const calculated =
      crypto.scryptSync(
        password,
        stored.salt,
        64
      );

    const original =
      Buffer.from(
        stored.hash,
        "hex"
      );

    return (
      calculated.length === original.length &&
      crypto.timingSafeEqual(
        calculated,
        original
      )
    );
  } catch {
    return false;
  }
}

/* =====================================================
   SESSION
===================================================== */

function createToken(userId, role = "user") {
  const payload = {
    userId,
    role,
    exp:
      Date.now() +
      7 *
        24 *
        60 *
        60 *
        1000
  };

  const encoded =
    Buffer
      .from(JSON.stringify(payload))
      .toString("base64url");

  const signature =
    crypto
      .createHmac(
        "sha256",
        SESSION_SECRET
      )
      .update(encoded)
      .digest("base64url");

  return encoded + "." + signature;
}

function getCookieToken(req) {
  const header =
    req.headers.cookie || "";

  const cookies = {};

  header.split(";").forEach((part) => {
    const index = part.indexOf("=");

    if (index === -1) {
      return;
    }

    const key =
      part.slice(0, index).trim();

    const value =
      part.slice(index + 1).trim();

    cookies[key] = value;
  });

  if (!cookies.goldai_session) {
    return null;
  }

  try {
    return decodeURIComponent(
      cookies.goldai_session
    );
  } catch {
    return cookies.goldai_session;
  }
}

function getSession(req) {
  try {
    const token =
      getCookieToken(req);

    if (!token) {
      return null;
    }

    const parts =
      token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [
      encoded,
      providedSignature
    ] = parts;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          SESSION_SECRET
        )
        .update(encoded)
        .digest("base64url");

    const a =
      Buffer.from(
        providedSignature
      );

    const b =
      Buffer.from(
        expectedSignature
      );

    if (
      a.length !== b.length ||
      !crypto.timingSafeEqual(a, b)
    ) {
      return null;
    }

    const payload =
      JSON.parse(
        Buffer
          .from(
            encoded,
            "base64url"
          )
          .toString("utf8")
      );

    if (
      !payload.exp ||
      Date.now() > payload.exp
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function setSessionCookie(req, res, token) {
  const secure =
    (
      req.headers["x-forwarded-proto"] || ""
    ) === "https"
      ? "; Secure"
      : "";

  res.setHeader(
    "Set-Cookie",
    "goldai_session=" +
      encodeURIComponent(token) +
      "; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800" +
      secure
  );
}

function clearSessionCookie(req, res) {
  const secure =
    (
      req.headers["x-forwarded-proto"] || ""
    ) === "https"
      ? "; Secure"
      : "";

  res.setHeader(
    "Set-Cookie",
    "goldai_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" +
      secure
  );
}

function formatUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    approved: Boolean(row.approved),
    emailVerified:
      Boolean(row.email_verified),
    createdAt: row.created_at
  };
}

/* =====================================================
   AUTH MIDDLEWARE
===================================================== */

async function requireUser(
  req,
  res,
  next
) {
  try {
    const session =
      getSession(req);

    if (
      !session ||
      session.role !== "user"
    ) {
      return res.status(401).json({
        error:
          "Not authenticated."
      });
    }

    const rows =
      await sql`
        SELECT *
        FROM users
        WHERE id = ${session.userId}
        LIMIT 1
      `;

    if (!rows.length) {
      return res.status(401).json({
        error:
          "User not found."
      });
    }

    req.user = rows[0];

    next();
  } catch {
    res.status(500).json({
      error:
        "Authentication failed."
    });
  }
}

async function requireApprovedUser(
  req,
  res,
  next
) {
  try {
    const session =
      getSession(req);

    if (
      !session ||
      session.role !== "user"
    ) {
      return res.status(401).json({
        error:
          "Not authenticated."
      });
    }

    const rows =
      await sql`
        SELECT *
        FROM users
        WHERE id = ${session.userId}
        LIMIT 1
      `;

    if (!rows.length) {
      return res.status(401).json({
        error:
          "User not found."
      });
    }

    req.user = rows[0];

    if (!req.user.approved) {
      return res.status(403).json({
        error:
          "Payment approval is required before using this feature."
      });
    }

    next();
  } catch {
    res.status(500).json({
      error:
        "Access verification failed."
    });
  }
}

function requireAdmin(
  req,
  res,
  next
) {
  const session =
    getSession(req);

  if (
    !session ||
    session.role !== "admin"
  ) {
    return res.status(401).json({
      error:
        "Admin authentication required."
    });
  }

  next();
}

/* =====================================================
   UPLOAD
===================================================== */

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        5 * 1024 * 1024
    },

    fileFilter:
      (req, file, cb) => {
        const allowed = [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif"
        ];

        if (
          !allowed.includes(
            file.mimetype
          )
        ) {
          return cb(
            new Error(
              "Only PNG, JPG, JPEG, WEBP and GIF images are allowed."
            )
          );
        }

        cb(null, true);
      }
  });

/* =====================================================
   USERS ID HELPER
   FIXES:
   null value in column "id"
   of relation "users"
===================================================== */

async function getNextUserId() {
  const info =
    await sql`
      SELECT
        data_type,
        udt_name,
        column_default,
        is_identity
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'id'
      LIMIT 1
    `;

  if (!info.length) {
    throw new Error(
      "The users.id column was not found."
    );
  }

  const dataType =
    String(
      info[0].data_type || ""
    ).toLowerCase();

  const udtName =
    String(
      info[0].udt_name || ""
    ).toLowerCase();

  const hasDefault =
    Boolean(
      info[0].column_default
    );

  const isIdentity =
    info[0].is_identity === "YES";

  if (
    hasDefault ||
    isIdentity
  ) {
    return null;
  }

  if (
    dataType === "uuid" ||
    udtName === "uuid" ||
    dataType === "text" ||
    dataType === "character varying" ||
    dataType === "character"
  ) {
    return crypto.randomUUID();
  }

  if (
    dataType === "integer" ||
    dataType === "bigint" ||
    dataType === "smallint"
  ) {
    const rows =
      await sql`
        SELECT
          MAX(id) AS max_id
        FROM users
      `;

    const raw =
      rows[0]?.max_id;

    const maxId =
      raw === null ||
      raw === undefined ||
      raw === ""
        ? 0
        : Number(raw);

    if (!Number.isFinite(maxId)) {
      throw new Error(
        "Could not determine the next users.id."
      );
    }

    return Math.floor(maxId) + 1;
  }

  throw new Error(
    "Unsupported users.id type: " +
    dataType
  );
}

/* =====================================================
   REGISTER
===================================================== */

app.post(
  "/api/register",
  async (req, res) => {
    try {
      const name =
        String(
          req.body?.name || ""
        ).trim();

      const email =
        String(
          req.body?.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body?.password || ""
        );

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Name, email and password are required."
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error:
            "Password must be at least 6 characters."
        });
      }

      const existing =
        await sql`
          SELECT id
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;

      if (existing.length) {
        return res.status(409).json({
          error:
            "An account with this email already exists."
        });
      }

      const passwordData =
        hashPassword(password);

      /*
       * IMPORTANT:
       *
       * Existing users.id has no DEFAULT.
       * Therefore we inspect the actual database
       * column before inserting.
       */
      const generatedUserId =
        await getNextUserId();

      let rows;

      if (
        generatedUserId === null
      ) {
        /*
         * PostgreSQL already generates the ID.
         */
        rows =
          await sql`
            INSERT INTO users (
              name,
              email,
              password_salt,
              password_hash,
              approved,
              email_verified
            )
            VALUES (
              ${name},
              ${email},
              ${passwordData.salt},
              ${passwordData.hash},
              FALSE,
              FALSE
            )
            RETURNING *
          `;
      } else {
        /*
         * Existing legacy database:
         * explicitly provide users.id.
         */
        rows =
          await sql`
            INSERT INTO users (
              id,
              name,
              email,
              password_salt,
              password_hash,
              approved,
              email_verified
            )
            VALUES (
              ${generatedUserId},
              ${name},
              ${email},
              ${passwordData.salt},
              ${passwordData.hash},
              FALSE,
              FALSE
            )
            RETURNING *
          `;
      }

      if (!rows.length) {
        throw new Error(
          "User account could not be created."
        );
      }

      setSessionCookie(
        req,
        res,
        createToken(
          rows[0].id,
          "user"
        )
      );

      res.json({
        ok: true,
        loggedIn: true,
        user:
          formatUser(
            rows[0]
          )
      });
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      if (
        String(
          error?.message || ""
        ).includes(
          "duplicate key"
        )
      ) {
        return res.status(409).json({
          error:
            "An account with this email already exists."
        });
      }

      res.status(500).json({
        error:
          error?.message ||
          "Registration failed."
      });
    }
  }
);

/* =====================================================
   LOGIN
===================================================== */

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const email =
        String(
          req.body?.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body?.password || ""
        );

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Email and password are required."
        });
      }

      const rows =
        await sql`
          SELECT *
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;

      if (!rows.length) {
        return res.status(401).json({
          error:
            "Invalid email or password."
        });
      }

      const user =
        rows[0];

      if (
        !checkPassword(
          password,
          {
            salt:
              user.password_salt,
            hash:
              user.password_hash
          }
        )
      ) {
        return res.status(401).json({
          error:
            "Invalid email or password."
        });
      }

      setSessionCookie(
        req,
        res,
        createToken(
          user.id,
          "user"
        )
      );

      res.json({
        ok: true,
        loggedIn: true,
        user:
          formatUser(user)
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Login failed."
      });
    }
  }
);

/* =====================================================
   LOGOUT
===================================================== */

app.post(
  "/api/logout",
  (req, res) => {
    clearSessionCookie(
      req,
      res
    );

    res.json({
      ok: true,
      loggedIn: false
    });
  }
);

/* =====================================================
   ME
===================================================== */

app.get(
  "/api/me",
  requireUser,
  (req, res) => {
    res.json({
      ok: true,
      loggedIn: true,
      user:
        formatUser(
          req.user
        )
    });
  }
);

/* =====================================================
   ACCESS
===================================================== */

app.get(
  "/api/access",
  requireUser,
  async (req, res) => {
    try {
      const userRows =
        await sql`
          SELECT approved
          FROM users
          WHERE id = ${req.user.id}
          LIMIT 1
        `;

      const approved =
        userRows.length
          ? Boolean(
              userRows[0].approved
            )
          : false;

      const payments =
        await sql`
          SELECT
            id,
            method,
            amount,
            reference,
            status,
            created_at,
            reviewed_at
          FROM payments
          WHERE user_id = ${req.user.id}
          ORDER BY created_at DESC
          LIMIT 20
        `;

      res.json({
        ok: true,
        approved,
        payments
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not check access."
      });
    }
  }
);

/* =====================================================
   PAYMENT
===================================================== */

app.post(
  "/api/payment",
  requireUser,
  upload.single("receipt"),
  async (req, res) => {
    try {
      const method =
        String(
          req.body?.method || ""
        ).trim();

      const reference =
        String(
          req.body?.reference || ""
        ).trim();

      if (
        ![
          "HesabPay",
          "Binance Pay"
        ].includes(method)
      ) {
        return res.status(400).json({
          error:
            "Invalid payment method."
        });
      }

      const amount =
        method === "HesabPay"
          ? 240
          : 4;

      const receiptData =
        req.file
          ? req.file.buffer.toString(
              "base64"
            )
          : null;

      const receiptMime =
        req.file
          ? req.file.mimetype
          : null;

      const rows =
        await sql`
          INSERT INTO payments (
            user_id,
            method,
            amount,
            reference,
            receipt_data,
            receipt_mime,
            status
          )
          VALUES (
            ${req.user.id},
            ${method},
            ${amount},
            ${reference},
            ${receiptData},
            ${receiptMime},
            'pending'
          )
          RETURNING
            id,
            method,
            amount,
            reference,
            status,
            created_at
        `;

      res.json({
        ok: true,
        payment:
          rows[0]
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Payment submission failed."
      });
    }
  }
);

/* =====================================================
   SUPPORT
===================================================== */

app.post(
  "/api/support",
  requireUser,
  async (req, res) => {
    try {
      const message =
        String(
          req.body?.message || ""
        ).trim();

      if (!message) {
        return res.status(400).json({
          error:
            "Message is required."
        });
      }

      const rows =
        await sql`
          INSERT INTO support (
            user_id,
            message
          )
          VALUES (
            ${req.user.id},
            ${message}
          )
          RETURNING *
        `;

      res.json({
        ok: true,
        message:
          rows[0]
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Support message failed."
      });
    }
  }
);

/* =====================================================
   SIGNALS
===================================================== */

app.get(
  "/api/signals",
  requireApprovedUser,
  async (req, res) => {
    try {
      const rows =
        await sql`
          SELECT *
          FROM signals
          ORDER BY created_at DESC
          LIMIT 100
        `;

      res.json({
        ok: true,
        signals:
          rows
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not load signals."
      });
    }
  }
);

/* =====================================================
   TIMEFRAME
===================================================== */

function normalizeTimeframe(value) {
  const v =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    v === "1m" ||
    v === "1"
  ) {
    return "1m";
  }

  if (
    v === "5m" ||
    v === "5"
  ) {
    return "5m";
  }

  if (
    v === "15m" ||
    v === "15"
  ) {
    return "15m";
  }

  return null;
}

/* =====================================================
   AI RESPONSE HELPERS
===================================================== */

function extractResponseText(data) {
  if (!data) {
    return "";
  }

  if (
    typeof data.output_text ===
    "string"
  ) {
    return data.output_text.trim();
  }

  if (
    Array.isArray(data.output)
  ) {
    let text = "";

    for (
      const item of data.output
    ) {
      if (
        Array.isArray(
          item.content
        )
      ) {
        for (
          const content of item.content
        ) {
          if (
            typeof content.text ===
            "string"
          ) {
            text += content.text;
          }
        }
      }
    }

    return text.trim();
  }

  return "";
}

function findJsonObject(text) {
  if (!text) {
    return null;
  }

  let cleaned =
    String(text).trim();

  cleaned =
    cleaned
      .replace(
        /^```json/i,
        ""
      )
      .replace(
        /^```/i,
        ""
      )
      .replace(
        /```$/i,
        ""
      )
      .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const first =
    cleaned.indexOf("{");

  const last =
    cleaned.lastIndexOf("}");

  if (
    first === -1 ||
    last === -1 ||
    last <= first
  ) {
    return null;
  }

  try {
    return JSON.parse(
      cleaned.slice(
        first,
        last + 1
      )
    );
  } catch {
    return null;
  }
}

/* =====================================================
   NORMALIZE AI RESULT
===================================================== */

function normalizeAnalysis(
  parsed,
  timeframe
) {
  const rawDirection =
    String(
      parsed?.direction || ""
    ).toUpperCase();

  const rawProbability =
    Number(
      String(
        parsed?.probability ??
        parsed?.signal_probability ??
        ""
      )
        .replace("%", "")
        .trim()
    );

  const probability =
    Number.isFinite(
      rawProbability
    )
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              rawProbability
            )
          )
        )
      : 0;

  let direction =
    [
      "BUY",
      "SELL",
      "WAIT"
    ].includes(
      rawDirection
    )
      ? rawDirection
      : "WAIT";

  if (
    probability < 20
  ) {
    direction = "WAIT";
  }

  const rawConfidence =
    String(
      parsed?.confidence || ""
    );

  const confidence =
    [
      "Low",
      "Medium",
      "High"
    ].includes(
      rawConfidence
    )
      ? rawConfidence
      : "Low";

  return {
    symbol:
      "XAUUSD",

    timeframe,

    direction,

    probability:
      probability + "%",

    signal_probability:
      probability + "%",

    entry:
      parsed?.entry ?? "",

    tp1:
      parsed?.tp1 ?? "",

    tp2:
      parsed?.tp2 ?? "",

    tp3:
      parsed?.tp3 ?? "",

    tp4:
      parsed?.tp4 ?? "",

    tp5:
      parsed?.tp5 ?? "",

    sl:
      parsed?.sl ?? "",

    confidence,

    analysis:
      String(
        parsed?.analysis || ""
      ),

    warning:
      String(
        parsed?.warning || ""
      )
  };
}

/* =====================================================
   ANALYSES ID HELPER
===================================================== */

async function getNextAnalysisId() {
  const info =
    await sql`
      SELECT
        data_type,
        udt_name,
        column_default,
        is_identity
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'analyses'
        AND column_name = 'id'
      LIMIT 1
    `;

  if (!info.length) {
    throw new Error(
      "The analyses.id column was not found."
    );
  }

  const dataType =
    String(
      info[0].data_type || ""
    ).toLowerCase();

  const udtName =
    String(
      info[0].udt_name || ""
    ).toLowerCase();

  const hasDefault =
    Boolean(
      info[0].column_default
    );

  const isIdentity =
    info[0].is_identity === "YES";

  if (
    hasDefault ||
    isIdentity
  ) {
    return null;
  }

  if (
    dataType === "uuid" ||
    udtName === "uuid" ||
    dataType === "text" ||
    dataType === "character varying" ||
    dataType === "character"
  ) {
    return crypto.randomUUID();
  }

  const numeric =
    dataType === "integer" ||
    dataType === "bigint" ||
    dataType === "smallint";

  if (!numeric) {
    throw new Error(
      "Unsupported analyses.id type: " +
      dataType
    );
  }

  const rows =
    await sql`
      SELECT MAX(id) AS max_id
      FROM analyses
    `;

  const raw =
    rows[0]?.max_id;

  const maxId =
    raw === null ||
    raw === undefined ||
    raw === ""
      ? 0
      : Number(raw);

  if (!Number.isFinite(maxId)) {
    throw new Error(
      "Could not determine the next analyses.id."
    );
  }

  return Math.floor(maxId) + 1;
}

/* =====================================================
   OPENAI
===================================================== */

async function requestAIAnalysis(
  imageUrl,
  prompt
) {
  const response =
    await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            "Bearer " +
            OPENAI_API_KEY
        },

        body:
          JSON.stringify({
            model:
              AI_MODEL,

            input: [
              {
                role:
                  "user",

                content: [
                  {
                    type:
                      "input_text",

                    text:
                      prompt
                  },

                  {
                    type:
                      "input_image",

                    image_url:
                      imageUrl,

                    detail:
                      "high"
                  }
                ]
              }
            ]
          })
      }
    );

  const raw =
    await response.text();

  let data;

  try {
    data =
      JSON.parse(raw);
  } catch {
    data = {
      raw
    };
  }

  return {
    response,
    data
  };
}

/* =====================================================
   ANALYZE CHART
===================================================== */

app.post(
  "/api/analyze-chart",
  requireApprovedUser,
  upload.single("chart"),
  async (req, res) => {
    try {
      if (!OPENAI_API_KEY) {
        return res.status(500).json({
          error:
            "OPENAI_API_KEY is not configured."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error:
            "Chart image is required."
        });
      }

      const timeframe =
        normalizeTimeframe(
          req.body?.timeframe
        );

      if (!timeframe) {
        return res.status(400).json({
          error:
            "Please select 1m, 5m or 15m timeframe."
        });
      }

      const language =
        [
          "fa",
          "en",
          "ar"
        ].includes(
          req.body?.language
        )
          ? req.body.language
          : "fa";

      const languageName =
        language === "fa"
          ? "Persian (Dari)"
          : language === "ar"
            ? "Arabic"
            : "English";

      const imageUrl =
        "data:" +
        req.file.mimetype +
        ";base64," +
        req.file.buffer.toString(
          "base64"
        );

      const prompt = `
You are GoldAI, an XAUUSD technical chart analyzer.

Selected timeframe: ${timeframe}
Interface language: ${languageName}

Analyze ONLY information visible in the uploaded chart.

Study:
- current visible XAUUSD price
- candlestick structure
- trend
- support
- resistance
- market structure
- momentum if visible
- breakout or rejection
- visible indicators
- nearby visible price levels

Do not invent invisible information.
Do not guarantee profit.

IMPORTANT SIGNAL RULE:

1. Return a probability from 0 to 100.
2. If probability is LESS THAN 20, direction MUST be WAIT.
3. If probability is 20 OR HIGHER and there is a real directional setup, return BUY or SELL.
4. Do not use WAIT simply because confidence is Low.
5. Do not invent BUY or SELL if the chart genuinely has no directional evidence.
6. A 20%+ signal is only an analytical estimate and is NOT a guarantee of profit.

Return ONLY valid JSON:

{
  "symbol": "XAUUSD",
  "timeframe": "${timeframe}",
  "direction": "BUY",
  "probability": 35,
  "entry": "0000",
  "tp1": "0000",
  "tp2": "0000",
  "tp3": "0000",
  "tp4": "0000",
  "tp5": "0000",
  "sl": "0000",
  "confidence": "Medium",
  "analysis": "short technical analysis",
  "warning": "short risk warning"
}

direction must be BUY, SELL or WAIT.
probability must be a number from 0 to 100.
confidence must be Low, Medium or High.
timeframe must remain exactly "${timeframe}".

Write analysis and warning in ${languageName}.

Return JSON only.
`;

      let aiResult =
        await requestAIAnalysis(
          imageUrl,
          prompt
        );

      if (
        !aiResult.response.ok
      ) {
        console.error(
          "OPENAI ERROR:",
          aiResult.data
        );

        return res.status(502).json({
          error:
            aiResult.data?.error
              ?.message ||
            "OpenAI analysis failed."
        });
      }

      let responseText =
        extractResponseText(
          aiResult.data
        );

      if (!responseText) {
        const retryPrompt = `
Analyze this XAUUSD chart.

Selected timeframe: ${timeframe}

Return ONLY valid JSON:

{
  "symbol": "XAUUSD",
  "timeframe": "${timeframe}",
  "direction": "WAIT",
  "probability": 0,
  "entry": "",
  "tp1": "",
  "tp2": "",
  "tp3": "",
  "tp4": "",
  "tp5": "",
  "sl": "",
  "confidence": "Low",
  "analysis": "",
  "warning": ""
}

Use only visible chart information.

Probability must be 0 to 100.

If probability is below 20:
direction = WAIT.

If probability is 20 or higher and there is a real directional setup:
direction = BUY or SELL.

Do not invent a direction.
Do not guarantee profit.

Write analysis and warning in ${languageName}.

Return JSON only.
`;

        aiResult =
          await requestAIAnalysis(
            imageUrl,
            retryPrompt
          );

        if (
          !aiResult.response.ok
        ) {
          return res.status(502).json({
            error:
              aiResult.data?.error
                ?.message ||
              "OpenAI retry failed."
          });
        }

        responseText =
          extractResponseText(
            aiResult.data
          );
      }

      if (!responseText) {
        return res.status(502).json({
          error:
            "AI returned no readable analysis. Please try again."
        });
      }

      const parsed =
        findJsonObject(
          responseText
        );

      if (
        !parsed ||
        typeof parsed !== "object"
      ) {
        console.error(
          "AI JSON ERROR:",
          responseText
        );

        return res.status(502).json({
          error:
            "AI returned an unreadable analysis. Please try again."
        });
      }

      const result =
        normalizeAnalysis(
          parsed,
          timeframe
        );

      const generatedAnalysisId =
        await getNextAnalysisId();

      let saved;

      if (
        generatedAnalysisId === null
      ) {
        saved =
          await sql`
            INSERT INTO analyses (
              user_id,
              symbol,
              timeframe,
              direction,
              signal_probability,
              entry,
              tp1,
              tp2,
              tp3,
              tp4,
              tp5,
              sl,
              confidence,
              analysis,
              warning
            )
            VALUES (
              ${req.user.id},
              ${result.symbol},
              ${result.timeframe},
              ${result.direction},
              ${result.signal_probability},
              ${String(result.entry)},
              ${String(result.tp1)},
              ${String(result.tp2)},
              ${String(result.tp3)},
              ${String(result.tp4)},
              ${String(result.tp5)},
              ${String(result.sl)},
              ${result.confidence},
              ${result.analysis},
              ${result.warning}
            )
            RETURNING *
          `;
      } else {
        saved =
          await sql`
            INSERT INTO analyses (
              id,
              user_id,
              symbol,
              timeframe,
              direction,
              signal_probability,
              entry,
              tp1,
              tp2,
              tp3,
              tp4,
              tp5,
              sl,
              confidence,
              analysis,
              warning
            )
            VALUES (
              ${generatedAnalysisId},
              ${req.user.id},
              ${result.symbol},
              ${result.timeframe},
              ${result.direction},
              ${result.signal_probability},
              ${String(result.entry)},
              ${String(result.tp1)},
              ${String(result.tp2)},
              ${String(result.tp3)},
              ${String(result.tp4)},
              ${String(result.tp5)},
              ${String(result.sl)},
              ${result.confidence},
              ${result.analysis},
              ${result.warning}
            )
            RETURNING *
          `;
      }

      res.json({
        ok: true,
        analysis: result,
        saved: saved[0]
      });
    } catch (error) {
      console.error(
        "ANALYZE ERROR:",
        error
      );

      res.status(500).json({
        error:
          error?.message ||
          "Chart analysis failed."
      });
    }
  }
);

/* =====================================================
   ANALYSIS HISTORY
===================================================== */

app.get(
  "/api/analyses",
  requireApprovedUser,
  async (req, res) => {
    try {
      const rows =
        await sql`
          SELECT *
          FROM analyses
          WHERE user_id = ${req.user.id}
          ORDER BY created_at DESC
          LIMIT 100
        `;

      res.json({
        ok: true,
        analyses:
          rows
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not load analysis history."
      });
    }
  }
);

/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post(
  "/api/admin/login",
  (req, res) => {
    const password =
      String(
        req.body?.password || ""
      );

    if (
      !password ||
      password !==
        ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error:
          "Invalid admin password."
      });
    }

    setSessionCookie(
      req,
      res,
      createToken(
        "admin",
        "admin"
      )
    );

    res.json({
      ok: true,
      loggedIn: true,
      role: "admin"
    });
  }
);

/* =====================================================
   ADMIN LOGOUT
===================================================== */

app.post(
  "/api/admin/logout",
  (req, res) => {
    clearSessionCookie(
      req,
      res
    );

    res.json({
      ok: true,
      loggedIn: false
    });
  }
);

/* =====================================================
   ADMIN ME
===================================================== */

app.get(
  "/api/admin/me",
  requireAdmin,
  (req, res) => {
    res.json({
      ok: true,
      loggedIn: true,
      role: "admin"
    });
  }
);

/* =====================================================
   ADMIN DATA
===================================================== */

app.get(
  "/api/admin/data",
  requireAdmin,
  async (req, res) => {
    try {
      const users =
        await sql`
          SELECT
            id,
            name,
            email,
            approved,
            email_verified,
            created_at
          FROM users
          ORDER BY created_at DESC
        `;

      const payments =
        await sql`
          SELECT
            p.id,
            p.user_id,
            p.method,
            p.amount,
            p.reference,
            p.status,
            p.created_at,
            p.reviewed_at,
            u.name,
            u.email
          FROM payments p
          LEFT JOIN users u
            ON u.id = p.user_id
          ORDER BY p.created_at DESC
        `;

      const signals =
        await sql`
          SELECT *
          FROM signals
          ORDER BY created_at DESC
        `;

      const support =
        await sql`
          SELECT
            s.id,
            s.user_id,
            s.message,
            s.created_at,
            u.name,
            u.email
          FROM support s
          LEFT JOIN users u
            ON u.id = s.user_id
          ORDER BY s.created_at DESC
          LIMIT 200
        `;

      res.json({
        ok: true,
        users,
        payments,
        signals,
        support
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not load admin data."
      });
    }
  }
);

/* =====================================================
   ADMIN RECEIPT
===================================================== */

app.get(
  "/api/admin/payment/:id/receipt",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id)
      ) {
        return res.status(400).json({
          error:
            "Invalid payment ID."
        });
      }

      const rows =
        await sql`
          SELECT
            receipt_data,
            receipt_mime
          FROM payments
          WHERE id = ${id}
          LIMIT 1
        `;

      if (!rows.length) {
        return res.status(404).json({
          error:
            "Payment not found."
        });
      }

      if (
        !rows[0].receipt_data
      ) {
        return res.status(404).json({
          error:
            "Receipt not found."
        });
      }

      res.setHeader(
        "Content-Type",
        rows[0].receipt_mime ||
          "image/jpeg"
      );

      res.send(
        Buffer.from(
          rows[0].receipt_data,
          "base64"
        )
      );
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not load receipt."
      });
    }
  }
);

/* =====================================================
   ADMIN APPROVE PAYMENT
===================================================== */

app.post(
  "/api/admin/payment/:id/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id)
      ) {
        return res.status(400).json({
          error:
            "Invalid payment ID."
        });
      }

      const paymentRows =
        await sql`
          SELECT *
          FROM payments
          WHERE id = ${id}
          LIMIT 1
        `;

      if (
        !paymentRows.length
      ) {
        return res.status(404).json({
          error:
            "Payment not found."
        });
      }

      const payment =
        paymentRows[0];

      await sql`
        UPDATE payments
        SET
          status = 'approved',
          reviewed_at = NOW()
        WHERE id = ${id}
      `;

      await sql`
        UPDATE users
        SET approved = TRUE
        WHERE id = ${payment.user_id}
      `;

      const rows =
        await sql`
          SELECT *
          FROM payments
          WHERE id = ${id}
          LIMIT 1
        `;

      res.json({
        ok: true,
        payment:
          rows[0]
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not approve payment."
      });
    }
  }
);

/* =====================================================
   ADMIN REJECT PAYMENT
===================================================== */

app.post(
  "/api/admin/payment/:id/reject",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id)
      ) {
        return res.status(400).json({
          error:
            "Invalid payment ID."
        });
      }

      const rows =
        await sql`
          UPDATE payments
          SET
            status = 'rejected',
            reviewed_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;

      if (!rows.length) {
        return res.status(404).json({
          error:
            "Payment not found."
        });
      }

      res.json({
        ok: true,
        payment:
          rows[0]
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not reject payment."
      });
    }
  }
);

/* =====================================================
   ADMIN USER APPROVAL
===================================================== */

app.post(
  "/api/admin/user/:id/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id)
      ) {
        return res.status(400).json({
          error:
            "Invalid user ID."
        });
      }

      const rows =
        await sql`
          UPDATE users
          SET approved = TRUE
          WHERE id = ${id}
          RETURNING
            id,
            name,
            email,
            approved,
            email_verified,
            created_at
        `;

      if (!rows.length) {
        return res.status(404).json({
          error:
            "User not found."
        });
      }

      res.json({
        ok: true,
        user:
          rows[0]
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not approve user."
      });
    }
  }
);

/* =====================================================
   ADMIN CREATE SIGNAL
===================================================== */

app.post(
  "/api/admin/signals",
  requireAdmin,
  async (req, res) => {
    try {
      const title =
        String(
          req.body?.title || ""
        ).trim();

      const body =
        String(
          req.body?.body || ""
        ).trim();

      if (
        !title ||
        !body
      ) {
        return res.status(400).json({
          error:
            "Title and body are required."
        });
      }

      const rows =
        await sql`
          INSERT INTO signals (
            title,
            body
          )
          VALUES (
            ${title},
            ${body}
          )
          RETURNING *
        `;

      res.json({
        ok: true,
        signal:
          rows[0]
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not create signal."
      });
    }
  }
);

/* =====================================================
   ADMIN DELETE SIGNAL
===================================================== */

app.delete(
  "/api/admin/signals/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id)
      ) {
        return res.status(400).json({
          error:
            "Invalid signal ID."
        });
      }

      await sql`
        DELETE FROM signals
        WHERE id = ${id}
      `;

      res.json({
        ok: true
      });
    } catch (error) {
      res.status(500).json({
        error:
          error?.message ||
          "Could not delete signal."
      });
    }
  }
);

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "API ERROR:",
      error
    );

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          error:
            "File is too large. Maximum size is 5 MB."
        });
      }

      return res.status(400).json({
        error:
          error.message ||
          "Upload error."
      });
    }

    res.status(500).json({
      error:
        error?.message ||
        "Server error."
    });
  }
);

/* =====================================================
   EXPORT
===================================================== */

module.exports = app;
