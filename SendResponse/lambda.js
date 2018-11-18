const app = require('./Index');


module.exports.recursiveLambda = (event, context, callback) => {
    app.ChatBotSync();
      
}
