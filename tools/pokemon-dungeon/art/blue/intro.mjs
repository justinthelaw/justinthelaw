// Original scene paintings in integer pixels. Reference images are not inputs.
import { Raster } from '../pixel/raster.mjs';

function rect(r,x,y,w,h,color){for(let row=Math.max(0,Math.round(y));row<Math.min(r.height,Math.round(y+h));row++)for(let col=Math.max(0,Math.round(x));col<Math.min(r.width,Math.round(x+w));col++)r.pixel(col,row,color);}
function hash(x,y){return(Math.imul(x+19,374761393)^Math.imul(y+97,668265263))>>>0;}
function straw(r,x,y,radius){r.ellipse(x,y,radius,radius*.78,'#a6812d');r.ellipse(x,y,radius-1,radius*.72,'#e8bd4f');r.ellipse(x,y,radius-4,radius*.56,'#f8d771');for(let n=0;n<30;n++){const a=n*2.399;const d=radius*(.55+(hash(n,3)%40)/100);const px=Math.round(x+Math.cos(a)*d),py=Math.round(y+Math.sin(a)*d*.73);r.line(px,py,px+Math.cos(a)*3,py+Math.sin(a)*3,n%2?'#ffe995':'#bc9437');}}
function bush(r,x,y,size=9){r.ellipse(x,y+2,size,size*.68,'#285e39');r.ellipse(x,y,size,size*.7,'#3c8b49');r.ellipse(x-2,y-3,size*.64,size*.44,'#70aa56');r.line(x-size*.5,y-3,x-1,y-5,'#9ac064');}
function envelope(r,x,y,width=9){rect(r,x,y,width,6,'#766542');rect(r,x+1,y+1,width-2,4,'#fff4cd');r.line(x+1,y+1,x+width/2,y+3,'#b99964');r.line(x+width-2,y+1,x+width/2,y+3,'#b99964');}

function interior(){
  const r=new Raster(528,528);rect(r,0,0,528,528,'#080b0c');
  r.ellipse(276,262,184,145,'#553b1c');r.ellipse(276,262,178,139,'#aa7935');r.ellipse(276,260,170,133,'#f3cb66');r.ellipse(276,258,162,126,'#ffe38c');
  r.ellipse(279,305,133,94,'#57742c');r.ellipse(279,303,127,91,'#497222');
  for(let n=0;n<170;n++){const h=hash(n,42),x=159+h%242,y=221+(h>>>8)%155;if(((x-279)/121)**2+((y-303)/85)**2<1)r.line(x,y,x+3,y+1,['#528029','#5c8a2b','#639030'][n%3]);}
  // Curved wall ribs and the upper flight exit.
  for(const [x,y,endX,endY]of[[116,216,139,224],[120,180,145,201],[143,150,165,179],[181,132,193,165],[236,122,242,158],[291,123,287,161],[344,138,330,175],[393,164,369,195],[425,207,395,225],[437,257,406,257],[421,313,393,300],[389,353,370,331]])r.line(x,y,endX,endY,'#ae7c37',4);
  rect(r,300,145,45,32,'#b0813d');rect(r,305,150,35,22,'#fff3b5');rect(r,308,150,31,19,'#fff9cd');
  r.polygon([[380,165],[410,182],[402,207],[374,191]],'#b1813d');r.polygon([[384,171],[403,183],[398,199],[380,188]],'#fff3bc');
  // Mail cubbies curve down the left wall; every envelope is authored geometry.
  for(let row=0;row<6;row++)for(let col=0;col<4;col++){
    const x=142+col*14+Math.round((5-row)**2*.65),y=168+row*15-col*2;
    rect(r,x,y,13,14,'#8c652b');rect(r,x+1,y+1,10,11,'#bf9944');
    if((row+col)%3!==0)envelope(r,x+2,y+4,8);
  }
  rect(r,218,149,31,42,'#9a7431');rect(r,220,151,27,36,'#e6dbad');rect(r,223,168,20,15,'#839670');
  envelope(r,225,172,16);r.polygon([[220,146],[225,131],[230,153]],'#b64534');
  for(const [x,height]of[[264,30],[280,25],[299,23],[321,23],[343,21],[363,21],[381,19]]){rect(r,x,208,5,height,'#8e6329');rect(r,x+1,209,2,height-2,'#c39648');}
  for(const [x,y]of[[218,219],[389,248]]){r.ellipse(x,y+6,11,7,'#8a8960');r.ellipse(x,y+4,10,7,'#c8c596');r.ellipse(x-2,y+2,6,4,'#e7dfb6');r.line(x-2,y-4,x+2,y-4,'#776442',2);}
  straw(r,248,267,20);straw(r,304,267,20);straw(r,426,309,21);
  // Raised cream counter, including its woven rope edge.
  rect(r,153,273,272,9,'#e7bb55');rect(r,154,273,270,3,'#ffed98');rect(r,154,282,270,6,'#ab8239');
  for(let x=155;x<423;x+=6){r.line(x,282,x+3,285,'#f5df83');r.line(x+3,285,x+6,282,'#f5df83');}
  for(const x of[202,258,314,370])envelope(r,x,272,8);
  rect(r,152,274,5,35,'#c49b43');rect(r,420,276,5,61,'#b58a3b');
  r.polygon([[256,386],[259,365],[267,357],[284,356],[294,365],[299,395]],'#b3bb7d');
  r.line(255,388,254,405,'#684923',4);r.line(299,388,300,405,'#684923',4);
  return r;
}

