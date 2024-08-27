import { React, useEffect, useState } from 'react';

const TIME_SECOND_IN_MS = 1000;

const ShimejiFrame = ({
    sources=[],
    frameRate=20,
    play,
    reset,
}) => {
    // track current frame of animation
    const [currFrame, setFrame] = useState(0);
    const intervalT = null;
    
    // function to cancel animation interval
    const cancelInterval = () => clearInterval(intervalT);

    // play animation with timeout to change to next frame
    useEffect(() => {
        if (play) {
            return () => {
                intervalT = setInterval(
                    () => setFrame( (currFrame + 1) % sources.length),
                    TIME_SECOND_IN_MS / frameRate
                );
            };
        }
        
        return () => {
            cancelInterval();       // cancel the animation interval as pause
            setFrame(currFrame);    // trigger rerender for pause
        };
    }, [play]);

    useEffect(() => {
        if (reset) {
            return () => {
                setFrame(0);
            };
        }
        return;
    }, [reset]);

    return (
        <div>
            {sources.map((frame, index) => {
                <img
                    src={frame}
                    className='shimeji-frame'
                    style={index===currFrame? {opacity: 1} : {opacity: 0}}
                />
            })}
        </div>
    );
}

export default ShimejiFrame;