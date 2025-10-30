import { Router } from "express";
import { z } from "zod";
import argon2 from "argon2";
import { pool } from "../db/pool.js";
import {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
} from "../utils/jwt.js";
import { sha256, randToken } from "../utils/crypto.js";
import { env } from "../config/env.js";
import { ulid } from "ulid";
import { loginLimiter, authLimiter } from '../middleware/rateLimit.js';


export const auth = Router();

const Register = z.object({
  fullName: z.string().min(2).max(191),
  email: z.string().email().max(191),
  phone: z.string().min(7).max(32).optional(),
  password: z.string().min(8).max(128),
});

const Login = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function setRefreshCookie(res: any, token: string, maxAgeSec: number) {
  res.cookie(env.REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN || undefined, 
    path: "/api/auth",
    maxAge: maxAgeSec * 1000,
  });
}

/** POST /api/auth/register */
auth.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = Register.parse(req.body);
    const hash = await argon2.hash(password, { type: argon2.argon2id });

    const [result] = (await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'user', 'active')`,
      [fullName, email.toLowerCase(), phone ?? null, hash]
    )) as any[];
    const userId = (result as any).insertId.toString();

    // create session
    const sid = ulid();
    const refresh = signRefresh({ sub: userId, sid });
    const refreshHash = sha256(refresh);
    const ua = req.get("user-agent") ?? null;
    const ip = req.ip ?? null;
    const [row] = (await pool.query("SELECT NOW() AS now")) as any[];
    const now = new Date(row[0].now);
    const exp = new Date(
      now.getTime() + Number(env.REFRESH_TOKEN_TTL_SEC) * 1000
    );

    await pool.query(
      `INSERT INTO sessions (id, user_id, refresh_hash, user_agent, ip, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sid, userId, refreshHash, ua, ip, exp]
    );

    setRefreshCookie(res, refresh, Number(env.REFRESH_TOKEN_TTL_SEC));
    const access = signAccess({ sub: userId, role: "user" });
    res.status(201).json({
      accessToken: access,
      user: { id: userId, fullName, email, phone, role: "user" },
    });
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    return next(e);
  }
});

