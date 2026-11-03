# LockwoodSTEM browser-to-Arduino bridge — protocol v1

Students run Python entirely in the browser. A teacher must first flash
`firmware/LockwoodStudio/LockwoodStudio.ino` using Arduino tools and the Servo
library. Initial target: Uno R3 or classic Nano with ATmega328P. This app is not
a firmware compiler/uploader. Other boards and school-managed USB policies need validation.

## Wiring and classroom setup

- LED: built-in D13 LED; no external LED required.
- Servo: signal D9; use a suitable external regulated servo supply and common ground.
  Disconnect power while wiring. Do not power a loaded servo from a computer USB port.
- Sensor: potentiometer wiper to A0, ends to 5V and GND on these 5V boards (0–1023).
- Begin unloaded with a small classroom servo; ensure 0–180 degrees is mechanically safe.
- Open Studio over HTTPS in desktop Chrome/Edge, choose USB Arduino, Connect board,
  select its serial port, wait for firmware v1 confirmation, then Arm hardware.
- Close Arduino Serial Monitor/other apps that own the port. Opening a port resets many boards.
- Run the hardware starter. The same code works in Simulator with its sensor slider.

```python
import asyncio
await arduino.led(True)
await arduino.servo(90)
print(await arduino.sensor())
await asyncio.sleep(1)
await arduino.stop()
```

Always `await` each command. Top-level await works in Studio. Live callbacks may be
`async def process_frame(frame)` and await hardware operations. Legacy commands are
available as `await serial_send("LED_ON")` (LED_OFF, SERVO_0/90/180, STOP,
MOTOR_STOP also supported); `await read_sensor()` returns the current A0 integer.
MOTOR_STOP is a STOP alias, not support for a motor driver.

## Wire format

115200 baud, 8N1, ASCII, LF terminated (CR before LF accepted), maximum 63 bytes
before LF. Request: `<positive-id> <COMMAND> <integer>\n`.
Response: `<id> OK <integer>\n` or `<id> ERR <code>\n`.
One outstanding request; IDs correlate responses, fragmented/coalesced reads are supported.
No unsolicited telemetry. Unknown IDs and bootloader text are ignored. Browser response
timeout is 1 second, following a 1.8-second bootloader wait before HELLO.

| Command | Value | Result |
| --- | --- | --- |
| HELLO | 0 | protocol version 1; disarms |
| ARM | 1 | 1; arms output commands |
| PING | 0 | 0; refreshes armed watchdog |
| LED | 0 or 1 | written value |
| SERVO | integer 0–180 | written angle; attaches D9 |
| SENSOR | 0 | current A0, 0–1023 |
| STOP | 0 | 0; LED off, servo detached, disarmed |

Errors: 1 malformed request, 2 not armed, 3 invalid command/value, 4 overflow.
Malformed/overflow replies use ID 0, disarm immediately, and lead to a browser timeout.
Firmware never executes arbitrary pin writes, code, or raw serial payloads from students.

## Stop behavior and validation

Run completion/error, Stop, camera stop while running, hidden tab, page exit,
disarm and disconnect request STOP. Pending Python requests are rejected; no new
actuator command passes the disarmed gate. Browser heartbeats run at 400 ms while
armed. Firmware independently turns the LED off and detaches the servo after
1500 ms without a valid armed command. Browser closure/crash cannot guarantee a
final serial write, so verify this watchdog on actual boards.

Servo detachment stops control pulses: it does NOT brake a load or cut servo power.
This is educational control, not an emergency-stop system for machinery. Disconnect
actuator power when a physical stop is needed. A0 is read on request, not continuously.

Before classroom release, verify on real Uno/Nano: firmware compilation/upload,
handshake/reset timing, LED, A0 endpoints, externally powered unloaded servo,
Stop/disarm/error/hidden-tab paths, unplug/reconnect, browser crash watchdog,
permission denial, and managed Chrome/Edge compatibility. Automated browser tests
use simulated media and serial streams, not a physical board.
