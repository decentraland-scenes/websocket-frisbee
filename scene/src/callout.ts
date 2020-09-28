@Component("calloutFlag")
class CalloutFlag {}

class calloutToUser implements ISystem {
  update() {
    for (let entity of calloutGroup.entities) {
      entity.getComponent(Transform).lookAt(Camera.instance.position)
    }
  }
}

let calloutSystem: ISystem

export class Callout extends Entity {
  constructor(model: GLTFShape, transform: Transform) {
    super()
    engine.addEntity(this)
    this.addComponent(new CalloutFlag())
    this.addComponent(model)
    this.addComponent(transform)
    calloutSystem = engine.addSystem(new calloutToUser())
  }
  
  removeCallout(): void {
    this.getComponent(Transform).scale.setAll(0)
  }
  addCallout(): void {
    this.getComponent(Transform).scale.setAll(1)
  }
}

const calloutGroup = engine.getComponentGroup(CalloutFlag)