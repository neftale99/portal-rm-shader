uniform float uTime;
uniform float uVelocity;
uniform float uDisplacementScale;
uniform float uNoiseScale;
uniform float uStep;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;

varying vec2 vUv;

#include ../Includes/perlingNoise.glsl

void main()
{
    // Display the uv
    vec2 displacedUv = vUv + cnoise(
        vec3(vUv * uDisplacementScale, uTime * 0.1 * uVelocity)
    );

    // Perling noise
    float strength = cnoise(vec3(
        displacedUv * uNoiseScale, uTime * 0.2 *uVelocity)
    );

    // Outer glow
    float outerGlow = distance(vUv, vec2(0.5)) * 5.0 - 1.4;
    strength += outerGlow;

    // Step
    strength += step(- 0.2, strength) * uStep;

    // Clamp the value
    strength = clamp(strength, 0.0, 1.0);

    // Final color
    vec3 color = mix(uColorStart, uColorEnd, strength);

    gl_FragColor = vec4(color, 1.0);
}