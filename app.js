// ─────────────────────── Importações ───────────────────────
const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const PORT = 8000;

// ─────────────────────── Configurações ───────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(
  session({ secret: "banguela", resave: false, saveUninitialized: true })
);
app.use("/static", express.static(path.join(__dirname, "static")));
app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

// ─────────────────────── Banco de Usuários ───────────────────────
const dbUsers = new sqlite3.Database("adm.db");
dbUsers.serialize(() => {
  dbUsers.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cpf TEXT UNIQUE,
      nome TEXT,
      email TEXT UNIQUE,
      password TEXT,
      adm INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1
    )
  `);

  dbUsers.get(
    "SELECT * FROM users WHERE cpf = '000.000.000-00'",
    (err, row) => {
      if (!row) {
        dbUsers.run(
          "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
          ["000.000.000-00", "admin@site.com", "adm123", 1, 1]
        );
      }
    }
  );

  dbUsers.get(
    "SELECT * FROM users WHERE cpf = '111.111.111-11'",
    (err, row) => {
      if (!row) {
        dbUsers.run(
          "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
          ["111.111.111-11", "miniadm@site.com", "1234", 2, 1]
        );
      }
    }
  );
});

// ─────────────── TURMAS ───────────────
const dbTurmas = new sqlite3.Database("turmas.db");
dbTurmas.run(`
  CREATE TABLE IF NOT EXISTS turmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sigla TEXT UNIQUE,
    docente TEXT,
    ativo INTEGER DEFAULT 1
  )
`);

// ─────────────── CAMPANHAS ───────────────
const dbCampanhas = new sqlite3.Database("campanhas.db");

dbCampanhas.serialize(() => {
  dbCampanhas.run(`
    CREATE TABLE IF NOT EXISTS campanhas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      data_inicio TEXT,
      data_fim TEXT,
      ativa INTEGER DEFAULT 1
    )
  `);

  dbCampanhas.run(`
    CREATE TABLE IF NOT EXISTS itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_campanha INTEGER,
      nome_item TEXT,
      pontos INTEGER
    )
  `);

  dbCampanhas.run(`
    CREATE TABLE IF NOT EXISTS campanhas_turmas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_campanha INTEGER,
      id_turma INTEGER
    )
  `);
});

// ─────────────── DOAÇÕES ───────────────
const dbDoacoes = new sqlite3.Database("doacoes.db");

dbDoacoes.run(`
  CREATE TABLE IF NOT EXISTS doacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_turma INTEGER,
    id_item INTEGER,
    quantidade INTEGER,
    total_pontos INTEGER,
    data_doacao TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// ─────────────────────── Middlewares ───────────────────────
function apenasadm(req, res, next) {
  if (req.session.user && req.session.user.adm === 1) return next();
  res.redirect("/login");
}

function apenasadmouminiadm(req, res, next) {
  if (
    req.session.user &&
    (req.session.user.adm === 1 || req.session.user.adm === 2)
  )
    return next();
  res.redirect("/login");
}

// ─────────────────────── Rotas ───────────────────────
app.get("/", (req, res) =>
  res.render("pages/index", { título: "Index", req })
);

// ─────────────── LOGIN / LOGOUT ───────────────
app.get("/login", (req, res) =>
  res.render("pages/login", { título: "Login", req, erro: null })
);

