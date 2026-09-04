(() => {
  "use strict";

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (v, amount) => [v[0] * amount, v[1] * amount, v[2] * amount];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const length = (v) => Math.hypot(v[0], v[1], v[2]);
  const normalize = (v) => {
    const magnitude = length(v);
    return magnitude > 1e-10 ? scale(v, 1 / magnitude) : [0, 0, 1];
  };

  function computedNormal(a, b, c) {
    return normalize(cross(subtract(b, a), subtract(c, a)));
  }

  function parseBinarySTL(buffer) {
    const view = new DataView(buffer);
    if (buffer.byteLength < 84) return null;
    const triangleCount = view.getUint32(80, true);
    const expectedLength = 84 + triangleCount * 50;
    if (!triangleCount || expectedLength > buffer.byteLength) return null;

    const triangles = [];
    let offset = 84;
    for (let index = 0; index < triangleCount; index += 1) {
      const suppliedNormal = [
        view.getFloat32(offset, true),
        view.getFloat32(offset + 4, true),
        view.getFloat32(offset + 8, true)
      ];
      offset += 12;
      const vertices = [];
      for (let vertexIndex = 0; vertexIndex < 3; vertexIndex += 1) {
        vertices.push([
          view.getFloat32(offset, true),
          view.getFloat32(offset + 4, true),
          view.getFloat32(offset + 8, true)
        ]);
        offset += 12;
      }
      offset += 2;
      const normal = length(suppliedNormal) > 1e-8
        ? normalize(suppliedNormal)
        : computedNormal(vertices[0], vertices[1], vertices[2]);
      triangles.push({ vertices, normal });
    }
    return triangles;
  }

  function parseAsciiSTL(buffer) {
    const text = new TextDecoder().decode(buffer);
    const vertexPattern = /vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/gi;
    const vertices = [];
    let match;
    while ((match = vertexPattern.exec(text)) !== null) {
      vertices.push([Number(match[1]), Number(match[2]), Number(match[3])]);
    }
    if (vertices.length < 3 || vertices.length % 3 !== 0) return null;

    const triangles = [];
    for (let index = 0; index < vertices.length; index += 3) {
      const triVertices = [vertices[index], vertices[index + 1], vertices[index + 2]];
      triangles.push({
        vertices: triVertices,
        normal: computedNormal(triVertices[0], triVertices[1], triVertices[2])
      });
    }
    return triangles;
  }

  function parseSTL(buffer) {
    return parseBinarySTL(buffer) || parseAsciiSTL(buffer);
  }

  function prepareModel(rawTriangles) {
    const originalPoints = rawTriangles.flatMap((triangle) => triangle.vertices);
    const originalMin = [Infinity, Infinity, Infinity];
    const originalMax = [-Infinity, -Infinity, -Infinity];
    originalPoints.forEach((point) => {
      for (let axis = 0; axis < 3; axis += 1) {
        originalMin[axis] = Math.min(originalMin[axis], point[axis]);
        originalMax[axis] = Math.max(originalMax[axis], point[axis]);
      }
    });

    // CAD STL files are commonly Z-up. Convert to a Y-up web-viewer orientation.
    const orientPoint = ([x, y, z]) => [x, z, -y];
    const orientNormal = ([x, y, z]) => normalize([x, z, -y]);
    const orientedPoints = originalPoints.map(orientPoint);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    orientedPoints.forEach((point) => {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    });

    const center = scale(add(min, max), 0.5);
    const maxDimension = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
    const modelScale = 1.5 / maxDimension;

    const triangles = rawTriangles.map((triangle) => ({
      vertices: triangle.vertices.map((point) => scale(subtract(orientPoint(point), center), modelScale)),
      normal: orientNormal(triangle.normal)
    }));

    // Build feature edges while filtering out coplanar triangle diagonals.
    const edgeMap = new Map();
    const vertexKey = (point) => point.map((value) => Math.round(value * 100000)).join(",");
    triangles.forEach((triangle, faceIndex) => {
      [[0, 1], [1, 2], [2, 0]].forEach(([startIndex, endIndex]) => {
        const start = triangle.vertices[startIndex];
        const end = triangle.vertices[endIndex];
        const startKey = vertexKey(start);
        const endKey = vertexKey(end);
        const key = startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
        if (!edgeMap.has(key)) edgeMap.set(key, { start, end, faces: [] });
        edgeMap.get(key).faces.push(faceIndex);
      });
    });

    const angleThreshold = Math.cos((25 * Math.PI) / 180);
    const edges = [...edgeMap.values()].filter((edge) => {
      if (edge.faces.length < 2) return true;
      const first = triangles[edge.faces[0]].normal;
      const second = triangles[edge.faces[1]].normal;
      return Math.abs(dot(first, second)) < angleThreshold;
    });

    const dimensions = originalMax.map((value, axis) => value - originalMin[axis]);
    return { triangles, edges, dimensions };
  }

  function createViewer(root) {
    const canvas = root.querySelector("[data-stl-canvas]");
    const status = root.querySelector("[data-stl-status]");
    const dimensionsOutput = root.querySelector("[data-stl-dimensions]");
    const autoRotateInput = root.querySelector("[data-stl-auto-rotate]");
    const fullscreenButton = root.querySelector("[data-stl-fullscreen]");
    const resetButton = root.querySelector("[data-stl-reset]");
    const ctx = canvas.getContext("2d", { alpha: true });
    const pointers = new Map();

    let model = null;
    let cssWidth = 1;
    let cssHeight = 1;
    let pixelRatio = 1;
    let lastFrameTime = performance.now();
    let lastPinchDistance = null;

    const state = {
      yaw: -0.72,
      pitch: -0.48,
      zoom: 1,
      mode: "shaded",
      autoRotate: false,
      dirty: true
    };

    const setStatus = (message, stateName = "loading") => {
      status.textContent = message;
      status.dataset.state = stateName;
    };

    const rotatePoint = ([x, y, z]) => {
      const cosPitch = Math.cos(state.pitch);
      const sinPitch = Math.sin(state.pitch);
      const pitchedY = y * cosPitch - z * sinPitch;
      const pitchedZ = y * sinPitch + z * cosPitch;
      const cosYaw = Math.cos(state.yaw);
      const sinYaw = Math.sin(state.yaw);
      return [
        x * cosYaw + pitchedZ * sinYaw,
        pitchedY,
        -x * sinYaw + pitchedZ * cosYaw
      ];
    };

    const projectPoint = ([x, y, z]) => {
      const cameraDistance = 4.6;
      const perspective = cameraDistance / Math.max(0.3, cameraDistance - z);
      const screenScale = Math.min(cssWidth, cssHeight) * 0.35 * state.zoom;
      return [
        cssWidth / 2 + x * screenScale * perspective,
        cssHeight / 2 - y * screenScale * perspective,
        z
      ];
    };

    function drawEdge(edge, dashed) {
      const start = projectPoint(rotatePoint(edge.start));
      const end = projectPoint(rotatePoint(edge.end));
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      if (dashed) {
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = "rgba(71, 85, 105, 0.78)";
        ctx.lineWidth = 1.6;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = state.mode === "shaded" ? "#243b53" : "#0b1f3a";
        ctx.lineWidth = state.mode === "shaded" ? 1.8 : 3;
      }
      ctx.lineCap = "round";
      ctx.stroke();
    }

    function render() {
      state.dirty = false;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      if (!model) return;

      const lightDirection = normalize([0.45, 0.8, 1]);
      const transformedTriangles = model.triangles.map((triangle, faceIndex) => {
        const vertices = triangle.vertices.map(rotatePoint);
        const normal = normalize(rotatePoint(triangle.normal));
        return {
          faceIndex,
          vertices,
          projected: vertices.map(projectPoint),
          normal,
          depth: (vertices[0][2] + vertices[1][2] + vertices[2][2]) / 3
        };
      }).sort((a, b) => a.depth - b.depth);

      transformedTriangles.forEach((triangle) => {
        const facingNormal = triangle.normal[2] < 0 ? scale(triangle.normal, -1) : triangle.normal;
        const brightness = clamp(0.56 + Math.max(0, dot(facingNormal, lightDirection)) * 0.36, 0.48, 0.94);
        const shade = Math.round(255 * brightness);
        const fill = state.mode === "shaded"
          ? `rgb(${Math.round(shade * 0.83)}, ${Math.round(shade * 0.9)}, ${shade})`
          : state.mode === "hidden"
            ? "rgba(241, 245, 249, 0.86)"
            : "rgb(244, 247, 250)";

        ctx.beginPath();
        ctx.moveTo(triangle.projected[0][0], triangle.projected[0][1]);
        ctx.lineTo(triangle.projected[1][0], triangle.projected[1][1]);
        ctx.lineTo(triangle.projected[2][0], triangle.projected[2][1]);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      });

      const faceNormals = model.triangles.map((triangle) => normalize(rotatePoint(triangle.normal)));
      const hiddenEdges = [];
      const visibleEdges = [];
      model.edges.forEach((edge) => {
        const visible = edge.faces.some((faceIndex) => faceNormals[faceIndex][2] > 0.015);
        (visible ? visibleEdges : hiddenEdges).push(edge);
      });

      if (state.mode === "hidden") hiddenEdges.forEach((edge) => drawEdge(edge, true));
      visibleEdges.forEach((edge) => drawEdge(edge, false));
      ctx.setLineDash([]);
    }

    function updatePressedButtons(selector, activeValue, attributeName) {
      root.querySelectorAll(selector).forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset[attributeName] === activeValue));
      });
    }

    function setView(viewName) {
      const views = {
        iso: { yaw: -0.72, pitch: -0.48 },
        front: { yaw: 0, pitch: 0 },
        top: { yaw: 0, pitch: -Math.PI / 2 },
        right: { yaw: Math.PI / 2, pitch: 0 }
      };
      const view = views[viewName] || views.iso;
      state.yaw = view.yaw;
      state.pitch = view.pitch;
      state.dirty = true;
      updatePressedButtons("[data-stl-view]", viewName, "stlView");
    }

    function setMode(modeName) {
      state.mode = modeName;
      state.dirty = true;
      updatePressedButtons("[data-stl-mode]", modeName, "stlMode");
    }

    function resetViewer() {
      state.zoom = 1;
      setView("iso");
      setMode("shaded");
      autoRotateInput.checked = false;
      state.autoRotate = false;
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * pixelRatio);
      canvas.height = Math.round(cssHeight * pixelRatio);
      state.dirty = true;
    }

    function pointerDistance() {
      const values = [...pointers.values()];
      if (values.length < 2) return null;
      return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    }

    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      lastPinchDistance = pointerDistance();
    });

    canvas.addEventListener("pointermove", (event) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 1) {
        state.yaw += (event.clientX - previous.x) * 0.011;
        state.pitch += (event.clientY - previous.y) * 0.011;
        state.dirty = true;
        updatePressedButtons("[data-stl-view]", "", "stlView");
      } else if (pointers.size >= 2) {
        const distance = pointerDistance();
        if (distance && lastPinchDistance) {
          state.zoom = clamp(state.zoom * (distance / lastPinchDistance), 0.55, 2.6);
          state.dirty = true;
        }
        lastPinchDistance = distance;
      }
    });

    const removePointer = (event) => {
      pointers.delete(event.pointerId);
      lastPinchDistance = pointerDistance();
    };
    canvas.addEventListener("pointerup", removePointer);
    canvas.addEventListener("pointercancel", removePointer);

    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.0012), 0.55, 2.6);
      state.dirty = true;
    }, { passive: false });

    canvas.addEventListener("keydown", (event) => {
      const keyActions = {
        ArrowLeft: () => { state.yaw -= 0.12; },
        ArrowRight: () => { state.yaw += 0.12; },
        ArrowUp: () => { state.pitch -= 0.12; },
        ArrowDown: () => { state.pitch += 0.12; },
        "+": () => { state.zoom = clamp(state.zoom * 1.12, 0.55, 2.6); },
        "=": () => { state.zoom = clamp(state.zoom * 1.12, 0.55, 2.6); },
        "-": () => { state.zoom = clamp(state.zoom / 1.12, 0.55, 2.6); }
      };
      if (keyActions[event.key]) {
        event.preventDefault();
        keyActions[event.key]();
        state.dirty = true;
        updatePressedButtons("[data-stl-view]", "", "stlView");
      }
    });

    root.querySelectorAll("[data-stl-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.stlView));
    });
    root.querySelectorAll("[data-stl-view-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        setView(button.dataset.stlViewJump);
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        canvas.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        window.setTimeout(() => canvas.focus({ preventScroll: true }), reducedMotion ? 0 : 350);
      });
    });
    root.querySelectorAll("[data-stl-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.stlMode));
    });

    resetButton.addEventListener("click", resetViewer);
    autoRotateInput.addEventListener("change", () => {
      state.autoRotate = autoRotateInput.checked;
      state.dirty = true;
    });

    fullscreenButton.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await root.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        setStatus("Full-screen mode is unavailable in this browser.", "error");
      }
    });

    document.addEventListener("fullscreenchange", () => {
      fullscreenButton.textContent = document.fullscreenElement ? "Exit Full Screen" : "Full Screen";
      window.setTimeout(resizeCanvas, 80);
    });

    const observer = "ResizeObserver" in window
      ? new ResizeObserver(resizeCanvas)
      : null;
    if (observer) observer.observe(canvas);
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const animate = (time) => {
      const deltaSeconds = Math.min((time - lastFrameTime) / 1000, 0.05);
      lastFrameTime = time;
      if (state.autoRotate && model) {
        state.yaw += deltaSeconds * 0.48;
        state.dirty = true;
        updatePressedButtons("[data-stl-view]", "", "stlView");
      }
      if (state.dirty) render();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    const modelSource = root.dataset.modelSrc;
    setStatus("Loading 3D model…", "loading");
    fetch(modelSource)
      .then((response) => {
        if (!response.ok) throw new Error(`Model request failed (${response.status})`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const triangles = parseSTL(buffer);
        if (!triangles || !triangles.length) throw new Error("The STL file could not be read.");
        model = prepareModel(triangles);
        const formattedDimensions = model.dimensions
          .map((value) => Number(value.toFixed(2)).toLocaleString(undefined, { maximumFractionDigits: 2 }))
          .join(" × ");
        dimensionsOutput.textContent = `${formattedDimensions} mm`;
        setStatus(`Model ready • ${triangles.length} triangular faces`, "ready");
        state.dirty = true;
      })
      .catch((error) => {
        console.error("STL viewer error:", error);
        setStatus("The 3D model could not be loaded. Use the STL download in the Resources section.", "error");
      });
  }

  document.querySelectorAll("[data-stl-viewer]").forEach(createViewer);
})();
