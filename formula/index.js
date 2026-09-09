const BACKGROUND = "#101010"
const FOREGROUND = "#50FF50"

// Lines fade out as they approach the camera, so the near side of the model
// stops painting over everything behind it.
const ALPHA_NEAR = 0.02      // at the closest point of the model
const ALPHA_FAR  = 0.90      // at the furthest point
const LINE_WIDTH = 1.2       // CSS pixels

// The ink landing on a pixel is roughly (lines crossing it) x (alpha), so a
// fixed alpha that reads well on a 100k-edge model saturates to a solid blob
// on a 1.4M-edge one. Fade in proportion to the edge count to hold the density
// steady; the two constants above are what a model of this size should look
// like. Models below it are left alone.
const ALPHA_EDGES = 150000

const SPIN = Math.PI         // radians per second
let dz = 1
let angle = 0

// Per-line alpha means per-line state, and canvas 2D can only carry that with
// one stroke call per line -- which is the thing that made big models crawl.
// WebGL takes it as a vertex attribute, so it costs nothing.
const gl = game.getContext("webgl2") || game.getContext("webgl")
if (!gl) {
    const ctx = game.getContext("2d")
    ctx.fillStyle = FOREGROUND
    ctx.font = "16px monospace"
    ctx.fillText("this renderer needs WebGL", 20, 40)
    throw new Error("no WebGL context")
}

// WebGL2 has instancing built in; WebGL1 needs the extension.
const instancing = gl.drawArraysInstanced
    ? {draw: gl.drawArraysInstanced.bind(gl),
       divisor: gl.vertexAttribDivisor.bind(gl)}
    : (() => {
        const ext = gl.getExtension("ANGLE_instanced_arrays")
        if (!ext) throw new Error("no instanced arrays")
        return {draw: ext.drawArraysInstancedANGLE.bind(ext),
                divisor: ext.vertexAttribDivisorANGLE.bind(ext)}
    })()

const VERTEX_SHADER = `
attribute vec2 a_corner;    // x: 0 = from, 1 = to.  y: which side of the line
attribute vec3 a_from;
attribute vec3 a_to;

uniform float u_angle;
uniform float u_dz;
uniform float u_radius;     // how far the model reaches out from the spin axis
uniform float u_scale;      // device pixels per projected unit
uniform vec2  u_half;       // half the canvas, in device pixels
uniform float u_halfWidth;  // half the line width, in device pixels
uniform vec2  u_alpha;      // near, far

varying float v_alpha;

vec3 rotate_xz(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(p.x*c - p.z*s, p.y, p.x*s + p.z*c);
}

vec2 screen(vec3 p) {
    return vec2(p.x, p.y) / p.z * u_scale;
}

void main() {
    vec3 a = rotate_xz(a_from, u_angle);  a.z += u_dz;
    vec3 b = rotate_xz(a_to,   u_angle);  b.z += u_dz;

    // Widen the line in screen space, so it keeps its thickness whatever the
    // perspective does to it. gl.lineWidth is capped at 1 on most platforms.
    vec2 sa = screen(a);
    vec2 sb = screen(b);
    vec2 d = sb - sa;
    float len = length(d);
    vec2 normal = len > 0.0 ? vec2(-d.y, d.x)/len : vec2(0.0, 0.0);

    vec2 pos = mix(sa, sb, a_corner.x) + normal*a_corner.y*u_halfWidth;
    gl_Position = vec4(pos / u_half, 0.0, 1.0);

    float z = mix(a.z, b.z, a_corner.x);
    float t = clamp((z - (u_dz - u_radius)) / (2.0*u_radius), 0.0, 1.0);
    v_alpha = mix(u_alpha.x, u_alpha.y, t);
}
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 u_color;
varying float v_alpha;

void main() {
    gl_FragColor = vec4(u_color, v_alpha);
}
`

function compile(type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader))
    return shader
}

const program = gl.createProgram()
gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER))
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
gl.linkProgram(program)
if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program))
gl.useProgram(program)

function rgb(hex) {
    return [parseInt(hex.slice(1, 3), 16)/255,
            parseInt(hex.slice(3, 5), 16)/255,
            parseInt(hex.slice(5, 7), 16)/255]
}

function attribute(name, data, size, divisor) {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
    instancing.divisor(loc, divisor)
}

// Every entry of fs is a closed loop of vertices, except a two-index entry,
// which is a single edge rather than a loop that doubles back on itself.
function segments_in(f) {
    return f.length > 2 ? f.length : 1
}

// One quad per edge, expanded to width in the vertex shader.
function build() {
    let count = 0
    for (const f of fs) count += segments_in(f)

    const from = new Float32Array(count*3)
    const to = new Float32Array(count*3)
    let k = 0
    for (const f of fs) {
        const n = segments_in(f)
        for (let i = 0; i < n; ++i) {
            const a = vs[f[i]]
            const b = vs[f[(i+1)%f.length]]
            from[k] = a.x; from[k+1] = a.y; from[k+2] = a.z
            to[k] = b.x;   to[k+1] = b.y;   to[k+2] = b.z
            k += 3
        }
    }

    attribute("a_corner", new Float32Array([0,-1, 0,1, 1,-1, 1,1]), 2, 0)
    attribute("a_from", from, 3, 1)
    attribute("a_to", to, 3, 1)
    return count
}

// The spin is about the y axis, so what sets the depth range is how far the
// model reaches out sideways, not its full bounding sphere.
function spin_radius() {
    let r = 0
    for (const v of vs) r = Math.max(r, Math.sqrt(v.x*v.x + v.z*v.z))
    return Math.max(r, 1e-6)
}

const count = build()
const radius = spin_radius()

const uniform = name => gl.getUniformLocation(program, name)
gl.uniform3fv(uniform("u_color"), rgb(FOREGROUND))
const fade = Math.min(1, ALPHA_EDGES/count)
gl.uniform2f(uniform("u_alpha"), ALPHA_NEAR*fade, ALPHA_FAR*fade)
gl.uniform1f(uniform("u_radius"), radius)
gl.uniform1f(uniform("u_dz"), dz)

const background = rgb(BACKGROUND)
gl.clearColor(background[0], background[1], background[2], 1)
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

// Fill the whole browser window, at device resolution so lines stay crisp.
function resize() {
    const dpr = window.devicePixelRatio || 1
    game.width = Math.round(window.innerWidth * dpr)
    game.height = Math.round(window.innerHeight * dpr)
    gl.viewport(0, 0, game.width, game.height)
    gl.uniform2f(uniform("u_half"), game.width/2, game.height/2)
    // -1..1 maps to the largest square centred in the canvas, so the model
    // keeps its proportions whatever shape the window is
    gl.uniform1f(uniform("u_scale"), Math.min(game.width, game.height)/2)
    gl.uniform1f(uniform("u_halfWidth"), LINE_WIDTH*dpr/2)
}
resize()
window.addEventListener("resize", resize)

let last = 0
function frame(now) {
    const dt = last ? Math.min((now - last)/1000, 0.1) : 0
    last = now
    angle += SPIN*dt

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(uniform("u_angle"), angle)
    instancing.draw(gl.TRIANGLE_STRIP, 0, 4, count)

    requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
