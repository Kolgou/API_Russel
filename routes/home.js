const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { user: req.session.user, error: undefined });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username && password) {
    req.session.user = { username, id: 1 };
    res.redirect('/dashboard');
  } else {
    res.render('home', { error: 'Identifiants invalides', user: req.session.user });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