app.post("/login", (req, res) => {
  const { cpf, password } = req.body;

  dbUsers.get("SELECT * FROM users WHERE cpf = ?", [cpf], (err, row) => {
    if (err)
      return res.render("pages/login", {
        título: "Login",
        req,
        erro: "Erro no servidor!",
      });
    if (!row)
      return res.render("pages/login", {
        título: "Login",
        req,
        erro: "Usuário não encontrado!",
      });
    if (row.password !== password)
      return res.render("pages/login", {
        título: "Login",
        req,
        erro: "Senha incorreta!",
      });
    if (row.ativo === 0)
      return res.render("pages/login", {
        título: "Login",
        req,
        erro: "Usuário desativado!",
      });

    req.session.user = { id: row.id, cpf: row.cpf, adm: row.adm };

    if (row.adm === 1) res.redirect("/dashboard");
    else res.redirect("/");
  });
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ─────────────── CADASTRO ───────────────
app.get("/cadastro", (req, res) =>
  res.render("pages/cadastro", {
    título: "Cadastro",
    req,
    erro: null,
    sucesso: null,
  })
);

app.post("/cadastro", (req, res) => {
  const { cpf, email, password } = req.body;

  if (!cpf || !email || !password)
    return res.render("pages/cadastro", {
      título: "Cadastro",
      req,
      erro: "Preencha todos os campos!",
      sucesso: null,
    });

  dbUsers.run(
    "INSERT INTO users (cpf, email, password) VALUES (?, ?, ?)",
    [cpf, email, password],
    (err) => {
      if (err)
        return res.render("pages/cadastro", {
          título: "Cadastro",
          req,
          erro: "CPF ou E-mail já cadastrados!",
          sucesso: null,
        });

      res.render("pages/cadastro", {
        título: "Cadastro",
        req,
        erro: null,
        sucesso: "Usuário cadastrado com sucesso!",
      });
    }
  );
});

// ─────────────── DASHBOARD ───────────────
app.get("/dashboard", apenasadm, (req, res) =>
  res.render("pages/dashboard", {
    título: "Dashboard",
    req,
    user: req.session.user,
  })
);

// ─────────────── USUÁRIOS (ADMIN) ───────────────
app.get("/usuariosadm", apenasadm, (req, res) => {
  dbUsers.all("SELECT * FROM users", (err, users) =>
    res.render("pages/usuariosadm", {
      título: "Usuários",
      req,
      users,
    })
  );
});

// Criar usuário
app.post("/usuariosadm/criar", apenasadm, (req, res) => {
  const { cpf, email, password, adm, ativo } = req.body;

  dbUsers.run(
    "INSERT INTO users (cpf, email, password, adm, ativo) VALUES (?, ?, ?, ?, ?)",
    [cpf, email, password, Number(adm) || 0, Number(ativo) || 1],
    () => res.redirect("/usuariosadm")
  );
});

// Editar
app.post("/usuariosadm/editar/:id", apenasadm, (req, res) => {
  const { cpf, email, password, adm, ativo } = req.body;
  const id = req.params.id;

  const query = password
    ? "UPDATE users SET cpf=?, email=?, password=?, adm=?, ativo=? WHERE id=?"
    : "UPDATE users SET cpf=?, email=?, adm=?, ativo=? WHERE id=?";

  const params = password
    ? [cpf, email, password, adm, ativo, id]
    : [cpf, email, adm, ativo, id];

  dbUsers.run(query, params, () => res.redirect("/usuariosadm"));
});

// Deletar
app.post("/usuariosadm/deletar/:id", apenasadm, (req, res) => {
  dbUsers.run("DELETE FROM users WHERE id=?", [req.params.id], () =>
    res.redirect("/usuariosadm")
  );
});

// ─────────────── TABELA CAMPANHAS ───────────────
app.get("/tabela", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  dbCampanhas.all("SELECT * FROM campanhas", (err, campanhas) => {
    const agora = new Date();

    campanhas.forEach((c) => {
      if (c.ativa === 1 && new Date(c.data_fim) < agora) {
        dbCampanhas.run("UPDATE campanhas SET ativa=0 WHERE id=?", [c.id]);
        c.ativa = 0;
      }
    });

    res.render("pages/tabela", {
      campanhas,
      título: "Tabela de Campanhas",
      req,
    });
  });
});

// ─────────────── REALIZAR DOAÇÃO ───────────────
app.get("/realizardoacaocamp", apenasadmouminiadm, (req, res) => {
  const idCampanhaSelecionada = req.query.id_campanha || null;

  dbCampanhas.all("SELECT * FROM campanhas WHERE ativa=1", (err, campanhas) => {
    dbTurmas.all("SELECT * FROM turmas WHERE ativo=1", (err, turmas) => {
      dbCampanhas.all("SELECT * FROM itens", (err, roupas) => {
        res.render("pages/realizardoacaocamp", {
          campanhas,
          turmas,
          roupas,
          idCampanhaSelecionada,
          título: "Realizar Doação",
          req,
        });
      });
    });
  });
});

// Doação
app.post("/realizardoacao", apenasadmouminiadm, (req, res) => {
  const { id_campanha, id_turma, id_roupa, quantidade } = req.body;

  if (quantidade < 1 || quantidade > 99)
    return res.send("Quantidade inválida (1 a 99)");

  dbCampanhas.get(
    "SELECT pontos FROM itens WHERE id = ?",
    [id_roupa],
    (err, roupa) => {
      if (!roupa) return res.status(500).send("Erro ao buscar pontos");

      const pontosTotais = roupa.pontos * quantidade;

      dbDoacoes.run(
        "INSERT INTO doacoes (id_turma, id_item, quantidade, total_pontos) VALUES (?, ?, ?, ?)",
        [id_turma, id_roupa, quantidade, pontosTotais],
        () => res.redirect("/tabela")
      );
    }
  );
});

// ─────────────── CRIAR CAMPANHA ───────────────
app.get("/criarcampanha", apenasadm, (req, res) =>
  res.render("pages/criarcampanha", {
    título: "Criar Campanha",
    req,
    erro: null,
    sucesso: null,
  })
);

app.post("/criarcampanha", apenasadm, (req, res) => {
  const { nome, descricao, data_inicio, data_fim, nome_item, pontos } = req.body;

  if (!/^[A-Za-zÀ-ÿ\s]{1,40}$/.test(nome))
    return res.render("pages/criarcampanha", {
      título: "Criar Campanha",
      req,
      erro: "O nome da campanha deve conter apenas letras e até 40 caracteres.",
      sucesso: null,
    });

  for (let item of nome_item) {
    if (!/^[A-Za-zÀ-ÿ\s]{1,40}$/.test(item))
      return res.render("pages/criarcampanha", {
        título: "Criar Campanha",
        req,
        erro:
          "Os itens devem conter apenas letras e no máximo 40 caracteres.",
        sucesso: null,
      });
  }

  if (new Date(data_fim) < new Date(data_inicio))
    return res.render("pages/criarcampanha", {
      título: "Criar Campanha",
      req,
      erro: "A data de término não pode ser antes do início!",
      sucesso: null,
    });

  dbCampanhas.run(
    "INSERT INTO campanhas (nome, descricao, data_inicio, data_fim) VALUES (?, ?, ?, ?)",
    [nome, descricao || "", data_inicio, data_fim],
    function (err) {
      if (err)
        return res.render("pages/criarcampanha", {
          título: "Criar Campanha",
          req,
          erro: "Erro ao criar campanha!",
          sucesso: null,
        });

      const campanhaId = this.lastID;

      const stmt = dbCampanhas.prepare(
        "INSERT INTO itens (id_campanha, nome_item, pontos) VALUES (?, ?, ?)"
      );
      for (let i = 0; i < nome_item.length; i++) {
        if (nome_item[i] && pontos[i])
          stmt.run(campanhaId, nome_item[i], pontos[i]);
      }
      stmt.finalize();

      res.render("pages/criarcampanha", {
        título: "Criar Campanha",
        req,
        erro: null,
        sucesso: "Campanha criada com sucesso!",
      });
    }
  );
});

// ─────────────── DESATIVAR CAMPANHA VIA API
app.post("/api/campanhas/desativar/:id", (req, res) => {
  dbCampanhas.run(
    "UPDATE campanhas SET ativa=0 WHERE id=?",
    [req.params.id],
    () => res.json({ sucesso: true })
  );
});

// ─────────────── VER CAMPANHA
app.get("/campanhas/:id", (req, res) => {
  const idCampanha = req.params.id;

  dbCampanhas.all(
    "SELECT * FROM itens WHERE id_campanha = ?",
    [idCampanha],
    (err, itens) => {
      if (!itens || itens.length === 0)
        return res.send("Nenhum item cadastrado para esta campanha.");

      const itemIds = itens.map((i) => i.id);
      const placeholders = itemIds.map(() => "?").join(",");

      dbDoacoes.all(
        `
        SELECT id_turma, id_item, SUM(quantidade) AS total_itens, SUM(total_pontos) AS total_pontos
        FROM doacoes
        WHERE id_item IN (${placeholders})
        GROUP BY id_turma, id_item
      `,
        itemIds,
        (err, doacoes) => {
          if (!doacoes || doacoes.length === 0)
            return res.send("Nenhuma doação registrada ainda.");

          const turmaIds = [...new Set(doacoes.map((d) => d.id_turma))];
          const placeholdersTurmas = turmaIds.map(() => "?").join(",");

          dbTurmas.all(
            `SELECT id, sigla FROM turmas WHERE id IN (${placeholdersTurmas})`,
            turmaIds,
            (err, turmas) => {
              const siglas = {};
              turmas.forEach((t) => (siglas[t.id] = t.sigla));

              const itemMap = {};
              itens.forEach(
                (i) => (itemMap[i.id] = { nome: i.nome_item, pontos: i.pontos })
              );

              const turmasDoacoes = {};

              doacoes.forEach((d) => {
                if (!turmasDoacoes[d.id_turma])
                  turmasDoacoes[d.id_turma] = {
                    sigla: siglas[d.id_turma],
                    itens: [],
                  };

                turmasDoacoes[d.id_turma].itens.push({
                  nome: itemMap[d.id_item].nome,
                  quantidade: d.total_itens,
                  pontos: d.total_pontos,
                });
              });

              res.render("pages/verCampanha", {
                título: `Campanha ${idCampanha}`,
                campanha: { id: idCampanha },
                turmasDoacoes,
                req,
              });
            }
          );
        }
      );
    }
  );
});

// ─────────────── 404 ───────────────
app.use((req, res) =>
  res
    .status(404)
    .render("pages/fail", { título: "HTTP ERROR 404", req, msg: "404" })
);

// ─────────────── Servidor ───────────────
app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);