/** POST /api/auth/login */
auth.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = Login.parse(req.body);
    const [rows] = (await pool.query(
      `SELECT id, full_name, email, phone, password_hash, role, status FROM users WHERE email = ? LIMIT 1`,
      [email.toLowerCase()]
    )) as any[];
    const u = (rows as any)[0];
    if (!u) return res.status(401).json({ error: "Invalid credentials" });
    if (u.status !== "active")
      return res.status(403).json({ error: "Account disabled" });

    const ok = await argon2.verify(u.password_hash, password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const sid = ulid();
    const refresh = signRefresh({ sub: String(u.id), sid });
    const refreshHash = sha256(refresh);
    const ua = req.get("user-agent") ?? null;
    const ip = req.ip ?? null;
    const [row] = (await pool.query("SELECT NOW() AS now")) as any[];
    const now = new Date(row[0].now);
    const exp = new Date(
      now.getTime() + Number(env.REFRESH_TOKEN_TTL_SEC) * 1000
    );

    await pool.query(
      `INSERT INTO sessions (id, user_id, refresh_hash, user_agent, ip, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sid, String(u.id), refreshHash, ua, ip, exp]
    );

    setRefreshCookie(res, refresh, Number(env.REFRESH_TOKEN_TTL_SEC));
    const access = signAccess({ sub: String(u.id), role: u.role });
    res.json({
      accessToken: access,
      user: {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/refresh */
auth.post("/refresh", authLimiter, async (req, res, next) => {
  try {
    const token = req.cookies?.[env.REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "No refresh" });

    const payload = verifyRefresh(token);
    const sid = payload.sid;
    const userId = payload.sub;

    const [rows] = (await pool.query(
      `SELECT refresh_hash, revoked_at, expires_at FROM sessions WHERE id = ? AND user_id = ? LIMIT 1`,
      [sid, userId]
    )) as any[];
    const s = (rows as any)[0];
    if (!s || s.revoked_at || new Date(s.expires_at) < new Date()) {
      return res.status(401).json({ error: "Invalid session" });
    }
    // reuse detection
    if (sha256(token) !== s.refresh_hash) {
      await pool.query(`UPDATE sessions SET revoked_at = NOW() WHERE id = ?`, [
        sid,
      ]);
      return res.status(401).json({ error: "Token reuse detected" });
    }
    // rotate
    const newSid = ulid();
    const newRefresh = signRefresh({ sub: userId, sid: newSid });
    const newHash = sha256(newRefresh);
    await pool.query(
      "UPDATE sessions SET revoked_at = NOW(), replaced_by = ? WHERE id = ?",
      [newSid, sid]
    );
    const [row] = (await pool.query("SELECT NOW() AS now")) as any[];
    const now = new Date(row[0].now);
    const exp = new Date(
      now.getTime() + Number(env.REFRESH_TOKEN_TTL_SEC) * 1000
    );
    await pool.query(
      `INSERT INTO sessions (id, user_id, refresh_hash, user_agent, ip, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newSid,
        userId,
        newHash,
        req.get("user-agent") ?? null,
        req.ip ?? null,
        exp,
      ]
    );

    setRefreshCookie(res, newRefresh, Number(env.REFRESH_TOKEN_TTL_SEC));
    // fetch role
    const [urows] = (await pool.query(`SELECT role FROM users WHERE id = ?`, [
      userId,
    ])) as any[];
    const role = (urows as any)[0].role as "user" | "admin";
    const access = signAccess({ sub: userId, role });
    res.json({ accessToken: access });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/logout */
auth.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[env.REFRESH_COOKIE_NAME];
    if (token) {
      try {
        const { sid } = verifyRefresh(token);
        await pool.query(
          `UPDATE sessions SET revoked_at = NOW() WHERE id = ?`,
          [sid]
        );
      } catch {
        /* ignore */
      }
    }
    res.clearCookie(env.REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/** GET /api/auth/me */
auth.get("/me", async (req, res) => {
  const authz = req.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const { sub } = verifyAccess(token);
    const [rows] = (await pool.query(
      `SELECT id, full_name, email, phone, role, status FROM users WHERE id = ? LIMIT 1`,
      [sub]
    )) as any[];
    const u = (rows as any)[0];
    if (!u) return res.status(404).json({ error: "Not found" });
    res.json({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
    });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

/** POST /api/auth/forgot */
auth.post("/forgot", authLimiter, async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body?.email);
    const [rows] = (await pool.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email.toLowerCase()]
    )) as any[];
    const u = (rows as any)[0];
    if (u) {
      const token = randToken(32);
      const hash = sha256(token);
      const [row] = (await pool.query("SELECT NOW() AS now")) as any[];
      const exp = new Date(new Date(row[0].now).getTime() + 60 * 60 * 1000); // 1h
      await pool.query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
        [String(u.id), hash, exp]
      );
      if (env.NODE_ENV === "development") {
        const url = `${env.FRONTEND_BASE_URL}/reset-password?token=${token}`;
        return res.json({ ok: true, resetUrl: url });
      }
    }
    // Always generic
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** POST /api/auth/reset */
auth.post("/reset", authLimiter, async (req, res, next) => {
  try {
    const body = z
      .object({
        token: z.string().min(10),
        password: z.string().min(8).max(128),
      })
      .parse(req.body);
    const hash = sha256(body.token);
    const [rows] = (await pool.query(
      `SELECT pr.id, pr.user_id FROM password_resets pr
       WHERE pr.token_hash = ? AND pr.used_at IS NULL AND pr.expires_at > NOW()
       LIMIT 1`,
      [hash]
    )) as any[];
    const r = (rows as any)[0];
    if (!r) return res.status(400).json({ error: "Invalid or expired token" });

    const pwHash = await argon2.hash(body.password, { type: argon2.argon2id });
    await pool.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [
      pwHash,
      String(r.user_id),
    ]);
    await pool.query(
      `UPDATE password_resets SET used_at = NOW() WHERE id = ?`,
      [r.id]
    );
    // revoke all sessions for this user
    await pool.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE user_id = ?`,
      [String(r.user_id)]
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
