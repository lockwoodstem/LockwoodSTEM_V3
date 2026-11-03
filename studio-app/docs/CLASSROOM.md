# Programming Studio classroom guide

## First class: prepare, run, explain

Open `/studio/` over HTTPS. The Classroom launchpad guides students through Python
readiness, the run mode, camera and hardware requirements. Start with **Create
first-run project**, then Run. Students should see a success message in the console.
This creates a new named project without replacing the previous program.

The curriculum uses student-written Python and OpenCV. There is no AI coding
assistant, code-generation service, API key or hosted language-model integration.
Existing optional image-classification tools are separate from coding assistance;
none of these three lessons requires a trained AI model.

## Lesson sequence

| Lesson | Time | Outcome | Equipment |
| --- | --- | --- | --- |
| 1. Sensor-controlled LED & servo | 25–35 min | Threshold decisions and proportional mapping | Simulator; optional teacher-prepared board |
| 2. Detect a colored object | 30–40 min | HSV mask, contour area and evidence from changing conditions | Webcam and green object |
| 3. Vision-controlled sorter | 40–50 min | Vision-to-actuator decisions with frame persistence | Webcam and simulator first; optional board |

Each lesson opens a separate project with runnable code and the appropriate mode.
Students follow Build & test, check their own evidence, and record observations.
Checks and notes autosave with the project and travel in the JSON submission file.
These are self-reported observations, not automatically verified mastery or hardware
certification. No frames or photographs are included in the submission.

### Suggested assessment

- Explain the input, decision and output in the student's own code.
- Predict behavior before changing a threshold or mapping.
- Compare expected and observed results, including a boundary or negative case.
- Describe a limitation and use evidence to justify one improvement.
- Demonstrate Stop, rearming and export independently.

Lesson 1 boundary: `value > 512` is false at 512 and true at 513. Sensor endpoints
map to 0° and 180°. Lesson 2 should compare green, non-green and empty scenes in
more than one lighting condition. Lesson 3 uses a green-pixel ratio of 0.08 and
three consecutive agreeing frames before changing the gate command. The delay
varies with achieved frame rate; it is not a fixed time guarantee. Noise and lighting
can cause false detections. A classroom sorter is not a safety-rated machine.

## Submission and recovery

Use Export submission for a `.studio.json` containing code, inputs, run mode,
lesson checklist and reflection. Students upload that file to your usual LMS.
The console is included only when it corresponds to the current project's unchanged
code, input and mode; `lastRun` records the program used for the last run of that project in this session.
A file may have no console evidence if it was restored or edited after running.
Import project restores lesson notes after confirmation and creates a new project ID.
Export .py remains available for code-only submission. Browser data is local to the
origin/profile; students should export before leaving a shared device.

Opening a lesson first commits the current project. If saving fails, Studio leaves
it open and asks the student to export it. Use one Studio editing tab at a time.

## Simulator and troubleshooting

The LED, animated servo arm and sensor meter reflect the browser simulator's state.
Sensor presets include 0, 512, 513 and 1023 for boundary tests. Manual LED/servo
controls require arming and are disabled during Python execution; the sensor slider
and presets remain usable while a program runs. Stop switches the LED off and
marks the servo detached. The gray arm shows its last command, not a claim about
physical position. When USB mode is selected, the display shows commands and sensor
replies, not measured servo feedback; simulator manual controls are hidden.

Camera messages distinguish permission denial, missing devices and busy devices.
Connection help explains USB selection, browser support, port ownership and timeouts.
USB arming remains unavailable until the standard firmware handshake completes.

## Teacher hardware validation record — complete with actual devices

Software tests use fake media/serial streams. The following must be observed on
classroom hardware, not inferred from a green software check. Record date, tester,
computer/browser version, board model, firmware version and result for every item.

- [ ] Verify school-managed browser access to the site and required package downloads.
- [ ] Load the standard firmware onto Uno R3 or classic Nano. Check USB permissions.
- [ ] Connect, confirm firmware v1, arm and test the built-in LED.
- [ ] Read a correctly wired A0 potentiometer at low, middle and high positions.
- [ ] Check an externally powered, unloaded D9 servo with common ground. Start at 90°;
      verify mechanically safe travel before running endpoint tests or attaching a gate.
- [ ] Test webcam permission allow/deny, unplug/reconnect and conflicts with other apps.
- [ ] Run each lesson in simulation before enabling USB.
- [ ] Verify Stop, program errors, disarm, hidden tab and USB unplug stop commands.
- [ ] Verify firmware watchdog behavior after the browser is terminated (1500 ms without
      valid armed traffic). Servo detachment stops pulses; it does not cut power or brake.
- [ ] Verify reconnect/reset timing, rearming, and a second student's browser session.
- [ ] Export and re-import a submission and confirm code, checklist and notes survive.

Follow [wiring and protocol instructions](HARDWARE.md). Keep servo power disconnected
while wiring and keep hands clear of moving mechanisms. Physical validation is not
performed automatically by this page or by the simulator.
