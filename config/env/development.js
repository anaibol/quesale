module.exports = {
  db: "mongodb://localhost/quesale-dev",
  port: 3000,
  app: {
    name: "Quesale - Development",
    accessToken: "1511193072439143|B3CXLPHQjOUyQ6Bu1wbdyLxJEwQ"
  },
  facebook: {
    clientID: "1511193072439143",
    clientSecret: "2d463b32df69fd1f1e398868705ff0eb",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  }
};