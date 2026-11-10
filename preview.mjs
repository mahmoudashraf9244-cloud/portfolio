import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const port=Number(process.env.PORT||4173);
if(!Number.isInteger(port)||port<0||port>65535) throw new Error('Invalid PORT');
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    let target=path.resolve(root,'.'+pathname);
    const relative=path.relative(root,target);
    if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403).end('Forbidden');return;}
    if((await fs.stat(target)).isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(301,{Location:url.pathname+'/'+url.search}).end();return;}
      target=path.join(target,'index.html');
    }
    const data=await fs.readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:data);
  } catch(error){
    const status=error instanceof URIError?400:['ENOENT','ENOTDIR'].includes(error.code)?404:500;
    res.writeHead(status).end(http.STATUS_CODES[status]);
  }
}).listen(port,'127.0.0.1',function(){console.log(`Local: http://127.0.0.1:${this.address().port}`);});
