import {React, useEffect, useRef, useState} from 'react';
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

const Shimeji = ({
    id,             // id of current shimeji instance
    remove,         // parent's function for removing a shimeji with id
    duplicate,      // parent's function for duplication a shimeji with id
}) => {
    const [action, setAction] = useState(0);
    const [position, setPosition] = useState({
        x: 200,
        y: 10,
    });
    const [menu, setMenu] = useState({
        position: {
            x: 0,
            y: 0,
        },
        toggled: false,
    });
    const contextMenuRef = useRef(null);

    // generate a new time out for 1st shimeji action

    // handle right click to open menu
    const handleRightClick = (e) => {
        e.preventDefault();
        // get reference to context menu DOM
        const contextMenuAttr = contextMenuRef.current.getBoundingClientRect();
        
        // check if cursor is at left of menu when clicked
        const isLeft = e.clientX < window?.innerWidth / 2;

        let x = e.clientX;
        let y = e.clientY;

        if (!isLeft) {
            x = e.clientX - contextMenuAttr.width;
        }

        setMenu({
            position: {
                x,
                y,
            },
            toggled: true,
        });
    };

    // close right click menu
    const closeContextMenu = () => {
        setMenu({
            position: {
                x: 0,
                y: 0,
            },
            toggled: false,
        });
    };

    // handle click anywhere on root document to close right click menu
    useEffect(() => {
        const handleCloseMenu = (e) => {
            // check if right click menu component exist
            if (contextMenuRef.current) {
                // check if right click menu component is the one that trigger this function call
                if (!contextMenuRef.current.contains(e.target)) {
                    // close right click menu
                    closeContextMenu();
                }
            }
        };

        document.addEventListener('click', handleCloseMenu);

        return () => {
            document.removeEventListener('click', handleCloseMenu);
        };
    });
    
    // remove shimeji with parent's function
    const removeShimeji = () => {
        remove(id);
    };

    // duplicate shimeji with parent's function
    const duplicateShimeji = () => {
        duplicate(id);
    };

    // render shimeji on screen on topmost of <body>
    return (
        <div
            className='shimeji-container'
            style={{ width: WIDTH, height: HEIGHT, left: position.x, bottom: position.y }}
            onContextMenu={(e) => handleRightClick(e)}    // invoke right click context menu
        >
            
            <ContextMenu               // right click context menu component in ContextMenu.js
                contextMenuRef={contextMenuRef}
                isToggled={menu.toggled}        // check if context menu is shown
                positionY={menu.position.y}     // set top position of context menu
                positionX={menu.position.x}     // set left position of context menu
                remove={removeShimeji}          // pass current removeShimeji function to be invoked by pressing remove button in context menu
                duplicate={duplicateShimeji}    // pass current duplicateShimeji function to be invoked by pressing duplicate button in context menu
            />
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