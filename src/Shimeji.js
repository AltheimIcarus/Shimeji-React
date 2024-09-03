import {React, useCallback, useEffect, useRef} from 'react';
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
const generateActionID = (id=0) => {
    let result = Math.floor( Math.random() * (constants.MAX_ACTION_ID - constants.MIN_ACTION_ID + 1) ) + constants.MIN_ACTION_ID;
    while (result === id) {
        result = Math.floor( Math.random() * (constants.MAX_ACTION_ID - constants.MIN_ACTION_ID + 1) ) + constants.MIN_ACTION_ID;
    }
    return result;
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
    const shimejiRef = useRef(null);
    const [position, setPosition, positionRef] = useState({
        x: 200,
        y: 10,
    });
    const [showShimeji, setShowShimeji, showShimejiRef] = useState(true);
    const [action, setAction, actionRef] = useState(constants.ACTIONS.standing);
    
    // track action animation timeout
    const [actionTimeout, setActionTimeout, actionTimeoutRef] = useState(null);
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
    // track shimeji move direction for walking or climbing actions, see config for list of available options
    const [moveDirection, setMoveDirection, moveDirectionRef] = useState(null);
    // set the rotation of the Shimeji which depends on the move direction and attached wall
    const [rotation, setRotation, rotationRef] = useState(null);

    // track sequence of actions so that last action animation can be successfully terminated from infinite loop
    const [sequence, setSequence, sequenceRef] = useState(0);

    
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

    // handle landing animation
    const land = async () => {
        await sleep(constants.FPS_INTERVAL_FALLING * 2);
        setAction(constants.ACTIONS.landing);
        await sleep(constants.FPS_INTERVAL_FALLING * 5);
    }

    // handle falling animation
    const fall = async () => {
        if (shouldFall(positionRef.current.x, positionRef.current.y, window?.innerWidth, window?.innerHeight) && !isDraggedRef.current) {
            let currY = positionRef.current.y + constants.GRAVITY_PIXEL;
            
            if ( (currY + constants.HEIGHT) > window?.innerHeight) {
                currY = window?.innerHeight - constants.HEIGHT;
            }
            await sleep(constants.FPS_INTERVAL_FALLING);
            setPosition({
                x: positionRef.current.x,
                y: currY,
            });
            fall();
        } else {
            await land();
            resume();
            return;
        }
        return;
    }

    // resume to action animation prior to dragging
    const resume = () => {
        // actionID prior to dragging animation frame to resume animation
        if (!playRef.current) {
            const elapsedPauseTime = Date.now() - pauseStartTimeRef.current;
            const remainTime = Math.abs(endTimeRef.current - Date.now()) + elapsedPauseTime;
            setPauseStartTime(Date.now());
            setActionTimeout(setTimeout(() => {
                nextAction();
            }, remainTime));
            setAction(actionIDBeforeDragRef.current);
            setActionIDBeforeDrag(null);
            setPlay(true);
        }
    }

    const animate = async () => {
        if (!playRef.current || isDraggedRef.current) {
            //console.log('cancelled...');
            return;
        }
        //console.log('animate... ', actionRef.current);
        let newPosition = moveDirectionRef.current;

        if(actionRef.current === constants.ACTIONS.walking) {
            //console.log('walking... ');
            newPosition += positionRef.current.x;
            // if not hitting wall
            if (newPosition > 0 && newPosition + constants.WIDTH < window?.innerWidth) {
                //console.log('moving... ', positionRef.current.x, ' -> ', newPosition);
                setPosition({
                    ...position,
                    x: newPosition,
                    y: positionRef.current.y,
                });
                await sleep(constants.FPS_INTERVAL_FALLING);
                return;
            }
            //console.log('hit wall... ', newPosition);
            
            // if 0 = hit left wall else right wall
            newPosition = (newPosition <= 0)? 0 : window?.innerWidth - constants.WIDTH;
            setPosition({
                ...position,
                x: newPosition,
                y: positionRef.current.y,
            });
            alignShimeji();
            await sleep(constants.FPS_INTERVAL_FALLING);
            
            // change action to climbing
            setAction(constants.ACTIONS.climbing);

            // move downward if in the sky, else move upward if on the ground
            setMoveDirection((positionRef.current.y === 0)? constants.MOVE_PIXEL_POS : constants.MOVE_PIXEL_NEG);
            return;
        } else if (actionRef.current === constants.ACTIONS.climbing) {
            //console.log('climbing... ');
            newPosition += positionRef.current.y;
            // if not hitting ground or sky
            if (newPosition > 0 && newPosition + constants.HEIGHT < window?.innerHeight) {
                //console.log('moving... ', positionRef.current.x, ' -> ', newPosition);
                setPosition({
                    ...position,
                    x: positionRef.current.x,
                    y: newPosition,
                });
                await sleep(constants.FPS_INTERVAL_FALLING);
                return;
            }
            //console.log('hit sky/gnd... ', newPosition);

            // if 0 = hit sky else ground
            newPosition = (newPosition <= 0)? 0 : window?.innerHeight - constants.HEIGHT;
            setPosition({
                ...position,
                x: positionRef.current.x,
                y: newPosition,
            });
            alignShimeji();
            await sleep(constants.FPS_INTERVAL_FALLING);

            // change action to walking
            setAction(constants.ACTIONS.walking);

            // move rightward if on left wall, else move leftward if on right wall
            setMoveDirection((positionRef.current.x === 0)? constants.MOVE_PIXEL_POS : constants.MOVE_PIXEL_NEG);
            return;
        }
    };

    const nextAction = async () => {
        const newTimeout = generateTimeOutDuration();
        clearTimeout(actionTimeoutRef.current);
        // stop current animation
        setPlay(false);
        setMoveDirection(null);
        // set new duration for next action
        setActionTimeout(setTimeout(() => {
            nextAction();
        }, newTimeout));
        // set action animation
        //setAction(generateActionID(actionRef.current));
        setAction(constants.ACTIONS.walking);
        // start animation from frame 1
        setRestart(true);
        // set new action sequence to terminate last animation
        let currSequence = sequenceRef.current + 1;
        setSequence(currSequence);
        // start animation for shimeji frame component
        setPlay(true);
        await sleep(constants.TIME_SECOND_IN_MS);
        // record start time for new action
        setEndTime(Date.now() + newTimeout);
        // if walking or climbing, set move direction
        setMoveDirection((Math.random()>0.5)? constants.MOVE_PIXEL_NEG : constants.MOVE_PIXEL_POS);
        let startTime = Date.now();
        let currTime = null;
        alignShimeji();
        while (playRef.current && moveDirectionRef.current!==null && !isDraggedRef.current && sequenceRef.current === currSequence) {
            currTime = Date.now();
            if (currTime-startTime >= constants.TIME_SECOND_IN_MS) {
                startTime = Date.now();
                await animate();
            }
        }
    }

    // move shimeji on windows resize
    const handleWindowResize = useCallback((e) => {
        if (shimejiRef.current) {
            let x = positionRef.current.x;
            if (shimejiRef.current.state.x + constants.WIDTH > e.currentTarget.innerWidth)
                x = e.currentTarget.innerWidth - constants.WIDTH;
            let y = e.currentTarget.innerHeight - constants.HEIGHT;
            setPosition({
                ...position,
                x: x,
                y: y,
            });
        }
    }, []);

    useEffect(()=> {
        //console.log('action ', action);
        //console.log('isDragged ', isDragged);
        //console.log('pos ', position);
        //console.log('play ', play);
        fall();
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);
    
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
    const handleDragStart = (e, data) => {
        e.stopPropagation();
        if (playRef.current && !isDraggedRef.current) {
            setPlay(false);
            if (actionTimeoutRef.current) {
                clearTimeout(actionTimeoutRef.current);
                setActionTimeout(null);
            }
            setActionIDBeforeDrag(actionRef.current);
            setIsDragged(true);
            setPauseStartTime(Date.now());
            setAction(constants.ACTIONS.dragging);
        }
    };

    // handle dragging shimeji event
    const handleDrag = async (e, data) => {
        setPosition({
            ...position,
            x: data.x,
            y: data.y,
        });
    }

    // handle drag end shimeji event
    const handleDragEnd = async (e, data) => {
        setPosition({
            ...position,
            x: data.x,
            y: data.y,
        });
        setIsDragged(false);
        setAction(constants.ACTIONS.falling);
        fall();
    };

    // align Shimeji to appropriate rotation to face the direction it is currently moving to
    const alignShimeji = () => {
        if (actionRef.current===constants.ACTIONS.walking) {
            let result = '';
            if (positionRef.current.y === 0)
                result = 'flip-horizontal';
            if (moveDirectionRef.current > 0) {
                result += ' flip-vertical';
            }
            setRotation(result);
            return;
        }
        if (actionRef.current===constants.ACTIONS.climbing) {
            let result = '';
            if (positionRef.current.x + constants.WIDTH === window?.innerWidth)
                result = 'flip-vertical';
            if (moveDirectionRef.current > 0)
                result += ' flip-horizontal';
            setRotation(result);
            return;
        }
        setRotation('');
        return;
    };

    // render shimeji on screen on topmost of <body>
    return (
        <Draggable
            position={position}
            onStart={handleDragStart}
            onDrag={handleDrag}
            onStop={handleDragEnd}
            bounds={"Body"}
            scale={1}
            ref={shimejiRef}
        >
            <div
                className={`shimeji-container`}
                style={{
                    width: constants.WIDTH,
                    height: constants.HEIGHT,
                    left: 0,
                    top: 0,
                    visibility: showShimeji? 'visible':'hidden',
                    opacity: showShimeji? '1':'0'
                }}
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
                        rotation={rotation}
                    />
                ))}

                <ContextMenu                        // right click context menu component in ContextMenu.js
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