import {React, useEffect, useRef} from 'react';
import Draggable from 'react-draggable';
import useState from 'react-usestateref';
import ContextMenu from './components/ContextMenu';
import './Shimeji.css';
import ShimejiFrame from './components/ShimejiFrame';
import * as constants from './config.js';

// generate a new time out for shimeji action
const generateTimeOutDuration = () => {
    return Math.floor( Math.random() * (constants.MAX_DURATION_MS - constants.MIN_DURATION_MS + 1) ) + constants.MIN_DURATION_MS;
}

// generate a random shimeji action id
const generateActionID = () => {
    return Math.floor( Math.random() * (3 + 1) );
}

// util function to mimic sleep()
const sleep = async (timeMs) => {
    await new Promise(r => setTimeout(r, timeMs));
}

// function to determine if shimeji should fall from sky
const shouldFall = (x, y, max_x, max_y) => {
    // not on left or right wall
    if ( (x > 0) && (x + constants.WIDTH < max_x) ) {
        // not on ground
        return (y > 0) && (y + constants.HEIGHT < max_y);
    }
    return false;
}

const Shimeji = ({
    id,             // id of current shimeji instance
    remove,         // parent's function for removing a shimeji with id
    duplicate,      // parent's function for duplication a shimeji with id
}) => {

    const [position, setPosition, positionRef] = useState({
        x: 200,
        y: 10,
    });
    const [showShimeji, setShowShimeji, showShimejiRef] = useState(true);
    const [action, setAction, actionRef] = useState(constants.ACTIONS.standing);
    
    // track action animation timeout
    const [timeout, setTimeout, timeoutRef] = useState(generateTimeOutDuration());
    // set if animation is paused (false) or played (true)
    const [play, setPlay, playRef] = useState(false);
    // set if animation is restarted from first frame
    const [restart, setRestart, restartRef] = useState(true);
    // variable to calculate time elapsed since beginning of any action animation, handles pause and resume play animation
    const [endTime, setEndTime, endTimeRef] = useState(Date.now());
    // variable to calculate time elapsed since beginning of pause, handles pause and resume play animation
    const [pauseStartTime, setPauseStartTime, pauseStartTimeRef] = useState(Date.now());
    // track the actionID before user firing a drag event to resume the same action animation on drag end
    const [actionIDBeforeDrag, setActionIDBeforeDrag, actionIDBeforeDragRef] = useState(constants.ACTIONS.standing);
    // track if shimeji is being dragged
    const [isDragged, setIsDragged, isDraggedRef] = useState(false);

    
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

    // handle falling animation
    const fall = async () => {
        if (shouldFall(positionRef.current.x, positionRef.current.y, window?.innerWidth, window?.innerHeight) && !isDraggedRef.current) {
            let currY = positionRef.current.y + constants.GRAVITY_PIXEL;
            
            if ( (currY + constants.HEIGHT) > window?.innerHeight) {
                currY = window?.innerHeight - constants.HEIGHT;
            }
            await sleep(constants.FPS_INTERVAL);
            setPosition({
                ...positionRef,
                x: positionRef.current.x,
                y: currY,
            });
            fall();
        }
        return;
    }

    // resume to action animation prior to dragging
    const resume = () => {
        // actionID prior to dragging animation frame to resume animation
        const elapsedPauseTime = Date.now() - pauseStartTimeRef.current;
        const remainTime = Math.abs(endTimeRef.current - Date.now()) + elapsedPauseTime;
        setPauseStartTime(Date.now());
        setTimeout(remainTime);
        setAction(actionIDBeforeDragRef.current);
        setPlay(true);
    }

    const nextAction = () => {
        const newTimeout = generateTimeOutDuration();
        // set new duration for next action
        setTimeout(newTimeout);
        // set action animation
        setAction(generateActionID());
        // start animation from frame 1
        setRestart(true);
        // start animation for shimeji frame component
        setPlay(true);
        // record start time for new action
        setEndTime(Date.now() + newTimeout)
    }

    // useEffect(()=> {
    //     //console.log('action ', action);
    //     console.log('isDragged ', isDragged);
    //     console.log('pos ', position);
    //     //console.log('play ', play);
    // }, [state]);

    // handle timeout and reset of timeout
    useEffect(() => {
        if (playRef.current) {
            return () => {
                setTimeout(
                    () => {
                        nextAction();
                    },
                    timeoutRef.current
                );
            };
        }
        
        return () => {};
    }, [play]);
    
    // remove shimeji with parent's function
    const removeShimeji = () => {
        remove(id); // pass reference id back to main app
        setShowShimeji(false);
    };

    // duplicate shimeji with parent's function
    const duplicateShimeji = () => {
        duplicate(id); // pass reference id back to main app
    };

    // handle drag start shimeji event
    const handleDragStart = () => {
        setPlay(false);
        setActionIDBeforeDrag(actionRef.current);
        setIsDragged(true);
        setPauseStartTime(Date.now());
    };

    // handle drag end shimeji event
    const handleDragEnd = async (e, data) => {
        setPosition({
            ...position,
            x: data.x,
            y: data.y,
        });
        setIsDragged(false);
        fall();
        resume();
    };

    // render shimeji on screen on topmost of <body>
    return (
        <Draggable
            position={position}
            onStart={handleDragStart}
            onStop={handleDragEnd}
            bounds={"Body"}
            scale={1}
        >
            <div
                className='shimeji-container'
                style={{ width: constants.WIDTH, height: constants.HEIGHT, left: 0, top: 0, visibility: showShimeji? 'visible':'hidden', opacity: showShimeji? '1':'0' }}
                onContextMenu={(e) => handleRightClick(e)}    // invoke right click context menu
            >

                {Object.keys(constants.ACTIONS).map((actionName, index) => (
                    <ShimejiFrame
                        play={play}
                        style={{visibility: index===action? 'visible':'hidden', opacity: index===action? 1:0}}
                        reset={restart}
                        key={index}
                        actionName={actionName}
                        actionID={index}
                        currentAction={action}
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