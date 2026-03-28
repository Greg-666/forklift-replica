import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const app = express();
const { Pool } = pg;

/* ================= DATABASE ================= */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST.includes("neon.tech") ? { rejectUnauthorized: false } : false,
});

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options(/(.*)/,  cors());
app.use(express.json());

/* ================= RATE LIMIT ================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
});

/* ================= MAIL ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ================= AUTH ================= */

// LOGIN
app.post("/auth/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "Identifiants incorrects" });
    if (user.status === "pending") return res.status(403).json({ message: "Compte en attente de validation" });
    if (user.status === "rejected") return res.status(403).json({ message: "Compte refusé" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// REGISTER
app.post("/auth/register", async (req, res) => {
  const { email, password, username, country } = req.body;
  try {
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "Cet email est déjà utilisé" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password, username, role, status, country, avatar_color, avatar_emoji) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [email, hashedPassword, username, "member", "pending", country || null, "#1a6b3a", "🚜"]
    );
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// FORGOT PASSWORD
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "Aucun compte trouvé" });
    const tempPassword = crypto.randomBytes(4).toString("hex");
    const hashed = await bcrypt.hash(tempPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE email=$2", [hashed, email]);
    await transporter.sendMail({
      from: `Forklift Replica <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Mot de passe temporaire – Forklift Replica",
      html: `<p>Ton mot de passe temporaire : <b>${tempPassword}</b></p><p>Connecte-toi et change-le dès que possible.</p>`,
    });
    res.json({ message: "Mot de passe temporaire envoyé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= USERS ================= */

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id,email,username,role,status,country,avatar_color,avatar_emoji FROM users"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id,email,username,role,status,country,avatar_color,avatar_emoji FROM users WHERE id=$1",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  try {
    const current = await pool.query("SELECT role FROM users WHERE id=$1", [id]);
    const currentRole = current.rows[0]?.role || "member";
    const result = await pool.query(
      "UPDATE users SET role=$1, status=$2 WHERE id=$3 RETURNING id,email,username,role,status",
      [role || currentRole, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, country, password, avatar_color, avatar_emoji } = req.body;
  try {
    let query, params;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = "UPDATE users SET username=$1,country=$2,password=$3,avatar_color=$4,avatar_emoji=$5 WHERE id=$6 RETURNING id,email,username,role,status,country,avatar_color,avatar_emoji";
      params = [username, country, hashedPassword, avatar_color || "#1a6b3a", avatar_emoji || "🚜", id];
    } else {
      query = "UPDATE users SET username=$1,country=$2,avatar_color=$3,avatar_emoji=$4 WHERE id=$5 RETURNING id,email,username,role,status,country,avatar_color,avatar_emoji";
      params = [username, country, avatar_color || "#1a6b3a", avatar_emoji || "🚜", id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= ARTICLES ================= */

app.get("/articles", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM articles ORDER BY date DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/articles/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM articles WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Article introuvable" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/articles", async (req, res) => {
  const { title, title_en, category, date, author, summary, summary_en, content, content_en, image, tags, photos, video_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO articles (title,title_en,category,date,author,summary,summary_en,content,content_en,image,tags,photos,video_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [title, title_en || null, category, date, author, summary, summary_en || null, content, content_en || null, image, tags, photos || [], video_url || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.put("/articles/:id", async (req, res) => {
  const { id } = req.params;
  const { title, title_en, category, date, author, summary, summary_en, content, content_en, image, tags, photos, video_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE articles SET title=$1,title_en=$2,category=$3,date=$4,author=$5,
       summary=$6,summary_en=$7,content=$8,content_en=$9,image=$10,tags=$11,photos=$12,video_url=$13
       WHERE id=$14 RETURNING *`,
      [title, title_en || null, category, date, author, summary, summary_en || null, content, content_en || null, image, tags, photos || [], video_url || null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete("/articles/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM articles WHERE id=$1", [req.params.id]);
    res.json({ message: "Article supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= COMMENTS ================= */

app.get("/comments", async (req, res) => {
  const { articleId } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM comments WHERE article_id=$1 ORDER BY date ASC", [articleId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/comments", async (req, res) => {
  const { articleId, content, author } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO comments (article_id,content,author,date) VALUES ($1,$2,$3,$4) RETURNING *",
      [articleId, content, author, new Date().toISOString()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete("/comments/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM comments WHERE id=$1", [req.params.id]);
    res.json({ message: "Commentaire supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= CHARIOTS ================= */

// GET ALL — filtres: ?marque=&type=&pays=&marque_jouet=
app.get("/chariots", async (req, res) => {
  const { marque, type, pays, marque_jouet, page = 1, limit = 24 } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let i = 1;

  if (marque) { conditions.push(`mc.id = $${i++}`); params.push(marque); }
  if (type)   { conditions.push(`tc.id = $${i++}`); params.push(type); }
  if (pays)   { conditions.push(`mc.pays ILIKE $${i++}`); params.push(`%${pays}%`); }
  if (marque_jouet) { conditions.push(`mj.id = $${i++}`); params.push(marque_jouet); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM chariots c
       LEFT JOIN marques_constructeur mc ON c.marque_constructeur_id = mc.id
       LEFT JOIN marques_jouet mj ON c.marque_jouet_id = mj.id
       LEFT JOIN types_chariot tc ON c.type_chariot_id = tc.id
       ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT c.*,
              mc.nom AS marque_nom, mc.pays AS marque_pays, mc.annee_creation AS marque_annee,
              mj.nom AS jouet_nom,
              tc.nom AS type_nom, tc.slug AS type_slug
       FROM chariots c
       LEFT JOIN marques_constructeur mc ON c.marque_constructeur_id = mc.id
       LEFT JOIN marques_jouet mj ON c.marque_jouet_id = mj.id
       LEFT JOIN types_chariot tc ON c.type_chariot_id = tc.id
       ${where}
       ORDER BY mc.nom, c.modele
       LIMIT $${i++} OFFSET $${i++}`,
      params
    );
    res.json({ data: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET ONE CHARIOT
app.get("/chariots/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              mc.nom AS marque_nom, mc.pays AS marque_pays, mc.annee_creation AS marque_annee,
              mc.description AS marque_description, mc.slug AS marque_slug,
              mj.nom AS jouet_nom, mj.pays AS jouet_pays, mj.slug AS jouet_slug,
              tc.nom AS type_nom, tc.slug AS type_slug, tc.description AS type_description
       FROM chariots c
       LEFT JOIN marques_constructeur mc ON c.marque_constructeur_id = mc.id
       LEFT JOIN marques_jouet mj ON c.marque_jouet_id = mj.id
       LEFT JOIN types_chariot tc ON c.type_chariot_id = tc.id
       WHERE c.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Chariot introuvable" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// CREATE CHARIOT
app.post("/chariots", async (req, res) => {
  const { marque_constructeur_id, marque_jouet_id, type_chariot_id, thematique_id, modele, quantite, notes, image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO chariots (marque_constructeur_id,marque_jouet_id,type_chariot_id,thematique_id,modele,quantite,notes,image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [marque_constructeur_id, marque_jouet_id || null, type_chariot_id, thematique_id || null, modele, quantite || 1, notes || null, image_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// UPDATE CHARIOT
app.put("/chariots/:id", async (req, res) => {
  const { id } = req.params;
  const { marque_constructeur_id, marque_jouet_id, type_chariot_id, thematique_id, modele, quantite, notes, image_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE chariots SET marque_constructeur_id=$1,marque_jouet_id=$2,type_chariot_id=$3,
       thematique_id=$4,modele=$5,quantite=$6,notes=$7,image_url=$8
       WHERE id=$9 RETURNING *`,
      [marque_constructeur_id, marque_jouet_id || null, type_chariot_id, thematique_id || null, modele, quantite || 1, notes || null, image_url || null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// DELETE CHARIOT
app.delete("/chariots/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM chariots WHERE id=$1", [req.params.id]);
    res.json({ message: "Chariot supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= MARQUES CONSTRUCTEUR ================= */

app.get("/marques-constructeur", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mc.*, COUNT(c.id)::int AS total_chariots
       FROM marques_constructeur mc
       LEFT JOIN chariots c ON c.marque_constructeur_id = mc.id
       GROUP BY mc.id ORDER BY mc.nom`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/marques-constructeur/:slug", async (req, res) => {
  try {
    const mc = await pool.query("SELECT * FROM marques_constructeur WHERE slug=$1", [req.params.slug]);
    if (mc.rows.length === 0) return res.status(404).json({ message: "Marque introuvable" });
    const chariots = await pool.query(
      `SELECT c.*, tc.nom AS type_nom, mj.nom AS jouet_nom
       FROM chariots c
       LEFT JOIN types_chariot tc ON c.type_chariot_id = tc.id
       LEFT JOIN marques_jouet mj ON c.marque_jouet_id = mj.id
       WHERE c.marque_constructeur_id = $1 ORDER BY tc.nom, c.modele`,
      [mc.rows[0].id]
    );
    res.json({ marque: mc.rows[0], chariots: chariots.rows });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= MARQUES JOUET ================= */

app.get("/marques-jouet", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mj.*, COUNT(c.id)::int AS total_chariots
       FROM marques_jouet mj
       LEFT JOIN chariots c ON c.marque_jouet_id = mj.id
       GROUP BY mj.id ORDER BY mj.nom`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/marques-jouet/:slug", async (req, res) => {
  try {
    const mj = await pool.query("SELECT * FROM marques_jouet WHERE slug=$1", [req.params.slug]);
    if (mj.rows.length === 0) return res.status(404).json({ message: "Marque jouet introuvable" });
    const chariots = await pool.query(
      `SELECT c.*, mc.nom AS marque_nom, tc.nom AS type_nom
       FROM chariots c
       LEFT JOIN marques_constructeur mc ON c.marque_constructeur_id = mc.id
       LEFT JOIN types_chariot tc ON c.type_chariot_id = tc.id
       WHERE c.marque_jouet_id = $1 ORDER BY mc.nom, c.modele`,
      [mj.rows[0].id]
    );
    res.json({ marque: mj.rows[0], chariots: chariots.rows });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= TYPES DE CHARIOTS ================= */

app.get("/types", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.*, COUNT(c.id)::int AS total
       FROM types_chariot tc
       LEFT JOIN chariots c ON c.type_chariot_id = tc.id
       GROUP BY tc.id ORDER BY total DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= STATS ================= */

app.get("/stats", async (req, res) => {
  try {
    const [total, marques, types, jouets] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM chariots"),
      pool.query("SELECT COUNT(*)::int AS total FROM marques_constructeur"),
      pool.query("SELECT COUNT(*)::int AS total FROM types_chariot"),
      pool.query("SELECT COUNT(*)::int AS total FROM marques_jouet"),
    ]);
    const topMarques = await pool.query(
      `SELECT mc.nom, COUNT(c.id)::int AS total
       FROM marques_constructeur mc
       JOIN chariots c ON c.marque_constructeur_id = mc.id
       GROUP BY mc.nom ORDER BY total DESC LIMIT 10`
    );
    const parType = await pool.query(
      `SELECT tc.nom, COUNT(c.id)::int AS total
       FROM types_chariot tc
       JOIN chariots c ON c.type_chariot_id = tc.id
       GROUP BY tc.nom ORDER BY total DESC`
    );
    res.json({
      total_chariots: total.rows[0].total,
      total_marques: marques.rows[0].total,
      total_types: types.rows[0].total,
      total_jouets: jouets.rows[0].total,
      top_marques: topMarques.rows,
      par_type: parType.rows,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* ================= CONTACT ================= */

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await transporter.sendMail({
      from: `Forklift Replica <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      replyTo: email,
      subject: `[Forklift Replica] Message de ${name}`,
      html: `<h3>Nouveau message</h3><p><b>Nom :</b> ${name}</p><p><b>Email :</b> ${email}</p><p><b>Message :</b></p><p>${message}</p>`,
    });
    res.json({ message: "Message envoyé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'envoi" });
  }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Forklift Replica backend running on port ${PORT}`);
});
