import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import portalVertexShader from './Shaders/Portal/vertex.glsl'
import portalFragmentShader from './Shaders/Portal/fragment.glsl'
import overlayVertexShader from './Shaders/Overlay/vertex.glsl'
import overlayFragmentShader from './Shaders/Overlay/fragment.glsl'


/**
 * Loaders
 */
// Loading
const loaderElement = document.querySelector('.loading')
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        gsap.delayedCall(1, () => {

            loaderElement.style.display = 'none'

            gsap.to(
                overlayMaterial.uniforms.uAlpha, 
                { duration: 1.5, value: 0, delay: 0.5 }
            )

            window.setTimeout(() => {
                initGUI()
            }, 2000)
        })
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => 
    {
        loaderElement.style.display = 'block'
    }
)

// Texture
const textureLoader = new THREE.TextureLoader(loadingManager)

// Draco
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('draco/')

// GLTF
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Base
 */
// Debug
const debugObject = {} 
// gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader,
    uniforms: {
        uAlpha: new THREE.Uniform(1)
    },
    transparent: true,
    depthWrite: false,
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Model
 */
// Material
const bakedTexture = textureLoader.load('/Model/r&m.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

const bakedTexture2 = textureLoader.load('/Model/Rick2.jpg')
bakedTexture2.flipY = false
bakedTexture2.colorSpace = THREE.SRGBColorSpace
const bakedMaterial2 = new THREE.MeshBasicMaterial({ map: bakedTexture2 })

// Portal
debugObject.portalColorStart = '#3a8f47'
debugObject.portalColorEnd = '#c8e14c'

const uniforms = {
    uTime: new THREE.Uniform(0),
    uVelocity: new THREE.Uniform(4.135),
    uDisplacementScale: new THREE.Uniform(9.107),
    uNoiseScale: new THREE.Uniform(3.731),
    uStep: new THREE.Uniform(0.16),
    uColorStart: new THREE.Uniform(new THREE.Color(debugObject.portalColorStart)),
    uColorEnd: new THREE.Uniform(new THREE.Color(debugObject.portalColorEnd))
}

function initGUI()
{
    const gui = new GUI({
        width: 300
    })
    
    gui
        .add(uniforms.uDisplacementScale, 'value', 0, 20, 0.001)
        .name('Displacement Scale')

    gui
        .add(uniforms.uNoiseScale, 'value', 0, 20, 0.001)
        .name('Noise Scale')

    gui
        .add(uniforms.uStep, 'value', 0, 1, 0.001)
        .name('Step')

    gui
        .add(uniforms.uVelocity, 'value', 0.5, 10, 0.001)
        .name('Velocity')

    gui
        .addColor(debugObject, 'portalColorStart')
        .name('Color Start')
        .onChange(() => 
        {
            uniforms.uColorStart.value.set(debugObject.portalColorStart)
        })

    gui
        .addColor(debugObject, 'portalColorEnd')
        .name('Color End')
        .onChange(() => 
        {
            uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
        })

}

const portalMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms: uniforms
})

let modelCenter = new THREE.Vector3() 

gltfLoader.load(
    'Model/r&m.glb',
    (gltf) =>
    {
        gltf.scene.traverse((child) =>
            {
                child.material = bakedMaterial
            })
        gltf.scene.position.y = - 2
        scene.add(gltf.scene)

        const rick = gltf.scene.children.find((child) => child.name === 'Rick')
        rick.material = bakedMaterial2

        const portal = gltf.scene.children.find((child) => child.name === 'Portal')
        portal.material = portalMaterial

        const boundingBox = new THREE.Box3().setFromObject(gltf.scene)
        modelCenter = boundingBox.getCenter(new THREE.Vector3())
    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 15
camera.position.y = 12
camera.position.z = 12
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

controls.minPolarAngle = Math.PI / 8
controls.maxPolarAngle = Math.PI / 2

controls.minAzimuthAngle = Math.PI / 0.5
controls.maxAzimuthAngle = Math.PI / 2

controls.minDistance = 5
controls.maxDistance = 30

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()
    controls.target.copy(modelCenter)
    controls.update()

    // Update materials
    uniforms.uTime.value = elapsedTime

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()