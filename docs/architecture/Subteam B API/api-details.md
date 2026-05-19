(**To See How it Works**)[https://github.com/facefusion/facefusion?tab=License-1-ov-file]

---

### How it works

Usually you’d run FaceFusion on **your own server** and expose a simple HTTP API endpoint.
**General Process**

- It works on any **normal** photo
- Faces are detected automatically using face detection models
- **You just provide:**
  - source image (the face you want to use)
  - target image (the photo where faces will be replaced)
  - optional settings

**What then happens internally**

- The system:
  - Detects all faces in the target image
  - Detects the face in the source image
  - Matches and swaps based on similarity + detection confidence

**Then your backend:**

- saves the files temporarily
- runs FaceFusion via CLI/Python
- returns the merged image

---

### Typically how its used

CLI means Command Line Interface — basically running a program through terminal commands instead of clicking buttons.
For FaceFusion, you normally run commands like:
```
python facefusion.py run \
 --source source.jpg \
 --target target.jpg \
 --output output.jpg 
 ```

That command tells FaceFusion:
which face image to use (source)
which image/video to modify (target)
where to save the result (output)

---

### Option JavaScript (Node.JS API)

You can call FaceFusion from Node using child_process.

Example:

```
const { exec } = require("child_process")

exec(
  `python facefusion.py run --source s.jpg --target t.jpg --output o.jpg`,
  (err, stdout, stderr) => {
    console.log(stdout)
  }
)
```
