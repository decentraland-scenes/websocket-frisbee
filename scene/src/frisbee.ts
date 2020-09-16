import { Sound } from './sounds'
import * as ui from '../node_modules/@dcl/ui-utils/index'
import { createFloatingText } from './floatingText'
import { alteredUserName, dataType } from './wsConnection'
import { streakCounter } from './game'

const X_OFFSET = 0
const Y_OFFSET = 0.5
const Z_OFFSET = 1

const FIXED_TIME_STEPS = 1.0 / 60.0 // seconds
const MAX_TIME_STEPS = 3
//const RECALL_SPEED = 10
const SHOOT_VELOCITY = 100

const shootSound = new Sound(new AudioClip('sounds/shoot.mp3'))
const recallSound = new Sound(new AudioClip('sounds/recall.mp3'))

export class Frisbee extends Entity {
  isFired: boolean = false
  blueGlow = new Entity()
  orangeGlow = new Entity()
  body: CANNON.Body
  holding: boolean = false
  otherHolding: boolean = false
  lastHolder: boolean = false
  world: CANNON.World
  socket: WebSocket
  constructor(transform: Transform, world: CANNON.World, socket: WebSocket) {
    super()
    engine.addEntity(this)
    this.addComponent(new GLTFShape('models/translocator.glb'))
    this.addComponent(transform)

    this.world = world
    this.socket = socket

    // Glow setup
    this.blueGlow.addComponent(new Transform())
    this.blueGlow.addComponent(new GLTFShape('models/blueGlow.glb'))
    this.blueGlow.setParent(this)

    this.orangeGlow.addComponent(new Transform())
    this.orangeGlow.addComponent(new GLTFShape('models/orangeGlow.glb'))
    this.orangeGlow.setParent(this)

    this.setGlow(false)

    this.addComponent(
      new OnPointerDown(
        () => {
          if (this.holding || this.otherHolding) return

          this.playerPickUp(this.getComponent(Transform).position.clone())
        },
        { hoverText: 'Pick up', distance: 6, button: ActionButton.PRIMARY }
      )
    )

    this.body = new CANNON.Body({
      mass: 3, // kg
      position: new CANNON.Vec3(
        transform.position.x,
        transform.position.y,
        transform.position.z
      ), // m
      shape: new CANNON.Sphere(0.2), // m (Create sphere shaped body with a radius of 0.2)
    })

    const translocatorPhysicsMaterial: CANNON.Material = new CANNON.Material(
      'translocatorMaterial'
    )

    this.body.material = translocatorPhysicsMaterial // Add bouncy material to translocator body
    this.body.linearDamping = 0.4 // Round bodies will keep translating even with friction so you need linearDamping
    this.body.angularDamping = 0.4 // Round bodies will keep rotating even with friction so you need angularDamping
    world.addBody(this.body) // Add body to the world
  }

  // Switches between the glows
  setGlow(isFired: boolean): void {
    if (isFired) {
      this.isFired = isFired
      this.blueGlow.getComponent(Transform).scale.setAll(0)
      this.orangeGlow.getComponent(Transform).scale.setAll(1)
    } else {
      this.isFired = isFired
      this.blueGlow.getComponent(Transform).scale.setAll(1)
      this.orangeGlow.getComponent(Transform).scale.setAll(0)
    }
  }
  setPos(pos: Vector3, rot: Quaternion, holding?: boolean) {
    this.getComponent(Transform).position.copyFrom(pos)
    this.getComponent(Transform).rotation.copyFrom(rot)

    this.body.position = new CANNON.Vec3(pos.x, pos.y, pos.z)
    this.body.quaternion = new CANNON.Quaternion(rot.x, rot.y, rot.z, rot.w)

    this.lastHolder = false
    this.holding = false
    if (holding) {
      this.otherHolding = true
    } else {
      this.otherHolding = false
    }
  }

