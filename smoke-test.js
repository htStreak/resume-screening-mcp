import { spawn } from "node:child_process";
import { once } from "node:events";

const child = spawn(process.execPath, ["./src/index.js"], {
  cwd: new URL("..", import.meta.url),
  stdio: ["pipe", "pipe", "inherit"],
});

let buffer = Buffer.alloc(0);
child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
});

function send(id, method, params = {}) {
  const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}

function readOne() {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;
      const header = buffer.slice(0, headerEnd).toString();
      const length = Number(header.match(/Content-Length:\s*(\d+)/i)?.[1] || 0);
      const start = headerEnd + 4;
      const end = start + length;
      if (buffer.length < end) return;
      const message = JSON.parse(buffer.slice(start, end).toString());
      buffer = buffer.slice(end);
      clearInterval(timer);
      resolve(message);
    }, 20);
  });
}

send(1, "initialize", { protocolVersion: "2024-11-05" });
console.log(await readOne());
send(2, "tools/list", {});
console.log(await readOne());
send(3, "tools/call", {
  name: "screen_resumes",
  arguments: {
    resumes: [
      {
        file_name: "张三.pdf",
        text: "姓名：张三\n本科 清华大学\n5年 Java Spring Boot MySQL Redis 互联网经验，负责订单系统，提升效率30%。",
      },
    ],
    job_description: "招聘 Java 后端工程师，要求3年以上经验，熟悉 Java、Spring Boot、MySQL，有互联网经验优先。",
  },
});
console.log(await readOne());
child.kill();
await once(child, "exit");
