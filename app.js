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

app.post("/cadastro", function (req, res) {
  const { cpf, email, password } = req.body;

  if (!cpf || !email || !password) {
    return res.render("pages/cadastro", { título: "Cadastro", req, erro: "Preencha todos os campos!", sucesso: null });
  }

  db.run("INSERT INTO users (cpf, email, password) VALUES (?, ?, ?)", [cpf, email, password], function (err) {
    if (err) {
      console.error("Erro ao cadastrar:", err.message);
      return res.render("pages/cadastro", { título: "Cadastro", req, erro: "CPF ou E-mail já cadastrados!", sucesso: null });
    }

    res.render("pages/cadastro", { título: "Cadastro", req, erro: null, sucesso: "Usuário cadastrado com sucesso!" });
  });
});

// ─────────────────────── Login ───────────────────────
app.get("/login", (req, res) => {
  res.render("pages/login", { título: "Login", req, erro: null });
});

app.post("/login", (req, res) => {
  const { cpf, password } = req.body;

  db.get("SELECT * FROM users WHERE cpf = ?", [cpf], (err, row) => {
    if (err) {
      console.error("Erro no login:", err.message);
      return res.render("pages/login", { título: "Login", req, erro: "Erro no servidor!" });
    }

    if (!row) {
      return res.render("pages/login", { título: "Login", req, erro: "Usuário não encontrado!" });
    }

    if (row.password !== password) {
      return res.render("pages/login", { título: "Login", req, erro: "Senha incorreta!" });
    }

    if (row.ativo === 0) {
      return res.render("pages/login", { título: "Login", req, erro: "Usuário desativado!" });
    }

    // Setando a sessão
    req.session.user = { id: row.id, cpf: row.cpf, adm: row.adm };

    // Redireciona conforme o tipo de usuário
    if (row.adm === 1) {
      return res.redirect("/doacoes_doar"); // admin
    } else {
      return res.redirect("/doacoes_doaruser"); // usuário normal
    }
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ─────────────────────── Área Restrita ───────────────────────
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("pages/dashboard", { título: "Dashboard", req, user: req.session.user });
});

// ─────────────────────── CRUD Usuários ───────────────────────
app.get("/usuariosadm", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  dbUsers.all("SELECT * FROM users", (err, users) => res.render("pages/usuariosadm", { título: "Usuários", req, users }));
});

app.post("/usuarios/criar", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  const { cpf, email, password, adm, ativo } = req.body;
  db.run("INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)", [cpf, email, password, adm || 0, ativo || 1], () => {
    res.redirect("/usuarios");
  });
});

app.post("/usuarios/editar/:id", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  const { cpf, email, password, adm, ativo } = req.body;
  db.run("UPDATE users SET cpf = ?, email = ?, password = ?, adm = ?, ativo = ? WHERE id = ?", [cpf, email, password, adm || 0, ativo || 1, req.params.id], () => {
    res.redirect("/usuarios");
  });
});

app.post("/usuarios/deletar/:id", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], () => {
    res.redirect("/usuarios");
  });
});


app.post('/realizardoacao', (req, res) => {
  const { id_campanha, id_turma, id_roupa, quantidade } = req.body;

  dbCampanhas.get('SELECT pontos FROM itens WHERE id = ?', [id_roupa], (err, roupa) => {
    if (err || !roupa) return res.status(500).send('Erro ao buscar pontos do item');

    const pontosTotais = roupa.pontos * quantidade;

    dbDoacoes.run(
      `INSERT INTO doacoes (id_turma, id_item, quantidade, total_pontos) VALUES (?, ?, ?, ?)`,
      [id_turma, id_roupa, quantidade, pontosTotais],
      err => {
        if (err) return res.status(500).send('Erro ao salvar doação');
        res.redirect('/tabela'); // volta pra tabela de campanhas
      }
    );
  });
});

// ─────────────────────── Criar Campanhas ───────────────────────
app.get("/criarcampanha", (req, res) =>
  res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: null, sucesso: null })
);

app.post("/criarcampanha", (req, res) => {
  const { nome, descricao, data_inicio, data_fim, nome_item, pontos } = req.body;

  if (!nome || !data_inicio || !data_fim || !nome_item || !pontos) {
    return res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: "Preencha todos os campos obrigatórios!", sucesso: null });
  }

  dbCampanhas.run(
    `INSERT INTO campanhas (nome, descricao, data_inicio, data_fim) VALUES (?, ?, ?, ?)`,
    [nome, descricao || "", data_inicio, data_fim],
    function (err) {
      if (err) {
        console.error("Erro ao criar campanha:", err.message);
        return res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: "Erro ao criar campanha!", sucesso: null });
      }

      const campanhaId = this.lastID;

      const stmt = dbCampanhas.prepare(`INSERT INTO itens (id_campanha, nome_item, pontos) VALUES (?, ?, ?)`);
      for (let i = 0; i < nome_item.length; i++) {
        if (nome_item[i] && pontos[i]) {
          stmt.run(campanhaId, nome_item[i], pontos[i]);
        }
      }
      stmt.finalize();

      res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: null, sucesso: "Campanha criada com sucesso!" });
    }
  );
});

// ─────────────────────── Página de erro 404 ───────────────────────
app.use((req, res) => res.status(404).render('pages/fail', { título: "HTTP ERROR 404", req, msg: "404" }));

// ─────────────────────── Servidor ───────────────────────
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta: ${PORT}`));
