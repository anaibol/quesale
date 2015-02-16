module.exports = {
  db: 'mongodb://admin:alsacelorraine@candidate.43.mongolayer.com:10086/quesale',
  port: 3001,
  app: {
    name: 'quesale - Test',
    accessToken: '439472799532734|q2yZ3bxPv8magGScTA672Ab-x7Y'
  },
  facebook: {
    clientID: '439472799532734',
    clientSecret: '6e940b23fdbf539939dffbe479678623',
    callbackURL: 'https://quesale.com/auth/facebook/callback'
  },
  stripe: {
    publicKey: 'pk_test_FUAvcVhP9LZqFHvO8nfVjIeO',
    secretKey: 'sk_test_unsLWduKZDNdClYZHMLHzytg'
  }
  /*,
  twitter: {
    clientID: 'CONSUMER_KEY',
    clientSecret: 'CONSUMER_SECRET',
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
  },
  github: {
    clientID: 'APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/auth/github/callback'
  },
  google: {
    clientID: 'APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  linkedin: {
    clientID: 'API_KEY',
    clientSecret: 'SECRET_KEY',
    callbackURL: 'http://localhost:3000/auth/linkedin/callback'
  }*/
};
