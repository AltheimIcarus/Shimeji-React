import { React, useEffect, useState } from 'react';

const ShimejiFrame = ({
    sources=[],
    frameRate=20,
    play,
}) => {
    // track current frame of animation
    const [currFrame, setFrame] = useState(0);
    
    // play animation with timeout to change to next frame
    useEffect(() => {
        if (play) {
            return () => {
                setTimeout(
                    () => setFrame( (currFrame + 1) % sources.length),
                    1000 / frameRate
                );
            };
        }
        
        return;
    }, [play, frame]);

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