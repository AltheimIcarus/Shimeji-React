import {React, useCallback, useEffect, useRef} from 'react';
import Draggable from 'react-draggable';
import useState from 'react-usestateref';
import ContextMenu from './components/ContextMenu';
import './Shimeji.css';
import ShimejiFrame from './components/ShimejiFrame';
import * as constants from './config.js';
import { ACTIONS_SOURCES } from './components/ShimejiSources';

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

// generate move direction
const generateMoveDirection = (previousDirection=null) => {
    if (!previousDirection) return (Math.random()>0.5)? constants.MOVE_PIXEL_NEG : constants.MOVE_PIXEL_POS;
    // 0.8 probability of returning previous direction
    const probabilities = [previousDirection, previousDirection, previousDirection, previousDirection, (-1)*previousDirection];
    return probabilities[ Math.floor(Math.random() * probabilities.length) ];
}

// util function to mimic sleep()
const sleep = async (timeMs) => {
    await new Promise(r => setTimeout(r, timeMs));
}

/**
 * function to determine if shimeji should fall from sky
 * @param {number} x    x coordinate of Shimeji
 * @param {number} y    y coordinate of Shimeji
 * @param {number} max_x    viewport maximum width (right) excluding scrollbar
 * @param {number} max_y    viewport maximum height (ground) excluding scrollbar
 */
const shouldFall = (x, y, max_x=window?.innerWidth, max_y=window?.innerHeight) => {
    // not on left or right wall
    if ( (x > 0) && (x + constants.WIDTH < max_x) ) {
        // not on ground
        return (y > 0) && (y + constants.HEIGHT < max_y);
    }
    return false;
}

/**
 * function to calculate the width of window's scrollbar
 * @returns {number} Window's scrollbar width in pixel
 */
const getScrollbarWidth = () => {
    // Add temporary box to wrapper
    let scrollbox = document.createElement('div');

    // Make box scrollable
    scrollbox.style.overflow = 'scroll';

    // Append box to document
    document.body.appendChild(scrollbox);

    // Measure inner width of box
    let scrollBarWidth = scrollbox.offsetWidth - scrollbox.clientWidth;

    // Remove box
    document.body.removeChild(scrollbox);

    return (document.body.scrollHeight > document.body.clientHeight)? scrollBarWidth : 0;
}

