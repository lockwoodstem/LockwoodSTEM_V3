"""Render the IED Unit 4 diagrams and silent video clips.

Requires Pillow, ffmpeg (libx264), and DejaVu Sans on Linux.
Lesson 4.1 uses a separate workshop illustration and is not generated here.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, subprocess

OUT = Path(__file__).resolve().parents[1] / "assets/img/ied/unit-4"
OUT.mkdir(parents=True, exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
NAVY='#102847'; BLUE='#205e91'; GOLD='#aa6900'; GREEN='#216345'; RED='#9b373b'; GRAY='#4d6173'
W,H=720,360
VIDEOS={3,5,6,7,9,11,13,15,17,18,19,20}

def scene(n,t):
    im=Image.new('RGB',(W,H),'#edf3f9')
    d=ImageDraw.Draw(im)
    def txt(x,y,s,size=20,color=NAVY,bold=False):
        d.text((x,y),s,font=ImageFont.truetype(BOLD if bold else FONT,size),fill=color,anchor='mm')
    def ln(points,color=NAVY,w=5):
        d.line(points,fill=color,width=w,joint='curve')
    def box(x,y,w,h,fill='#fff',stroke='#c3d2e1',r=10):
        d.rounded_rectangle((x,y,x+w,y+h),r,fill,stroke,width=2)
    def dot(x,y,r,fill=NAVY):
        d.ellipse((x-r,y-r,x+r,y+r),fill)
    def arrow(a,b,color=BLUE):
        ln([a,b],color)
        q=math.atan2(b[1]-a[1],b[0]-a[0])
        d.polygon([b,*[(b[0]-15*math.cos(q+k),b[1]-15*math.sin(q+k)) for k in (-.55,.55)]],fill=color)
    def ring(x,y,r,color=BLUE,w=5):
        d.ellipse((x-r,y-r,x+r,y+r),outline=color,width=w)
    def polar(x,y,r,a):
        return x+r*math.cos(a),y+r*math.sin(a)
    def panel(x,y,w,h,title):
        box(x,y,w,h)
        txt(x+w/2,y+24,title,20,NAVY,True)
    def beam(x,y,width,amount):
        for cx in (x+15,x+width-15):
            d.polygon([(cx,y),(cx-16,y+30),(cx+16,y+30)],fill=GRAY)
        points=[(x+i*width/40,y+amount*math.sin(math.pi*i/40)) for i in range(41)]
        ln(points,BLUE,8)
        return y+amount
    def wheel(x,y,r,a,cabins=True):
        ring(x,y,r)
        for i in range(4):
            p=polar(x,y,r,a+i*math.pi/2)
            ln([(x,y),p],BLUE,3)
            if cabins:
                px,py=p
                ln([p,(px,py+10)],NAVY,3)
                box(px-12,py+10,24,17,'#f8d98f',GOLD,3)
        dot(x,y,7)
    def gear(x,y,r,a,teeth,color):
        pts=[polar(x,y,r*(1 if i%4 in (1,2) else .86),a+i*math.tau/(teeth*4)) for i in range(teeth*4)]
        d.polygon(pts,fill=color)
        dot(x,y,r*.22,'#fff')
    def swing(x,y,a,rad=145):
        tip=polar(x,y,rad,a+math.pi/2)
        ln([(x-90,y+rad+28),(x,y),(x+90,y+rad+28)],GRAY,5)
        ln([(x,y),tip],BLUE,6); dot(x,y,9)
        px,py=tip
        d.polygon([(px-52,py-8),(px+52,py-8),(px+33,py+23),(px-33,py+23)],fill=GOLD)
        return tip
    def chart(rows,maximum,unit):
        for i,(name,val,color) in enumerate(rows):
            y=98+i*71
            txt(160,y+16,name,20)
            box(235,y,300,35,'#e8eff6','#e8eff6',3)
            box(235,y,max(5,300*val/maximum),35,color,color,3)
            txt(594,y+18,f'{val} {unit}',20,NAVY,True)
    def circuit(closed):
        box(70,72,580,218)
        color=GREEN if closed else GRAY
        ln([(190,146),(190,105),(320,105)],color)
        ln([(386,105),(530,105),(530,156)],color)
        ln([(530,220),(530,260),(190,260),(190,202)],color)
        ln([(168,146),(212,146)],NAVY,5)
        ln([(179,202),(201,202)],NAVY,5)
        txt(150,147,'+',24); txt(151,201,'−',24)
        txt(190,178,'Battery',18)
        # The pivot belongs to the left contact; the blade touches both contacts only when closed.
        ln([(320,105),(386,105 if closed else 79)],color,6)
        dot(320,105,6); dot(386,105,6)
        txt(353,144,'Switch',18)
        ring(530,188,32,color); txt(530,188,'M',23)
        txt(530,244,'Motor',18)
    titles={2:'Bending and mass tell different stories',3:'Read the center before and under load',4:'Compare mean deflection',5:'Rotary motion and oscillation',6:'A cam lifts a straight-line follower',7:'Meshing gears turn in opposite directions',8:'Compare catch-free turns',9:'An open switch breaks the circuit',10:'Separate fillets vs. a solder bridge',11:'Switch and motor in one circuit path',12:'Ferris Wheel concept and footprint',13:'Crank and rod rock the ship',14:'Align the support holes',15:'Check clearance at two positions',16:'Measure before fastening',17:'Find where the wheel rubs',18:'Route the wire away from the shaft',19:'Record the number of complete turns',20:'Retest under the same conditions',21:'Connect a showcase claim to evidence'}
    txt(360,35,titles[n],24,NAVY,True)
    if n==2:
        for x,title,unit,values,maxval in [(25,'Bend under load','mm',[2,5],5),(373,'Mass','g',[18,10],18)]:
            panel(x,72,322,225,title)
            for i,v in enumerate(values):
                y=127+66*i
                txt(x+32,y+18,'AB'[i],19)
                box(x+59,y,176*v/maxval,34,[BLUE,GOLD][i],[BLUE,GOLD][i],3)
                txt(x+275,y+17,f'{v} {unit}',18,NAVY,True)
    elif n==3:
        amount=29*min(1,max(0,(t-.22)*2.1))
        panel(48,70,624,231,'Measurement at the center')
        cy=beam(130,165,450,amount)
        ln([(360,cy),(360,245)],GOLD,3); dot(360,cy,7,GOLD)
        if t>.18: arrow((360,126),(360,cy-12),GOLD)
        txt(360,265, '38 mm unloaded' if t<.55 else '34 mm loaded · 4 mm deflection',20,NAVY,True)
    elif n==4:
        chart([('Sample A',3,BLUE),('Sample B',7,GOLD)],8,'mm')
        txt(360,278,'Range: 2 mm for each sample',21,NAVY,True)
    elif n==5:
        panel(30,73,320,246,'Wheel: rotary')
        panel(370,73,320,246,'Ship: oscillating')
        wheel(190,195,63,t*math.tau,False)
        swing(530,133,.48*math.sin(t*math.tau),124)
    elif n==6:
        ang=t*math.tau
        x,y=360,232
        offset=17*math.sin(ang)
        d.ellipse((x-41+17*math.cos(ang),y-41+offset,x+41+17*math.cos(ang),y+41+offset),fill=BLUE)
        dot(x,y,7)
        yface=y-41+offset
        ln([(375,101),(375,162)],GRAY,4); ln([(345,101),(345,162)],GRAY,4)
        ln([(360,113+offset),(360,yface)],GOLD,8)
        ln([(333,yface),(387,yface)],GOLD,7)
        txt(221,229,'Rotating cam',19); txt(504,133,'Follower',19)
        arrow((464,144),(468,189),GOLD)
    elif n==7:
        a=t*math.tau
        gear(275,188,77,a,12,BLUE)
        gear(413,188,77,-a+math.tau/24,12,GOLD)
        txt(275,296,'Input',20); txt(413,296,'Output',20)
    elif n==8:
        chart([('Before',2,BLUE),('After',5,GREEN)],5,'/ 5')
        txt(360,273,'Same pace · same operator · one support adjusted',18)
    elif n in (9,11):
        closed=.27<=t<.76
        circuit(closed)
        txt(360,320,'Closed path · motor can turn' if closed else 'Open path · motor current stops',20,GREEN if closed else NAVY,True)
    elif n==10:
        for x,bridge in [(35,False),(370,True)]:
            panel(x,72,315,230,'Possible bridge' if bridge else 'Separate joints')
            box(x+37,122,240,108,'#216345','#216345')
            for cx in (x+95,x+215):
                dot(cx,175,28,'#b6c7d5')
                dot(cx,175,9,'#324757')
            if bridge: ln([(x+119,175),(x+193,175)],'#b6c7d5',13)
            txt(x+158,264,'Solder crosses the gap' if bridge else 'Clear gap between pads',17)
    elif n==12:
        panel(58,71,290,241,'Front view')
        wheel(203,178,60,.78)
        ln([(203,178),(203,277),(173,277),(236,277)],GRAY,5)
        panel(372,71,290,241,'Base from above')
        box(457,139,120,113,'#dfebf7',BLUE,4)
        txt(517,279,'230 × 240 mm',20)
    elif n==13:
        phase=t*math.tau
        # Intersection of the rocker-arm circle and the fixed-length rod circle.
        crank=(177,163); pivot=(500,139); arm=95; rod=320
        c=polar(*crank,35,phase); vx,vy=c[0]-pivot[0],c[1]-pivot[1]
        dist=math.hypot(vx,vy)
        along=(arm*arm-rod*rod+dist*dist)/(2*dist)
        rise=math.sqrt(max(0,arm*arm-along*along))
        p=(pivot[0]+(along*vx+rise*vy)/dist,pivot[1]+(along*vy-rise*vx)/dist)
        angle=math.atan2(p[1]-pivot[1],p[0]-pivot[0])-math.pi/2
        ring(*crank,35,BLUE); ln([crank,c],BLUE,7); dot(*crank,6)
        swing(*pivot,angle,118)
        ln([c,p],GOLD,7); dot(*c,7); dot(*p,7)
        txt(177,255,'Crank',19); txt(332,275,'Connecting rod',19); txt(545,97,'Pivot',19)
    elif n in (14,16):
        box(113,262,494,35,'#dae7f4',BLUE)
        y2=142 if n==14 else 125
        for x,y in [(218,142),(495,y2)]:
            box(x-35,y-34,70,262-y+34,'#fff',BLUE,4)
            ring(x,y,15,BLUE)
        ln([(152,142),(560,142)],GOLD,3)
        dot(218,142,6,GOLD); dot(495,y2,6,GOLD)
        if n==14:
            txt(360,201,'Same axle centerline',19,NAVY,True)
        else:
            txt(215,84,'55 mm',20); txt(495,69,'58 mm',20)
            txt(360,211,'Adjust before fastening',19,NAVY,True)
    elif n==15:
        panel(47,73,626,231,'Top view')
        center=(315,212)
        ring(*center,75,BLUE)
        a=-1.2+t*1.27
        tip=polar(*center,88,a)
        ln([center,tip],BLUE,6); box(tip[0]-20,tip[1]-15,40,30,'#f8d98f',GOLD,4)
        box(409,193,31,42,'#c5d0dc',GRAY,4)
        txt(489,215,'Post',18)
        txt(360,326,'Check the moving seat against the fixed post.',19)
    elif n==17:
        panel(51,72,618,236,'Front view · power disconnected')
        a=t*math.tau
        wheel(340,175,63,a)
        box(411,139,30,100,'#c5d0dc',GRAY,4)
        for i in range(4):
            cx, cy = polar(340, 175, 63, a + i * math.pi / 2)
            if cx + 12 >= 411 and 139 <= cy + 18 <= 239:
                dot(411, cy + 18, 7, RED)
        txt(512,189,'Upright',18)
        txt(340,281,'Mark the location of any contact.',18)
    elif n==18:
        panel(53,70,614,242,'Power disconnected')
        box(474,116,44,121,'#c5d0dc',GRAY,4)
        ring(352,174,36,BLUE); ln([(324,174),(380,174)],BLUE,4); dot(352,174,8)
        txt(350,232,'Rotating shaft',18)
        safe=t>.44
        pts=[(151,249),(151,119),(497,119),(497,154)] if safe else [(151,249),(352,183),(497,154)]
        ln(pts,GREEN if safe else RED,7)
        txt(374,276,'Wire secured to stationary frame' if safe else 'Wire crosses the shaft area',18,NAVY,True)
    elif n==19:
        turns=min(2,t*2.7)
        angle = turns * math.tau - math.pi / 2
        wheel(352,170,64,angle,False)
        dot(*polar(352,170,64,angle),8,GOLD)
        arrow((352,83),(352,97),GRAY)
        txt(360,287,f'Completed turns: {int(turns)} / 3',21,NAVY,True)
    elif n==20:
        panel(30,72,320,233,'Before · 2 of 3 turns')
        panel(370,72,320,233,'After · 0 of 3 turns')
        for x,safe in [(190,False),(530,True)]:
            y=190
            ring(x,y,53,BLUE)
            tip=polar(x,y,53,t*math.tau)
            ln([(x,y),tip],BLUE,4); dot(*tip,11,GOLD)
            box(x+(77 if safe else 51),y-15,18,30,'#c5d0dc',GRAY,3)
            if not safe and tip[0]>x+47: dot(x+57,y,8,RED)
        txt(360,330,'Illustrative counts from the lesson example',18)
    elif n==21:
        for i,(label,value,explain) in enumerate([('Target','5 cycles','Pirate Ship'),('Observed','5 cycles','Last approved run'),('Next change','Stiffen','Support shifted')]):
            x=25+i*233
            panel(x,88,204,191,label)
            txt(x+102,179,value,27,GREEN if i==1 else BLUE,True)
            txt(x+102,230,explain,16)
    return im

if __name__ == "__main__":
    for n in range(2,22):
        scene(n, .12 if n in VIDEOS else 0).save(OUT/f'lesson-4-{n}.webp',quality=87)
        if n in VIDEOS:
            dest=OUT/f'lesson-4-{n}.mp4'
            args=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate','12','-i','-','-an','-c:v','libx264','-crf','23','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(dest)]
            with subprocess.Popen(args,stdin=subprocess.PIPE) as process:
                for i in range(60):
                    process.stdin.write(scene(n,i/59).tobytes())
                process.stdin.close()
                if process.wait(): raise RuntimeError(dest)
