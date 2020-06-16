"use strict"

const fetch = require('node-fetch');
const express = require("express");
const expressPlayground = require("graphql-playground-middleware-express").default;
const { InMemoryCache } = require("apollo-cache-inmemory");
const { HttpLink } = require("apollo-link-http");
const { ApolloClient, gql } = require("apollo-boost");


// Load configuration
const config = require('../config/config')
const secret = require('../config/secret')

const PORT = config['default']['port'] || 4000

//
const httpLink = new HttpLink({
    uri: config['github-api']['url'],
    fetch: fetch,
    headers: {
        'Authorization': `Bearer ${secret['github-api']['token']}`
    }
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

client
    .query({
        query: gql`
query { 
  viewer { 
    login
  }
}
        `
    })
    .then(result => console.log(JSON.stringify(result, null, 4)))
    .catch(error => console.log(JSON.stringify(error, null, 4)));


const app = express()
app.get(
    '/playground',
    expressPlayground({
        endpoint: config['github-api']['url'],
        headers: {
            "Authorization": `Bearer ${secret['github-api']['token']}`
        }
    }),
)

// Start the Express app
app.listen(PORT)
console.log(
    `Serving the GraphQL Playground on http://localhost:${PORT}/playground`,
)