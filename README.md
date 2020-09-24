# websocket-frisbee-throw
 A multiplayer scene that uses a websockets server to sync the position of a frisbee as it's thrown between players

_demo of cannon-example-scene running in preview._

![demo](https://github.com/decentraland-scenes/cannon-example-scene/blob/master/screenshots/cannon.gif)

## Description

This scene uses WebSockets to sync what each player sees while throwing a futuristic frisbee around, that bounces using the [cannon.js](https://github.com/schteppe/cannon.js) physics engine.

Since physics is calculated client side, sending messages for each change of position would be too much. Here, we're just sharing information about each throwing of the frisbee, and each client then calculates the effects of that locally.

The last player to throw the frisbee is assigned as the source of truth, and syncs the position of the frisbee in the scene to others every few seconds. 

This scene uses the default echo websockets server, which simply forwards all messages received to all other players in the room. A more robustly developed scene might implement server-side logic to dissambiguate confiting data better, or even run a parallel phyisics simulation and take that as the final source of truth. The benefit of this implementation is that it doesn't require changing the server-side code at all, but it has its limitations.

## Try it out

**Install the CLI**

Download and install the Decentraland CLI by running the following command:

```bash
npm i -g decentraland
```

**Previewing the scene**

Download this example and navigate to the `scene` directory, then run:

```
$:  dcl start
```

Any dependencies are installed and then the CLI opens the scene in a new browser tab.

**Run the server**

By default, the scene relies on an already deployed server on that can be reached on `wss://64-225-45-232.nip.io/`

To instead run the server locally, on a separate command line window, navigate to the `server` directory and run:

```
npm run start
```

The server will then be listening on `localhost:8080`, you can redirect the scene to point to this address when connecting to the WS server.

```

socket = new WebSocket(
    'wss://localhost:8080/broadcast/' + realm.displayName
  )
```

**Scene Usage**

Use the `E` key to pick upt the frisbee, then click to throw it. Other players can press `E` to catch it when it flies by near them. The UI counts the times you throw and catch it without falling to the ground. If you open multiple tabs to the same preview, you should see that all tabs respond to the changes that other players do too. These messages are travelling via WebSockets.
