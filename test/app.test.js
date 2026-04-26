const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
process.env.API_KEY = process.env.API_KEY || 'dev-api-key';

const { app, api } = require('../server');

const catwaysFile = path.join(__dirname, '..', 'public', 'json', 'catways.json');
const reservationsFile = path.join(__dirname, '..', 'public', 'json', 'reservations.json');

let apiServer;
let webServer;
let apiBaseUrl;
let webBaseUrl;
let catwaysBackup;
let reservationsBackup;

const fetchText = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  return { response, text };
};

test.before(async () => {
  catwaysBackup = fs.readFileSync(catwaysFile, 'utf-8');
  reservationsBackup = fs.readFileSync(reservationsFile, 'utf-8');

  apiServer = api.listen(0);
  await new Promise((resolve) => apiServer.once('listening', resolve));
  apiBaseUrl = `http://127.0.0.1:${apiServer.address().port}`;
  process.env.API_BASE_URL = apiBaseUrl;

  webServer = app.listen(0);
  await new Promise((resolve) => webServer.once('listening', resolve));
  webBaseUrl = `http://127.0.0.1:${webServer.address().port}`;
});

test.after(async () => {
  if (webServer) {
    await new Promise((resolve) => webServer.close(resolve));
  }
  if (apiServer) {
    await new Promise((resolve) => apiServer.close(resolve));
  }

  if (catwaysBackup !== undefined) {
    fs.writeFileSync(catwaysFile, catwaysBackup, 'utf-8');
  }
  if (reservationsBackup !== undefined) {
    fs.writeFileSync(reservationsFile, reservationsBackup, 'utf-8');
  }
});

test('GET /catways returns imported catways', async () => {
  const { response, text } = await fetchText(`${apiBaseUrl}/catways`);
  assert.equal(response.status, 200);
  const payload = JSON.parse(text);
  assert.ok(Array.isArray(payload));
  assert.equal(payload[0].catwayNumber, 1);
});

test('protected API rejects mutating requests without API key', async () => {
  const { response } = await fetchText(`${apiBaseUrl}/catways`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ catwayNumber: 99, type: 'short', catwayState: 'bon état' })
  });

  assert.equal(response.status, 401);
});

test('POST and DELETE /catways work with API key', async () => {
  const catwayNumber = 99;

  const create = await fetchText(`${apiBaseUrl}/catways`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY
    },
    body: JSON.stringify({ catwayNumber, type: 'short', catwayState: 'bon état' })
  });

  assert.equal(create.response.status, 201);

  const remove = await fetchText(`${apiBaseUrl}/catways/${catwayNumber}`, {
    method: 'DELETE',
    headers: { 'x-api-key': process.env.API_KEY }
  });

  assert.equal(remove.response.status, 204);
});

test('nested reservation routes are available', async () => {
  const catwayNumber = 98;
  const reservationBody = {
    clientName: 'Test Client',
    boatName: 'Test Boat',
    checkIn: '2026-05-01',
    checkOut: '2026-05-02'
  };

  await fetchText(`${apiBaseUrl}/catways`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY
    },
    body: JSON.stringify({ catwayNumber, type: 'long', catwayState: 'bon état' })
  });

  const created = await fetchText(`${apiBaseUrl}/catways/${catwayNumber}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY
    },
    body: JSON.stringify(reservationBody)
  });

  assert.equal(created.response.status, 201);
  const reservation = JSON.parse(created.text);
  assert.equal(reservation.catwayNumber, catwayNumber);

  const nested = await fetchText(`${apiBaseUrl}/catways/${catwayNumber}/reservations/${reservation.idReservation}`);
  assert.equal(nested.response.status, 200);

  const deleteReservation = await fetchText(`${apiBaseUrl}/catways/${catwayNumber}/reservations/${reservation.idReservation}`, {
    method: 'DELETE',
    headers: { 'x-api-key': process.env.API_KEY }
  });
  assert.equal(deleteReservation.response.status, 204);

  await fetchText(`${apiBaseUrl}/catways/${catwayNumber}`, {
    method: 'DELETE',
    headers: { 'x-api-key': process.env.API_KEY }
  });
});

test('login requires valid credentials', async () => {
  const invalid = await fetchText(`${webBaseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'bad', password: 'bad' })
  });

  assert.match(invalid.text, /Identifiants invalides/);

  const valid = await fetchText(`${webBaseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'admin', password: 'admin' }),
    redirect: 'manual'
  });

  assert.equal(valid.response.status, 302);
  const cookie = valid.response.headers.get('set-cookie');
  assert.ok(cookie);

  const dashboard = await fetchText(`${webBaseUrl}/dashboard`, {
    headers: { Cookie: cookie }
  });

  assert.equal(dashboard.response.status, 200);
  assert.match(dashboard.text, /Tableau de Bord/);
});
