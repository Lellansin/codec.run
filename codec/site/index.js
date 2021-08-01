var getRawBody = require('raw-body');
var getFormBody = require('body/form');
var body = require('body');


/*
To enable the initializer feature (https://help.aliyun.com/document_detail/156876.html)
please implement the initializer function as below：
exports.initializer = (context, callback) => {
  console.log('initializing');
  callback(null, '');
};
*/

exports.handler = (req, resp, context) => {
    console.log('hello world');

    var params = {
        path: req.path,
        queries: req.queries,
        headers: req.headers,
        method : req.method,
        requestURI : req.url,
        clientIP : req.clientIP,
    }
        
    getRawBody(req, function(err, body) {
        // for (var key in req.queries) {
        //   var value = req.queries[key];
        //   resp.setHeader(key, value);
        // }
        // params.body = body.toString();
        // resp.send(JSON.stringify(params, null, '    '));
        // resp.headers.set('content-type', 'text/html');
        resp.headers['content-type'] = 'text/html';
        // console.log('header set', resp.headers);
        resp.send('hello world, bilibili???');
    }); 
      
    /*
    getFormBody(req, function(err, formBody) {
        for (var key in req.queries) {
          var value = req.queries[key];
          resp.setHeader(key, value);
        }
        params.body = formBody;
        console.log(formBody);
        resp.send(JSON.stringify(params));
    }); 
    */
}