const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

// In-memory API store so the web app can run without an external backend.
const nowIso = () => new Date().toISOString();
const db = {
  users: [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin',
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ],
  catways: [
    {
      id: 1,
      number: 'A1',
      status: 'disponible',
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  ],
  reservations: []
};

const nextId = (collection) => {
  if (!collection.length) return 1;
  return Math.max(...collection.map((item) => Number(item.id) || 0)) + 1;
};

const findById = (collection, id) => collection.find((item) => String(item.id) === String(id));

const api = express();
api.use(express.json());
api.use(express.urlencoded({ extended: true }));

api.get('/users', (req, res) => {
  const usersWithoutPassword = db.users.map(({ password, ...safeUser }) => safeUser);
  res.json(usersWithoutPassword);
});

api.get('/users/:id', (req, res) => {
  const user = findById(db.users, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  const { password, ...safeUser } = user;
  res.json(safeUser);
});

api.post('/users', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email et password sont requis' });
  }

  const duplicate = db.users.find((u) => u.email === email || u.username === username);
  if (duplicate) {
    return res.status(409).json({ error: 'Utilisateur déjà existant' });
  }

  const user = {
    id: nextId(db.users),
    username,
    email,
    password,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.users.push(user);
  const { password: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

api.put('/users/:id', (req, res) => {
  const { username, email } = req.body;
  const user = findById(db.users, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  if (username) user.username = username;
  if (email) user.email = email;
  user.updatedAt = nowIso();

  const { password, ...safeUser } = user;
  res.json(safeUser);
});

api.delete('/users/:id', (req, res) => {
  const index = db.users.findIndex((u) => String(u.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  db.users.splice(index, 1);
  res.status(204).send();
});

api.get('/catways', (req, res) => {
  res.json(db.catways);
});

api.get('/catways/:id', (req, res) => {
  const catway = findById(db.catways, req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }
  res.json(catway);
});

api.post('/catways', (req, res) => {
  const { number, status } = req.body;
  if (!number || !status) {
    return res.status(400).json({ error: 'number et status sont requis' });
  }

  const catway = {
    id: nextId(db.catways),
    number,
    status,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.catways.push(catway);
  res.status(201).json(catway);
});

api.put('/catways/:id', (req, res) => {
  const { status } = req.body;
  const catway = findById(db.catways, req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  if (status) catway.status = status;
  catway.updatedAt = nowIso();
  res.json(catway);
});

api.delete('/catways/:id', (req, res) => {
  const index = db.catways.findIndex((c) => String(c.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  const catwayId = String(req.params.id);
  db.catways.splice(index, 1);
  db.reservations = db.reservations.filter((r) => String(r.catwayId) !== catwayId);

  res.status(204).send();
});

api.get('/reservations', (req, res) => {
  res.json(db.reservations);
});

api.get('/reservations/:id', (req, res) => {
  const reservation = findById(db.reservations, req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Réservation non trouvée' });
  }
  res.json(reservation);
});

api.post('/reservations', (req, res) => {
  const { catwayId, clientName, clientEmail, startDate, endDate } = req.body;
  if (!catwayId || !clientName || !clientEmail || !startDate || !endDate) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const catway = findById(db.catways, catwayId);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  const reservation = {
    id: nextId(db.reservations),
    catwayId: Number(catwayId),
    clientName,
    clientEmail,
    startDate,
    endDate,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.reservations.push(reservation);
  res.status(201).json(reservation);
});

api.delete('/reservations/:id', (req, res) => {
  const index = db.reservations.findIndex((r) => String(r.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Réservation non trouvée' });
  }

  db.reservations.splice(index, 1);
  res.status(204).send();
});

const startServer = (instance, preferredPort, serverName, onStarted) => {
  const tryListen = (portToUse) => {
    const server = instance
      .listen(portToUse, () => {
        console.log(`${serverName} démarré sur http://localhost:${portToUse}`);
        if (typeof onStarted === 'function') {
          onStarted(Number(portToUse));
        }
      })
      .on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.warn(`Port ${portToUse} occupé pour ${serverName}, tentative sur ${Number(portToUse) + 1}...`);
          tryListen(Number(portToUse) + 1);
          return;
        }

        throw error;
      });
  };

  tryListen(Number(preferredPort));
};

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
};

app.use('/', require('./routes/home'));
app.use('/dashboard', requireAuth, require('./routes/dashboard'));
app.use('/catways', require('./routes/catways'));
app.use('/reservations', require('./routes/reservations'));
app.use('/documentation', require('./routes/documentation'));

app.use((req, res) => {
  res.status(404).render('404');
});

startServer(api, API_PORT, 'API', (runningPort) => {
  process.env.API_BASE_URL = `http://localhost:${runningPort}`;
  console.log(`API_BASE_URL actif: ${process.env.API_BASE_URL}`);
});
startServer(app, PORT, 'Serveur web');
