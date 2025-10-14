const express = require('express');
const { login, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', login);

// Perfil del usuario autenticado
router.get('/profile', authenticateToken, getProfile);

module.exports = router;