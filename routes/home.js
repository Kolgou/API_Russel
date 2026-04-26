const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { user: req.session.user, error: undefined });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const isValidLogin = username === 'admin' && password === 'admin';

  if (!isValidLogin) {
    res.render('home', { error: 'Identifiants invalides', user: req.session.user });
    return;
  }

  req.session.user = { username, id: 1 };
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
