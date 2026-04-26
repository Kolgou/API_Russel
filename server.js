const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;
const API_KEY = process.env.API_KEY || 'dev-api-key';

const CATWAYS_FILE = path.join(__dirname, 'public', 'json', 'catways.json');
const RESERVATIONS_FILE = path.join(__dirname, 'public', 'json', 'reservations.json');

const nowIso = () => new Date().toISOString();

const readJsonArray = (filePath) => {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Impossible de lire ${filePath}:`, error.message);
    return [];
  }
};

const writeJsonArray = (filePath, collection) => {
  fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), 'utf-8');
};

const ensureReservationIds = (reservations) => {
  let changed = false;
  const normalized = reservations.map((reservation, index) => {
    if (reservation.idReservation !== undefined && reservation.idReservation !== null) {
      return reservation;
    }

    changed = true;
    return {
      ...reservation,
      idReservation: index + 1
    };
  });

  return { normalized, changed };
};

const loadedReservations = readJsonArray(RESERVATIONS_FILE);
const reservationsWithIds = ensureReservationIds(loadedReservations);

if (reservationsWithIds.changed) {
  writeJsonArray(RESERVATIONS_FILE, reservationsWithIds.normalized);
}

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
  catways: readJsonArray(CATWAYS_FILE),
  reservations: reservationsWithIds.normalized
};

const nextId = (collection) => {
  if (!collection.length) return 1;
  return Math.max(...collection.map((item) => Number(item.id) || 0)) + 1;
};

const findById = (collection, id) => collection.find((item) => String(item.id) === String(id));
const findCatway = (catwayNumber) => db.catways.find((item) => Number(item.catwayNumber) === Number(catwayNumber));
const findReservation = (idReservation) => db.reservations.find((item) => Number(item.idReservation) === Number(idReservation));

const saveCatways = () => writeJsonArray(CATWAYS_FILE, db.catways);
const saveReservations = () => writeJsonArray(RESERVATIONS_FILE, db.reservations);

const isValidCatwayType = (value) => value === 'long' || value === 'short';

const requireApiKey = (req, res, next) => {
  if (req.header('x-api-key') === API_KEY) {
    next();
    return;
  }

  res.status(401).json({ error: 'Clé API invalide' });
};

const validateReservationDates = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return false;
  }
  return start <= end;
};

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

api.post('/users', requireApiKey, (req, res) => {
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

api.put('/users/:id', requireApiKey, (req, res) => {
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

api.delete('/users/:id', requireApiKey, (req, res) => {
  const index = db.users.findIndex((u) => String(u.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  db.users.splice(index, 1);
  res.status(204).send();
});

api.get('/catways', (req, res) => {
  const catways = [...db.catways].sort((a, b) => Number(a.catwayNumber) - Number(b.catwayNumber));
  res.json(catways);
});

api.get('/catways/:id', (req, res) => {
  const catway = findCatway(req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }
  res.json(catway);
});

api.post('/catways', requireApiKey, (req, res) => {
  const { catwayNumber, type, catwayState } = req.body;
  if (catwayNumber === undefined || !type || !catwayState) {
    return res.status(400).json({ error: 'catwayNumber, type et catwayState sont requis' });
  }

  if (!isValidCatwayType(type)) {
    return res.status(400).json({ error: 'type doit être long ou short' });
  }

  if (findCatway(catwayNumber)) {
    return res.status(409).json({ error: 'Ce catway existe déjà' });
  }

  const catway = {
    catwayNumber: Number(catwayNumber),
    type,
    catwayState,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.catways.push(catway);
  saveCatways();
  res.status(201).json(catway);
});

api.put('/catways/:id', requireApiKey, (req, res) => {
  const { type, catwayState } = req.body;
  const catway = findCatway(req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  if (!type || !catwayState) {
    return res.status(400).json({ error: 'type et catwayState sont requis pour un PUT' });
  }

  if (!isValidCatwayType(type)) {
    return res.status(400).json({ error: 'type doit être long ou short' });
  }

  catway.type = type;
  catway.catwayState = catwayState;
  catway.updatedAt = nowIso();
  saveCatways();
  res.json(catway);
});

api.patch('/catways/:id', requireApiKey, (req, res) => {
  const { type, catwayState } = req.body;
  const catway = findCatway(req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  if (type !== undefined) {
    if (!isValidCatwayType(type)) {
      return res.status(400).json({ error: 'type doit être long ou short' });
    }
    catway.type = type;
  }

  if (catwayState !== undefined) {
    catway.catwayState = catwayState;
  }

  catway.updatedAt = nowIso();
  saveCatways();
  res.json(catway);
});

api.delete('/catways/:id', requireApiKey, (req, res) => {
  const catwayNumber = Number(req.params.id);
  const index = db.catways.findIndex((c) => Number(c.catwayNumber) === catwayNumber);
  if (index === -1) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  db.catways.splice(index, 1);
  db.reservations = db.reservations.filter((r) => Number(r.catwayNumber) !== catwayNumber);

  saveCatways();
  saveReservations();

  res.status(204).send();
});

api.get('/catways/:id/reservations', (req, res) => {
  const catway = findCatway(req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  const reservations = db.reservations.filter((item) => Number(item.catwayNumber) === Number(req.params.id));
  res.json(reservations);
});

const getSingleNestedReservation = (req, res) => {
  const catway = findCatway(req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  const reservation = db.reservations.find(
    (item) => Number(item.catwayNumber) === Number(req.params.id) && Number(item.idReservation) === Number(req.params.idReservation)
  );

  if (!reservation) {
    return res.status(404).json({ error: 'Réservation non trouvée pour ce catway' });
  }

  res.json(reservation);
};

api.get('/catways/:id/reservations/:idReservation', getSingleNestedReservation);
api.get('/catway/:id/reservations/:idReservation', getSingleNestedReservation);

api.post('/catways/:id/reservations', requireApiKey, (req, res) => {
  const catway = findCatway(req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  const { clientName, boatName, checkIn, checkOut } = req.body;
  if (!clientName || !boatName || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'clientName, boatName, checkIn et checkOut sont requis' });
  }

  if (!validateReservationDates(checkIn, checkOut)) {
    return res.status(400).json({ error: 'Les dates checkIn/checkOut sont invalides' });
  }

  const reservation = {
    idReservation: nextId(db.reservations.map((r) => ({ id: r.idReservation }))),
    catwayNumber: Number(req.params.id),
    clientName,
    boatName,
    checkIn,
    checkOut,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.reservations.push(reservation);
  saveReservations();
  res.status(201).json(reservation);
});

const deleteNestedReservation = (req, res) => {
  const catway = findCatway(req.params.id);
  if (!catway) {
    return res.status(404).json({ error: 'Catway non trouvé' });
  }

  const index = db.reservations.findIndex(
    (item) => Number(item.catwayNumber) === Number(req.params.id) && Number(item.idReservation) === Number(req.params.idReservation)
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Réservation non trouvée pour ce catway' });
  }

  db.reservations.splice(index, 1);
  saveReservations();
  res.status(204).send();
};

api.delete('/catways/:id/reservations/:idReservation', requireApiKey, deleteNestedReservation);
api.delete('/catway/:id/reservations/:idReservation', requireApiKey, deleteNestedReservation);

api.get('/reservations', (req, res) => {
  res.json([...db.reservations].sort((a, b) => Number(a.idReservation) - Number(b.idReservation)));
});

api.get('/reservations/:idReservation', (req, res) => {
  const reservation = findReservation(req.params.idReservation);
  if (!reservation) {
    return res.status(404).json({ error: 'Réservation non trouvée' });
  }
  res.json(reservation);
});

api.delete('/reservations/:idReservation', requireApiKey, (req, res) => {
  const index = db.reservations.findIndex((r) => Number(r.idReservation) === Number(req.params.idReservation));
  if (index === -1) {
    return res.status(404).json({ error: 'Réservation non trouvée' });
  }

  db.reservations.splice(index, 1);
  saveReservations();
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

module.exports = { app, api, API_KEY };

if (require.main === module) {
  startServer(api, API_PORT, 'API', (runningPort) => {
    process.env.API_BASE_URL = `http://localhost:${runningPort}`;
    console.log(`API_BASE_URL actif: ${process.env.API_BASE_URL}`);
  });
  startServer(app, PORT, 'Serveur web');
}
