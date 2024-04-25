const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const port = 4000;

// Create a PostgreSQL pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'twitterpostdb',
    password: '1234',
    port: 5432
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// GET API endpoint for retrieving saved posts with pagination
app.get('/api/posts', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const queryResult = await pool.query('SELECT * FROM posts ORDER BY date DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const posts = queryResult.rows;

        res.json(posts);
    } catch (error) {
        console.error('Error retrieving posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
