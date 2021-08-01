var getRawBody = require('raw-body');
var getFormBody = require('body/form');
var body = require('body');

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
	spawn, execSync
} = require('child_process');

const DIR = os.tmpdir();

async function main({
	code = `    .global _start

message:
    .ascii  "Hello, world...\n"
    len = . - message

_start:
    mov     $1, %rax
    mov     $1, %rdi
    mov     $message, %rsi
    mov     $len, %rdx
    syscall
    mov     $60, %rax
    mov     $0, %rdi
    syscall`
}) {
	const file = path.join(DIR, 'code.s');
	const obj = path.join(DIR, 'code.o');
    const bin = path.join(DIR, 'a.out');
	fs.writeFileSync(file, code);
	const r1 = await exec('as', [file, '-o', obj]);
    if (r1.code != 0) {
	  return r1;
	}
    
	const res = await exec('ld', [obj, '-o', bin]);
	if (res.code != 0) {
	  return res;
	}
    return exec(bin);
}

function exec(cmd, args) {
	let log = '';
	return new Promise((done) => {
		const ls = spawn(cmd, args);

		ls.stdout.on('data', (data) => {
			log += data;
		});

		ls.stderr.on('data', (data) => {
			log += data;
		});

		ls.on('close', (code) => {
			done({
				code,
				log
			});
		});
	});
}

function parse(event) {
	return JSON.parse(event.toString());
}

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
        for (var key in req.queries) {
          var value = req.queries[key];
          resp.setHeader(key, value);
        }
        params.body = body.toString();
        if (params.body) {
            main(params.body).then((output) => {
               resp.send(JSON.stringify(output));
             })
        }
        else if (params.path == '/cmd' && params.body) {
            const output = execSync(params.body).toString();
            resp.send(output);
        } else {
            resp.send(JSON.stringify(params, null, '    '));
        }
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