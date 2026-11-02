// LockwoodSTEM protocol v1: Uno R3 / classic Nano (ATmega328P).
// Built-in LED D13, servo signal D9, analog sensor A0. See HARDWARE.md.
#include <Servo.h>
#include <stdlib.h>
#include <string.h>
Servo actuator;
bool armed=false;
unsigned long lastContact=0;
char line[64];
byte used=0;
bool overflow=false;
void safeStop(){armed=false;digitalWrite(LED_BUILTIN,LOW);actuator.detach();}
void reply(unsigned long id,bool ok,int value){Serial.print(id);Serial.print(ok?" OK ":" ERR ");Serial.println(value);}
bool number(const char* s,long &v){if(!s||!*s)return false;char* end;v=strtol(s,&end,10);return *end=='\0';}
void handle(){
 char* idText=strtok(line," ");char* command=strtok(NULL," ");char* valueText=strtok(NULL," ");char* extra=strtok(NULL," ");long id,value;
 if(!number(idText,id)||id<1||!command||!number(valueText,value)||extra){safeStop();reply(0,false,1);return;}
 if(strcmp(command,"HELLO")==0&&value==0){safeStop();reply(id,true,1);return;}
 if(strcmp(command,"STOP")==0&&value==0){safeStop();reply(id,true,0);return;}
 if(strcmp(command,"ARM")==0&&value==1){armed=true;lastContact=millis();reply(id,true,1);return;}
 if(!armed){reply(id,false,2);return;}
 bool valid=true;int result=value;
 if(strcmp(command,"PING")==0&&value==0){}
 else if(strcmp(command,"LED")==0&&(value==0||value==1)){digitalWrite(LED_BUILTIN,value?HIGH:LOW);}
 else if(strcmp(command,"SERVO")==0&&value>=0&&value<=180){if(!actuator.attached()){actuator.write(value);actuator.attach(9);}actuator.write(value);}
 else if(strcmp(command,"SENSOR")==0&&value==0){result=analogRead(A0);}
 else valid=false;
 if(valid)lastContact=millis();else safeStop();
 reply(id,valid,valid?result:3);
}
void setup(){pinMode(LED_BUILTIN,OUTPUT);safeStop();Serial.begin(115200);}
void loop(){
 if(armed&&millis()-lastContact>1500)safeStop();
 // Bounded buffer, discard the complete oversized line rather than interpreting a suffix.
 byte budget=64;
 while(Serial.available() && budget--){
  char c=Serial.read();
  if(c=='\n'){if(overflow){safeStop();reply(0,false,4);}else{line[used]='\0';handle();}used=0;overflow=false;}
  else if(c!='\r'){if(used<sizeof(line)-1&&!overflow)line[used++]=c;else{overflow=true;safeStop();}}
 }
}
