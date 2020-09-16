@Component('floatingText')
export class FloatingText {
  timeLeft: number = 1
  speed: number = 1
  opacity: number = 1
  constructor(speed: number = 1) {
    this.speed = speed
  }
}

// component group floating texts
export const texts = engine.getComponentGroup(FloatingText)

export function createFloatingText(
  val: string,
  pos: Vector3,
  speed: number = 1,
  height: number = 1,
  color: Color3 = Color3.Blue()
) {
  let text = new Entity()
  text.addComponent(new Billboard(true, true, true))
  //text.setParent(parent)

  //   let pos: Vector3
  //   if (parent instanceof Vector3) {
  //     pos = parent.clone()
  //   } else if (parent instanceof Entity) {
  //     pos = parent.getComponent(Transform).position.clone()
  //   }

  pos.y = height
  text.addComponent(
    new Transform({
      position: pos, // new Vector3(0, height, 0)
    })
  )
  text.addComponent(new FloatingText(speed))
  engine.addEntity(text)

  let textShape = new TextShape(val)
  text.addComponent(textShape)

  textShape.fontSize = 5
  textShape.fontWeight = 'bold'
  textShape.color = color
}

export class FloatingTextUpdate implements ISystem {
  update(dt: number) {
    for (let t of texts.entities) {
      let transform = t.getComponent(Transform)
      let text = t.getComponent(FloatingText)
      let textShape = t.getComponent(TextShape)
      transform.position.y += dt / 2
      text.timeLeft -= dt * text.speed
      textShape.opacity *= 0.95
      if (text.timeLeft < 0) {
        engine.removeEntity(t)
      }
    }
  }
}
