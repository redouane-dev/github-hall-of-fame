'use strict';

const express = require('express');
const expressPlayground = require('graphql-playground-middleware-express').default;

const DataFetcher = require ('./dataFetcher');

// Load configuration
const config = require('../config/config')
const secret = require('../config/secret')

const PORT = config['default']['port'] || 4000;

// Connect and fetch data from the GraphQL API endpoint
let d = new DataFetcher(
    config['github-api']['url'],
    secret['github-api']['token'],
    config['database']
);

// Periodically fetch and store data
try {
    setInterval(
        () => d.query('is:public stars:>1000', config['default']['pagination-page-size']),
        config['default']['interval-mn'] * 60 * 1000    // Milliseconds
    );
    // d.paginatedQuery('is:public stars:>1000', 10, 1);

} catch (error) {
    console.error(error);   
}


const app = express();

// Redirect to Grafana dashboard
// app.get('/', (req, res) => res.redirect(req.headers.host + ':3000'));

// Start GraphQL Playground
app.get(
    '/playground',
    expressPlayground({
        endpoint: config['github-api']['url'],
        headers: {
            'Authorization': `Bearer <please insert your token here>`
        }
    }),
);

// Start the Express app
app.listen(PORT);
console.log(
    `Serving the GraphQL Playground on http://localhost:${PORT}/playground`,
);
