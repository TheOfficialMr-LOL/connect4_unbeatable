FROM node:18-slim

#install C++ runtime
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

#set working directory
WORKDIR /app

#install Node dependencies
COPY package*.json ./
RUN npm install

#copy everything else (including C++ executable)
COPY . .

#make sure C++ executable is runnable
RUN chmod +x ./public/scripts/webMinimax.exe

#expose app port
EXPOSE 2000

#start the server
CMD ["npm", "start"]
