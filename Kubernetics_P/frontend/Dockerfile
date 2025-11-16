# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
# Copy the built static files from the 'build' stage
COPY --from=build /app/build /usr/share/nginx/html
# Nginx will serve index.html on port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]