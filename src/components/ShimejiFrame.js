import { React, useEffect, useState } from 'react';
import * as constants from '../config';
import { ACTIONS_SOURCES } from './ShimejiSources';
import { UseFrameLoop } from './UseFrameLoop';

// util function to mimic sleep()
const sleep = async (timeMs) => {
    await new Promise(r => setTimeout(r, timeMs));
}

const ShimejiFrame = ({
    play,
    reset,
    key,
    actionName,
    actionID,
    currentAction,
}) => {
    // track current frame of animation
    const [currFrame, setFrame] = useState(0);

    // play animation with timeout to change to next frame
    useEffect(() => {
        const handlePlay = () => {
            if (play && ACTIONS_SOURCES[actionName].length>1 && currentAction === actionID) {
                return () => {
                    sleep(constants.TIME_SECOND_IN_MS);
                    setFrame( (currFrame + 1) % ACTIONS_SOURCES[actionName].length);
                };
            }
        };
        
        return () => {handlePlay()};
    }, [play, currentAction, currFrame]);

    useEffect(() => {
        if (reset) {
            return () => {
                setFrame(0);
            };
        }
        return;
    }, [reset]);

    return (
        <div
            style={currentAction===actionID? {visibility: 'visible', opacity: 1} : {visibility: 'hidden', opacity: 0}}
            id={`${actionName}`}
        >
            {ACTIONS_SOURCES[actionName].map((frame, index) => (
                <img
                    src={process.env.PUBLIC_URL + frame}
                    className='shimeji-frame'
                    key={index}
                    style={index===currFrame? {opacity: 1} : {opacity: 0}}
                    alt={`shimeji-frame-${actionName}-${index}`}
                />
            ))}
        </div>
    );
}

export default ShimejiFrame;