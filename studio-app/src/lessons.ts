import type {Project} from './storage';
export type Lesson = {
  id:string; title:string; duration:string; goal:string; needs:string;
  steps:string[]; checks:string[]; reflection:string; extension:string;
  code:string; mode:'once'|'live'; camera:boolean; hardware:boolean;
};
export const lessons:Lesson[] = [
  {
    id:'sensor-control', title:'1 · Sensor-controlled LED & servo', duration:'25–35 minutes',
    goal:'Use an input threshold to make a decision, then map the sensor range to a servo angle.',
    needs:'Start with Simulator. No camera or board is needed.', camera:false, hardware:true, mode:'once',
    steps:[
      'Open this lesson as a new project. Keep Hardware mode on Simulator, then select Arm hardware.',
      'Select Run. Move Sensor A0 through 0, 512, 513 and 1023 while the program runs. Watch the LED, servo arm and console.',
      'Record which value first turns the LED on. Explain why 512 and 513 produce different decisions.',
      'Press Stop. Verify the LED is off and the servo is detached. Restart Python, change THRESHOLD to 700, arm again, and repeat.',
      'For a teacher-approved board trial, stop first, choose USB Arduino, connect the flashed board and arm it. Use an A0 potentiometer instead of the simulator slider. Keep the servo unloaded.'
    ],
    checks:['I tested both sides of the threshold, including the boundary.', 'I compared the servo at sensor values 0, 512 and 1023.', 'I verified Stop and explained how the threshold change affected the result.'],
    reflection:'What happened at 512 and 513? Why does the servo mapping divide by 1023? Record your changed threshold and two observations.',
    extension:'Reverse the servo mapping so increasing sensor values move the arm toward 0°. Predict the endpoints before testing.',
    code:`import asyncio

THRESHOLD = 512
print("Move Sensor A0. Press Stop when you finish testing.")
while True:
    value = await arduino.sensor()
    angle = round(value * 180 / 1023)
    led_on = value > THRESHOLD
    await arduino.led(led_on)
    await arduino.servo(angle)
    print(f"A0={value} | LED={led_on} | servo={angle} degrees")
    await asyncio.sleep(0.5)
`
  },
  {
    id:'color-detection', title:'2 · Detect a colored object', duration:'30–40 minutes',
    goal:'Create a color mask and use measured image area to distinguish a green object from background noise.',
    needs:'A webcam and a green object or piece of paper. Keep faces out of the camera view.', camera:true, hardware:false, mode:'live',
    steps:[
      'Open the lesson, start the camera and point it at a clear workspace. Live vision mode is selected for you.',
      'Select Run live. Place a green object in the center of the view. Compare the original image with the mask and bounding boxes.',
      'Remove the object, then test a non-green object. Record whether each trial gives the expected result.',
      'Change lighting or distance. Stop, restart Python, adjust MIN_AREA, and run again. Explain any missed detections or false detections.',
      'Press Stop and verify the camera switches off. Write your observations before exporting the submission.'
    ],
    checks:['I tested green, non-green and empty scenes.', 'I tested a second lighting condition or distance.', 'I explained one false detection or limitation and verified camera Stop.'],
    reflection:'Record at least three trials (object, lighting/distance, expected result, observed result). What did changing MIN_AREA do?',
    extension:'Tune the HSV bounds for a different color. Explain why a fixed threshold is sensitive to lighting.',
    code:`import cv2

MIN_AREA = 400

def process_frame(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_RGBA2RGB)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    mask = cv2.inRange(hsv, (35, 70, 60), (85, 255, 255))
    output = cv2.cvtColor(mask, cv2.COLOR_GRAY2RGBA)
    count = 0
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        if cv2.contourArea(contour) >= MIN_AREA:
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(output, (x, y), (x+w, y+h), (255, 200, 40, 255), 2)
            count += 1
    cv2.putText(output, f"Green objects: {count}", (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 200, 40, 255), 2)
    return output
`
  },
  {
    id:'vision-sorter', title:'3 · Build a vision-controlled sorter', duration:'40–50 minutes',
    goal:'Connect a measured vision signal to an actuator decision, with persistence to reduce rapid switching.',
    needs:'A webcam, green object and Simulator first. Board extension requires teacher approval and the standard firmware.', camera:true, hardware:true, mode:'live',
    steps:[
      'Open the lesson as a new project, start the camera and choose Simulator. Arm hardware, then select Run live.',
      'Fill more than 8% of the image with a green object for three frames. The gate should move to 150° and the LED should turn on.',
      'Remove the object for three frames. The gate should return to 30° and the LED should turn off. Watch the ratio and pending-frame count on the preview.',
      'Test small objects, brief appearances and changes in lighting. Stop and restart to adjust MIN_RATIO or STABLE_FRAMES, then compare results.',
      'After a successful simulation, ask your teacher to check the wiring and gate travel. Stop before choosing USB Arduino. Connect, arm and run the same code with an unloaded servo before attaching a lightweight gate.',
      'Test Stop and tab switching. The program must stop and disarm. Servo detachment does not mechanically brake a gate; keep loads safe.'
    ],
    checks:['I tested both gate positions in simulation.', 'I tested a brief appearance and explained the three-frame rule.', 'I verified Stop and recorded simulation versus physical testing separately.'],
    reflection:'Record at least four trials and the gate result. How did STABLE_FRAMES reduce switching? State whether you tested simulation only or a teacher-approved physical board.',
    extension:'Use separate enter/exit ratio thresholds to reduce switching near the boundary. Explain why persistence is measured in frames, not fixed seconds.',
    code:`import cv2

MIN_RATIO = 0.08
STABLE_FRAMES = 3
candidate = None
streak = 0
last_sent = None

async def process_frame(frame):
    global candidate, streak, last_sent
    rgb = cv2.cvtColor(frame, cv2.COLOR_RGBA2RGB)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    mask = cv2.inRange(hsv, (35, 70, 60), (85, 255, 255))
    ratio = cv2.countNonZero(mask) / mask.size
    detected = ratio >= MIN_RATIO
    if detected == candidate:
        streak += 1
    else:
        candidate, streak = detected, 1
    if streak >= STABLE_FRAMES and detected != last_sent:
        await arduino.servo(150 if detected else 30)
        await arduino.led(detected)
        last_sent = detected
    label = f"Green {ratio:.0%} | stable {min(streak, STABLE_FRAMES)}/{STABLE_FRAMES}"
    cv2.putText(frame, label, (10, 25), cv2.FONT_HERSHEY_SIMPLEX,
                0.6, (255, 220, 40, 255), 2)
    return frame
`
  }
];
export function lessonProject(lesson:Lesson):Project {
  return {id:crypto.randomUUID(),name:lesson.id+'.py',code:lesson.code,input:'',mode:lesson.mode,
    lesson:{id:lesson.id,checks:[],reflection:''}};
}
