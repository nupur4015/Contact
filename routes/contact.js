const { Router } = require('express');
const pool = require('../db');

const router = Router();
router.get('/', (request, response, next) => {
    pool.query('SELECT * FROM contact ORDER BY id ASC', (err, res) => {
      if (err) return next(err);
  
      response.json(res.rows);
    });
  });
  router.post('/', (request, response, next) => {
    const { email, phonenumber } = request.body;
    const linkprecedence='primary';
    pool.query(
        'INSERT INTO contact (phoneNumber, email, linkPrecedence) VALUES ($1, $2, $3)',
       [ phonenumber, email, linkprecedence],
      (err, res) => {
        if (err) return next(err);
  
        response.redirect('/');
      }
    );
  });  
  module.exports = router;