'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const getRawBody = require('raw-body');
const qs = require('querystring');

const DIR = os.tmpdir();
const DEFAULT_CODE = `    .global _start

message:
    .ascii  "Hello, world!\n"
    len = . - message

_start:
    mov     $1, %rax
    mov     $1, %rdi
    mov     $message, %rsi
    mov     $len, %rdx
    syscall
    mov     $60, %rax
    mov     $0, %rdi
    syscall`;

async function asmRunner(params = {}) {
    let code = DEFAULT_CODE;
    if (params.body && params.body.code) {
        code = params.body.code;
    }

    // 1. 保存代码为临时文件
	const file = path.join(DIR, 'code.s');
	fs.writeFileSync(file, code);

    // 2. 使用汇编编译器编译临时文件，生成对象文件: as 临时文件 -o 对象文件
	const obj = path.join(DIR, 'code.o');
	const r1 = await exec('as', [file, '-o', obj]);
    if (r1.exitCode != 0) {
	  return r1;
	}
    
    // 3. 使用 ld 连接器链接对象文件，生成可执行文件: ld 对象文件 -o 可执行文件
    const bin = path.join(DIR, 'a.out');
	const res = await exec('ld', [obj, '-o', bin]);
	if (res.exitCode != 0) {
	  return res;
	}

    // 4. 运行可执行文件
    const result = await exec(bin);
    return result;
}

function exec(cmd, args) {
	let log = '';
	return new Promise((resolve) => {
		const ls = spawn(cmd, args);

        // stdout 拼装
		ls.stdout.on('data', (data) => {
			log += data;
		});

        // stderr 拼装
		ls.stderr.on('data', (data) => {
			log += data;
		});

		ls.on('close', (exitCode) => {
			resolve({
				exitCode,
				log
			});
		});
	});
}

/**
 * FC 的 handler
 * @param {*} req HTTP request 请求
 * @param {*} resp HTTP response 响应
 */
exports.handler = async (req, resp) => {
    try {
        await main(req, resp);
    } catch(err) {
        resp.statusCode = 500;
        resp.send(err.stack);
    }
}

async function main(req, resp) {
    // 1. 拼装请求参数
    var params = {
        path: req.path,
        queries: req.queries,
        headers: req.headers,
        method : req.method,
        requestURI : req.url,
        clientIP : req.clientIP,
    }

    // 2. 解析 body (json, 表单)
    const rawBody = await getRawBody(req);
    params.body = qs.parse(rawBody.toString());

    // 执行 asm 代码
    const result = await asmRunner(params);

    // 返回执行结果
    resp.headers['content-type'] = 'application/json';
    resp.send(JSON.stringify(result));
}