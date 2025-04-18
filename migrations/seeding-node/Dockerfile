FROM node:20-slim

WORKDIR /app

# Copy dependency specifications first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies if needed for build steps, otherwise use --omit=dev)
# Using --omit=dev as types/uuid is likely not needed in the final image
RUN npm install --omit=dev --ignore-scripts

# Copy source code from the src directory
COPY src ./src

# Default command uses the new entry point path
CMD ["node", "src/main.js"]
