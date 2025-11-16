# Use an official Node.js runtime
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and install libraries
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Tell Docker what port the app runs on
EXPOSE 5000

# The command to run the app
CMD [ "node", "server.js" ]