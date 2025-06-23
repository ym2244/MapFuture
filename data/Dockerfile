# data/Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy cities.json to the container and rename it to db.json
COPY cities.json ./db.json

# Install json-server globally
RUN npm install -g json-server

# Expose the default json-server port
EXPOSE 9000

# Start json-server
CMD ["json-server", "--watch", "db.json", "--host", "0.0.0.0", "--port", "9000"]
