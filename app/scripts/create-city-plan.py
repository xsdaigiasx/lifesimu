import json
from pathlib import Path
def curve(s,t):
 a,b,c,d=s;q=1-t;return [q**3*a[i]+3*q*q*t*b[i]+3*q*t*t*c[i]+t**3*d[i] for i in (0,1)]
main=[[[-50,880],[140,810],[300,720],[430,660]],[[430,660],[590,580],[740,515],[900,440]],[[900,440],[1080,355],[1280,245],[1490,160]]]
j1=curve(main[1],.58);j2=curve(main[1],.78);j3=curve(main[2],.35);j4=curve(main[0],.85)
roads=[dict(id='avenue',width=28,segments=main),dict(id='west-street',width=20,segments=[[j1,[555,450],[350,330],[120,240]]]),dict(id='riverside',width=20,segments=[[j3,[1200,420],[1320,560],[1280,870]]]),dict(id='market-lane',width=14,segments=[[j2,[900,580],[950,655],[1080,730]]]),dict(id='residential-lane',width=13,segments=[[j4,[470,750],[580,825],[715,885]]])]
campusStart=curve(roads[1]['segments'][0],.4)
roads.append(dict(id='campus-lane',width=12,segments=[[campusStart,[585,355],[700,330],[820,340]]]))
plots=[dict(id=id,x=x,y=y) for id,x,y in [('home',400,560),('office',930,300),('market',980,510),('mall',250,400),('bank',670,235),('hospital',460,300),('bus',210,650),('park',700,423),('streetfood',620,665),('restaurant',1120,600),('apartments',1180,210),('villa',1080,815)]]
fills=[dict(key='southern-homes',asset='home',x=470,y=840,scale=.92),dict(key='riverside-homes',asset='home',x=860,y=840,scale=.88)]
Path('src/map/city-plan.json').write_text(json.dumps(dict(plots=plots,fills=fills,roads=roads),indent=2)+'\n')