  playerPickUp(pos: Vector3) {
    this.holding = true
    this.lastHolder = true
    this.otherHolding = false
    this.isFired = false
    recallSound.getComponent(AudioSource).playOnce()

    this.body.velocity.setZero()
    this.body.angularVelocity.setZero()
    this.setParent(Attachable.FIRST_PERSON_CAMERA)
    this.getComponent(Transform).position.set(X_OFFSET, Y_OFFSET, Z_OFFSET)
    this.getComponent(Transform).rotation = Quaternion.Zero()
    this.body.position = new CANNON.Vec3(X_OFFSET, Y_OFFSET, Z_OFFSET)
    //this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 0), 0)

    if (pos.y > 0.5) {
      ui.displayAnnouncement('Good catch!')
      streakCounter.increase()
    } else {
      streakCounter.set(0)
    }

    this.socket.send(
      JSON.stringify({
        type: dataType.PICK,
        data: {
          user: alteredUserName,
          pos: pos,
          streak: streakCounter.read(),
          timeStamp: Date.now(),
        },
      })
    )

    // if y > 0 -> Show UI "Caught!"

    // maybe if currently moving / longer distance, more score
  }
  otherPickUp(user: string, pos: Vector3, streak: number) {
    this.holding = false
    this.lastHolder = false
    this.otherHolding = true
    this.isFired = false

    this.body.velocity.setZero()
    this.body.angularVelocity.setZero()
    this.getComponent(GLTFShape).visible = false

    if (pos.y > 1.5) {
      createFloatingText('Wow!', pos, 0.5, 2, Color3.Red())
    } else if (pos.y > 0.5) {
      createFloatingText('Good Catch!', pos, 0.5, 2, Color3.Red())
    } else {
      createFloatingText('Picked frisbee up', pos, 0.5, 2)
    }
    streakCounter.set(streak)

    // if y > 0 -> Show in-world UI "Caught!"
  }
  playerThrow(shootDirection: Vector3) {
    if (this.isFired || !this.holding) return
    this.isFired = true
    engine.addSystem(new shootDiscSystem(this))

    shootSound.getComponent(AudioSource).playOnce()
    this.holding = false

    this.getComponent(GLTFShape).visible = true

    this.setGlow(true)
    this.setParent(null)

    this.body.position.set(
      Camera.instance.feetPosition.x + shootDirection.x,
      shootDirection.y + Camera.instance.position.y,
      Camera.instance.feetPosition.z + shootDirection.z
    )

    // Shoot
    this.body.applyImpulse(
      new CANNON.Vec3(
        shootDirection.x * SHOOT_VELOCITY,
        shootDirection.y * SHOOT_VELOCITY,
        shootDirection.z * SHOOT_VELOCITY
      ),
      new CANNON.Vec3(
        this.body.position.x,
        this.body.position.y,
        this.body.position.z
      )
    )
  }
  otherThrow(pos: Vector3, rot: Quaternion, shootDirection: Vector3) {
    this.holding = false
    this.lastHolder = false
    this.otherHolding = false
    this.isFired = true
    //shootSound.getComponent(AudioSource).playOnce()

    this.getComponent(GLTFShape).visible = true
    this.setParent(null)

    engine.addSystem(new shootDiscSystem(this))

    this.getComponent(Transform).position.copyFrom(pos)
    this.getComponent(Transform).rotation.copyFrom(rot)

    this.body.position = new CANNON.Vec3(pos.x, pos.y, pos.z)
    this.body.quaternion = new CANNON.Quaternion(rot.x, rot.y, rot.z, rot.w)

    this.body.applyImpulse(
      new CANNON.Vec3(
        shootDirection.x * SHOOT_VELOCITY,
        shootDirection.y * SHOOT_VELOCITY,
        shootDirection.z * SHOOT_VELOCITY
      ),
      new CANNON.Vec3(pos.x, pos.y, pos.z)
    )
  }
}

class shootDiscSystem implements ISystem {
  frisbee: Frisbee
  constructor(frisbee: Frisbee) {
    this.frisbee = frisbee
  }
  update(dt: number): void {
    if (this.frisbee.isFired) {
      this.frisbee.world.step(FIXED_TIME_STEPS, dt, MAX_TIME_STEPS)
      this.frisbee
        .getComponent(Transform)
        .position.copyFrom(this.frisbee.body.position)
    } else {
      engine.removeSystem(this)
    }
  }
}
