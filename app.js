// ─────────────────────── Importações ───────────────────────
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
const PORT = 8000;

// ─────────────────────── Configurações ───────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'banguela', resave: false, saveUninitialized: true }));
app.use("/static", express.static(path.join(__dirname, "static")));
app.set('view engine', 'ejs');

// ─────────────────────── Banco de Usuários ───────────────────────
const dbUsers = new sqlite3.Database('adm.db');
dbUsers.serialize(() => {
  dbUsers.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpf TEXT UNIQUE,
    nome TEXT,
    email TEXT UNIQUE,
    password TEXT,
    adm INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1
  )`);

  dbUsers.get("SELECT * FROM users WHERE cpf = '000.000.000-00'", (err, row) => {
    if (!row) {
      dbUsers.run(
        "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
        ["000.000.000-00", "admin@site.com", "adm123", 1, 1],
        () => console.log("✅ Admin padrão criado no adm.db!")
      );
    }
  });
});

// ─────────────── TURMAS ───────────────
const dbTurmas = new sqlite3.Database('turmas.db');
dbTurmas.run(`CREATE TABLE IF NOT EXISTS turmas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sigla TEXT UNIQUE,
  docente TEXT,
  ativo INTEGER DEFAULT 1
)`);

// ─────────────── CAMPANHAS ───────────────
const dbCampanhas = new sqlite3.Database('campanhas.db');
dbCampanhas.serialize(() => {
  dbCampanhas.run(`CREATE TABLE IF NOT EXISTS campanhas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    data_inicio TEXT,
    data_fim TEXT,
    ativa INTEGER DEFAULT 1
  )`);

  dbCampanhas.run(`CREATE TABLE IF NOT EXISTS itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_campanha INTEGER,
    nome_item TEXT,
    pontos INTEGER
  )`);

  dbCampanhas.run(`CREATE TABLE IF NOT EXISTS campanhas_turmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_campanha INTEGER,
    id_turma INTEGER
  )`);
});

// ─────────────── DOAÇÕES ───────────────
const dbDoacoes = new sqlite3.Database('doacoes.db');
dbDoacoes.run(`CREATE TABLE IF NOT EXISTS doacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_turma INTEGER,
  id_item INTEGER,
  quantidade INTEGER,
  total_pontos INTEGER,
  data_doacao TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// ─────────────────────── Rotas Fixas ───────────────────────
app.get("/", (req, res) => res.render("pages/index", { título: "Index", req }));
app.get("/sobre", (req, res) => res.render("pages/sobre", { título: "Sobre", req }));
app.get("/localizacao", (req, res) => res.render("pages/localizacao", { título: "Localizacao", req }));

// ─────────────────────── Cadastro ───────────────────────
app.get("/cadastro", (req, res) => {
  res.render("pages/cadastro", { título: "Cadastro", req, erro: null, sucesso: null });
});

app.post("/cadastro", (req, res) => {
  const { cpf, email, password } = req.body;

  if (!cpf || !email || !password) {
    return res.render("pages/cadastro", { título: "Cadastro", req, erro: "Preencha todos os campos!", sucesso: null });
  }

  dbUsers.run(
    "INSERT INTO users (cpf, email, password) VALUES (?, ?, ?)",
    [cpf, email, password],
    function (err) {
      if (err) {
        console.error("Erro ao cadastrar:", err.message);
        return res.render("pages/cadastro", { título: "Cadastro", req, erro: "CPF ou E-mail já cadastrados!", sucesso: null });
      }

      res.render("pages/cadastro", { título: "Cadastro", req, erro: null, sucesso: "Usuário cadastrado com sucesso!" });
    }
  );
});

// ─────────────────────── Login ───────────────────────
app.get("/login", (req, res) => {
  res.render("pages/login", { título: "Login", req, erro: null });
});

app.post("/login", (req, res) => {
  const { cpf, password } = req.body;

  dbUsers.get("SELECT * FROM users WHERE cpf = ?", [cpf], (err, row) => {
    if (err) return res.render("pages/login", { título: "Login", req, erro: "Erro no servidor!" });
    if (!row) return res.render("pages/login", { título: "Login", req, erro: "Usuário não encontrado!" });
    if (row.password !== password) return res.render("pages/login", { título: "Login", req, erro: "Senha incorreta!" });
    if (row.ativo === 0) return res.render("pages/login", { título: "Login", req, erro: "Usuário desativado!" });

    req.session.user = { id: row.id, cpf: row.cpf, adm: row.adm };
    return row.adm === 1 ? res.redirect("/doacoes_doar") : res.redirect("/doacoes_doaruser");
  });
});

// Logout
app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/")));

// ─────────────────────── Dashboard ───────────────────────
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("pages/dashboard", { título: "dashboardadm", req, user: req.session.user });
});

// ─────────────────────── CRUD Usuários ───────────────────────
app.get("/usuariosadm", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  dbUsers.all("SELECT * FROM users", (err, users) => res.render("pages/usuariosadm", { título: "Usuários", req, users }));
});

app.post("/usuariosadm/criar", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  const { cpf, email, password, adm, ativo } = req.body;
  dbUsers.run(
    "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
    [cpf, email, password, adm || 0, ativo || 1],
    () => res.redirect("/usuariosadm")
  );
});

app.post("/usuariosadm/editar/:id", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  const { cpf, email, password, adm, ativo } = req.body;
  dbUsers.run(
    "UPDATE users SET cpf = ?, email = ?, password = ?, adm = ?, ativo = ? WHERE id = ?",
    [cpf, email, password, adm || 0, ativo || 1, req.params.id],
    () => res.redirect("/usuariosadm")
  );
});

app.post("/usuariosadm/deletar/:id", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  dbUsers.run("DELETE FROM users WHERE id = ?", [req.params.id], () => res.redirect("/usuariosadm"));
});


// ─────────────────────── Páginas Doações ───────────────────────
app.get("/doacoes_doar", (req, res) => res.render("pages/doacoes_doar", { título: "Doações", req, erro: null }));
app.get("/doacoes_doaruser", (req, res) => res.render("pages/doacoes_doaruser", { título: "Doações Usuário", req, erro: null }));


//________________________Criar Campanhas__________________________

app.get("/criarcampanha", (req, res) => res.render("pages/criarcampanha", { título: "CriarCampanha", req }));

// ─────────────────────── Página de erro 404 ───────────────────────
app.use((req, res) => res.status(404).render('pages/fail', { título: "HTTP ERROR 404", req, msg: "404" }));

// ─────────────────────── Servidor ───────────────────────
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta: ${PORT}`));
