# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).\
A spinoff idea from another repo Qwiki to create a java-like Shimeji (simple animated character) in React.js to interact with components on a webpage.\

## Functionallities
Currently it supports:\
- [x] Falling animation due to gravity.
- [x] Standing action animation.
- [x] Walking, Climbing, Sleeping, and Dragging action animations.
- [x] Random next action animation and duration.
- [x] Play and pause when dragged.
- [x] Draggable Shimeji using react-draggable within ```<body>```.
- [x] Dragging Shimeji while it is falling.
- [x] Adjustable gravity and animation frame rate.
- [ ] Cloning Shimeji.
- [x] Remove Shimeji.
- [ ] Release drag on mouseout instead of having to click on screen. (issue with react-draggable when parent and child (img) are both absolute positioned.)
- [ ] Batch import required Shimeji images into background-image of div instead of using img tag.
- [ ] Interact or climb onto each DOM element.
- [ ] Add pause action (Shimeji with light bulb on head) in between each action transition
- [ ] More functionallities to come.

Submit an issue to me for additional features.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`

Builds the app for production to the `build` folder.\
