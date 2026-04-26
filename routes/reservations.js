const express = require('express');
const router = express.Router();
const axios = require('axios');

const getApiBaseUrl = () => process.env.API_BASE_URL || 'http://localhost:5000';

router.get('/', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get(`${apiBaseUrl}/reservations`);
    res.render('reservations-list', {
      user: req.session.user,
      reservations: response.data || [],
      error: undefined
    });
  } catch (error) {
    res.render('reservations-list', {
      user: req.session.user,
      reservations: [],
      error: 'Erreur lors du chargement des réservations'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const reservation = await axios.get(`${apiBaseUrl}/reservations/${req.params.id}`);
    res.render('reservation-detail', {
      user: req.session.user,
      reservation: reservation.data
    });
  } catch (error) {
    res.status(404).render('404');
  }
});

module.exports = router;
