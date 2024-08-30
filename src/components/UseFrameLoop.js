import { useEffect, useRef } from "react";
import { FPS_INTERVAL } from "../config";

export const UseFrameLoop = (callback) => {
    const requestID = useRef();
    const previousTime = useRef();

    const loop = time => {
        if (previousTime.current !== undefined) {
            const deltaTime = time - previousTime.current;
            if (deltaTime >= FPS_INTERVAL)
                callback(time, deltaTime);
        }

        previousTime.current = time;
        requestID.current = requestAnimationFrame(loop);
    }

    useEffect(() => {
        requestID.current = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(requestID.current);
    }, []);
};