export class Sound extends Entity {
  constructor(audio: AudioClip) {
    super()
    engine.addEntity(this)
    this.addComponent(new AudioSource(audio))
    this.addComponent(new Transform())
    this.setParent(Attachable.AVATAR)
  }
}
