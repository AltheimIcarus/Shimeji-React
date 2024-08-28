import {React, useEffect, useReducer, useRef, useState} from 'react';
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
const FRAME_RATE = 5;  // must be lesser than 1000, 5 is recommended

// Default gravity falling speed (px), 1 is recommended
const GRAVITY_PIXEL = 1;

// DO NOT CHANGE, YOU MAY ADD NEW ACTION BUT DO NOT ALTER EXISTING VALUE
// available action animation of shimeji
const actions = {
    0: 'standing',
    1: 'walking',
    2: 'sleeping',
    3: 'climbing',
    4: 'dragging',
};

// generate a new time out for shimeji action
const generateTimeOutDuration = () => {
    return Math.floor( Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS + 1) ) + MIN_DURATION_MS;
}

// generate a random shimeji action id
const generateActionID = () => {
    return Math.floor( Math.random() * Object.keys(actions).length );
}

// util function to mimic sleep()
const sleep = async (timeMs) => {
    await new Promise(r => setTimeout(r, timeMs));
}

const shimejiReducer = (state, action) => {
    switch (action.type) {
        case 'drag-start': {
            return {
                ...state,
                play: false,
                actionIDBeforeDrag: state.action,
                action: 4,   // actionID for dragging animation frame
                isDragged: true,
            };
        }
        case 'drag-end': {
            const remainTime = state.endTime - Date.now();
            return {
                ...state,
                position: {
                    ...state.position,
                    x: action.value.x,
                    y: action.value.y
                },
                action: state.actionIDBeforeDrag,   // actionID for dragging animation frame
                play: true,
                timeout: remainTime,
                isDragged: false,
                isFalling: ((action.value.y + HEIGHT) < action.max_height && action.value.x > 0 && (action.value.x + WIDTH) < action.max_width),
            };
        }
        case 'fall': {                             // handle falling animation
            let currY = state.position.y + GRAVITY_PIXEL;
            if ( (currY + HEIGHT) > action.max_height) {
                currY = action.max_height - HEIGHT;
            }
            return {
                ...state,
                position: {
                    ...state.position,
                    x: state.position.x,
                    y: currY,
                },
                isDragged: false,
                isFalling: (currY + HEIGHT) < action.max_height,
            };
        }
        case 'land': {                             // handle falling animation
            return {
                ...state,
                isFalling: false,
            };
        }
        case 'timeout': {
            const newTimeout = generateTimeOutDuration();
            return {
                ...state,
                timeout: newTimeout,                // set new duration for next action
                action: generateActionID(),         // set action animation
                restart: true,                      // start animation from frame 1
                play: true,                         // start animation for shimeji frame component
                endTime: Date.now() + newTimeout,   // record start time for new action
            };
        }
        case 'remove': {
            return {
                ...state,
                showShimeji: false,
            };
        }
        default: {
            return {...state};
        }
    }
};

const initialState = {
    showShimeji: true,
    action: 0,
    position: {
        x: 200,
        y: 10,
    },
    timeout: generateTimeOutDuration(), // track action animation timeout
    play: true,                         // set if animation is paused (false) or played (true)
    restart: true,                      // set if animation is restarted from first frame
    endTime: Date.now(),                // variable to calculate time elapsed since beginning of any action animation, handles pause and resume play animation
    actionIDBeforeDrag: 0,              // track the actionID before user firing a drag event to resume the same action animation on drag end
    isDragged: false,                   // track if shimeji is being dragged
    isFalling: true,                    // track if shimeji is not attached to left and right most wall and is falling
};

const Shimeji = ({
    id,             // id of current shimeji instance
    remove,         // parent's function for removing a shimeji with id
    duplicate,      // parent's function for duplication a shimeji with id
}) => {
    const [state, dispatch] = useReducer(shimejiReducer, initialState);
    const { showShimeji, action, position, timeout, play, restart, endTime, actionIDBeforeDrag, isDragged, isFalling } = state;
    
    // right click menu state
    const [menu, setMenu] = useState({
        position: {
            x: 0,
            y: 0,
        },
        toggled: false,
    });

    // right click menu DOM reference
    const contextMenuRef = useRef(null);

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
                x: x,
                y: y,
            },
            toggled: true,
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
                    setMenu({
                        position: {
                            x: 0,
                            y: 0,
                        },
                        toggled: false,
                    });
                }
            }
        };

        document.addEventListener('click', handleCloseMenu);

        return () => {
            document.removeEventListener('click', handleCloseMenu);
        };
    });


    useEffect(() => {
        if (!isDragged && isFalling) {
            return () => {
                if (position.x > 0 && position.x + WIDTH < window?.innerWidth) {
                    sleep(1000/FRAME_RATE);
                    dispatch({ type: 'fall', max_height: window?.innerHeight });
                }
            };
        }
        return () => {
            dispatch({ type: 'land' });
        };
    }, [isDragged, isFalling, position]);

    // handle timeout and reset of timeout
    useEffect(() => {
        if (play) {
            return () => {
                setTimeout(
                    () => {
                        dispatch({ type: 'timeout' });
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
        dispatch({ type: 'remove' });
    };

    // duplicate shimeji with parent's function
    const duplicateShimeji = () => {
        duplicate(id); // pass reference id back to main app
    };

    // render shimeji on screen on topmost of <body>
    return (
        <Draggable
            position={position}
            onStart={() => dispatch({ type: 'drag-start' })}    // handle drag start shimeji event
            onStop={(e, data) => {                              // handle drag end shimeji event
                dispatch({ type: 'drag-end', value: {
                    x: data.x,
                    y: data.y,
                }, max_height: window?.innerHeight, max_width: window?.innerWidth });
            }}
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