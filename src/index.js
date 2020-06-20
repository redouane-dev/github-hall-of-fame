'use strict';

const express = require('express');
const expressPlayground = require('graphql-playground-middleware-express').default;

const DataFetcher = require ('./dataFetcher');

// Load configuration
const config = require('../config/config')
const secret = require('../config/secret')

const PORT = config['default']['port'] || 4000;

//
let d = new DataFetcher(
    config['github-api']['url'],
    secret['github-api']['token']
);

try {
    // d.query('is:public stars:>1000', 10);
    // d.paginatedQuery('is:public stars:>1000', 10, 1);


    setInterval(
        () => d.query('is:public stars:>1000', 100),
        1000
    );

} catch (error) {
    console.error(error);   
}


const app = express()
app.get(
    '/playground',
    expressPlayground({
        endpoint: config['github-api']['url'],
        headers: {
            'Authorization': `Bearer ${secret['github-api']['token']}`
        }
    }),
)

// Start the Express app
app.listen(PORT)
console.log(
    `Serving the GraphQL Playground on http://localhost:${PORT}/playground`,
)