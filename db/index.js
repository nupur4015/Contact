const { Pool } = require('pg');

const pool = new Pool({ 
    user: 'node_user', 
    host: 'localhost', 
    database: 'contactdb', 
    password: 'nupur1234', 
    port:'5432' 
});

module.exports = pool;