import React, { useCallback, useEffect, useRef } from "react";
import useState from 'react-usestateref';
import * as constants from './config.js';
import * as utility from './utility.js';
import FOOD_SOURCE from './ShimejiSources.js';

// Shimeji feeding food
const ShimejiFood = React.memo(({
    id = null,
    edible = false,
    height = constants.FOOD_HEIGHT,
    width = constants.FOOD_WIDTH,
    notifyInterval = null,
    initialX,
    initialY,
    onGround,
}) => {
    const [position, setPosition, positionRef] = useState({
        x: initialX,
        y: initialY,
    });

    // boundaries
    let scrollBarWidth = utility.getScrollbarWidth();
    let maxHeight = window?.innerHeight - scrollBarWidth;
    let maxWidth = window?.innerWidth - scrollBarWidth;

    const getMaxWidth = useMemo(() => {
        maxWidth = window?.innerWidth - scrollBarWidth;
        return maxWidth;
    }, [window?.innerWidth, scrollBarWidth]);

    const getMaxHeight = useMemo(() => {
        maxHeight = window?.innerHeight - scrollBarWidth;
        return maxHeight;
    }, [window?.innerHeight, scrollBarWidth]);

    useEffect(()=> {
        fall();
        // move shimeji on windows resize
        const handleWindowResize = utility.debounce((e) => {
            scrollBarWidth = utility.getScrollbarWidth();
            maxHeight = getMaxHeight();
            maxWidth = getMaxWidth();
            // e.currentTarget.innerWidth,e.currentTarget.innerHeight
            let x = utility.bound(positionRef.current.x, constants.WIDTH, maxWidth);
            let y = utility.bound(positionRef.current.y, constants.HEIGHT, maxHeight);
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

    const fall = async () => {
        const x = positionRef.current.x;
        let y = positionRef.current.y;
        const maxWidth = getMaxWidth();
        const maxHeight = getMaxHeight();
        while ( utility.shouldFall(x, y, maxWidth, maxHeight) ) {
            await utility.sleep(constants.FPS_INTERVAL_FALLING);
            y += constants.GRAVITY_PIXEL;
            setPosition({
                x: x,
                y: y,
            });
        }
        if ( utility.onGroundBound(y, maxHeight) ) {
            // notify Shimejis
            onGround(id, positionRef.current.x, positionRef.current.y, width, height);
        }
        return;
    }

    return (
        <div
            id={`shimeji-food-${id}`}
            class='shimeji-food'
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 100,
                width: width,
                height: height,
                filter: 'drop-shadow(0 5mm 4mm rgba(0, 0, 0, 0.637))',
                transform: `translate(${position.x}px, ${position.y}px)`
            }}
        >
            <img
                src={FOOD_SOURCE}
                alt={`shimeji-food-${id}`}
                style={{
                    width: width,
                    height: height,
                }}
            />
        </div>
    );
});

export default ShimejiFood;