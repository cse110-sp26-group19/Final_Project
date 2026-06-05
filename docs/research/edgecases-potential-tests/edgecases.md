# Potential Edge Cases

### Pose & Orientation

- Extreme profile views (90° side face)
- Looking up/down at steep angles
- Head tilted heavily (roll rotation)
- Upside -down faces
- Faces reflected in mirrors
- Faces displayed on screens or photographs

### Occlusions

- Sunglasses (especially large reflective ones)
- Face masks
- Hands covering parts of the face
- Hair covering eyes or cheeks
- Scarves, hats, helmets
- Microphone or objects blocking facial features

### Lighting

- Strong backlighting
- Overexposed faces
- Underexposed/dark faces
- Colored lighting (red, blue, club lighting)
- Harsh shadows across the face
- Mixed lighting conditions
- Flash reflections

### Identity & Demographics

- Identical twins
- Similar -looking individuals in the same image
- Children vs. adults
- Elderly faces with deep wrinkles
- Heavy makeup
- Facial tattoos
- Dramatic weight differences between source and target

### Facial Features

- Facial hair mismatches
- Very large beards
- Mustaches obscuring the mouth
- Missing teeth visible in smile
- Braces
- Closed eyes vs. open eyes
- Extreme facial expressions (screaming, laughing, puffed cheeks)

### Image Quality

- Motion blur
- Defocus blur
- JPEG compression artifacts
- Low -resolution source face
- AI -generated faces
- Noise/grainy images
- Sharpening artifacts

### Multi -Person Scenarios

- Many faces in one image (>10)
- Similar -looking people in group photos
- Face ordering ambiguity
- Multiple detections of the same face
- Faces at drastically different scales

### Alignment & Geometry

- Source face much larger than target face
- Source face much smaller than target face
- Different focal lengths (wide -angle vs telephoto)
- Perspective distortion
- Fish -eye lens distortion
- Face near image boundaries

### Accessories

- Glasses → no glasses swap
- No glasses → glasses swap
- Transparent glasses
- Reflective sunglasses
- Earrings intersecting face boundaries
- Headphones

### Skin & Color Issues

- Large skin tone differences
- Different white balance between images
- HDR target image
- Strong color grading/filtering
- Uneven skin illumination

### Detection Edge Cases

- Statues/mannequins detected as faces
- Cartoon/anime characters
- Animal faces mistakenly detected
- Faces in paintings
- Faces on posters/billboards
- Deepfake -generated faces

### Production -Level Adversarial Cases

- Two faces sharing nearly identical embeddings
- Face detector finds face but landmark detector fails
- Landmark detector drifts on profile faces
- Swap target has extreme expression not present in source
- Very high -resolution images (8K+)
- Transparent or semi -transparent objects in front of face
- Face partially hidden behind glass with reflections[3:48 PM]## What to test and what not to
