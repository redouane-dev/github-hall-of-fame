'use strict';

const fetch = require ('node-fetch');
const { InMemoryCache } = require ('apollo-cache-inmemory');
const { HttpLink } = require ('apollo-link-http');
const { ApolloClient, gql } = require ('apollo-boost');

/*
 * Define a class that wraps methods to fetch and store GitHub repositories statistics from the
 * GraphQL API.
 */
module.exports =  class DataFetcher {

    /*
     * Constructor for the class DataFetcher
     *
     * @arg uri: (String) URI of the GitHub GraphQL API.
     * @arg token: (String) GitHub API authorization token.
     * 
     * @return: None
     */
    constructor (uri, token) {
        this.uri = uri;
        this.token = `Bearer ${token}`;

        this._initGraphqlClient();
    }

    /*
     * Helper method to initialize the GraphQL client.
     *
     * @arg: None
     * @return: None
     */
    _initGraphqlClient() {
        const httpLink = new HttpLink({
            uri: this.uri,
            fetch: fetch,
            headers: {
                'Authorization': this.token
            }
        });

        this.graphqlClient = new ApolloClient({
            link: httpLink,
            cache: new InMemoryCache({ addTypename: true }),
        });
    }

    /*
     * Perform a query using GaphQL client.
     *
     * @arg query: (String) query to perform.
     * @arg first: (Integer) Number of responses to return, e.g. first: 10.
     * @arg after: (String, optional) GitHub cursor for offsetting the response.
     * 
     * @return: None
     */
    query(query, first, after) {
        let searchArguments = `query: "${query}", type:REPOSITORY, first: ${first}`;
        if (after !== undefined)
            searchArguments = searchArguments.concat(`, after:"${after}"`);

        this.graphqlClient
            .query({
                query: gql`
                    query {
                        search(${searchArguments}) {
                            edges {
                               cursor
                            }
                            nodes {
                                ... on Repository {
                                    name
                                    url
                                    stargazers {
                                        totalCount
                                    }
                                    forks {
                                        totalCount
                                    }
                                    owner {
                                        login
                                    }
                                    primaryLanguage {
                                        name
                                    }
                                }
                            }
                        }
                    }
                `
            })
            .then(result => {
                let data = result.data.search.nodes;
                let lastCursor = result.data.search.edges.slice(-1)[0]['cursor'];

                console.log(JSON.stringify(data, null, 4));
            })
            .catch(error => console.log(JSON.stringify(error, null, 4)));
    }
}

