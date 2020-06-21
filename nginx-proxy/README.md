# nginx-proxy
Reverse proxy to enable LetsEncrypt SSL encryption. 

## HOw to
1. Add following snippet as environment variables to you docker-compose servies that will serve a port or endpoint:
```
environment:
...
    # Nginx Reverse Proxy configuration (SSL Encryption)
    - "VIRTUAL_PORT=xxxx"
    - "VIRTUAL_HOST=<subdomain.domain.tld>"
    - "LETSENCRYPT_HOST=<subdomain.domain.tld>"
    - "LETSENCRYPT_EMAIL=<mail@yourdomain.tld>"   # optional
```

2. Run the docker-compose.yaml file that comes with this folder in order to start listing on the docker network.