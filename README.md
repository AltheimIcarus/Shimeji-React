# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).\
A spinoff idea from another repo Qwiki to create a java-like Shimeji (simple animated character) in React.js and VanillaJS to interact with components on a webpage.

The mascot, Shimeji, stands, walks, climbs, eats, sleeps, falls, and runs to closest food on your webpage.\
You can drag it, make it sticks to the wall (left and right border) or sky (top border), and let it falls freely to ground (bottom border).\
More features below...

## Functionallities
| Feature | `React (main) branch supports:` | `Standalone VanillaJS branch supports:` |
| ------------- | ------------- | ------------- |
| Falling animation due to gravity.                                        | ✔️ | ✔️ |
| Dragging, Falling, and Landing action animations.                        | ✔️ | ✔️ |
| Standing, Walking, Climbing, Sleeping, and Eating action animations.     | ✔️ | ✔️ |
| Random next action animation and duration.                               | ✔️ | ✔️ |
| Draggable Shimeji using react-draggable within ```<body>```.             | ✔️ | ✔️ |
| Dragging Shimeji while it is falling.                                    | ✔️ | ❌ |
| Adjustable gravity and animation frame rate.                             | ✔️ | ✔️ |
| Cloning Shimeji.                                                         | ❌ | ✔️ |
| Remove Shimeji.                                                          | ✔️ | ✔️ |
| Release drag on mouseout instead of having to click on screen. (issue with react-draggable when parent and child (img) are both absolute positioned.) | ❌ | ❌ |
| Batch import required Shimeji images into background-image of div instead of using img tag. | ❌ | ✔️ (Base64 Encoded) |
| ~~Interact or climb onto each DOM element.~~                             | Cancelled | Cancelled |
| Add pause action (Shimeji with light bulb on head) in between each action transition. | ❌ | ❌ |
| Drop feeding foods and have Shimeji chase after and eat it.              | ❌ | ✔️ |

Submit an issue to me for additional features.

> [!NOTE]
> **Interact or climb onto each DOM element** feature is cancelled and removed from plan due to its complexity to recalculate collision box on every window resize or changes in dynamic content on the webpage.

## Available Scripts

### React (main) branch

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

#### `npm run build`

Builds the app for production to the `build` folder.\

### Standalone VanillaJS branch

1. Download and include the `Shimeji.standalone.js` into your html code.

```html
<script type="text/javascript" src="shimeji-app/src/Shimeji.standalone.js"></script>
<script type="text/javascript">
    var shimejiA = new ShimejiController();
</script>
```

OR

2. Download the `Shimeji.script.js` and upload it into the Tampermonkey plugin in your web browser.
