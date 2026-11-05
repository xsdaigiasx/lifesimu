// Exercise verifier from a minimal copy with no .git or historical objects.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process'),root=path.resolve(__dirname,'../..');
const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),b=JSON.parse(fs.readFileSync(path.join(__dirname,'portable-baseline.json'))),qa=path.resolve(root,'../.qa-runtime');fs.mkdirSync(qa,{recursive:true});const dest=fs.mkdtempSync(path.join(qa,'issue-133-no-history-'));
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to)};
for(const j of m.items)copy(path.join(root,'app/public',j.file),path.join(dest,'app/public',j.file));
for(const p of b.protected_files)copy(path.join(root,p.file),path.join(dest,p.file));
const target=path.join(dest,'assets/issue-133-lot-5');for(const f of ['verify.cjs','manifest.json','portable-baseline.json',...b.characters.map(p=>p.file)])copy(path.join(__dirname,f),path.join(target,f));
assert(!fs.existsSync(path.join(dest,'.git')));const output=execFileSync(process.execPath,[path.join(target,'verify.cjs')],{cwd:dest,env:process.env,encoding:'utf8'});console.log(output.trim());fs.writeFileSync(path.join(__dirname,'portable-validation.json'),JSON.stringify({result:'PASS',git_directory:false,baseline_commit_available:false,verifier_output:JSON.parse(output)},null,2)+'\n');console.log('PASS: minimal history-free copy');
