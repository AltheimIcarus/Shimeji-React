import React, { useContext, useCallback, useEffect, useRef} from 'react';
import Draggable from 'react-draggable';
import useState from 'react-usestateref';
import ContextMenu from './components/ContextMenu';
import './Shimeji.css';
import ShimejiFrame from './components/ShimejiFrame';
import * as constants from './config.js';
import * as utility from './utility.js';
import { ACTIONS_SOURCES } from './components/ShimejiSources';
import ShimejiFoodContext from './contexts/ShimejiFoodContext.js';


const Shimeji = React.memo(({
    id,             // id of current shimeji instance
    shouldExplode = false,  // override default spawn and fall from sky behaviour with spawn and explode from specific position
    initialX,
    initialY,
    trajectory = [],     // explosion propel trajectory
    remove,         // parent's function for removing a shimeji with id
    duplicate,      // parent's function for duplication a shimeji with id
    onEat,            // parent's function for eating a ShimejiFood with Shimeji id and ShimejiFood id
    onExplode,      // parent's function for explosion
}) => {
    const shimejiFoodContext = useContext(ShimejiFoodContext);
    const shimejiRef = useRef(null);

    const [position, setPosition, positionRef] = useState({
        x: initialX,
        y: initialY,
    });
    const [height, setHeight, heightRef] = useState(constants.HEIGHT);
    const [width, setWidth, widthRef] = useState(constants.WIDTH);
    const [showShimeji, setShowShimeji, showShimejiRef] = useState(true);
    const [action, setAction, actionRef] = useState(constants.ACTIONS.standing);

    // set if animation is paused (false) or played (true)
    const [play, setPlay, playRef] = useState(false);
    const [isPropelled, setIsPropelled, isPropelledRef] = useState(false);
    // track if shimeji is being dragged
    const [isDragged, setIsDragged, isDraggedRef] = useState(false);
    // track shimeji move direction for walking or climbing actions, see config for list of available options
    const [moveDirection, setMoveDirection, moveDirectionRef] = useState(null);
    // set the rotation of the Shimeji which depends on the move direction and attached wall
    const [rotation, setRotation, rotationRef] = useState(null);

    // track sequence of actions so that last action animation can be successfully terminated from infinite loop
    const sequenceRef = useRef(0);

    // track current frame of animation for child ShimejiFrame component
    const [frame, setFrame, frameRef] = useState(0);

    // distance to closest food
    const closestFoodDistanceRef = useRef(null);
    // is chasing food
    const isChasingFoodRef = useRef(false);
    // id of closest food
    const closestFoodIdRef = useRef(null);
    // targetted food reference
    const targetFoodRef = useRef(null);
    // is removed
    const [isRemoved, setIsRemoved, isRemovedRef] = useState(false);
    
    // track action animation timeout
    const actionTimeoutRef = useRef(null);
    // action begin time to determine if timeout and move on to next action
    const actionBeginTimeRef = useRef(Date.now());
    
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

    // boundaries
    let scrollBarWidthRef = useRef(utility.getScrollbarWidth());
    const windowWidthRef = useRef(window?.innerWidth);
    const windowHeightRef = useRef(window?.innerHeight);
    let maxHeight = window?.innerHeight - scrollBarWidthRef.current;
    let maxWidth = window?.innerWidth - scrollBarWidthRef.current;
    let radius = Math.max(constants.WIDTH / 2, constants.HEIGHT / 2);

    const getMaxWidth = useCallback(() => {
        maxWidth = window?.innerWidth - scrollBarWidthRef.current;
        return maxWidth;
    }, [windowWidthRef.current, scrollBarWidthRef.current]);

    const getMaxHeight = useCallback(() => {
        maxHeight = window?.innerHeight - scrollBarWidthRef.current;
        return maxHeight;
    }, [windowHeightRef.current, scrollBarWidthRef.current]);

    // handle right click to open menu
    const handleRightClick = (e) => {
        e.preventDefault();
        setPlay(false);
        // get reference to context menu DOM
        const contextMenuAttr = contextMenuRef.current.getBoundingClientRect();
        
        // check if cursor is at left and top of menu when clicked
        const isLeft = e.clientX < maxWidth / 2;
        const isTop = e.clientY > contextMenuAttr.y + contextMenuAttr.height / 2;

        let x = e.clientX;
        let y = e.clientY;

        if (!isLeft) {
            x = e.clientX - contextMenuAttr.width;
        }
        if (isTop) {
            y = e.clientY - contextMenuAttr.height;
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
    const handleCloseMenu = useCallback((e) => {
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
    }, [contextMenuRef]);

    useEffect(() => {
        document.addEventListener('click', handleCloseMenu);
        return () => {
            document.removeEventListener('click', handleCloseMenu);
        };
    }, [contextMenuRef]);

    // handle landing animation
    const land = async () => {
        await utility.sleep(constants.FPS_INTERVAL_FALLING * 2);
        setAction(constants.ACTIONS.landing);
        await utility.sleep(constants.FPS_INTERVAL_FALLING * 5);
    }

    // handle falling animation
    const fall = async () => {
        setPlay(false);
        setAction(constants.ACTIONS.falling);
    }

    // /**
    //  * **Propel Shimeji in given parabolic trajectory.**
    //  * @param {[{x: number, y: number},...{}]} trajectory   parabolic trajectory consisting of list of 2D coordinates to propel Shimeji.
    //  */
    // const propel = async () => {
    //     if (trajectory.length <= 1) return false;
    //     setPlay(false);
    //     actionTimeoutRef.current = null;
    //     clearFoodStates();
    //     setIsPropelled(true);
    //     setAction(constants.ACTIONS.eating);

    //     const direction = trajectory[1].x - trajectory[0].x > 0? constants.MOVE_PIXEL_POS : constants.MOVE_PIXEL_NEG;
    //     setMoveDirection(direction);
    //     alignShimeji();
    //     let fps_interval_explosion = constants.FPS_INTERVAL_FALLING;
        
    //     for (let i=0; i<trajectory.length; ++i) {
    //         setPosition({
    //             x: trajectory[i].x,
    //             y: trajectory[i].y,
    //         });
    //         await utility.sleep(fps_interval_explosion);
    //         fps_interval_explosion -= 0.01; // increment animation speed
    //     }
    //     await land();
    //     setIsPropelled(false);
    //     setAction(constants.ACTIONS.standing);

    //     setPlay(true);
    //     sequenceRef.current += 1;
    //     animateShimeji();
        
    //     return true;
    // }

    // // grow in size when consumed food
    // const grow = async () => {
    //     const oldHeight = heightRef.current;
    //     setWidth(widthRef.current * constants.GROW_FACTOR);
    //     setHeight(heightRef.current * constants.GROW_FACTOR);
    //     setPosition({
    //         x: positionRef.current.x,
    //         y: utility.bound(positionRef.current.y, heightRef.current, 0, maxHeight),
    //     });
    //     if (heightRef.current > constants.HEIGHT * constants.MAX_GROW_RATIO || widthRef.current > constants.WIDTH * constants.MAX_GROW_RATIO)
    //         await explode();

    //     return;
    // }

    // // explode into mini Shimejis when reached maximum size
    // const explode = async () => {
    //     // define mini Shimeji size
    //     const miniWidth = constants.MIN_WIDTH;
    //     const miniHeight = constants.MIN_HEIGHT;
    //     const newX = positionRef.current.x + (widthRef.current / 2) - (miniWidth / 2);
    //     const newY = positionRef.current.y - (heightRef.current / 2) - (miniHeight / 2);
        
    //     // reduce current Shimeji size to by (GROW_FACTOR - 1)
    //     this.setSize(miniWidth, miniHeight);
    //     this.setPosition({
    //         x: newX,
    //         y: newY,
    //     });

    //     // call parent's explode handler
    //     onExplode(id, newX, newY, miniWidth, miniHeight);

    //     // remove current exploded Shimeji
    //     removeShimeji();
    // }

    const moveShimeji = async () => {
        if (!playRef.current || isDraggedRef.current) {
            //console.log('cancelled...');
            return;
        }
        //console.log('animate... ', actionRef.current);
        let newPosition = moveDirectionRef.current;

        if(actionRef.current === constants.ACTIONS.walking) {
            newPosition = utility.bound(positionRef.current.x, widthRef.current, newPosition, maxWidth);
            // if not hitting wall
            if (!utility.onBound(newPosition, widthRef.current, maxWidth)) {
                //console.log('moving... ', positionRef.current.x, ' -> ', newPosition);
                setPosition({
                    ...position,
                    x: newPosition,
                    y: positionRef.current.y,
                });
                await utility.sleep(constants.FPS_INTERVAL_FALLING);
                return;
            }
            //console.log('hit wall... ', newPosition);
            
            // if 0 = hit left wall else right wall
            setPosition({
                ...position,
                x: newPosition,
                y: positionRef.current.y,
            });
            await utility.sleep(constants.FPS_INTERVAL_FALLING);
            
            // change action to climbing
            setAction(constants.ACTIONS.climbing);

            // move downward if in the sky, else move upward if on the ground
            setMoveDirection((positionRef.current.y === 0)? constants.MOVE_PIXEL_POS : constants.MOVE_PIXEL_NEG);
            return;
        } else if (actionRef.current === constants.ACTIONS.climbing) {
            //console.log('climbing... ');
            newPosition = utility.bound(positionRef.current.y, heightRef.current, newPosition, maxHeight);
            // if not hitting ground or sky
            if (!utility.onBound(newPosition, heightRef.current, maxHeight)) {
                //console.log('moving... ', positionRef.current.x, ' -> ', newPosition);
                setPosition({
                    ...position,
                    x: positionRef.current.x,
                    y: newPosition,
                });
                await utility.sleep(constants.FPS_INTERVAL_FALLING);
                return;
            }
            
            // if 0 = hit sky else ground
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
            await utility.sleep(constants.FPS_INTERVAL_FALLING);
            return;
        }
    };

    const nextAction = async (actionId = null) => {
        const newTimeout = utility.generateTimeOutDuration(constants.MIN_DURATION_MS, constants.MAX_DURATION_MS);
        // clear previous timeout
        //clearTimeout(this.#actionTimeout);
        
        // stop current animation
        setPlay(false);
        
        // set new duration for next action
        actionTimeoutRef.current = Date.now() + newTimeout;
        
        // set action animation
        let currAction = (actionId)? actionId : utility.generateActionID(actionRef.current, constants.MIN_ACTION_ID, constants.MAX_ACTION_ID);

        let x = positionRef.current.x;
        let y = positionRef.current.y;
        if (utility.onSkyBound(y)) {
            currAction = constants.ACTIONS.walking;
        }
        if (utility.onBound(x, widthRef.current, maxWidth) && utility.onSkyBound(y) && utility.onGroundBound(y+heightRef.current, maxHeight)) {
            currAction = constants.ACTIONS.climbing;
        }
        if (actionRef.current !== currAction) {
            setAction(currAction);
        }

        // start animation for shimeji frame component
        setPlay(true);
        
        // set new action sequence to terminate last animation
        sequenceRef.current += 1;
        await utility.sleep(constants.FPS_INTERVAL_FALLING);
        
        // if walking or climbing, set move direction
        if (currAction === constants.ACTIONS.walking || currAction === constants.ACTIONS.climbing) {
            setMoveDirection(utility.generateMoveDirection(moveDirectionRef.current, constants.MOVE_PIXEL_NEG, constants.MOVE_PIXEL_POS));
        } else {
            setMoveDirection(null);
        }

        actionBeginTimeRef.current = Date.now();
        return;
    }

    // const eatDroppedFood = () => {
    //     const food = targetFoodRef.current;
    //     // stop chasing food
    //     isChasingFoodRef.current = false;
    //     // start eating food animation
    //     setAction(constants.ACTIONS.eatingDroppedFood);
    //     // align before animation
    //     alignShimeji();

    //     actionTimeoutRef.current = 4 * constants.TIME_SECOND_IN_MS;
    //     actionBeginTimeRef.current = Date.now();

    //     setPlay(true);

    //     // if food is eaten by other Shimeji, perform hard reset on food variables
    //     if( !onEat() ) {
    //         // clear food related variables
    //         clearFoodStates();
    //         return;
    //     }

    //     return;
    // }

    // // chase food
    // const toClosestFood = async (lastFood, foodList) => {
    //     if (
    //         isDraggedRef.current || 
    //         actionRef.current === constants.ACTIONS.falling || 
    //         actionRef.current === constants.ACTIONS.landing ||
    //         typeof foodList.current[lastFood.current.id] === 'undefined'
    //     )
    //         return;

    //     // check previously chasing food status
    //     if (typeof foodList.current[closestFoodIdRef.current] === 'undefined') {
    //         clearFoodStates();
    //     }

    //     // setting food variables
    //     const food = lastFood.current;
    //     const x = positionRef.current.x + radius;
    //     const y = positionRef.current.y + radius;
    //     let distNew = utility.distanceRounded(x, food.x, y, food.y);
        
    //     if (isChasingFoodRef.current && closestFoodIdRef.current === food.id) // avoid repetition of function invocation
    //         return;

    //     // compare two foods for current shortest distance to avoid rapid and repeated changing food
    //     if (targetFoodRef.current && closestFoodIdRef.current !== food.id) {
    //         const foodOriRadius = Math.max(targetFoodRef.current.width / 2, targetFoodRef.current.height / 2);
    //         const foodOriX = targetFoodRef.current.x + foodOriRadius;
    //         const foodOriY = targetFoodRef.current.y + foodOriRadius;
    //         let distOri = utility.distanceRounded(x, foodOriX, y, foodOriY);
    //         if (distOri <= distNew) return;
    //     }
    //     // additional firewall to block changes
    //     if (closestFoodDistanceRef.current !== null && closestFoodDistanceRef.current <= distNew) {
    //         return;
    //     }
        
    //     // clear action states
    //     // clearActionStates();

    //     // Setting up variables for chasing food
    //     closestFoodDistanceRef.current = distNew;
    //     isChasingFoodRef.current = true;
    //     closestFoodIdRef.current = food.id;
    //     targetFoodRef.current = {
    //         ...food
    //     };

    //     // move left or right toward food
    //     setMoveDirection( (food.x < x + radius)? constants.MOVE_PIXEL_NEG : constants.MOVE_PIXEL_POS );

    //     // take shortcut from sky and wall to ground
    //     if (utility.onBound(x, widthRef.current, maxWidth) && !utility.onGroundBound(y + heightRef.current, maxHeight)) {
    //         setPosition({
    //             x: (x === 0)? constants.MOVE_PIXEL_POS : x - constants.MOVE_PIXEL_POS,
    //             y: y,
    //         });
    //         fall();
    //     }
    //     if (utility.onSkyBound(y)) {
    //         setPosition({
    //             x: x,
    //             y: y + 1,
    //         });
    //         fall();
    //     }

    //     while (true) {
    //         // do nothing
    //         if (!utility.shouldFall(positionRef.current.x, positionRef.current.y, maxWidth, maxHeight, widthRef.current, heightRef.current)) break;
    //         await utility.sleep(constants.FPS_INTERVAL_FALLING);
    //     }
        
    //     // continue chasing food
    //     setAction(constants.ACTIONS.walking);

    //     // set new action sequence to terminate last animation
    //     // sequenceRef.current += 1;

    //     actionBeginTimeRef.current = Date.now();

    //     return;
    // }

    // useEffect(() => {
    //     toClosestFood(shimejiFoodContext.lastFoodRef, shimejiFoodContext.ShimejiFoodsRef);
    //     return () => {};
    // }, [shimejiFoodContext.ShimejiFoodsRef, shimejiFoodContext.lastFoodRef]);

    const animateShimeji = async () => {
        let currSequence = sequenceRef.current;
        while (!isRemovedRef.current) {
            // Event based action
            if (isPropelledRef.current) {
                await utility.sleep(constants.FPS_INTERVAL_FALLING);
                continue;
            }
            if (isDraggedRef.current || actionRef.current === constants.ACTIONS.dragging) {
                await utility.sleep(constants.FPS_INTERVAL_FALLING);
                continue;
            }
            if (actionRef.current === constants.ACTIONS.falling) {
                const x = positionRef.current.x;
                const y = positionRef.current.y;

                if (utility.shouldFall(x, y, maxWidth, maxHeight, widthRef.current, heightRef.current) && !isDraggedRef.current) {
                    setPosition({
                        x: x,
                        y: utility.bound(positionRef.current.y, heightRef.current, constants.GRAVITY_PIXEL, maxHeight),
                        // y: y + constants.GRAVITY_PIXEL,
                    });
                    alignShimeji();
                    await utility.sleep(constants.FPS_INTERVAL_FALLING * 1.5);
                    continue;
                }

                if ( !utility.onBound(x, widthRef.current, maxWidth) || !utility.onSkyBound(y) ) {
                    await land();
                }
    
                if ( utility.onBound(x, widthRef.current, maxWidth) ) {
                    setAction(constants.ACTIONS.climbing);
                }
    
                if ( utility.onBound(y, heightRef.current, maxHeight) ) {
                    setAction(constants.ACTIONS.walking);
                }
    
                await alignShimeji();
                await utility.sleep(100);

                
                if (!playRef.current)
                    setPlay(true);
                
                // move on to next action
                if (!isChasingFoodRef.current) {
                    await nextAction();
                    currSequence = sequenceRef.current;
                    continue;
                }

                // set new action sequence to terminate last animation
                currSequence = sequenceRef.current;
            }
            if (actionRef.current === constants.ACTIONS.landing) {
                await utility.sleep(constants.FPS_INTERVAL_FALLING);
                continue;
            }
            if (isChasingFoodRef.current) {
                // if food is eaten by other Shimeji
                if (
                    targetFoodRef.current === null ||
                    document.getElementById(`shimeji-food-${targetFoodRef.current}`) === null ||
                    !document.getElementById(`shimeji-food-${targetFoodRef.current}`).classList.contains('shimeji-food-edible')
                ) {
                    // stop chasing food
                    isChasingFoodRef.current = false;
                    // clear food related variables
                    closestFoodDistanceRef.current = null;
                    closestFoodIdRef.current = null;
                    targetFoodRef.current = null;
                    // start next non event based action
                    nextAction(constants.ACTIONS.standing);
                    currSequence = sequenceRef.current;
                    continue;
                }

                // change target food
                if (closestFoodIdRef.current !== targetFoodRef.current.id)
                    continue;

                // chase food
                if (playRef.current && Date.now() - actionBeginTimeRef.current < constants.FPS_INTERVAL_CHASING_FOOD) {
                    await utility.sleep(constants.FPS_INTERVAL_CHASING_FOOD);
                }
                actionBeginTimeRef.current = Date.now();
                nextFrame();
                closestFoodDistanceRef.current = Math.floor( Math.abs(positionRef.current.x + radius - targetFoodRef.current.x) );

                // reached food
                if ( closestFoodDistanceRef.current < constants.MOVE_PIXEL_POS ) {
                    // eatDroppedFood();
                    continue;
                }

                // reached food alternative condition
                if ( positionRef.current.x + moveDirectionRef.current <= 0 || positionRef.current.y + widthRef.current + moveDirectionRef.current >= maxWidth ) {
                    setPosition({
                        x: positionRef.current.x + moveDirectionRef.current,
                        y: positionRef.current.y,
                    });
                    // eatDroppedFood();
                    continue;
                }

                moveShimeji();
                alignShimeji();// align after movement
                await utility.sleep(constants.FPS_INTERVAL_FALLING);
                continue;

            }
            if (actionRef.current === constants.ACTIONS.eatingDroppedFood) {
                // if finished eating food
                if (
                    isDraggedRef.current ||
                    targetFoodRef.current === null ||
                    actionBeginTimeRef.current > actionTimeoutRef.current
                ) {
                    // clear food related variables
                    clearFoodStates();
                    // await grow();
                    // start next non event based action
                    nextAction(constants.ACTIONS.standing);
                    currSequence = sequenceRef.current;
                    continue;
                }

                if (playRef.current && Date.now() - actionBeginTimeRef.current >= constants.FPS_INTERVAL_ACTION) {
                    actionBeginTimeRef.current = Date.now();
                    nextFrame();
                    continue;
                }

                await utility.sleep(constants.FPS_INTERVAL_FALLING);
            }

            // Non-Event-based actions
            // timeout for current action, move on to next action
            if ( (sequenceRef.current !== currSequence) || (actionBeginTimeRef.current > actionTimeoutRef.current) ) {
                await nextAction();
                console.log("!");
                currSequence = sequenceRef.current;
                continue;
            }

            if (playRef.current && Date.now() - actionBeginTimeRef.current >= constants.FPS_INTERVAL_ACTION) {
                actionBeginTimeRef.current = Date.now();
                await alignShimeji();    // align before movement
                nextFrame();
                
                if (moveDirectionRef.current !== null) {
                    moveShimeji();
                    alignShimeji();// align after movement
                }
                continue;
            }
            await utility.sleep(constants.FPS_INTERVAL_FALLING);
        }
        return;
    }

    useEffect(()=> {
        if (!shouldExplode) {
            fall();
        } else {
            // if (!propel()) fall(); // fallback to fall() if propel is unsuccessfull
        }
        animateShimeji();
        // move shimeji on windows resize
        const handleWindowResize = utility.debounce((e) => {
            scrollBarWidthRef.current = utility.getScrollbarWidth();
            windowHeightRef.current = window?.innerHeight;
            windowWidthRef.current = window?.innerWidth;
            getMaxHeight();
            getMaxWidth();
            // e.currentTarget.innerWidth,e.currentTarget.innerHeight
            let x = utility.bound(positionRef.current.x, widthRef.current, 0, maxWidth);
            let y = utility.bound(positionRef.current.y, heightRef.current, 0, maxHeight);
            setPosition({
                ...positionRef.current,
                x: x,
                y: y,
            });
        }, 100);
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    // clear all action related states
    const clearFoodStates = () => {
        // food
        closestFoodDistanceRef.current = null;
        isChasingFoodRef.current = false;
        closestFoodIdRef.current = null;
        targetFoodRef.current = null;

        // move direction
        setMoveDirection(null);
    }
    
    // // remove shimeji with parent's function
    // const removeShimeji = () => {
    //     remove(id); // pass reference id back to main app
    //     setShowShimeji(false);
    //     setIsRemoved(true);
    // };

    // // duplicate shimeji with parent's function
    // const duplicateShimeji = () => {
    //     setPlay(true);
    //     duplicate(id); // pass reference id back to main app
    // };

    // handle drag start shimeji event
    const handleDragStart = (e, data) => {
        e.stopPropagation();
        if (playRef.current && !isDraggedRef.current) {
            setPlay(false);
            if (actionTimeoutRef.current) {
                clearTimeout(actionTimeoutRef.current);
                actionTimeoutRef.current = null;
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
        x = utility.bound(x, widthRef.current, 0, maxWidth);
        y = utility.bound(y-50, heightRef.current, 0, maxHeight);
        
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
            x: utility.bound(data.x, widthRef.current, 0, maxWidth),
            y: utility.bound(data.y-50, heightRef.current, 0, maxHeight),
        });
        setIsDragged(false);
        fall();
    };

    // align Shimeji to appropriate rotation to face the direction it is currently moving to
    const alignShimeji = async () => {
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
                if (positionRef.current.x + widthRef.current >= maxWidth) {
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
            case constants.ACTIONS.standing:
            case constants.ACTIONS.sleeping:
            case constants.ACTIONS.dragging:
            case constants.ACTIONS.eating: {
                // no other action is permitted when not on the ground except climbing & walking
                setRotation('none');
                return;
            }
            default: {
                break;
            }
        }
        // special case for falling, eatingDroppedFood
        switch (moveDirectionRef.current) {
            case constants.MOVE_PIXEL_NEG: {
                setRotation('none');
                return;
            }
            case constants.MOVE_PIXEL_POS: {
                setRotation('scaleX(-1)');
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
        const actionName = constants.ACTIONS_MAP[actionRef.current];
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
            onWindowResize
        >
            <div
                className={`shimeji-container`}
                style={{
                    width: width,
                    height: height,
                    visibility: showShimeji? 'visible':'hidden',
                    opacity: showShimeji? '1':'0'
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
                    // remove={removeShimeji}          // pass current removeShimeji function to be invoked by pressing remove button in context menu
                    // duplicate={duplicateShimeji}    // pass current duplicateShimeji function to be invoked by pressing duplicate button in context menu
                    // explode={explode}    // pass current duplicateShimeji function to be invoked by pressing duplicate button in context menu
                />
            </div>
        </Draggable>
    );

});

export default Shimeji;