const Shimeji = ({
    id,             // id of current shimeji instance
    remove,         // parent's function for removing a shimeji with id
    // duplicate,      // parent's function for duplication a shimeji with id
}) => {
    const shimejiRef = useRef(null);
    const [position, setPosition, positionRef] = useState({
        x: (window?.innerWidth / 5) * 3,
        y: 10,
    });
    const [showShimeji, setShowShimeji, showShimejiRef] = useState(true);
    const [action, setAction, actionRef] = useState(constants.ACTIONS.standing);
    
    // track action animation timeout
    const [actionTimeout, setActionTimeout, actionTimeoutRef] = useState(null);
    // set if animation is paused (false) or played (true)
    const [play, setPlay, playRef] = useState(false);
    // track if shimeji is being dragged
    const [isDragged, setIsDragged, isDraggedRef] = useState(false);
    // track shimeji move direction for walking or climbing actions, see config for list of available options
    const [moveDirection, setMoveDirection, moveDirectionRef] = useState(null);
    // set the rotation of the Shimeji which depends on the move direction and attached wall
    const [rotation, setRotation, rotationRef] = useState(null);

    // track sequence of actions so that last action animation can be successfully terminated from infinite loop
    const [sequence, setSequence, sequenceRef] = useState(0);

    // track current frame of animation for child ShimejiFrame component
    const [frame, setFrame, frameRef] = useState(0);

    
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

    // record window's scrollbar width
    let scrollBarWidth = getScrollbarWidth(); 

    // bound x coordinate in viewport
    const boundX = (val) => {
        if (val < 0) {
            return 0;
        }
        if (val + constants.WIDTH > getMaxWidth()) {
            return getMaxWidth() - constants.WIDTH;
        }
        return val;
    };

    // bound y coordinate in viewport
    const boundY = (val) => {
        if (val < 0) {
            return 0;
        }
        if (val + constants.HEIGHT > getMaxHeight()) {
            return getMaxHeight() - constants.HEIGHT;
        }
        return val;
    };

    // check is shimeji touching left/right wall
    const onXBound = () => {
        return positionRef.current.x === 0 || positionRef.current.x + constants.WIDTH === getMaxWidth();
    }
    // check is shimeji touching sky/ground
    const onYBound = () => {
        return positionRef.current.y === 0 || positionRef.current.y + constants.HEIGHT === getMaxHeight();
    }
    // check is shimeji touching sky only
    const onSkyBound = () => {
        return positionRef.current.y === 0;
    }
    // get max height boundary
    const getMaxHeight = () => {
        return window?.innerHeight - scrollBarWidth;
    };
    // get max width boundary
    const getMaxWidth = () => {
        return window?.innerWidth - scrollBarWidth;
    };

    // handle right click to open menu
    const handleRightClick = (e) => {
        e.preventDefault();
        setPlay(false);
        // get reference to context menu DOM
        const contextMenuAttr = contextMenuRef.current.getBoundingClientRect();
        
        // check if cursor is at left of menu when clicked
        const isLeft = e.clientX < getMaxWidth() / 2;

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
        setAction(constants.ACTIONS.falling);
        while (shouldFall(positionRef.current.x, positionRef.current.y, getMaxWidth(), getMaxHeight()) && !isDraggedRef.current) {
            let currY = boundY(positionRef.current.y + constants.GRAVITY_PIXEL);
            
            await sleep(constants.FPS_INTERVAL_FALLING);
            setPosition({
                x: positionRef.current.x,
                y: currY,
            });
        }
        if (!shouldFall(positionRef.current.x, positionRef.current.y, getMaxWidth(), getMaxHeight())) {
            if ( !onXBound() || !onSkyBound() ) {
                await land();
            }
            if ( onXBound() )
                setAction(constants.ACTIONS.climbing);
            if ( onYBound() )
                setAction(constants.ACTIONS.walking);
            alignShimeji();

            if (!playRef.current) {
                setPlay(false);
                nextAction();
            }
        }
        return;
    }

    const moveShimeji = async () => {
        if (!playRef.current || isDraggedRef.current) {
            //console.log('cancelled...');
            return;
        }
        //console.log('animate... ', actionRef.current);
        let newPosition = moveDirectionRef.current;

        if(actionRef.current === constants.ACTIONS.walking) {
            newPosition += positionRef.current.x;
            // if not hitting wall
            if (newPosition > 0 && newPosition + constants.WIDTH < getMaxWidth()) {
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
            newPosition = boundX(newPosition);
            setPosition({
                ...position,
                x: newPosition,
                y: positionRef.current.y,
            });
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
            if (newPosition > 0 && newPosition + constants.HEIGHT < getMaxHeight()) {
                //console.log('moving... ', positionRef.current.x, ' -> ', newPosition);
                setPosition({
                    ...position,
                    x: positionRef.current.x,
                    y: newPosition,
                });
                await sleep(constants.FPS_INTERVAL_FALLING);
                return;
            }
            
            // if 0 = hit sky else ground
            newPosition = boundY(newPosition);
            //console.log('hit sky/gnd... ', newPosition);
            setPosition({
                ...position,
                x: positionRef.current.x,
                y: newPosition,
            });
            
            // change action to walking
            setAction(constants.ACTIONS.walking);
            
            // move rightward if on left wall, else move leftward if on right wall
            setMoveDirection((positionRef.current.x === 0)? constants.MOVE_PIXEL_POS : constants.MOVE_PIXEL_NEG);
            await sleep(constants.FPS_INTERVAL_FALLING);
            return;
        }
    };

    const nextAction = async () => {
        const newTimeout = generateTimeOutDuration();
        // clear previous timeout
        clearTimeout(actionTimeoutRef.current);
        
        // stop current animation
        setPlay(false);
        
        // set new duration for next action
        setActionTimeout(setTimeout(() => {
            console.log(newTimeout);
            nextAction();
        }, newTimeout));
        
        // set action animation
        let currAction = generateActionID(actionRef.current);
        //const currAction = actionRef.current;
        if (positionRef.current.y + constants.HEIGHT < getMaxHeight()) {
            if ( onXBound() ) {
                currAction = constants.ACTIONS.climbing;
            } else {
                currAction = constants.ACTIONS.walking;
            }
        }
        if (actionRef.current !== currAction) {
            setAction(currAction);
            // start animation from frame 1
            setFrame(0);
        }

        // start animation for shimeji frame component
        setPlay(true);
        
        // set new action sequence to terminate last animation
        const currSequence = sequenceRef.current + 1;
        setSequence(currSequence);

        // await rerender
        await sleep(constants.TIME_SECOND_IN_MS);
        
        // if walking or climbing, set move direction
        if (currAction === constants.ACTIONS.walking || currAction === constants.ACTIONS.climbing) {
            setMoveDirection(generateMoveDirection(moveDirectionRef.current));
            //setMoveDirection(moveDirectionRef.current);
            // align Shimeji to face the moving direction
        } else {
            setMoveDirection(null);
        }
        let startTime = Date.now();
        while (playRef.current && !isDraggedRef.current && sequenceRef.current === currSequence) {
            if (Date.now() - startTime >= constants.TIME_SECOND_IN_MS) {
                startTime = Date.now();
                alignShimeji();
                nextFrame();
                if (moveDirectionRef.current !== null) {
                    await moveShimeji();
                    alignShimeji();
                }
                continue;
            }
            await sleep(constants.FPS_INTERVAL_FALLING);
        }
        return;
    }

    // move shimeji on windows resize
    const handleWindowResize = useCallback((e) => {
        if (shimejiRef.current) {
            scrollBarWidth = getScrollbarWidth();
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

    // handle scrolling
    const handleScrolling = useCallback((e) => {
        // update position if necessary
        this.setPosition({
            x: boundX(positionRef.current.x),
            y: boundY(positionRef.current.y),
        });
    }, []);

    useEffect(()=> {
        fall();
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('scroll', handleScrolling);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            window.removeEventListener('scroll', handleScrolling);
        };
    }, []);
    
    // remove shimeji with parent's function
    const removeShimeji = () => {
        remove(id); // pass reference id back to main app
        setShowShimeji(false);
    };

    // duplicate shimeji with parent's function
    // const duplicateShimeji = () => {
    //     duplicate(id); // pass reference id back to main app
    // };

    // handle drag start shimeji event
    const handleDragStart = (e, data) => {
        e.stopPropagation();
        if (playRef.current && !isDraggedRef.current) {
            setPlay(false);
            if (actionTimeoutRef.current) {
                clearTimeout(actionTimeoutRef.current);
                setActionTimeout(null);
            }
            setRotation('none');
            setIsDragged(true);
            setAction(constants.ACTIONS.dragging);
        }
    };

    // handle dragging shimeji event
    const handleDrag = async (e, data) => {
        e.preventDefault();
        let x = null;
        let y = null;
        if (e.touches) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        x = boundX(x);
        y = boundY(y - 50);
        
        setPosition({
            ...positionRef.current,
            x: x,
            y: y,
        });
    }

    // handle drag end shimeji event
    const handleDragEnd = async (e, data) => {
        setPosition({
            ...positionRef.current,
            x: data.x,
            y: data.y,
        });
        setIsDragged(false);
        fall();
    };

    // align Shimeji to appropriate rotation to face the direction it is currently moving to
    const alignShimeji = () => {
        switch (actionRef.current) {
            case constants.ACTIONS.walking: {
                if (positionRef.current.y === 0) {
                    if (moveDirectionRef.current > 0) {
                        setRotation('scale(-1, -1)');
                        return;
                    }
                    setRotation('scaleY(-1)');
                    return;
                }
                if (positionRef.current.y > 0 && moveDirectionRef.current > 0) {
                    setRotation('scaleX(-1)');
                    return;
                }
                setRotation('none');
                return;
            }
            case constants.ACTIONS.climbing: {
                if (positionRef.current.x + constants.WIDTH >= getMaxWidth()) {
                    if (moveDirectionRef.current > 0) {
                        setRotation('scale(-1, -1)');
                        return;
                    }
                    setRotation('scaleX(-1)');
                    return;
                }
                if (positionRef.current.x === 0 && moveDirectionRef.current > 0) {
                    setRotation('scaleY(-1)');
                    return;
                }
                setRotation('none');
                return;
            }
            default: {
                // no other action is permitted when not on the ground except climbing & walking
                setRotation('none');
                return;
            }
        }
    };

    // loop over each frame
    const nextFrame = () => {
        if (!playRef.current) return;
        const actionName = Object.keys(constants.ACTIONS)[actionRef.current];
        //const actionID = actionRef.current;
        const frameCount = ACTIONS_SOURCES[actionName].length;
        if (frameCount > 1) {
            setFrame( (frameRef.current + 1) % frameCount);
        } else {
            setFrame(0);
        }
    }

    // render shimeji on screen on topmost of <body>
    return (
        <Draggable
            position={position}
            onStart={handleDragStart}
            onDrag={handleDrag}
            onStop={handleDragEnd}
            bounds={"body"}
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
                    opacity: showShimeji? '1':'0',
                    zIndex: 3
                }}
                onContextMenu={(e) => handleRightClick(e)}    // invoke right click context menu
            >

                {Object.keys(constants.ACTIONS).map((actionName, index) => (
                    <ShimejiFrame
                        style={{visibility: index===action? 'visible':'hidden', opacity: index===action? 1:0}}
                        key={index}
                        actionName={actionName}
                        actionID={index}
                        currentAction={action}
                        rotation={rotation}
                        currFrame={frame}
                    />
                ))}

                <ContextMenu                        // right click context menu component in ContextMenu.js
                    contextMenuRef={contextMenuRef}
                    isToggled={menu.toggled}        // check if context menu is shown
                    positionY={menu.position.y}     // set top position of context menu
                    positionX={menu.position.x}     // set left position of context menu
                    remove={removeShimeji}          // pass current removeShimeji function to be invoked by pressing remove button in context menu
                    // duplicate={duplicateShimeji}    // pass current duplicateShimeji function to be invoked by pressing duplicate button in context menu
                />
            </div>
        </Draggable>
    );

}

export default Shimeji;