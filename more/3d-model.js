(function () {
  function Vec3(x, y, z) {
    return { x: x || 0, y: y || 0, z: z || 0 };
  }

  function add(a, b) { return Vec3(a.x + b.x, a.y + b.y, a.z + b.z); }
  function sub(a, b) { return Vec3(a.x - b.x, a.y - b.y, a.z - b.z); }
  function scale(a, s) { return Vec3(a.x * s, a.y * s, a.z * s); }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function cross(a, b) {
    return Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function norm(a) { const l = len(a) || 1; return scale(a, 1 / l); }

  function rotateX(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return Vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
  }
  function rotateY(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return Vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
  }
  function rotateZ(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return Vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
  }

  function Camera(opts) {
    opts = opts || {};
    return {
      x: opts.x || 0, y: opts.y || 0, z: opts.z || 5,
      fov: opts.fov || 60,
      near: opts.near || 0.1,
      far: opts.far || 100,
      targetX: opts.targetX || 0,
      targetY: opts.targetY || 0,
      targetZ: opts.targetZ || 0
    };
  }

  function viewTransform(v, cam) {
    const eye = Vec3(cam.x, cam.y, cam.z);
    const target = Vec3(cam.targetX, cam.targetY, cam.targetZ);
    const up = Vec3(0, 1, 0);
    const zAxis = norm(sub(eye, target));
    const xAxis = norm(cross(up, zAxis));
    const yAxis = cross(zAxis, xAxis);
    const p = sub(v, eye);
    return Vec3(dot(p, xAxis), dot(p, yAxis), dot(p, zAxis));
  }

  function project(v, cam, width, height) {
    const vv = viewTransform(v, cam);
    if (vv.z >= -cam.near) return null;
    const f = 1 / Math.tan((cam.fov * Math.PI) / 360);
    const aspect = width / height;
    const ndcX = (vv.x * f / aspect) / -vv.z;
    const ndcY = (vv.y * f) / -vv.z;
    return {
      x: (ndcX * 0.5 + 0.5) * width,
      y: (1 - (ndcY * 0.5 + 0.5)) * height,
      z: -vv.z
    };
  }

  function computeNormal(a, b, c) {
    return norm(cross(sub(b, a), sub(c, a)));
  }

  function faceColor(baseColor, normal, lightDir) {
    const l = Math.max(0, dot(normal, lightDir));
    const shade = 0.3 + 0.7 * l;
    if (typeof baseColor === 'string' && baseColor[0] === '#') {
      let r = parseInt(baseColor.slice(1, 3), 16);
      let g = parseInt(baseColor.slice(3, 5), 16);
      let b = parseInt(baseColor.slice(5, 7), 16);
      r = Math.round(r * shade);
      g = Math.round(g * shade);
      b = Math.round(b * shade);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    return baseColor;
  }

  function renderMesh(ctx, mesh, cam, width, height, opts) {
    opts = opts || {};
    const lightDir = norm(opts.light || Vec3(0.4, 0.8, 0.6));
    const baseColor = opts.color || '#e94560';
    const stroke = opts.stroke || null;
    const strokeWidth = opts.strokeWidth || 1;

    const tris = [];
    for (let i = 0; i < mesh.faces.length; i++) {
      const face = mesh.faces[i];
      const p0 = mesh.verts[face[0]];
      const p1 = mesh.verts[face[1]];
      const p2 = mesh.verts[face[2]];
      const n = computeNormal(p0, p1, p2);
      const center = scale(add(add(p0, p1), p2), 1 / 3);
      const viewCenter = viewTransform(center, cam);
      if (viewCenter.z >= -cam.near) continue;
      const a = project(p0, cam, width, height);
      const b = project(p1, cam, width, height);
      const c = project(p2, cam, width, height);
      if (!a || !b || !c) continue;
      const depth = (a.z + b.z + c.z) / 3;
      tris.push({ a, b, c, depth, normal: n, center });
    }

    tris.sort((p, q) => q.depth - p.depth);

    for (let i = 0; i < tris.length; i++) {
      const t = tris[i];
      const col = faceColor(baseColor, t.normal, lightDir);
      ctx.beginPath();
      ctx.moveTo(t.a.x, t.a.y);
      ctx.lineTo(t.b.x, t.b.y);
      ctx.lineTo(t.c.x, t.c.y);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    }
  }

  function cube(size) {
    const s = (size || 1) / 2;
    const verts = [
      Vec3(-s, -s, -s), Vec3(s, -s, -s), Vec3(s, s, -s), Vec3(-s, s, -s),
      Vec3(-s, -s, s), Vec3(s, -s, s), Vec3(s, s, s), Vec3(-s, s, s)
    ];
    const faces = [
      [0, 1, 2], [0, 2, 3],
      [4, 6, 5], [4, 7, 6],
      [0, 4, 5], [0, 5, 1],
      [1, 5, 6], [1, 6, 2],
      [2, 6, 7], [2, 7, 3],
      [3, 7, 4], [3, 4, 0]
    ];
    return { verts, faces };
  }

  function sphere(r, seg) {
    r = r || 1;
    seg = seg || 12;
    const verts = [];
    const faces = [];
    for (let i = 0; i <= seg; i++) {
      const phi = (i / seg) * Math.PI;
      for (let j = 0; j <= seg; j++) {
        const theta = (j / seg) * Math.PI * 2;
        verts.push(Vec3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ));
      }
    }
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * (seg + 1) + j;
        const b = a + seg + 1;
        faces.push([a, b, a + 1]);
        faces.push([a + 1, b, b + 1]);
      }
    }
    return { verts, faces };
  }

  function plane(w, h, seg) {
    w = w || 1;
    h = h || 1;
    seg = seg || 4;
    const verts = [];
    const faces = [];
    for (let i = 0; i <= seg; i++) {
      for (let j = 0; j <= seg; j++) {
        verts.push(Vec3(
          (i / seg - 0.5) * w,
          0,
          (j / seg - 0.5) * h
        ));
      }
    }
    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * (seg + 1) + j;
        const b = a + seg + 1;
        faces.push([a, b, a + 1]);
        faces.push([a + 1, b, b + 1]);
      }
    }
    return { verts, faces };
  }

  function transformMesh(mesh, fn) {
    return {
      verts: mesh.verts.map(fn),
      faces: mesh.faces
    };
  }

  const api = {
    Vec3, add, sub, scale, dot, cross, len, norm,
    rotateX, rotateY, rotateZ,
    Camera, project, renderMesh,
    cube, sphere, plane, transformMesh
  };

  FengACS.registerExtension({
    id: '3d-model',
    file: '3d-model.js',
    type: 'hook',
    name: '3D Model Toolkit',
    onRun: function (info) {
      if (!info) return;
      window.__fengACS_3d = api;
      try {
        if (window.__fengACS_3d && typeof window.__fengACS_3d === 'object') {
          console.log('[3d-model] toolkit injected as window.__fengACS_3d');
        }
      } catch (_) {}
    }
  });

  const originalRun = window.run;
  if (typeof originalRun === 'function') {
    window.run = function () {
      window.__fengACS_3d = api;
      return originalRun.apply(this, arguments);
    };
  }

  window.__fengACS_3d = api;
})();