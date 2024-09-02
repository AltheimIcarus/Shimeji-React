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
}) => {
    // track current frame of animation
    const [currFrame, setFrame, currFrameRef] = useState(0);

    // identify the number of frames to loop back to first frame in cycle
    const FRAME_COUNT = ACTIONS_SOURCES[actionName].length; // trivial, no need of useMemo or useCached here

    // loop over each frame at one second interval
    const loopFrame = async () => {
        if (!play) return;
        await sleep(constants.TIME_SECOND_IN_MS);
        setFrame( (currFrameRef.current + 1) % FRAME_COUNT);
        loopFrame();
    }
    
    const handlePlay = useCallback(() => {
        if (play && currentAction === actionID) {
            loopFrame();
        }
    }, [play, currentAction]);

    // play animation with timeout to change to next frame
    // useEffect(() => {
    //     return () => handlePlay;
    // }, [play, currentAction]);

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