const assert=require('node:assert/strict');const {engine}=require('../.test-build/domain/engine');const {officeAction,officeOf,validOffice,activeLease,SIZES,COMPANIES}=require('../.test-build/domain/office');
const apply=(s,a)=>{const r=officeAction(s,a);assert(r.ok,r.error);assert(engine.valid(r.state));return r.state};
const base0=engine.initial(),F=50000000,base={...base0,company:{version:1,founded:0,fund:F}};assert(engine.valid(base));assert.equal(officeOf(base).role,'visitor');
for(const size of Object.keys(SIZES))for(const industry of ['tech','design','trade','accounting']){
 let s=apply(base,{kind:'rent',size,industry,name:'Công ty Quân'});assert.equal(s.company.fund,F-SIZES[size].rent);assert.equal(s.money,base.money);assert(!officeAction(base0,{kind:'rent',size,industry,name:'X'}).ok,'chưa lập công ty thì không thuê được');assert.equal(s.office.leaseUntil,30);assert(activeLease(s));assert(!officeAction(s,{kind:'rent',size,industry,name:'X'}).ok);assert(!officeAction(s,{kind:'renew'}).ok);
 s=apply(s,{kind:'buyDecor',id:'plant'});assert.equal(s.office.ownerDecor.plant,null);const paid=s.company.fund;assert(!officeAction(s,{kind:'buyDecor',id:'plant'}).ok);assert.equal(s.company.fund,paid);
 s=apply(s,{kind:'place',id:'plant',slot:0});s=apply(s,{kind:'buyDecor',id:'lamp'});assert(!officeAction(s,{kind:'place',id:'lamp',slot:0}).ok);s=apply(s,{kind:'place',id:'plant',slot:null});s=apply(s,{kind:'place',id:'lamp',slot:0});
 assert(!officeAction({...s,company:{...s.company,fund:0}},{kind:'upgrade',item:'computer'}).ok);
 const expired={...s,day:30};assert(!activeLease(expired));assert(!officeAction(expired,{kind:'place',id:'lamp',slot:1}).ok);const renewed=apply({...expired,money:10000000},{kind:'renew'});assert.equal(renewed.office.leaseUntil,60);assert.deepEqual(renewed.office.ownerDecor,s.office.ownerDecor);assert(!officeAction(renewed,{kind:'renew'}).ok);
 assert(engine.parse(JSON.stringify(renewed)));
}
for(const c of COMPANIES){let s={...base,office:{...officeOf(base),role:'employee',employerId:c.id}};assert(engine.valid(s));assert(!officeAction(s,{kind:'upgrade',item:'printer'}).ok);assert(!officeAction(s,{kind:'buyDecor',id:'coffee'}).ok);assert(!officeAction(s,{kind:'rent',size:'small',industry:'tech',name:'X'}).ok);assert(!officeAction(s,{kind:'upgrade',item:'computer'}).ok);assert(!officeAction(s,{kind:'buyDecor',id:'plant'}).ok);assert.equal(s.office.workComputer,1);assert(!officeAction(s,{kind:'upgrade',item:'computer'}).ok);s=apply(s,{kind:'leave'});assert.equal(s.office.workComputer,1);assert.equal(s.office.computers,1);assert.equal(s.office.role,'visitor');}
let s=apply(base,{kind:'meet',id:'reception'});assert.deepEqual(s.office.met,['reception']);assert(!officeAction(s,{kind:'meet',id:'reception'}).ok);assert(!officeAction(s,{kind:'meet',id:'unknown'}).ok);assert(!officeAction({...base,fishing:{atLake:true}},{kind:'apply',id:COMPANIES[0].id,cv:'Tôi tốt nghiệp ngành công nghệ thông tin.'}).ok);
assert(!validOffice({...s.office,workComputer:99}));assert(!validOffice({...s.office,met:['reception','reception']}));assert(!validOffice({...s.office,ownerDecor:{plant:0,lamp:0}}));assert(!validOffice({...s.office,ownerDecor:{plant:9}}));assert(!engine.valid({...s,office:{...s.office,employerId:'unknown'}}));
let owner=apply({...base,money:20000000},{kind:'rent',size:'small',industry:'tech',name:'X'});owner=apply(owner,{kind:'upgrade',item:'computer'});assert.equal(owner.company.fund,F-SIZES.small.rent-SIZES.small.seats*450000);assert.equal(owner.money,20000000);owner=apply(owner,{kind:'upgrade',item:'printer'});owner=apply(owner,{kind:'upgrade',item:'printer'});assert.equal(owner.office.printer,2);assert(!officeAction(owner,{kind:'upgrade',item:'printer'}).ok);
// thuê theo tháng, theo năm rẻ hơn 10%; gia hạn trong 7 ngày cuối hạn, nối tiếp từ ngày hết hạn
{const {leasePrice,TERM_DAYS,YEAR_DISCOUNT}=require('../.test-build/domain/office');
 for(const size of Object.keys(SIZES)){assert.equal(leasePrice(size,'month'),SIZES[size].rent);assert.equal(leasePrice(size,'year'),Math.round(SIZES[size].rent*12*(1-YEAR_DISCOUNT)));assert(leasePrice(size,'year')<12*SIZES[size].rent)}
 const big={...base,company:{...base.company,fund:900000000}};
 const y=apply(big,{kind:'rent',size:'small',industry:'tech',name:'X',term:'year'});assert.equal(y.office.leaseUntil,TERM_DAYS.year);assert.equal(y.company.fund,900000000-leasePrice('small','year'));
 assert(!officeAction(big,{kind:'rent',size:'small',industry:'tech',name:'X',term:'week'}).ok,'kỳ thuê lạ bị từ chối');
 const m=apply(big,{kind:'rent',size:'small',industry:'tech',name:'X'});assert.equal(m.office.leaseUntil,30);
 assert(!officeAction({...m,day:10},{kind:'renew'}).ok,'còn hơn 7 ngày chưa gia hạn');
 const near=apply({...m,day:23},{kind:'renew'});assert.equal(near.office.leaseUntil,60,'nối tiếp từ ngày hết hạn, không mất ngày');
 const nearY=apply({...m,day:25},{kind:'renew',term:'year'});assert.equal(nearY.office.leaseUntil,30+365);assert.equal(nearY.company.fund,m.company.fund-leasePrice('small','year'));
 const late=apply({...m,day:100},{kind:'renew'});assert.equal(late.office.leaseUntil,130,'quá hạn thì tính từ hôm nay');
 assert(!officeAction({...m,day:25,company:{...m.company,fund:1}},{kind:'renew'}).ok,'thiếu quỹ');}
assert.deepEqual(base0,engine.initial());console.log('PASS: office roles, 12 rental combinations, paid leases/renewal/expiry, company layouts, permissions, equipment caps/costs, placement collisions, contacts, old saves and round-trip validation.');
