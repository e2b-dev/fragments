# You can use most Debian-based base images
FROM ubuntu:22.04

RUN apt update && apt install -y python3-pip
RUN pip3 install --no-cache-dir streamlit pandas numpy matplotlib requests seaborn plotly


# Copy the code to the container
WORKDIR /home/user
COPY . /home/user
