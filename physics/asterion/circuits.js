/* Standard DC voltage-source and zigzag resistor symbols, in scalable SVG. */
function circuitDiagram(topology, voltage, fixed, actuator) {
  const parallel = topology === 'parallel';
  const wire = d => `<path class="circuit-wire" d="${d}"/>`;
  const label = (x,y,txt,cls='') => `<text x="${x}" y="${y}" class="${cls}">${txt}</text>`;
  const resistor = (x,y,value,name) => `<g transform="translate(${x} ${y})"><path class="circuit-resistor" d="M0 0v10l-9 6 18 12-18 12 18 12-18 12 18 12-9 6v10"/>${label(22,38,name,'component-name')}${label(22,60,value+' \u03a9','component-value')}</g>`;
  const arrow=(x,y,txt)=>`<path class="circuit-arrow" d="M${x} ${y}v30m-4-6 4 6 4-6"/>${label(x+9,y+19,txt,'current-label')}`;
  const source=wire('M75 60V143M75 207V290')+`<circle class="circuit-source" cx="75" cy="175" r="32"/>`+label(75,164,'+','polarity')+label(75,194,'\u2212','polarity')+label(20,225,voltage+' V','source-value')+label(20,244,'DC','component-name');
  let network;
  if(parallel){network=wire('M75 60H400V105M75 290H400V197M235 60V105M235 197V290')+resistor(235,105,fixed,'R\u2081 \u00b7 Fixed')+resistor(400,105,actuator,'R\u2082 \u00b7 Actuator')+`<g class="circuit-node"><circle cx="235" cy="60" r="4"/><circle cx="235" cy="290" r="4"/></g>`+arrow(215,68,'I\u2081')+arrow(380,68,'I\u2082')+label(253,315,'Shared return node','diagram-note');}
  else{network=wire('M75 60H300V85M300 177V190M300 282V290H75')+resistor(300,85,fixed,'R\u2081 \u00b7 Fixed')+resistor(300,190,actuator,'R\u2082 \u00b7 Actuator')+arrow(280,48,'I');}
  const current=`<path class="circuit-arrow" d="M115 43h60m-6-4 6 4-6 4"/>${label(126,30,'I\u209b','current-label')}`;
  const description=parallel?`${voltage}-volt DC source connected across two parallel resistors: fixed load ${fixed} ohms and actuator ${actuator} ohms. Source current splits into I1 and I2 at the top junction and recombines at the return.`:`${voltage}-volt DC source connected in a single closed loop with fixed load ${fixed} ohms and actuator ${actuator} ohms in series. The same current flows through both resistors.`;
  return `<svg class="circuit-diagram" viewBox="0 0 550 340" role="img" aria-label="${description}"><title>${parallel?'Parallel':'Series'} DC circuit</title><desc>${description}</desc>${source}${network}${current}</svg><div class="circuit-caption">${parallel?'PARALLEL \u00b7 TWO BRANCHES':'SERIES \u00b7 ONE CURRENT PATH'}<span>Arrows indicate conventional current direction when energized.</span></div>`;
}
if(typeof module!=='undefined')module.exports=circuitDiagram;
