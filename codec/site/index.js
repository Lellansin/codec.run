var getRawBody = require('raw-body');

exports.handler = (req, resp, context) => {
  getRawBody(req, function(err, body) {
    resp.headers['content-type'] = 'text/html';
    resp.send('hello world, bilibili???');
  }); 
}