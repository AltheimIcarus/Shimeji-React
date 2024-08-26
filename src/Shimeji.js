import {React, useEffect, useRef, useState} from 'react';
import ContextMenu from './components/ContextMenu';
import './Shimeji.css';
import ShimejiFrame from './components/ShimejiFrame';

// fixed shimeji size in pixel
const WIDTH = 30;
const HEIGHT = 50;

// min and max animation repeat duration
const MIN_DURATION_MS = 10000;
const MAX_DURATION_MS = 30000;

// Default frame rate of animation
const FRAME_RATE = 20;

// DO NOT CHANGE, YOU MAY ADD NEW ACTION BUT DO NOT ALTER EXISTING VALUE
// available action animation of shimeji
const actions = {
    0: 'standing',
    1: 'walking',
    2: 'sleeping',
    3: 'climbing',
    4: 'dragging',
};

const Shimeji = ({
    id,             // id of current shimeji instance
    remove,         // parent's function for removing a shimeji with id
    duplicate,      // parent's function for duplication a shimeji with id
}) => {
    const [showShimeji, setShowShimeji] = useState(true);
    const [action, setAction] = useState(0);
    const [position, setPosition] = useState({
        x: 200,
        y: 10,
    });

    // track action animation timeout
    const [timeout, setAnimationTimeout] = useState( generateTimeOutDuration() );

    // right click menu state
    const [menu, setMenu] = useState({
        position: {
            x: 0,
            y: 0,
        },
        toggled: false,
    });

    // set if animation is paused (false) or played (true)
    const [play, setPlay] = useState(true);

    // right click menu DOM reference
    const contextMenuRef = useRef(null);

    // generate a new time out for shimeji action
    const generateTimeOutDuration = () => {
        return Math.floor( Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS + 1) ) + MIN_DURATION_MS;
    }

    // generate a random shimeji action id
    const generateActionID = () => {
        return Math.floor( Math.random() * Object.keys(actions).length );
    }

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

    // run shimeji animation
    const playShimeji = () => {
        setPlay(true);
    }

    const pauseShimeji = () => {
        setPlay(false);
    }

    const dragShimeji = () => {
        pauseShimeji();
    }

    // handle shimeji movement in XY axis
    //////////////////////////////////////////////////////////////////////////////

    // handle timeout and reset of timeout when play state is changed
    useEffect(() => {
        if (play) {
            return () => {
                setTimeout(
                    () => {
                        setAnimationTimeout( generateTimeOutDuration() );
                        setAction( generateActionID() );
                    },
                    timeout
                );
            };
        }
        
        return;
    }, [play, timeout]);
    
    // remove shimeji with parent's function
    const removeShimeji = () => {
        remove(id); // pass reference id back to main app
    };

    // duplicate shimeji with parent's function
    const duplicateShimeji = () => {
        duplicate(id); // pass reference id back to main app
    };

    // animate standing
    const stand = () => {
        return (
            <ShimejiFrame
                play={play}
                frameRate={FRAME_RATE}
            />
        );
    }

    // animate walking
    const walk = () => {
        return (
            <ShimejiFrame
                play={play}
                frameRate={FRAME_RATE}
            />
        );
    }

    // animate sleeping
    const sleep = () => {
        return (
            <ShimejiFrame
                play={play}
                frameRate={FRAME_RATE}
            />
        );
    }

    // animate climbing
    const climb = () => {
        return (
            <ShimejiFrame
                play={play}
                frameRate={FRAME_RATE}
            />
        );
    }
    
    // animate dragging
    const drag = () => {
        return (
            <ShimejiFrame
                play={play}
                frameRate={FRAME_RATE}
            />
        );
    }

    // controller to change action animation frame using cache copy (to avoid reloading source img when action is changed)
    const getActionFrame = cache( (action) => {
        setAction(action);
        switch (action) {
            case 1:
                return stand();
            case 1:
                return walk();
            case 1:
                return sleep();
            case 1:
                return climb();
            case 1:
                return drag();
            default:
                return stand();
        };
    });

    // render shimeji on screen on topmost of <body>
    return (
        <div
            className='shimeji-container'
            style={{ width: WIDTH, height: HEIGHT, left: position.x, bottom: position.y, visibility: showShimeji? 'visible':'hidden', opacity: showShimeji? '1':'0' }}
            onContextMenu={(e) => handleRightClick(e)}    // invoke right click context menu
            onMouseDown={dragShimeji}
            onMouseUp={playShimeji}
        >

            {getActionFrame(action)}

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

}

export default Shimeji;