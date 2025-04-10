# Use a Debian-based image for the build stage
FROM node:22-slim AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Use a Debian-based image for the runtime stage
FROM node:22-slim

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/dist ./dist

COPY --from=build /app/package*.json ./

# Copy the secrets directory into the container
COPY secrets /app/secrets

# Install only production dependencies
RUN npm install --only=production

# Expose the port your application runs on
EXPOSE 5211

# Start the application
CMD ["npm", "start"]