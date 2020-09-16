export function addPhysicsConstraints(
  world: CANNON.World,
  xParcels: number,
  yParcels: number,
  onlyWalls?: boolean
) {
  if (!onlyWalls) {
    // Create a ground plane
    const planeShape = new CANNON.Plane()
    const groundBody = new CANNON.Body({
      mass: 0, // mass == 0 makes the body static
    })
    groundBody.addShape(planeShape)
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    ) // Reorient ground plane to be in the y-axis
    groundBody.position.y = 0.1 // Thickness of ground base model
    world.addBody(groundBody)
  }

  // Invisible walls
  //#region
  const wallShape = new CANNON.Box(new CANNON.Vec3(32, 50, 1))
  const wallNorth = new CANNON.Body({
    mass: 0,
    shape: wallShape,
    position: new CANNON.Vec3((xParcels * 16) / 2, 25, yParcels * 16),
  })
  world.addBody(wallNorth)

  const wallSouth = new CANNON.Body({
    mass: 0,
    shape: wallShape,
    position: new CANNON.Vec3((xParcels * 16) / 2, 25, 0),
  })
  world.addBody(wallSouth)

  const wallEast = new CANNON.Body({
    mass: 0,
    shape: wallShape,
    position: new CANNON.Vec3(0, 25, (yParcels * 16) / 2),
  })
  wallEast.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
  world.addBody(wallEast)

  const wallWest = new CANNON.Body({
    mass: 0,
    shape: wallShape,
    position: new CANNON.Vec3(xParcels * 16, 25, (yParcels * 16) / 2),
  })
  wallWest.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2)
  world.addBody(wallWest)
  //#endregion
}
