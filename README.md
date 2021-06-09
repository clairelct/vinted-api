# Vinted - Backend

[![](http://image.noelshack.com/fichiers/2021/23/3/1623221555-cover-vinted.jpg)](https://vinted-replica.netlify.app/)

## Overview

**Server** <br />
Heroku : https://vinted-phoenix.herokuapp.com/ <br />

**Online demo** <br />
Client : https://vinted-replica.netlify.app/ <br />
Github : https://github.com/clairelct/REACT-vinted-frontend

## Packages

- [CORS](https://github.com/expressjs/cors#readme)
- [Express](https://github.com/expressjs/express)
- [Express Formidable](https://github.com/hatashiro/express-formidable)
- [Cloudinary](https://github.com/cloudinary/cloudinary_npm)
- [Stripe](https://github.com/stripe/stripe-node)
- [Crypto JS](https://github.com/brix/crypto-js)
- [uid2](https://www.npmjs.com/package/uid2?activeTab=versions)
- [Mongoose](https://mongoosejs.com/)
- [Dotenv](https://www.npmjs.com/package/dotenv)

## Architecture

Route user

- **sign up** : creates a new user, generates a token and encrypt password with uid2, records user in DB.
- **login** : checks in DB if user already exists.

Route offer

- **publish** : records a new offer in Offer collection, records uploaded files to Cloudinary.
- **get all offers** : lists all offers (w/ filters).
- **get offer by id** : retrieves an offer by id.
- **pay** : sends transaction to Stripe.

## Running the project

Be sure, you have installed all dependencies and applications to run React project on your computer : [Getting Started with React](https://reactjs.org/docs/getting-started.html).

Clone this repository :

```
git clone https://github.com/clairelct/vinted-api.git
cd vinted-api
```

Install packages :

```
npm i
```

When installation is complete, run it :

```
npx nodemon index.js
```
