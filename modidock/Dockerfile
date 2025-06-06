# Dockerfile

# Use a base image with Node.js and a full OS so we can install MongoDB
FROM node:18

# Update package lists and install MongoDB and Supervisor
RUN apt-get update && apt-get install -y \
    mongodb \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for our app
WORKDIR /usr/src/app

# Copy the package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the supervisor configuration file
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose the new port
EXPOSE 7000

# The command to start Supervisor, which in turn starts MongoDB and our Node app
CMD ["/usr/bin/supervisord"]