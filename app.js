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
app.set('views', path.join(__dirname, 'views'));

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
    adm INTEGER DEFAULT 0,  -- 0 = user, 1 = admin, 2 = mini admin
    ativo INTEGER DEFAULT 1
  )`);

  // Cria admin padrão
  dbUsers.get("SELECT * FROM users WHERE cpf = '000.000.000-00'", (err, row) => {
    if (!row) {
      dbUsers.run(
        "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
        ["000.000.000-00", "admin@site.com", "adm123", 1, 1],
        () => console.log("✅ Admin padrão criado no adm.db!")
      );
    }
  });

  // Cria mini admin padrão
  dbUsers.get("SELECT * FROM users WHERE cpf = '111.111.111-11'", (err, row) => {
    if (!row) {
      dbUsers.run(
        "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
        ["111.111.111-11", "miniadm@site.com", "1234", 2, 1],
        () => console.log("✅ Mini admin padrão criado no adm.db!")
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

// ─────────────────────── Middlewares ───────────────────────
function apenasadm(req, res, next) {
  if (req.session.user && req.session.user.adm === 1) return next();
  res.redirect("/login");
}

function apenasadmouminiadm(req, res, next) {
  if (req.session.user && (req.session.user.adm === 1 || req.session.user.adm === 2)) return next();
  res.redirect("/login");
}

// ─────────────────────── Rotas ───────────────────────
app.get("/", (req, res) => res.render("pages/index", { título: "Index", req }));

// ─────────────── LOGIN / LOGOUT ───────────────
app.get("/login", (req, res) => res.render("pages/login", { título: "Login", req, erro: null }));

app.post("/login", (req, res) => {
  const { cpf, password } = req.body;

  dbUsers.get("SELECT * FROM users WHERE cpf = ?", [cpf], (err, row) => {
    if (err) return res.render("pages/login", { título: "Login", req, erro: "Erro no servidor!" });
    if (!row) return res.render("pages/login", { título: "Login", req, erro: "Usuário não encontrado!" });
    if (row.password !== password) return res.render("pages/login", { título: "Login", req, erro: "Senha incorreta!" });
    if (row.ativo === 0) return res.render("pages/login", { título: "Login", req, erro: "Usuário desativado!" });

    req.session.user = { id: row.id, cpf: row.cpf, adm: row.adm };

    // Redirecionamento conforme nível
    if (row.adm === 1) {
      res.redirect("/dashboard"); // ADM
    } else {
      res.redirect("/"); // Mini ADM e usuário comum
    }
  });
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log("Erro ao destruir sessão:", err);
      return res.status(500).send("Erro ao fazer logout");
    }
    res.redirect("/");
  });
});


// ─────────────── CADASTRO ───────────────
app.get("/cadastro", (req, res) =>
  res.render("pages/cadastro", { título: "Cadastro", req, erro: null, sucesso: null })
);

app.post("/cadastro", (req, res) => {
  const { cpf, email, password } = req.body;

  if (!cpf || !email || !password)
    return res.render("pages/cadastro", { título: "Cadastro", req, erro: "Preencha todos os campos!", sucesso: null });

  dbUsers.run(
    "INSERT INTO users (cpf, email, password) VALUES (?, ?, ?)",
    [cpf, email, password],
    err => {
      if (err)
        return res.render("pages/cadastro", { título: "Cadastro", req, erro: "CPF ou E-mail já cadastrados!", sucesso: null });
      res.render("pages/cadastro", { título: "Cadastro", req, erro: null, sucesso: "Usuário cadastrado com sucesso!" });
    }
  );
});

// ─────────────── DASHBOARD ───────────────
app.get("/dashboard", apenasadm, (req, res) =>
  res.render("pages/dashboard", { título: "Dashboard", req, user: req.session.user })
);

// ─────────────── USUÁRIOS (ADMIN) ───────────────
app.get("/usuariosadm", apenasadm, (req, res) => {
  dbUsers.all("SELECT * FROM users", (err, users) =>
    res.render("pages/usuariosadm", { título: "Usuários", req, users })
  );
});

// Criar usuário
app.post("/usuariosadm/criar", apenasadm, (req, res) => {
  const { cpf, email, password, adm, ativo } = req.body;

  dbUsers.run(
    "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
    [cpf, email, password, Number(adm) || 0, Number(ativo) || 1],
    (err) => {
      if (err) console.log(err);
      res.redirect("/usuariosadm");
    }
  );
});

// Editar usuário
app.post("/usuariosadm/editar/:id", apenasadm, (req, res) => {
  const { cpf, email, password, adm, ativo } = req.body;
  const id = req.params.id;

  const query = password
    ? "UPDATE users SET cpf = ?, email = ?, password = ?, adm = ?, ativo = ? WHERE id = ?"
    : "UPDATE users SET cpf = ?, email = ?, adm = ?, ativo = ? WHERE id = ?";

  const params = password
    ? [cpf, email, password, Number(adm) || 0, Number(ativo) || 1, id]
    : [cpf, email, Number(adm) || 0, Number(ativo) || 1, id];

  dbUsers.run(query, params, (err) => {
    if (err) console.log(err);
    res.redirect("/usuariosadm");
  });
});

// Deletar usuário
app.post("/usuariosadm/deletar/:id", apenasadm, (req, res) => {
  const id = req.params.id;
  dbUsers.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) console.log(err);
    res.redirect("/usuariosadm");
  });
});


// ─────────────── CAMPANHAS ───────────────
app.get("/tabela", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  dbCampanhas.all("SELECT * FROM campanhas", (err, campanhas) => {
    if (err) return res.status(500).send("Erro ao carregar campanhas");

    const agora = new Date();
    campanhas.forEach(c => {
      const fim = new Date(c.data_fim);
      if (c.ativa === 1 && fim < agora) {
        dbCampanhas.run("UPDATE campanhas SET ativa = 0 WHERE id = ?", [c.id]);
        c.ativa = 0;
      }
    });

    res.render("pages/tabela", { campanhas, título: "Tabela de Campanhas", req });
  });
});

// ─────────────── DOAÇÕES ───────────────
app.get("/realizardoacaocamp", apenasadmouminiadm, (req, res) => {
  const idCampanhaSelecionada = req.query.id_campanha || null;

  dbCampanhas.all('SELECT * FROM campanhas WHERE ativa = 1', (err, campanhas) => {
    if (err) {
      console.log("Erro ao carregar campanhas:", err);
      return res.render("pages/realizardoacaocamp", { campanhas: [], turmas: [], roupas: [], idCampanhaSelecionada, req });
    }

    dbTurmas.all('SELECT * FROM turmas WHERE ativo = 1', (err, turmas) => {
      if (err) {
        console.log("Erro ao carregar turmas:", err);
        return res.render("pages/realizardoacaocamp", { campanhas, turmas: [], roupas: [], idCampanhaSelecionada, req });
      }

      dbCampanhas.all('SELECT * FROM itens', (err, roupas) => {
        if (err) {
          console.log("Erro ao carregar itens:", err);
          return res.render("pages/realizardoacaocamp", { campanhas, turmas, roupas: [], idCampanhaSelecionada, req });
        }

        // Renderiza normalmente, mesmo que arrays estejam vazios
        res.render('pages/realizardoacaocamp', { campanhas, turmas, roupas, idCampanhaSelecionada, req });
      });
    });
  });
});

app.post("/realizardoacao", apenasadmouminiadm, (req, res) => {
  const { id_campanha, id_turma, id_roupa, quantidade } = req.body;

  dbCampanhas.get("SELECT pontos FROM itens WHERE id = ?", [id_roupa], (err, roupa) => {
    if (err || !roupa) return res.status(500).send("Erro ao buscar pontos do item");

    const pontosTotais = roupa.pontos * quantidade;

    dbDoacoes.run(
      "INSERT INTO doacoes (id_turma, id_item, quantidade, total_pontos) VALUES (?, ?, ?, ?)",
      [id_turma, id_roupa, quantidade, pontosTotais],
      err => {
        if (err) return res.status(500).send("Erro ao salvar doação");
        res.redirect("/tabela");
      }
    );
  });
});

// ─────────────── CRIAR CAMPANHA ───────────────
app.get("/criarcampanha", apenasadm, (req, res) =>
  res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: null, sucesso: null })
);

app.post("/criarcampanha", apenasadm, (req, res) => {
  const { nome, descricao, data_inicio, data_fim, nome_item, pontos } = req.body;

  if (!nome || !data_inicio || !data_fim || !nome_item || !pontos)
    return res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: "Preencha todos os campos!", sucesso: null });

  dbCampanhas.run(
    "INSERT INTO campanhas (nome, descricao, data_inicio, data_fim) VALUES (?, ?, ?, ?)",
    [nome, descricao || "", data_inicio, data_fim],
    function (err) {
      if (err) return res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: "Erro ao criar!", sucesso: null });

      const campanhaId = this.lastID;
      const stmt = dbCampanhas.prepare("INSERT INTO itens (id_campanha, nome_item, pontos) VALUES (?, ?, ?)");
      for (let i = 0; i < nome_item.length; i++) {
        if (nome_item[i] && pontos[i]) stmt.run(campanhaId, nome_item[i], pontos[i]);
      }
      stmt.finalize();

      res.render("pages/criarcampanha", { título: "Criar Campanha", req, erro: null, sucesso: "Campanha criada com sucesso!" });
    }
  );
});

//_____________________________Ver Campanhas
// Rota para ver detalhes de uma campanha

app.post("/api/campanhas/desativar/:id", (req, res) => {
  const id = req.params.id;
  dbCampanhas.run("UPDATE campanhas SET ativa = 0 WHERE id = ?", [id], err => {
    if (err) return res.status(500).json({ erro: "Erro ao desativar campanha" });
    res.json({ sucesso: true });
  });
});

app.get("/campanhas/:id", (req, res) => {
  const idCampanha = req.params.id;

  // Pega todos os itens da campanha
  dbCampanhas.all("SELECT * FROM itens WHERE id_campanha = ?", [idCampanha], (err, itens) => {
    if (err) return res.status(500).send("Erro ao buscar itens da campanha");

    const itemIds = itens.map(i => i.id);
    if (itemIds.length === 0) return res.send("Nenhum item cadastrado para essa campanha");

    // Soma todas as doações da campanha, por turma
    const placeholders = itemIds.map(() => '?').join(',');
    dbDoacoes.all(`
      SELECT id_turma, id_item, SUM(quantidade) AS total_itens, SUM(total_pontos) AS total_pontos
      FROM doacoes
      WHERE id_item IN (${placeholders})
      GROUP BY id_turma, id_item
    `, itemIds, (err, doacoes) => {
      if (err) return res.status(500).send("Erro ao carregar doações");

      if (doacoes.length === 0) return res.send("Nenhuma doação registrada ainda");

      // Pega todas as turmas que doaram
      const turmaIds = [...new Set(doacoes.map(d => d.id_turma))];
      const placeholdersTurmas = turmaIds.map(() => '?').join(',');
      dbTurmas.all(`SELECT id, sigla FROM turmas WHERE id IN (${placeholdersTurmas})`, turmaIds, (err, turmas) => {
        if (err) return res.status(500).send("Erro ao carregar turmas");

        const siglas = {};
        turmas.forEach(t => siglas[t.id] = t.sigla);

        // Pega os nomes dos itens
        const itemMap = {};
        itens.forEach(i => itemMap[i.id] = { nome: i.nome_item, pontos: i.pontos });

        // Organiza os dados por turma
        const turmasDoacoes = {};
        doacoes.forEach(d => {
          if (!turmasDoacoes[d.id_turma]) turmasDoacoes[d.id_turma] = { sigla: siglas[d.id_turma], itens: [] };
          turmasDoacoes[d.id_turma].itens.push({
            nome: itemMap[d.id_item].nome,
            quantidade: d.total_itens,
            pontos: d.total_pontos
          });
        });

        res.render("pages/verCampanha", {
          campanha: { id: idCampanha },
          turmasDoacoes,
          req
        });
      });
    });
  });
});



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

// ─────────────────────── Logout ───────────────────────
app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/")));

// ─────────────────────── Dashboard ───────────────────────
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("pages/dashboard", { título: "Dashboard", req, user: req.session.user });
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


// ─────────────────────── realizar a doacao em alguma campanha ───────────────────────

// ─────────────────────── Realizar Doação Campanha ───────────────────────
app.get('/realizardoacaocamp', (req, res) => {
  const idCampanhaSelecionada = req.query.id_campanha || null;

  dbCampanhas.all('SELECT * FROM campanhas WHERE ativa = 1', (err, campanhas) => {
    if (err) return res.status(500).send('Erro ao carregar campanhas');

    dbTurmas.all('SELECT * FROM turmas WHERE ativo = 1', (err, turmas) => {
      if (err) return res.status(500).send('Erro ao carregar turmas');

      dbCampanhas.all('SELECT * FROM itens', (err, roupas) => {
        if (err) return res.status(500).send('Erro ao carregar itens');

        res.render('pages/realizardoacaocamp', { campanhas, turmas, roupas, idCampanhaSelecionada });
      });
    });
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

// ─────────────── Servidor ───────────────
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
