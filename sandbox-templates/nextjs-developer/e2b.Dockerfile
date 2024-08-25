# You can use most Debian-based base images
FROM node:21-slim

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx create-next-app@latest . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --app --no-src-dir

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
