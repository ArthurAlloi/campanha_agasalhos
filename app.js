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
const db = new sqlite3.Database('adm.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cpf TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    adm INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1
  )`, () => {
    // Cria admin padrão se não existir
    db.get("SELECT * FROM users WHERE cpf='00000000000'", (err, row) => {
      if (!row) {
        db.run("INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)", [
          "00000000000",
          "admin@site.com",
          "adm123",
          1, // adm
          1  // ativo
        ], () => console.log("✅ Admin padrão criado!"));
      }
    });
  });
});

// ─────────────────────── Banco de Roupas ───────────────────────
const dbRoupas = new sqlite3.Database("pontuacaoroupas.db");
dbRoupas.run("CREATE TABLE IF NOT EXISTS roupa (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao TEXT, pontos INTEGER)");
dbRoupas.get("SELECT COUNT(*) as total FROM roupa", function (err, row) {
  if (row.total === 0) {
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas comuns usadas', 1)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas de frio usadas', 2)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas novas embaladas com etiqueta', 3)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas de cama de inverno usadas', 10)");
    dbRoupas.run("INSERT INTO roupa (descricao, pontos) VALUES ('Roupas de cama de inverno novas', 20)");
  }
});

// ─────────────────────── Banco de Turmas ───────────────────────
const dbTurmas = new sqlite3.Database("turmas.db");
dbTurmas.run("CREATE TABLE IF NOT EXISTS turma (id INTEGER PRIMARY KEY AUTOINCREMENT, sigla TEXT, docente TEXT)");
dbTurmas.get("SELECT COUNT(*) as total FROM turma", function (err, row) {
  if (row.total === 0) {
    dbTurmas.run("INSERT INTO turma (sigla, docente) VALUES ('M14', 'WILLIAM')");
    dbTurmas.run("INSERT INTO turma (sigla, docente) VALUES ('M3A', 'FABIO')");
    dbTurmas.run("INSERT INTO turma (sigla, docente) VALUES ('M3B', 'EPAMINONDAS')");
  }
});

// ─────────────────────── Banco de Arrecadação ───────────────────────
const dbArrecadacao = new sqlite3.Database("arrecadacao.db");
dbArrecadacao.run("CREATE TABLE IF NOT EXISTS ARRECADACAO (id INTEGER PRIMARY KEY AUTOINCREMENT, turma TEXT, item TEXT, quantidade INTEGER, pontos INTEGER, data TEXT)");

// ─────────────────────── Rotas Fixas ───────────────────────
app.get("/", (req, res) => res.render("pages/index", { título: "Index", req }));
app.get("/sobre", (req, res) => res.render("pages/sobre", { título: "Sobre", req }));
app.get("/localizacao", (req, res) => res.render("pages/localizacao", { título: "Localizacao", req }));

<<<<<<< HEAD
// Página inicial
app.get("/", function(req, res) {
  console.log("/Home GET");
  res.render("pages/index", { título: "Index", req });
});

// Páginas fixas
app.get("/sobre", function(req, res) {
  console.log("/Sobre GET");
  res.render("pages/sobre", { título: "Sobre", req });
});

app.get("/localizacao", function(req, res) {
  console.log("/Localizacao GET");
  res.render("pages/localizacao", { título: "Localizacao", req });
});

app.get("/equipe", function(req, res) {
  console.log("/Equipe GET");
  res.render("pages/equipe", { título: "Equipe", req });
});

// Login - GET exibe o formulário, POST valida o usuário
app.get("/login", function(req, res) {
  console.log("/Login GET");
  res.render("pages/login", { título: "Login", req, erro: null });
});

app.post("/login", function(req, res) {
  console.log("/Login POST");
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], function(err, row) {
    if (row) {
      req.session.user = row;
      res.redirect("/doacoes_doar");
=======
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
>>>>>>> origin/Dev-Arthur
    } else {
      return res.redirect("/doacoes_doaruser"); // usuário normal
    }
  });
});

<<<<<<< HEAD
// Logout - encerra sessão
app.get("/logout", function(req, res) {
  console.log("/Logout GET");
  req.session.destroy(function() {
    res.redirect("/");
  });
});

// Página de doações (acessível somente se estiver logado)
app.get("/doacoes_doar", function(req, res) {
  console.log("/Doacoes_Doar GET");
  res.render("pages/doacoes_doar", { título: "Doações", req });
});

// Página para realizar uma doação
app.get("/realizardoacao", function(req, res) {
  console.log("/Realizardoacao GET");
=======
// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ─────────────────────── Área Restrita ───────────────────────
app.get("/dashboard", (req, res) => {
>>>>>>> origin/Dev-Arthur
  if (!req.session.user) return res.redirect("/login");
  res.render("pages/dashboard", { título: "Área Restrita", req, user: req.session.user });
});

// ─────────────────────── CRUD de Usuários ───────────────────────
app.get("/usuarios", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  db.all("SELECT * FROM users", (err, users) => {
    res.render("pages/usuarios", { título: "Usuários", req, users });
  });
});

<<<<<<< HEAD
// Rota POST para processar a doação
app.post("/realizardoacao", function(req, res) {
  console.log("/Realizardoacao POST");
  if (!req.session.user) return res.redirect("/login");
  const { turma, item, quantidade } = req.body;
  const qtd = parseInt(quantidade);
  const mapaPontos = {
    "Roupas comuns usadas": 1,
    "Roupas de frio usadas": 2,
    "Roupas novas embaladas com etiqueta": 3,
    "Roupas de cama de inverno usadas": 10,
    "Roupas de cama de inverno novas": 20
  };
  const pontos = (mapaPontos[item] || 0) * qtd;
  const data = new Date().toISOString().split('T')[0];

  dbArrecadacao.run("INSERT INTO ARRECADACAO (turma, item, quantidade, pontos, data) VALUES (?, ?, ?, ?, ?)",
    [turma, item, qtd, pontos, data], function(err) {
      res.redirect("/tabela");
    });
});

// Página de ranking das turmas
app.get("/ranking", function(req, res) {
  console.log("/Ranking GET");
  dbArrecadacao.all(`
    SELECT turma, SUM(pontos) AS totalPontos, COUNT(*) AS totalDoacoes
    FROM ARRECADACAO
    GROUP BY turma
    ORDER BY totalPontos DESC
  `, function(err, ranking) {
    res.render("pages/ranking", {
      título: "Ranking de Doações",
      req,
      ranking
    });
  });
});

// Página com a tabela de doações, com filtro e paginação
app.get("/tabela", (req, res) => {
  console.log("/Tabela GET");
  const pagina = parseInt(req.query.pagina) || 1;
  const porPagina = 10;
  const offset = (pagina - 1) * porPagina;
  const turmaSelecionada = req.query.turma || "";

  const mapaPontos = {
    "Roupas comuns usadas": 1,
    "Roupas de frio usadas": 2,
    "Roupas novas embaladas com etiqueta": 3,
    "Roupas de cama de inverno usadas": 10,
    "Roupas de cama de inverno novas": 20
  };

  let query = "SELECT * FROM ARRECADACAO";
  let countQuery = "SELECT COUNT(*) as total FROM ARRECADACAO";
  const params = [];

  if (turmaSelecionada) {
    query += " WHERE turma = ?";
    countQuery += " WHERE turma = ?";
    params.push(turmaSelecionada);
  }

  query += " LIMIT ? OFFSET ?";
  params.push(porPagina, offset);

  dbArrecadacao.all(query, params, function(err, rows) {
    dbArrecadacao.get(countQuery, turmaSelecionada ? [turmaSelecionada] : [], function(err, result) {
      const totalRegistros = result.total;
      const totalPaginas = Math.ceil(totalRegistros / porPagina);

      const doacoes = rows.map(row => ({
        ...row,
        pontosUnitarios: mapaPontos[row.item] || 0
      }));

      dbTurmas.all("SELECT * FROM turma", (err, turmas) => {
        res.render("pages/tabela", {
          título: "Tabela de Doações",
          req,
          doacoes,
          paginaAtual: pagina,
          totalPaginas,
          turmas,
          turmaSelecionada
        });
      });
    });
=======
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
>>>>>>> origin/Dev-Arthur
  });
});

app.post("/usuarios/deletar/:id", (req, res) => {
  if (!req.session.user || req.session.user.adm !== 1) return res.redirect("/login");
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], () => {
    res.redirect("/usuarios");
  });
});

// ─────────────────────── Doações, Ranking e Tabela ───────────────────────
app.get("/doacoes_doar", (req, res) => {
  res.render("pages/doacoes_doar", { título: "doacoes_doar", req, erro: null });
});

app.get("/doacoes_doaruser", (req, res) => {
  res.render("pages/doacoes_doaruser", { título: "doacoes_doaruser", req, erro: null });
});

// ─────────────────────── Página de erro 404 ───────────────────────
app.use((req, res) => {
  res.status(404).render('pages/fail', { título: "HTTP ERROR 404 - PAGE NOT FOUND", req: req, msg: "404" });
});

// ─────────────────────── Servidor ───────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta: ${PORT}`);
});
