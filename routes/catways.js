const express = require('express');
const router = express.Router();
const axios = require('axios');

const getApiBaseUrl = () => process.env.API_BASE_URL || 'http://localhost:5000';

router.get('/', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await axios.get(`${apiBaseUrl}/catways`);
    res.render('catways-list', {
      user: req.session.user,
      catways: response.data || [],
      error: undefined
    });
  } catch (error) {
    res.render('catways-list', {
      user: req.session.user,
      catways: [],
      error: 'Erreur lors du chargement des catways'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const catway = await axios.get(`${apiBaseUrl}/catways/${req.params.id}`);
    res.render('catway-detail', {
      user: req.session.user,
      catway: catway.data
    });
  } catch (error) {
    res.status(404).render('404');
  }
});

module.exports = router;
