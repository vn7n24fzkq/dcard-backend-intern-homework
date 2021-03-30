const { v4: uuidv4 } = require('uuid');

module.exports = (client) => {
    client.setHeaders({ 'X-Forwarded-For': uuidv4() });
};
