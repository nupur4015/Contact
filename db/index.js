const { Pool } = require('pg');

const pool = new Pool({ 
    user: 'hggdocqp', 
    host: 'bubble.db.elephantsql.com', 
    database: 'hggdocqp', 
    password: 'a92BLoYLgAhJAmR3-nWVfSsKOH1OQJUU', 
    port:'5432' 
});

module.exports = pool;