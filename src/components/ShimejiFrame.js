import { React, useCallback, useEffect } from 'react';
import useState from 'react-usestateref';
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
    rotation,
}) => {
    // track current frame of animation
    const [currFrame, setFrame, currFrameRef] = useState(0);

    // identify the number of frames to loop back to first frame in cycle
    const FRAME_COUNT = ACTIONS_SOURCES[actionName].length; // trivial, no need of useMemo or useCached here

    // loop over each frame at one second interval
    const nextFrame = async () => {
        if (!play) return;
        setFrame( (currFrameRef.current + 1) % FRAME_COUNT);
        await sleep(constants.FPS_INTERVAL_FALLING);
    }
    
    const handlePlay = useCallback(async () => {
        if (play && currentAction === actionID && FRAME_COUNT > 1) {
            let startTime = Date.now();
            while (play && currentAction === actionID) {
                if (Date.now() - startTime >= constants.TIME_SECOND_IN_MS) {
                    startTime = Date.now();
                    await nextFrame();
                }
            }
        }
    }, [play, currentAction]);

    // play animation with timeout to change to next frame
    useEffect(() => {
        return () => {
            handlePlay();
        };
    }, [play, currentAction]);

    useEffect(() => {
        if (reset) {
            return () => {
                setFrame(0);
            };
        }
        return () => {};
    }, [reset]);

    return (
        <div
            className='shimeji-frame-container'
            style={{visibility: currentAction===actionID? 'visible':'hidden', opacity: currentAction===actionID? 1:0, transform: currentAction===actionID? `${rotation}` : 'none'}}
            id={`${actionName}`}
        >
            {ACTIONS_SOURCES[actionName].map((frame, index) => (
                <img
                    src={frame}
                    style={{opacity: (index===currFrame && currentAction===actionID)? "1":"0"}}
                    className='shimeji-frame'
                    key={index}
                    alt={`shimeji-frame-${actionName}-${index}`}
                />
            ))}
        </div>
    );
}

export default ShimejiFrame;