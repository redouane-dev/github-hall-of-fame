FROM node:13.6-alpine3.11

# Copy the repo's content for the container build
WORKDIR /github
COPY . .

RUN npm install

EXPOSE 4000

# Define how Docker should start the application
CMD ["node", "src/index.js"]