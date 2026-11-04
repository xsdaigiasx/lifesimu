import {spawnSync} from 'node:child_process';import {rm,mkdir,writeFile} from 'node:fs/promises';
await rm('.test-build',{force:true,recursive:true});await mkdir('.test-build',{recursive:true});await writeFile('.test-build/package.json','{"type":"commonjs"}');
for(const args of [['node_modules/typescript/bin/tsc','-p','tsconfig.tests.json'],['tests/home.test.cjs'],['tests/life.test.cjs'],['tests/home-shop.test.cjs'],['tests/engine.test.cjs'],['tests/fishing.test.cjs'],['tests/office.test.cjs'],['tests/recruitment-time.test.cjs'],['tests/rent.test.cjs'],['tests/money.test.cjs'],['tests/vitals.test.cjs'],['tests/travel.test.cjs'],['tests/skills.test.cjs'],['tests/career.test.cjs'],['tests/study.test.cjs'],['tests/bug-game.test.cjs'],['tests/probation.test.cjs'],
['tests/task-model.test.cjs'],['tests/reset.test.cjs'],['tests/update.test.cjs'],['tests/bau-cua.test.cjs'],['tests/bau-cua-session.test.cjs'],['tests/phone-data.test.cjs'],['tests/react-domain.test.cjs'],['tests/tile-loader.test.cjs'],['tests/intro-gate.test.cjs'],['tests/map-interaction.test.cjs'],['tests/journal.test.cjs'],['tests/layout.test.cjs'],['tests/work.test.cjs'],['tests/social.test.cjs'],['tests/office-items.test.cjs'],['tests/shift-choices.test.cjs']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)}



