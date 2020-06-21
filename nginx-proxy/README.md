# nginx-proxy
Reverse proxy to enable LetsEncrypt SSL encryption. 

## How to
1. Add following snippet as environment variables to you docker-compose servies that will serve a port or endpoint:
```
environment:
...
    # Nginx Reverse Proxy configuration (SSL Encryption)
    - "VIRTUAL_PORT=<your-application-port>"
    - "VIRTUAL_HOST=<subdomain.domain.tld>"
    - "LETSENCRYPT_HOST=<subdomain.domain.tld>"
    - "LETSENCRYPT_EMAIL=<mail@yourdomain.tld>"   # optional
```

2. Run the docker-compose.yaml file that comes with this folder in order to start listening on the docker network.