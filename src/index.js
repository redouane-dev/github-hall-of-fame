"use strict"

const express = require('express')
const expressPlayground = require('graphql-playground-middleware-express').default

// Load configuration
const config = require('../config/config')
const secret = require('../config/secret')

const PORT = config['default']['port'] || 4000


const app = express()
app.get(
    '/playground',
    expressPlayground({
        endpoint: config['github-api']['url'],
        headers: {
            "Authorization": "Bearer " + secret['github-api']['token']
        }
    }),
)

// Start the Express app
app.listen(PORT)
console.log(
    `Serving the GraphQL Playground on http://localhost:${PORT}/playground`,
)