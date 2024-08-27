import {React, useEffect, useRef, useState} from 'react';
import Draggable from 'react-draggable';
import ContextMenu from './components/ContextMenu';
import './Shimeji.css';
import ShimejiFrame from './components/ShimejiFrame';

// fixed shimeji size in pixel
const WIDTH = 50;
const HEIGHT = 50;

// min and max animation repeat duration
const MIN_DURATION_MS = 10000;
const MAX_DURATION_MS = 30000;

// Default frame rate of animation
const FRAME_RATE = 20;

// Default gravity falling speed (px)
const GRAVITY_PIXEL = 20;

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

    // generate a new time out for shimeji action
    const generateTimeOutDuration = () => {
        return Math.floor( Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS + 1) ) + MIN_DURATION_MS;
    }

    // generate a random shimeji action id
    const generateActionID = () => {
        return Math.floor( Math.random() * Object.keys(actions).length );
    }

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

    // set if animation is restarted from first frame
    const [restart, setRestart] = useState(true);

    // right click menu DOM reference
    const contextMenuRef = useRef(null);

    // variable to calculate time elapsed since beginning of any action animation
    // handles pause and resume play animation
    const [endTime, setEndTime] = useState(Date.now());

    // track is shimeji being dragged
    const [isDragged, setIsDragged] = useState(false);

    // track the actionID before user firing a drag event to resume the same action animation on drag end
    let actionIDBeforeDrag = 0;

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

    // pause shimeji animation at current frame
    const pauseShimeji = () => {
        setPlay(false);
    }

    // handle drag start shimeji event
    const handleDragStart = () => {
        setIsDragged(true);
        pauseShimeji();
        actionIDBeforeDrag = action;
        setAction(4);   // actionID for dragging animation frame
    }

    // handle falling animation due to gravity
    const fall = async (x, y) => {
        let currY = y;
        while (currY < window?.innerHeight) {
            currY += GRAVITY_PIXEL;
            await new Promise(r => setTimeout(r, 1000/FRAME_RATE));
            if ( (currY + HEIGHT) > window?.innerHeight) {
                setPosition({x: x, y: window?.innerHeight - HEIGHT});
            } else {
                setPosition({x: x, y: currY});
            }
        }
        return;
    }

    // handle drag end shimeji event
    const handleDragEnd = (e, data) => {
        setIsDragged(false);
        setPosition({
            x: data.x,
            y: data.y
        });
        fall(data.x, data.y);   // handle falling animation
        setAction(actionIDBeforeDrag);   // actionID for dragging animation frame
        playShimeji();
        const remainTime = endTime - Date.now();
        setAnimationTimeout(remainTime);
    }

    // change to drag animation temporarily
    // handle while dragggin shimeji event
    const dragShimeji = (e, data) => {
        //setAction(4);
    }

    useEffect(() => {
        fall(position.x, position.y);
    }, []);

    // handle timeout and reset of timeout
    useEffect(() => {
        if (play) {
            return () => {
                setTimeout(
                    () => {
                        setAnimationTimeout( generateTimeOutDuration() );   // set new duration for next action
                        setAction( generateActionID() );                    // set action animation
                        setRestart(true);                                   // start animation from frame 1
                        playShimeji();                                      // start animation for shimeji frame component
                        setEndTime(Date.now() + timeout);                   // record start time for new action
                    },
                    timeout
                );
            };
        }
        
        return;
    }, [timeout]);
    
    // remove shimeji with parent's function
    const removeShimeji = () => {
        remove(id); // pass reference id back to main app
    };

    // duplicate shimeji with parent's function
    const duplicateShimeji = () => {
        duplicate(id); // pass reference id back to main app
    };

    // render shimeji on screen on topmost of <body>
    return (
        <Draggable
            position={position}
            onStart={handleDragStart}
            onDrag={dragShimeji}
            onStop={handleDragEnd}
            bounds={"Body"}
            scale={1}
        >
            <div
                className='shimeji-container'
                style={{ width: WIDTH, height: HEIGHT, left: 0, top: 0, visibility: showShimeji? 'visible':'hidden', opacity: showShimeji? '1':'0' }}
                onContextMenu={(e) => handleRightClick(e)}    // invoke right click context menu
            >

                {Object.keys(actions).map((actionID, index) => (
                    <ShimejiFrame
                        play={play}
                        frameRate={FRAME_RATE}
                        style={action===actionID? {visibility: 'visible', opacity: 1} : {visibility: 'hidden', opacity: 0}}
                        reset={restart}
                        key={index}
                    />
                ))}

                <ContextMenu               // right click context menu component in ContextMenu.js
                    contextMenuRef={contextMenuRef}
                    isToggled={menu.toggled}        // check if context menu is shown
                    positionY={menu.position.y}     // set top position of context menu
                    positionX={menu.position.x}     // set left position of context menu
                    remove={removeShimeji}          // pass current removeShimeji function to be invoked by pressing remove button in context menu
                    duplicate={duplicateShimeji}    // pass current duplicateShimeji function to be invoked by pressing duplicate button in context menu
                />
            </div>
        </Draggable>
    );

}

export default Shimeji;