// cosnt getRawBody = require('raw-body');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, './index.html'));

exports.handler = async (req, resp, context) => {
  // const body = await getRawBody(req); 

  // 判断当前请求是否基于 http 协议
  if (req.headers['x-forwarded-proto'] === 'http') {
    // 是的话就重定向到 https 协议
    resp.headers['Location'] = 'https://codec.run';
    resp.statusCode = 302;
    resp.send('302 Moved Temporarily');
    return;
  }

  resp.headers['content-type'] = 'text/html';
  resp.send(html);
}