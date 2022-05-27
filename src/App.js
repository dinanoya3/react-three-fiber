import { Canvas, extend, useFrame, useLoader } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import glsl from "babel-plugin-glsl/macro";
import * as THREE from "three";
import React, { useRef, Suspense } from "react";
import "./App.css";

// uv cooordinates - each geometry has coordinates that are defined to help display different colors and textures
// access to uv coordinates are only available in vertex shader
// need to access in fragment shader -> need to use varying
// varying allows sending data from vertex shader to fragment shader
const WaveShaderMaterial = shaderMaterial(
  // uniform - send data from js to shader, can use in both vertex and fragment shader
  // use cases - pass mouse position data, time info, colors, textures
  // default of black, but if prop is passed, the color will be the passed uColor prop
  {
    uTime: 0.0,
    uColor: new THREE.Color(0.0, 0.0, 0.0),
    uTexture: new THREE.Texture(),
  },
  // vertex shader - runs FIRST, receives attributes, calculates, manipulates
  // the position of each vertex
  // position vertices of the geometry
  glsl`
  precision mediump float;

  varying vec2 vUv;
  varying float vWave;

  uniform float uTime;

  #pragma glslify: snoise3 = require(glsl-noise/simplex/3d);

  void main() {
    vUv = uv;

    vec3 pos = position;
    float noiseFreq = 2.5;
    float noiseAmp = 0.7;
    vec3 noisePos = vec3(pos.x * noiseFreq + uTime, pos.y, pos.z);
    pos.z += snoise3(noisePos) * noiseAmp;
    vWave = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // fragment shader - runs AFTER vertex, sets the color of each individual
  // 'fragment' (pixel) of the geometry
  glsl`
  precision mediump float;

  uniform vec3 uColor;
  uniform float uTime;
  uniform sampler2D uTexture;

  varying vec2 vUv;
  varying float vWave;

  void main() {
    float wave = vWave * 0.1;
    vec3 texture = texture2D(uTexture, vUv + wave ).rgb;
    // gl_FragColor = vec4(sin(vUv.x + uTime) * uColor, 1.0);
    gl_FragColor = vec4(texture, 1.0);

  }
  `
);

// the extend function allows the usage of WaveShaderMaterial as a JSX component
extend({ WaveShaderMaterial });

// useFrame - fiber hook that allows code execution on every frame of a fiber's render loop, perfect for animations
// must exist in their own components, NOT RELATIVE TO THE CANVAS COMPONENT
const Wave = () => {
  // useRef to create a reference for waveShaderMaterail
  const ref = useRef();
  useFrame(({ clock }) => {
    ref.current.uTime = clock.getElapsedTime();
  });

  const [image] = useLoader(THREE.TextureLoader, [
    "https://images.unsplash.com/photo-1586788224331-947f68671cf1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fG9yYW5nZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=1000&q=60",
  ]);

  return (
    <mesh>
      {/* the more segments (16 by 16) the smoother the wavy effect is */}
      <planeBufferGeometry args={[0.4, 0.6, 16, 16]} />
      <waveShaderMaterial
        uColor={"hotpink"}
        ref={ref}
        /*wireframe*/ uTexture={image}
      />
    </mesh>
  );
};

const Scene = () => {
  return (
    <Canvas camera={{ fov: 10, position: [0, 0, 5] }}>
      <Suspense fallback={null}>
        <Wave />
      </Suspense>
      {/* light outside of mesh with x,y,z values */}
      {/* <pointLight position={[10, 10, 10]} /> */}
      {/* <mesh> */}
      {/* the values in the args are width and height */}
      {/* <planeBufferGeometry args={[3, 5]} /> */}
      {/* change mesh material */}
      {/* color can only be shown if there's a source of light */}
      {/* <meshStandardMaterial color="red" /> */}
      {/* <waveShaderMaterial uColor={"green"} /> */}
      {/* </mesh> */}
    </Canvas>
  );
};

const App = () => {
  return (
    <>
      <h1>Lorem Ipsum Dolor</h1>
      <Scene />;
    </>
  );
};
export default App;
