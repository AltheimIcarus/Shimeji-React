import { React, useEffect, useState } from 'react';
import * as constants from '../config';
import { ACTIONS_SOURCES, ACTIONS_SOURCES_IMGS } from './ShimejiSources';
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

    const FRAME_COUNT = ACTIONS_SOURCES[actionName].length;

    const loopFrame = async () => {
        await sleep(constants.TIME_SECOND_IN_MS);
        setFrame( (currFrame + 1) % FRAME_COUNT);
        loopFrame();
    }

    // play animation with timeout to change to next frame
    useEffect(() => {
        const handlePlay = () => {
            if (play && currentAction === actionID) {
                return () => {
                    loopFrame();
                };
            }
        };
        
        return () => handlePlay;
    }, [play, currentAction]);

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
                    src={frame}
                    style={{opacity: index===currFrame? "1":"0"}}
                    className='shimeji-frame'
                    key={index}
                    alt={`shimeji-frame-${actionName}-${index}`}
                />
            ))}
        </div>
    );
}

export default ShimejiFrame;