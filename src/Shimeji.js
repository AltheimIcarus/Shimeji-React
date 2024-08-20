import {React, useCallback, useRef, useState} from 'react';
import ContextMenu from './components/ContextMenu';
import './Shimeji.css';

// fixed shimeji size in pixel
const WIDTH = 30;
const HEIGHT = 50;

// min and max animation repeat duration
const MIN_DURATION_MS = 10000;
const MAX_DURATION_MS = 30000;

// available action animation of shimeji
const actions = {
    0: 'standing',
    1: 'walking',
    2: 'sleeping',
    3: 'climbing',
    4: 'dragging',
};

function Frame() {
    
}

const Shimeji = () => {
    const [action, setAction] = useState(0);
    const [position, setPosition] = useState({
        x: 10,
        y: 10,
    });
    const [menu, setMenu] = useState(null);
    const ref = useRef(null);

    // generate a new time out for 1st shimeji action

    // handle right click to open menu
    const handleRightClick = useCallback(
        (e) => {
            e.preventDefault();
            const pane = ref.current.getBoundingClientRect();
            setMenu({
                ref: ref,
                top: e.clientY < pane.height - 200 && e.clientY,
                left: e.clientX < pane.width - 200 && e.clientX,
                right: e.clientX >= pane.width - 200 && pane.width - e.clientX,
                bottom: e.clientY >= pane.height - 200 && pane.height - e.clientY,
                remove: removeShimeji,
                duplicate: duplicateShimeji,
            });
        },
        [setMenu],
    );
    
    // close right click menu
    const handlePaneClick = useCallback(() => setMenu(null), [setMenu]);

    // remove shimeji
    const removeShimeji = () => {}

    // duplicate shimeji
    const duplicateShimeji = () => {}

    // render shimeji on screen on topmost of <body>
    return (
        <div
            ref={ref}
            className='shimeji-container'
            style={{ width: WIDTH, height: HEIGHT, position: 'fixed', left: position.x, bottom: position.y }}
            onContextMenu={handleRightClick}
            onPaneClick={handlePaneClick}
        >

            {menu && <ContextMenu
                onClick={handlePaneClick} {...menu}
            />}
        </div>
    );

    // generate a new time out duration for an action
    const generateTimeOutDuration = () => {
        return Math.floor( Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS + 1) ) + MIN_DURATION_MS;
    }

    // change the action of shimeji to be dragging when dragged by cursor
    const handleDrag = (event) => {}


    // run shimeji animation
    const runShimeji = () => {}

    // animate standing
    const stand = () => {}

    // animate walking
    const walk = () => {}

    // animate sleeping
    const sleep = () => {}

    // animate climbing
    const climb = () => {}

    // animate dragging
    const drag = () => {}
}

export default Shimeji;