FROM node:14-alpine as builder

ENV PORT 3000

# To compile libsodium which is used to encrypt cookies
RUN apk update && apk add libtool autoconf automake build-base python3
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --production

COPY . ./

RUN yarn build

FROM node:14-alpine
EXPOSE 3000

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app .

CMD ["yarn", "start"]