function postOffice(r,x,y,scale=1){
  const point=(px,py)=>[Math.round(x+px*scale),Math.round(y+py*scale)];
  const poly=(points,color)=>r.polygon(points.map(([px,py])=>point(px,py)),color);
  const box=(px,py,w,h,color)=>rect(r,x+px*scale,y+py*scale,w*scale,h*scale,color);
  const oval=(px,py,rx,ry,color)=>r.ellipse(x+px*scale,y+py*scale,rx*scale,ry*scale,color);
  oval(0,3,90,78,'#807339');oval(0,-3,87,76,'#d4ba62');oval(0,-10,80,67,'#e5ce7d');
  poly([[-82,12],[-82,-79],[-70,-113],[-48,-120],[-31,-104],[-34,-8]],'#9e9d70');
  poly([[-74,9],[-73,-81],[-62,-108],[-45,-111],[-38,-98],[-41,-5]],'#f1edce');
  box(-61,-94,18,29,'#797347');box(-58,-91,12,23,'#272c24');box(-58,-82,12,3,'#dadaba');
  oval(14,-44,65,32,'#6c6540');oval(15,-47,61,26,'#282d20');
  poly([[-39,-70],[-20,-98],[66,-121],[78,-119],[35,-82]],'#ae9844');
  poly([[-38,-74],[-19,-102],[67,-125],[75,-123],[31,-87]],'#f1d884');
  poly([[-36,-73],[-14,-95],[56,-116],[24,-90]],'#ffeb9e');
  poly([[-48,-40],[-22,-22],[28,-16],[77,-39],[66,-18],[25,-4],[-20,-14]],'#f6df8d');
  box(-50,10,23,27,'#aa9448');box(-46,13,15,19,'#393c27');box(37,6,22,26,'#ad984d');box(40,9,15,19,'#373b26');
  oval(1,54,20,29,'#8e7437');box(-17,44,36,30,'#343622');box(-12,48,26,24,'#232b1e');
  for(const [px,py,size]of[[-67,-117,21],[-42,-119,23],[-29,-103,18],[-85,29,17],[-71,52,13],[77,32,12]])bush(r,x+px*scale,y+py*scale,size*scale);
  r.line(x-52*scale,y-124*scale,x-47*scale,y-164*scale,'#3e773e',3*scale);
  poly([[-49,-157],[-60,-173],[-48,-169],[-43,-158]],'#73a941');poly([[-49,-146],[-36,-157],[-30,-153],[-43,-143]],'#548e39');
}

