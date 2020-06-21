'use strict';

const fetch = require('node-fetch');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { HttpLink } = require('apollo-link-http');
const { ApolloClient, gql } = require('apollo-boost');

const Influx = require('influx');

/*
 * Define a class that wraps methods to fetch and store GitHub repositories statistics from the
 * GraphQL API.
 */
module.exports = class DataFetcher {

    /*
     * Constructor for the class DataFetcher
     *
     * @arg uri: (String) URI of the GitHub GraphQL API.
     * @arg token: (String) GitHub API authorization token.
     * 
     * @return: None
     */
    constructor(uri, token, databaseConfig) {
        this.uri = uri;
        this.token = `Bearer ${token}`;

        // Set database configuration
        this.databaseHost = databaseConfig['host'];
        this.databasePort = databaseConfig['port'];
        this.databaseName = databaseConfig['name'];
        this.databaseMeasurement = databaseConfig['measurement'];
        this.databaseUsername = databaseConfig['username'];
        this.databasePassword = databaseConfig['password'];
        this.isDatabaseExist = false;

        // Initialize services
        this._initGraphqlClient();
        this._initDatabase();
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
     * Helper method to initialize the InfluxDB client
     *
     * @arg: None
     * @return: None
     */
    _initDatabase() {

        // Connect to the DB server and define the schema to use (optional)
        this.influxdbClient = new Influx.InfluxDB({
            host: this.databaseHost,
            port: this.databasePort,
            database: this.databaseName,
            username: this.databaseUsername,
            password: this.databasePassword,
            schema: [
                {
                    measurement: this.databaseMeasurement,
                    // Tags are meta-data stored as string values and indexed for faster search
                    tags: [
                        'owner',
                        'language'
                    ],
                    // Fields are the measured values, or values of interest (not indexed)
                    fields: {
                        name: Influx.FieldType.STRING,
                        url: Influx.FieldType.STRING,
                        stargazersCount: Influx.FieldType.INTEGER,
                        forksCount: Influx.FieldType.INTEGER
                    }
                }
            ]
        });

        // Check if schema exists, otherwise create it
        this.influxdbClient.getDatabaseNames()
            .then(names => {
                if (!names.includes(this.databaseName)) {
                    return this.influxdbClient.createDatabase(this.databaseName);
                }
            })
            .then(() => {
                this.isDatabaseExist = true;
                console.log(`Database '${this.databaseName}' is now available for storage!'`);
            })
            .catch(err => {
                console.error(`Error creating database '${this.databaseName}': ${err}`);
            });
    }

    /*
     * Perform a query using GaphQL client.
     *
     * The query used fetches repositories ordered by descending number of stars and returns
     * fields:
     *  - owner
     *  - language
     *  - repository name
     *  - url to repository
     *  - stargazers count
     *  - forks count
     *  - cursor of each repo
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

                // console.log(JSON.stringify(data, null, 4));

                let points = data.map(val => {
                    return {
                        tags: {
                            owner: val["owner"]["login"],
                            language: (val["primaryLanguage"] === null) ?
                                null : val["primaryLanguage"]["name"]
                        },
                        fields: {
                            name: val["name"],
                            url: val["url"],
                            stargazersCount: val["stargazers"]["totalCount"],
                            forksCount: val["forks"]["totalCount"]
                        }
                    };
                });

                this.store(points);

                // console.log(lastCursor);
                // return lastCursor;

            })
            .catch(error => console.log(JSON.stringify(error, null, 4)));
    }

    /*
     * Store repositories information in InfluxDB.
     *
     * @arg points: (Array) List of repositories data to store in the schema.
     * 
     * @return: None
     */
    store(points) {
        if (this.isDatabaseExist === true) {
            this.influxdbClient.writeMeasurement(this.databaseMeasurement, points)
                .then(() => {
                    console.log(`Successfully inserted batch size ${points.length}`);
                })
                .catch(err => console.error(err));
        } else {
            // Re-attempt a DB connection
            this._initDatabase();
        }
    }


    // async paginatedQuery(query, pagesCount = 10, elementsPerPage = 100) {
    //     let lastCursor;
    //     for (let page = 0; page < pagesCount; page++) {
    //         lastCursor = await this.query(query, elementsPerPage, lastCursor);
    //         console.log(lastCursor);
    //     }
    // }
}

