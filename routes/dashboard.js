const express = require('express');
const router = express.Router();
const axios = require('axios');

const getApiBaseUrl = () => process.env.API_BASE_URL || 'http://localhost:5000';

// GET Dashboard
router.get('/', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const [catways, reservations] = await Promise.all([
      axios.get(`${apiBaseUrl}/catways`).catch(() => ({ data: [] })),
      axios.get(`${apiBaseUrl}/reservations`).catch(() => ({ data: [] }))
    ]);

    res.render('dashboard', {
      user: req.session.user,
      catways: catways.data || [],
      reservations: reservations.data || [],
      message: req.query.message,
      error: req.query.error
    });
  } catch (error) {
    res.render('dashboard', {
      user: req.session.user,
      catways: [],
      reservations: [],
      error: 'Erreur lors du chargement des données',
      message: req.query.message
    });
  }
});

router.post('/users', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const { username, email, password } = req.body;
    const response = await axios.post(`${apiBaseUrl}/users`, { username, email, password });
    const userId = response.data.id;
    res.redirect('/dashboard?message=' + encodeURIComponent(`Utilisateur créé (ID: ${userId})`));
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur création utilisateur'));
  }
});

router.post('/users/:id', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const { username, email } = req.body;
    await axios.put(`${apiBaseUrl}/users/${req.params.id}`, { username, email });
    res.redirect('/dashboard?message=Utilisateur modifié');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur modification utilisateur'));
  }
});

router.post('/users/:id/delete', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    await axios.delete(`${apiBaseUrl}/users/${req.params.id}`);
    res.redirect('/dashboard?message=Utilisateur supprimé');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur suppression utilisateur'));
  }
});

router.post('/catways', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const { number, status } = req.body;
    const response = await axios.post(`${apiBaseUrl}/catways`, { number, status });
    const catwayId = response.data.id;
    res.redirect('/dashboard?message=' + encodeURIComponent(`Catway créé (ID: ${catwayId})`));
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur création catway'));
  }
});

router.post('/catways/:id', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const { status } = req.body;
    await axios.put(`${apiBaseUrl}/catways/${req.params.id}`, { status });
    res.redirect('/dashboard?message=Catway modifié');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur modification catway'));
  }
});

router.post('/catways/:id/delete', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    await axios.delete(`${apiBaseUrl}/catways/${req.params.id}`);
    res.redirect('/dashboard?message=Catway supprimé');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur suppression catway'));
  }
});

router.post('/reservations', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const { catwayId, clientName, clientEmail, startDate, endDate } = req.body;
    await axios.post(`${apiBaseUrl}/reservations`, {
      catwayId,
      clientName,
      clientEmail,
      startDate,
      endDate
    });
    res.redirect('/dashboard?message=Réservation créée');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur création réservation'));
  }
});

router.post('/reservations/:id/delete', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    await axios.delete(`${apiBaseUrl}/reservations/${req.params.id}`);
    res.redirect('/dashboard?message=Réservation supprimée');
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Erreur suppression réservation'));
  }
});

router.get('/catway/:id', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const catway = await axios.get(`${apiBaseUrl}/catways/${req.params.id}`);
    res.render('catway-detail', { user: req.session.user, catway: catway.data });
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Catway non trouvé'));
  }
});

router.get('/reservation/:id', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const reservation = await axios.get(`${apiBaseUrl}/reservations/${req.params.id}`);
    res.render('reservation-detail', { user: req.session.user, reservation: reservation.data });
  } catch (error) {
    res.redirect('/dashboard?error=' + encodeURIComponent('Réservation non trouvée'));
  }
});

module.exports = router;