function exterior(){
  const r=new Raster(720,528);rect(r,0,0,720,528,'#218bec');rect(r,0,216,720,74,'#5bb7ef');rect(r,0,290,720,238,'#1d83bd');
  for(let y=295;y<528;y+=7)for(let x=0;x<720;x+=29)rect(r,x+(y%6)*3,y,12,1,'#55adcf');
  r.polygon([[216,269],[299,239],[336,277],[390,292],[465,263],[539,280],[562,347],[558,408],[510,439],[395,448],[334,414],[242,431],[207,367]],'#659746');
  r.polygon([[216,262],[294,235],[333,272],[389,285],[465,256],[532,274],[552,339],[548,397],[502,426],[396,435],[335,403],[246,419],[214,363]],'#a5d265');
  for(let n=0;n<95;n++){const h=hash(n,14),x=232+h%300,y=285+(h>>>8)%130;r.line(x,y,x+2,y-3,n%2?'#89b855':'#bce078');}
  postOffice(r,418,285,1);
  r.polygon([[406,359],[435,359],[450,425],[397,435]],'#ddd89c');
  rect(r,302,338,37,28,'#9d6b37');rect(r,305,340,31,23,'#dbbf70');rect(r,307,343,27,16,'#fae7a0');
  r.polygon([[296,337],[301,325],[337,325],[345,337]],'#bb6b44');for(let x=303;x<340;x+=7)r.line(x,325,x-3,337,'#e39a61');
  for(let n=0;n<8;n++)envelope(r,307+(n%3)*8,343+Math.floor(n/3)*5,6);
  for(const [x,y]of[[334,382],[473,371],[292,390]]){bush(r,x,y,9);for(let n=0;n<4;n++)r.ellipse(x-5+n*4,y-4+n%2,2,2,n%2?'#fff2a4':'#f2cc62');}
  return r;
}

function aerial(){
  const r=new Raster(288,312);rect(r,0,0,288,312,'#278fe4');rect(r,0,66,288,69,'#70c4eb');rect(r,0,107,288,205,'#2597c7');
  for(let y=112;y<312;y+=8)for(let x=0;x<288;x+=23)rect(r,x+(y%3)*4,y,9,1,'#6ac6dc');
  r.polygon([[8,109],[81,111],[154,104],[224,116],[278,129],[277,301],[235,307],[171,307],[112,296],[63,307],[12,278]],'#587640');
  r.polygon([[8,99],[81,101],[154,94],[224,106],[278,119],[270,277],[232,292],[171,291],[112,283],[63,293],[12,263]],'#b0c667');
  for(let n=0;n<280;n++){const h=hash(n,56),x=9+h%264,y=107+(h>>>8)%186;if((x>83&&x<220&&y>159&&y<261)||(x<81&&y>254))continue;bush(r,x,y,4+h%3);}
  r.polygon([[29,279],[81,262],[107,228],[147,222],[184,193],[243,157],[255,130],[249,127],[232,152],[176,184],[142,215],[102,219],[74,253],[28,270]],'#f2e2a4');
  r.polygon([[89,266],[164,238],[222,251],[266,269],[270,260],[227,243],[166,231],[86,260]],'#efe0a0');
  r.line(14,251,65,244,'#235e97',7);r.line(65,244,134,262,'#235e97',7);r.line(134,262,207,265,'#235e97',7);r.line(207,265,273,286,'#235e97',7);
  r.line(14,250,65,243,'#58cbe7',4);r.line(65,243,134,261,'#58cbe7',4);r.line(134,261,207,264,'#58cbe7',4);r.line(207,264,273,285,'#58cbe7',4);
  rect(r,77,247,18,9,'#956b37');for(let x=78;x<95;x+=3)rect(r,x,247,1,9,'#d2ae60');
  // Whiscash's waterfall in the wooded upper-left hollow.
  r.ellipse(47,146,22,12,'#67c9d7');r.ellipse(47,147,16,8,'#41a6c2');rect(r,37,118,15,27,'#b5ece9');for(let x=39;x<52;x+=4)rect(r,x,119,1,28,'#ffffff');
  // Tiny painted facilities arranged around the square.
  for(const [x,y,w,h,color]of[[125,197,24,18,'#a8cba2'],[168,171,26,18,'#e9c16a'],[194,189,25,20,'#dbaa50'],[177,216,25,21,'#cba362'],[135,242,27,19,'#b88e45'],[107,220,24,18,'#d4b569'],[225,244,27,22,'#d78a56']]){
    rect(r,x-w/2,y,w,h,'#98723d');r.ellipse(x,y,w/2+2,h/2,color);rect(r,x-3,y+h-9,6,9,'#54563a');r.line(x-w/2+3,y-2,x+w/2-3,y-2,'#f9e4a5',2);
  }
  r.ellipse(154,221,12,8,'#c3bb83');r.ellipse(154,221,8,5,'#dfd6a4');
  // The opening illustration uses the renovated Pikachu-shaped rescue base.
  r.ellipse(48,280,20,15,'#c3a447');r.ellipse(48,276,19,13,'#f6db66');r.polygon([[32,267],[28,253],[37,264]],'#e5bd44');r.polygon([[60,265],[65,253],[65,269]],'#e5bd44');rect(r,37,275,3,4,'#363c2e');rect(r,55,275,3,4,'#363c2e');r.ellipse(47,283,6,5,'#916138');
  postOffice(r,250,131,.23);r.line(275,284,278,311,'#94e4e8',5);
  return r;
}

