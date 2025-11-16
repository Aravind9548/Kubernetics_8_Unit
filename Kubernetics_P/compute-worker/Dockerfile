FROM node:18-alpine
WORKDIR /app

# Install libraries first
COPY package*.json ./
RUN npm install

# Copy the worker code
COPY . .

# Run the worker script
CMD [ "node", "worker.js" ]