import * as ui from '@dcl/ui-scene-utils'
import * as utils from '@dcl/ecs-scene-utils'
/*
  IMPORTANT: The tsconfig.json has been configured to include "node_modules/cannon/build/cannon.js"
*/

import { Frisbee } from './frisbee'
import { addPhysicsConstraints } from './physicsConstraints'
import { FloatingTextUpdate } from './floatingText'
import { alteredUserName, dataType, joinSocketsServer } from './wsConnection'

export let frisbee: Frisbee
export let sceneStarted = false

// Create base scene
const baseScene = new Entity()
baseScene.addComponent(new GLTFShape('models/hexBase.glb'))
baseScene.addComponent(new Transform())
engine.addEntity(baseScene)

async function setUpScene() {
  const socket = await joinSocketsServer()

  // Setup our CANNON world
  const world = new CANNON.World()
  world.quatNormalizeSkip = 0
  world.quatNormalizeFast = false
  world.gravity.set(0, -9.82, 0) // m/s²

  const groundMaterial = new CANNON.Material('groundMaterial')
  const groundContactMaterial = new CANNON.ContactMaterial(
    groundMaterial,
    groundMaterial,
    { friction: 0, restitution: 0.33 }
  )
  world.addContactMaterial(groundContactMaterial)

  // Create a ground plane
  const planeShape = new CANNON.Plane()
  const groundBody = new CANNON.Body({
    mass: 0, // mass === 0 makes the body static
  })
  groundBody.addShape(planeShape)
  groundBody.material = groundMaterial
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis
  groundBody.position.y = 0.17 // Thickness of ground base model
  world.addBody(groundBody)

  frisbee = new Frisbee(
    new Transform({ position: new Vector3(24, 1, 24) }),
    world,
    socket,
    groundBody
  )

  addPhysicsConstraints(world, frisbee.body.material, 3, 3, true)

  const translocatorPhysicsContactMaterial = new CANNON.ContactMaterial(
    groundMaterial,
    frisbee.body.material,
    {
      friction: 0.0,
      restitution: 0.8,
    }
  )
  world.addContactMaterial(translocatorPhysicsContactMaterial)

  Input.instance.subscribe('BUTTON_DOWN', ActionButton.POINTER, false, (e) => {
    const shootDirection = Vector3.Forward().rotate(Camera.instance.rotation) // Camera's forward vector

    frisbee.playerThrow(shootDirection)

    socket.send(
      JSON.stringify({
        type: dataType.THROW,
        data: {
          user: alteredUserName,
          pos: Camera.instance.position.clone(),
          rot: Camera.instance.rotation.clone(),
          dir: shootDirection,
          timeStamp: Date.now(),
        },
      })
    )
  })

  const MAX_CATCH_DIST = 3

  Input.instance.subscribe('BUTTON_DOWN', ActionButton.PRIMARY, false, (e) => {
    if (!frisbee.isFired || frisbee.holding || frisbee.otherHolding) {
      return
    }

    const dist = distance(
      frisbee.getComponent(Transform).position,
      Camera.instance.position.clone()
    )

    log(dist)

    if (dist < MAX_CATCH_DIST * MAX_CATCH_DIST * MAX_CATCH_DIST) {
      frisbee.playerPickUp(frisbee.getComponent(Transform).position.clone())
    }
  })

  return
}

export async function setDisk(pos: Vector3, rot: Quaternion) {
  frisbee.getComponent(Transform).position.copyFrom(pos)
  frisbee.getComponent(Transform).rotation.copyFrom(rot)

  frisbee.body.position = new CANNON.Vec3(pos.x, pos.y, pos.z)
  frisbee.body.quaternion = new CANNON.Quaternion(rot.x, rot.y, rot.z, rot.w)
}

function distance(pos1: Vector3, pos2: Vector3): number {
  const a = pos1.x - pos2.x
  const b = pos1.y - pos2.y
  const c = pos1.z - pos2.z
  return a * a + b * b + c * c
}

engine.addSystem(new FloatingTextUpdate())

const streakLabel = new ui.CornerLabel(
  'STREAK',
  -80,
  30,
  Color4.FromHexString('#34deebff'),
  25
)
export const streakCounter = new ui.UICounter(
  0,
  -10,
  30,
  Color4.FromHexString('#34deebff'),
  25
)

export const catchHint = new ui.CornerLabel(
  'E to Catch',
  50,
  50,
  Color4.FromHexString('#f2ff3bff'),
  25
)
catchHint.uiText.hAlign = 'center'
catchHint.uiText.font = ui.SFHeavyFont
catchHint.uiText.visible = false

streakLabel.uiText.visible = false
streakCounter.uiText.visible = false

const uiArea = new Entity()
uiArea.addComponent(
  new Transform({
    position: new Vector3(24, 0, 24),
  })
)
engine.addEntity(uiArea)

uiArea.addComponent(
  new utils.TriggerComponent(
    new utils.TriggerBoxShape(new Vector3(48, 32, 48)),
    {
      onCameraEnter: () => {
        if (!sceneStarted) {
          setUpScene().catch((error) => log(error))
          sceneStarted = true
        }

        streakLabel.uiText.visible = true
        streakCounter.uiText.visible = true
      },
      onCameraExit: () => {
        streakLabel.uiText.visible = false
        streakCounter.uiText.visible = false
        catchHint.uiText.visible = false
      },
    }
  )
)
