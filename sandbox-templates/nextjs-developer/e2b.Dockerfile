# You can use most Debian-based base images
FROM ubuntu:22.04

# Install essential tools and prerequisites, including curl to retrieve the Node.js setup script, and nano
RUN apt-get update && apt-get install -y curl nano \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (using NodeSource for the latest versions)
RUN curl -fsSL https://deb.nodesource.com/setup_21.x | bash - && \
    apt-get install -y nodejs

COPY compile_page.sh /home/user/compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx create-next-app@latest . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --app --no-src-dir
# Here you can install NPM dependencies to the Nextjs app
RUN npm install recharts

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
