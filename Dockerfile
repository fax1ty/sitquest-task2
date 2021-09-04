FROM node:14
WORKDIR frontend
COPY package.json ./frontend
COPY yarn.lock ./frontend
RUN yarn
RUN yarn build
COPY ./build/ ./frontend
WORKDIR ../backend
COPY package.json ./backend
COPY yarn.lock ./backend
RUN yarn
COPY . ./backend
EXPOSE 3000
RUN yarn start