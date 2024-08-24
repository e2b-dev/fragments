# You can use most Debian-based base images
FROM ubuntu:22.04

# Install essential tools and prerequisites, including curl to retrieve the Node.js setup script, and nano
RUN apt-get update && apt-get install -y curl nano \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (using NodeSource for the latest versions)
RUN curl -fsSL https://deb.nodesource.com/setup_21.x | bash - && \
    apt-get install -y nodejs

# Install dependencies and customize sandbox
WORKDIR /home/user/vue-app

RUN npx nuxi@latest init . --packageManager=npm --gitInit=no -f

# Move the Vue app to the home directory and remove the Vue directory
RUN mv /home/user/vue-app/* /home/user/ && rm -rf /home/user/vue-app
