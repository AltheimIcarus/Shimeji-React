import { React, useEffect, useState } from 'react';

const ShimejiFrame = ({
    action,
    sources=[],
    frameRate=20
}) => {
    // start
    // animation styles
    const [styles, setStyle] = useState({
        opacity: 1,
        visibility: 'visible'
    });

    // set if animation is paused (false) or played (true)
    const [play, setPlay] = useState(false);

    // track current frame of animation
    const [currFrame, setFrame] = useState(0);
    
    // play animation with timeout
    useEffect(() => {
        if (play) {
            return () => {
                setTimeout(
                    () => setFrame(currFrame + 1),
                    1000 / frameRate
                );
            };
        }
        
        return;
    }, [play, frame]);

    return (
        <div
            style={styles}
            onClick={setPlay(!play)}
        >
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