function pelipperFlight(){
  const r=new Raster(384,96);
  for(let frame=0;frame<4;frame++){
    const x=frame*96,wing=[-25,-12,1,-12][frame];
    // Forward-left flight silhouette with a blue crown and broad bill pouch.
    r.polygon([[x+49,43],[x+74,24+wing],[x+89,18+wing],[x+83,33+wing],[x+65,53],[x+52,62]],'#254971');
    r.polygon([[x+50,42],[x+74,27+wing],[x+85,23+wing],[x+78,35+wing],[x+63,52],[x+53,58]],'#fffbe0');
    r.line(x+77,26+wing,x+70,37+wing,'#498cc6',5);
    r.polygon([[x+49,41],[x+24,25+wing],[x+4,26+wing],[x+11,37+wing],[x+38,57],[x+49,60]],'#274b71');
    r.polygon([[x+47,42],[x+23,29+wing],[x+8,29+wing],[x+14,35+wing],[x+39,53],[x+48,56]],'#fffbe2');
    r.line(x+10,31+wing,x+24,34+wing,'#4f8fc7',4);
    r.ellipse(x+48,56,18,21,'#294e75');r.ellipse(x+48,53,16,20,'#f6f1d9');
    r.ellipse(x+47,32,11,13,'#294c70');r.ellipse(x+48,32,9,11,'#fff6d7');
    r.polygon([[x+38,25],[x+41,18],[x+56,18],[x+61,22],[x+48,22],[x+45,25]],'#347ead');
    r.ellipse(x+37,52,23,17,'#96713b');r.ellipse(x+35,50,22,15,'#f1c45f');r.ellipse(x+35,48,18,10,'#f7da82');
    r.polygon([[x+46,32],[x+16,43],[x+7,44],[x+11,48],[x+38,43],[x+49,35]],'#a8803b');r.polygon([[x+46,31],[x+15,41],[x+9,44],[x+35,39]],'#ffe69b');
    rect(r,x+45,27,3,5,'#202b37');rect(r,x+46,27,1,2,'#ffffff');
    r.polygon([[x+55,71],[x+63,77],[x+53,77],[x+48,72]],'#3577a4');
  }
  return r;
}

export function createIntroPaintings(){
  return [
    {id:'post-interior',path:'post-interior.png',art:interior()},
    {id:'post-exterior',path:'post-exterior.png',art:exterior()},
    {id:'town-aerial',path:'town-aerial.png',art:aerial()},
    {id:'pelipper-flight',path:'pelipper-flight.png',art:pelipperFlight()},
  ];
}
