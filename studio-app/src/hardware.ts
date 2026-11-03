export type Port = {open:(options:{baudRate:number})=>Promise<void>;close:()=>Promise<void>;readable:ReadableStream<Uint8Array>;writable:WritableStream<Uint8Array>};
export type Serial = {requestPort:()=>Promise<Port>};
export type HardwareState = {mode:'simulation'|'board'; connected:boolean;ready:boolean; armed:boolean;led:number;servo:number|null;sensor:number;message:string};
export class Hardware {
  state:HardwareState={mode:'simulation',connected:false,ready:false,armed:false,led:0,servo:null,sensor:512,message:'Simulator ready'};
  onChange=(_:HardwareState)=>{};
  private port:Port|null=null;
  private reader:ReadableStreamDefaultReader<Uint8Array>|null=null;
  private writer:WritableStreamDefaultWriter<Uint8Array>|null=null;
  private pending: {id:number;resolve:(n:number)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}|null=null;
  private pulse:Promise<unknown>|null=null;
  private id=0; private epoch=0; private heartbeat:ReturnType<typeof setInterval>|undefined;
  update(p:Partial<HardwareState>){this.state={...this.state,...p};this.onChange({...this.state});}
  async connect(){
    const epoch=++this.epoch;
    const serial=(navigator as Navigator & {serial?:Serial}).serial;
    if(!serial)throw Error('Use desktop Chrome or Edge over HTTPS for USB. Simulation works here.');
    const port=await serial.requestPort();await port.open({baudRate:115200});
    if(epoch!==this.epoch){await port.close();return;}
    this.port=port;this.reader=port.readable.getReader();this.writer=port.writable.getWriter();
    this.update({mode:'board',connected:true,ready:false,armed:false,message:'Checking firmware…'});
    void this.read(this.reader);
    try{
      // Uno resets when its port opens. Wait for the bootloader before the handshake.
      await new Promise(r=>setTimeout(r,1800));
      if(epoch!==this.epoch)return;
      if(await this.request('HELLO',0)!==1)throw Error('Firmware protocol version mismatch');
      this.update({ready:true,message:'Firmware v1 ready · disarmed'});
    }catch(e){await this.disconnect();throw e;}
  }
  private async read(reader:ReadableStreamDefaultReader<Uint8Array>){
    let buffer='';const decoder=new TextDecoder();
    try{while(this.reader===reader){const {done,value}=await reader.read();if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      if(buffer.length>4096)throw Error('Oversized serial response');
      let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);
        const m=/^(\d+) (OK|ERR) (-?\d+)$/.exec(line);
        if(!m||Number(m[1])!==this.pending?.id)continue;
        const pending=this.pending!;this.pending=null;clearTimeout(pending.timer);
        if(m[2]==='OK')pending.resolve(Number(m[3]));else pending.reject(Error(`Board rejected command (${m[3]})`));
      }
    }}catch(e){this.update({message:String(e)});}finally{if(this.reader===reader)void this.disconnect();}
  }
  private request(command:string,value:number):Promise<number>{
    if(!this.writer)return Promise.reject(Error('Connect a board first'));
    if(this.pending)return Promise.reject(Error('Wait for the previous command; use await'));
    const id=++this.id;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{if(this.pending?.id===id){this.pending=null;reject(Error('Board response timed out'));void this.disconnect();}},1000);
      this.pending={id,resolve,reject,timer};
      this.writer!.write(new TextEncoder().encode(`${id} ${command} ${value}\n`)).catch(e=>{if(this.pending?.id===id){clearTimeout(timer);this.pending=null;reject(e);void this.disconnect();}});
    });
  }
  async arm(){
    if(this.state.mode==='board'){if(!this.state.ready)throw Error('Wait for firmware v1 confirmation before arming');await this.request('ARM',1);}
    this.update({armed:true,message:'Armed · commands enabled'});
    clearInterval(this.heartbeat);
    if(this.state.mode==='board')this.heartbeat=setInterval(()=>{if(!this.pending){this.pulse=this.request('PING',0).catch(()=>this.stop()).finally(()=>{this.pulse=null;});}},400);
  }
  stop(){
    clearInterval(this.heartbeat);
    if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(Error('Stopped'));this.pending=null;}
    this.update({armed:false,led:0,servo:null,message:'Stopped · LED off · servo detached'});
    // Queued after any in-flight write; no command can pass the armed gate after this point.
    if(this.writer)void this.request('STOP',0).catch(()=>{});
  }
  async command(command:string,value:number){
    if(!['LED','SERVO','SENSOR','STOP'].includes(command))throw Error('Unknown hardware command');
    if(!Number.isInteger(value)|| (command==='LED'&&value!==0&&value!==1)||(command==='SERVO'&&(value<0||value>180))||(['SENSOR','STOP'].includes(command)&&value!==0))throw Error('Invalid hardware value');
    if(command==='STOP'){this.stop();return 0;}
    if(this.pulse)await this.pulse;
    if(!this.state.armed)throw Error('Arm hardware before running commands');
    const result=this.state.mode==='board'?await this.request(command,value):(command==='SENSOR'?this.state.sensor:value);
    if(command==='LED')this.update({led:value});if(command==='SERVO')this.update({servo:value});if(command==='SENSOR')this.update({sensor:result});return result;
  }
  async disconnect(){
    ++this.epoch;this.stop();
    const reader=this.reader,writer=this.writer,port=this.port;
    this.reader=null;this.writer=null;this.port=null;this.update({ready:false,connected:false});
    if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(Error('Disconnected'));this.pending=null;}
    try{await reader?.cancel();}catch{}try{reader?.releaseLock();}catch{}
    try{await writer?.close();}catch{}try{writer?.releaseLock();}catch{}try{await port?.close();}catch{}
    this.update({connected:false,ready:false,armed:false,message:'Disconnected · choose simulator or reconnect'});
  }
}
