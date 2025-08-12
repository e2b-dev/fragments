# Use Node.js base image for Svelte
FROM node:21-slim

# Install necessary system dependencies
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /home/user

# Create a new Svelte 5 app with TypeScript and Tailwind CSS
RUN npm create vite@latest svelte-app -- --template svelte-ts
RUN cd svelte-app && npm install

# Install additional dependencies for TanStack and UI libraries
RUN cd svelte-app && npm install @tanstack/svelte-table@latest @tanstack/svelte-query@latest
RUN cd svelte-app && npm install -D tailwindcss postcss autoprefixer
RUN cd svelte-app && npx tailwindcss init -p

# Move app contents to home directory
RUN mv svelte-app/* /home/user/ && rm -rf svelte-app

# Copy any additional setup files
COPY app.svelte /home/user/src/App.svelte
COPY tailwind.config.js /home/user/tailwind.config.js
COPY app.css /home/user/src/app.css
